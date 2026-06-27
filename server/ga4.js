/*
 * ga4.js  ---- (B) Measurement Protocol：サーバーから GA4 へイベントを直送する
 *
 * 仕組み:
 *   サーバーが GA4 の収集エンドポイントに HTTP POST するだけ。GTMもブラウザも通らない。
 *     - 宛先と鍵 : measurement_id (G-XXXX) と api_secret（GA4管理画面で発行）
 *     - 識別子   : client_id（同じ人・同じセッションに紐付ける）/ user_id（任意）
 *     - 中身     : events[]（name と params。purchaseなら transaction_id/value/items など）
 *
 * GA4_MP_DEBUG=1 のとき:
 *   デバッグ用エンドポイント(/debug/mp/collect)へ送る。検証メッセージ(validationMessages)が
 *   返るので、ペイロードの形が正しいか学習・確認できる。
 *   ※ デバッグ用はGA4のレポートには記録されない（DebugView/検証専用）。本番反映時は DEBUG を外す。
 *
 * Node 18+ の global fetch を使用（追加依存なし）。
 */
'use strict';

async function sendEvent(opts) {
  opts = opts || {};
  const MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID || '';
  const API_SECRET = process.env.GA4_API_SECRET || '';
  const DEBUG = process.env.GA4_MP_DEBUG === '1';

  if (!MEASUREMENT_ID || !API_SECRET) {
    console.warn('[MP] GA4_MEASUREMENT_ID / GA4_API_SECRET が未設定のため送信をスキップしました。server/.env を設定してください。');
    return { skipped: true, reason: 'missing_credentials' };
  }

  const base = DEBUG
    ? 'https://www.google-analytics.com/debug/mp/collect'
    : 'https://www.google-analytics.com/mp/collect';
  const url = base
    + '?measurement_id=' + encodeURIComponent(MEASUREMENT_ID)
    + '&api_secret=' + encodeURIComponent(API_SECRET);

  // GA4 Measurement Protocol のペイロード
  const payload = { client_id: opts.client_id, events: opts.events };
  if (opts.user_id) payload.user_id = opts.user_id;
  if (opts.user_properties) payload.user_properties = opts.user_properties; // 形式: { 名前: { value: 値 } }

  let res, validation = null;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (DEBUG) { try { validation = await res.json(); } catch (e) { /* no body */ } }
  } catch (e) {
    console.error('[MP] 送信エラー:', e.message);
    return { skipped: false, error: String(e.message || e), sent: payload };
  }

  const txid = (payload.events && payload.events[0] && payload.events[0].params && payload.events[0].params.transaction_id) || '-';
  console.log('[MP] ' + (DEBUG ? '(debug) ' : '') + 'status=' + res.status
    + ' event=' + payload.events.map(function (e) { return e.name; }).join(',')
    + ' transaction_id=' + txid);
  if (validation) console.log('[MP] validation:', JSON.stringify(validation));

  return { skipped: false, debug: DEBUG, status: res.status, validation: validation, sent: payload };
}

module.exports = { sendEvent: sendEvent };
