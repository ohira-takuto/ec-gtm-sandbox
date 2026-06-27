/*
 * server.js  ---- Stage3 サーバー編（(B) Measurement Protocol）
 *
 * このサーバーが学習用に再現する「サーバー側の役割」:
 *   核(1) サーバーレンダリング : 注文の確定値を dataLayer としてHTMLに埋め込んで返す
 *   核(2) Measurement Protocol : 同じ購入を GA4 へHTTPで直送する（GTMもブラウザも通らない）
 *
 * 起動 : npm install && npm start   （既定 http://localhost:3000）
 * 確認 : /demo/purchase  … サーバーが注文を作り、dataLayer注入HTML + MP直送を実演
 *        既存の静的サイト(index.html 等)もそのまま配信される（Stage1-2はこの配信で動く）
 */
'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');
const ga4 = require('./ga4');
const PRODUCTS = require('./products');

// ---- server/.env を読む（dotenv不要の簡易ローダー）----
(function loadEnv() {
  const p = path.join(__dirname, '.env');
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, 'utf8').split(/\r?\n/).forEach(function (line) {
    if (line.trim().startsWith('#')) return;
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
})();

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..'); // リポジトリ直下（静的サイト本体）

app.use(express.json());

// ============ 注文ロジック（本番のバックエンド相当）============
function genTransactionId() {
  return 'T' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1000);
}
function buildOrder(cart) {
  if (!Array.isArray(cart) || cart.length === 0) throw new Error('cart が空です');
  const items = cart.map(function (line) {
    const p = PRODUCTS.find(function (x) { return x.item_id === String(line.item_id); });
    if (!p) throw new Error('未知の item_id: ' + line.item_id);
    const qty = Math.max(1, parseInt(line.quantity || 1, 10));
    return {
      item_id: p.item_id, item_name: p.item_name, item_brand: p.item_brand,
      item_category: p.item_category, item_category2: p.item_category2,
      price: p.price, quantity: qty
    };
  });
  const value = items.reduce(function (s, i) { return s + i.price * i.quantity; }, 0);
  const shipping = value >= 5000 ? 0 : 500;
  // value = 商品小計（送料・税は別フィールド）。priceが税込のため tax は 0（デモ簡易）。
  return { transaction_id: genTransactionId(), currency: 'JPY', value: value, tax: 0, shipping: shipping, items: items };
}

// 核(1) サーバーレンダリング用：dataLayer（datalayer.js の purchase と同じ形）
function buildDataLayer(order) {
  return [
    { ecommerce: null },
    { event: 'purchase', ecommerce: {
      transaction_id: order.transaction_id, currency: order.currency,
      value: order.value, tax: order.tax, shipping: order.shipping, items: order.items } }
  ];
}

// 核(2) Measurement Protocol用：events
function toMpEvents(order) {
  return [{ name: 'purchase', params: {
    transaction_id: order.transaction_id, currency: order.currency, value: order.value,
    tax: order.tax, shipping: order.shipping,
    items: order.items.map(function (i) {
      return { item_id: i.item_id, item_name: i.item_name, price: i.price, quantity: i.quantity };
    }) } }];
}
function randomClientId() {
  return Math.floor(Math.random() * 1e10) + '.' + Math.floor(Math.random() * 1e10);
}

// ============ ルーティング ============

// (静的) 既存サイトをそのまま配信。Stage1-2はこの配信で動く。
app.use(express.static(ROOT));

// (API) ブラウザの checkout から呼ばれる想定。注文確定 → MP直送 → 結果を返す。
app.post('/api/purchase', async function (req, res) {
  try {
    const order = buildOrder(req.body && req.body.cart);
    const user = (req.body && req.body.user) || null;
    const mp = await ga4.sendEvent({
      client_id: (req.body && req.body.client_id) || randomClientId(),
      user_id: user && user.logged_in ? user.user_id : undefined,
      user_properties: user ? {
        login_state: { value: user.logged_in ? 'logged_in' : 'guest' },
        membership_rank: { value: user.logged_in ? user.membership_rank : 'none' }
      } : undefined,
      events: toMpEvents(order)
    });
    res.json({ ok: true, order: order, dataLayer: buildDataLayer(order), mp: mp });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
});

// (デモ) サーバー側の役割を「目に見える形」で実演するページ。
app.get('/demo/purchase', async function (req, res) {
  try {
    const order = buildOrder([{ item_id: '351001', quantity: 2 }, { item_id: '455002', quantity: 1 }]);
    const dl = buildDataLayer(order);
    const clientId = randomClientId();
    const mp = await ga4.sendEvent({
      client_id: clientId,
      user_properties: { login_state: { value: 'guest' }, membership_rank: { value: 'none' } },
      events: toMpEvents(order)
    });
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(renderDemoPage(order, dl, clientId, mp));
  } catch (e) {
    res.status(500).send('error: ' + esc(String(e.message || e)));
  }
});

function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
function renderDemoPage(order, dl, clientId, mp) {
  const dlJson = JSON.stringify(dl, null, 2);
  const mpMsg = mp.skipped
    ? 'GA4の認証情報が未設定のため送信スキップ（server/.env を設定すると実際に送られます）'
    : (mp.error ? ('送信エラー: ' + mp.error) : (mp.debug ? ('デバッグ送信 status=' + mp.status) : ('本番送信 status=' + mp.status)));
  const pushes = dl.map(function (o) { return 'dataLayer.push(' + JSON.stringify(o) + ');'; }).join('\n');
  return '<!doctype html><html lang="ja"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<title>Stage3 デモ：サーバー側の役割</title>'
    + '<style>body{font-family:-apple-system,system-ui,sans-serif;max-width:860px;margin:24px auto;padding:0 16px;line-height:1.7;color:#222}'
    + 'h1{font-size:20px}h2{font-size:16px;margin-top:28px;border-left:4px solid #2e7d32;padding-left:8px}'
    + 'pre{background:#0d1117;color:#e6edf3;padding:14px;border-radius:8px;overflow:auto;font-size:12px}'
    + '.box{background:#f6f8fa;border:1px solid #d0d7de;border-radius:8px;padding:12px 16px}'
    + 'code{background:#eef;padding:1px 5px;border-radius:4px}.ok{color:#1f6f3f;font-weight:bold}</style>'
    // 核(1) サーバーレンダリング: サーバーが注文確定値を dataLayer に埋め込んで返している
    + '<script>\nwindow.dataLayer = window.dataLayer || [];\n' + pushes + '\n</script>'
    + '</head><body>'
    + '<h1>Stage3 デモ：サーバー側の役割（(B) Measurement Protocol）</h1>'
    + '<p class="box">このページを開いた瞬間、サーバーの中で2つのことが起きました。下にその中身を表示しています。</p>'
    + '<h2>核(1) サーバーレンダリング：dataLayer をHTMLに注入</h2>'
    + '<p>下のJSONは、サーバーが注文を確定して作り、ページ上部の &lt;script&gt; に直接書き込んだ dataLayer です。ブラウザのJSが推測したのではなく、サーバーの注文記録（真実の値）です。</p>'
    + '<pre>' + esc(dlJson) + '</pre>'
    + '<h2>核(2) Measurement Protocol：GA4へ直送</h2>'
    + '<p>同じ購入を、サーバーから GA4 へHTTPで直接送りました（GTMもブラウザも通っていません）。</p>'
    + '<div class="box">送信結果: <span class="ok">' + esc(mpMsg) + '</span><br>'
    + 'client_id: <code>' + esc(clientId) + '</code><br>transaction_id: <code>' + esc(order.transaction_id) + '</code></div>'
    + (mp.validation ? '<h2>検証メッセージ（デバッグ用エンドポイント）</h2><pre>' + esc(JSON.stringify(mp.validation, null, 2)) + '</pre>' : '')
    + '<h2>確認方法</h2>'
    + '<p>GA4の「DebugView」または「リアルタイム」を開くと、いま送った purchase が表示されます（GA4_MP_DEBUG=1 のときは DebugView）。</p>'
    + '</body></html>';
}

app.listen(PORT, function () {
  console.log('Stage3 サーバー起動: http://localhost:' + PORT);
  console.log('  デモページ : http://localhost:' + PORT + '/demo/purchase');
  console.log('  購入API    : POST http://localhost:' + PORT + '/api/purchase');
  const has = process.env.GA4_MEASUREMENT_ID && process.env.GA4_API_SECRET;
  console.log('  GA4認証    : ' + (has ? ('設定あり' + (process.env.GA4_MP_DEBUG === '1' ? '（デバッグ送信）' : '')) : '未設定（server/.env を設定すると実際にGA4へ送ります）'));
});
