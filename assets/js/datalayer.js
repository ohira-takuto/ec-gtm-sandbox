/*
 * datalayer.js  ---- 計測実装層（エンジニアが書く層 / 今回いちばん見てほしい所）
 *
 * コンサル/マーケが出した「計測要件定義書(docs/計測要件定義書.md)」を、
 * このファイルで window.dataLayer への push として実装します。
 *
 *   [サイトのコード] --push--> [dataLayer] --読み取り--> [GTM] --変換--> [GA4]
 *
 * GTM はこの dataLayer を読み取り、GA4 の「イベント」「eコマース」「ユーザープロパティ」に
 * 変換して送信します。つまり計測の品質は、この実装層が要件どおりに値を積めているかで決まります。
 *
 * 「[サーバー注入ポイント]」と書いた箇所は、本番ではサーバー(注文DB/会員DB)が値を生成し、
 * サーバーサイドテンプレートでHTMLに埋め込む部分です。このデモでは store.js / data.js が代役です。
 */
window.dataLayer = window.dataLayer || [];

window.DL = (function () {
  var CURRENCY = (window.DATA && window.DATA.currency) || 'JPY';

  function push(obj) {
    window.dataLayer.push(obj);
    if (window.__DL_DEBUG__) { try { console.log('[dataLayer]', JSON.parse(JSON.stringify(obj))); } catch (e) {} }
  }

  // GA4 eコマースの items[] 要素を組み立てる共通関数
  // p: data.js の商品オブジェクト
  // opts: { quantity, variant, index, listId, listName, price }
  function toItem(p, opts) {
    opts = opts || {};
    var item = {
      item_id: p.item_id,
      item_name: p.item_name,
      item_brand: p.item_brand || (window.DATA && window.DATA.brand),
      item_category: p.item_category,    // 大分類（例: メンズ）
      item_category2: p.item_category2,  // 中分類（例: アウター）
      price: opts.price != null ? opts.price : window.DATA.effectivePrice(p),
      quantity: opts.quantity != null ? opts.quantity : 1
    };
    if (opts.variant) item.item_variant = opts.variant; // 色 / サイズ
    if (opts.index != null) item.index = opts.index;
    if (opts.listId) item.item_list_id = opts.listId;
    if (opts.listName) item.item_list_name = opts.listName;
    return item;
  }

  // ecommerce を毎回 null でリセットしてから push する。
  // （GA4推奨。前のイベントの items が次に混ざるのを防ぐ）
  function ecom(eventName, ecommerce) {
    push({ ecommerce: null });
    push({ event: eventName, ecommerce: assign({ currency: CURRENCY }, ecommerce) });
  }

  function assign(a, b) { for (var k in b) { if (b.hasOwnProperty(k)) a[k] = b[k]; } return a; }

  // GA4ヒットの送信完了を待ってから画面遷移したい時に使う。
  // login/sign_up の直後に location.href で遷移すると、GTMのGA4タグ送信(非同期)が走る前に
  // ページが離脱し、ヒットが消えることがある。GTMはタグ発火後に eventCallback を呼ぶので、
  // それを使って遷移する。GTM未読込/タグ無しの保険として一定時間後にも必ず遷移する。
  function pushEvent(obj, cb) {
    if (typeof cb === 'function') {
      var fired = false;
      var done = function () { if (fired) return; fired = true; cb(); };
      obj.eventCallback = done;
      obj.eventTimeout = 1500;
      push(obj);
      setTimeout(done, 900);
    } else {
      push(obj);
    }
  }

  return {
    push: push,
    toItem: toItem,

    // 商品一覧の表示（インプレッション）
    viewItemList: function (listId, listName, products) {
      var items = products.map(function (p, i) {
        return toItem(p, { index: i, listId: listId, listName: listName });
      });
      ecom('view_item_list', { item_list_id: listId, item_list_name: listName, items: items });
    },

    // 一覧から商品をクリック
    selectItem: function (listId, listName, p, index) {
      ecom('select_item', {
        item_list_id: listId, item_list_name: listName,
        items: [toItem(p, { index: index, listId: listId, listName: listName })]
      });
    },

    // 商品詳細の表示
    viewItem: function (p) {
      ecom('view_item', { value: window.DATA.effectivePrice(p), items: [toItem(p, {})] });
    },

    // カートに追加
    addToCart: function (p, quantity, variant) {
      ecom('add_to_cart', {
        value: window.DATA.effectivePrice(p) * quantity,
        items: [toItem(p, { quantity: quantity, variant: variant })]
      });
    },

    // カートから削除
    removeFromCart: function (p, quantity, variant) {
      ecom('remove_from_cart', {
        value: window.DATA.effectivePrice(p) * quantity,
        items: [toItem(p, { quantity: quantity, variant: variant })]
      });
    },

    // カートの表示
    viewCart: function (items, value) {
      ecom('view_cart', { value: value, items: items });
    },

    // 購入手続きの開始
    beginCheckout: function (items, value, coupon) {
      var e = { value: value, items: items };
      if (coupon) e.coupon = coupon;
      ecom('begin_checkout', e);
    },

    // 配送情報の入力
    addShippingInfo: function (items, value, shippingTier) {
      ecom('add_shipping_info', { value: value, shipping_tier: shippingTier, items: items });
    },

    // 支払い情報の入力
    addPaymentInfo: function (items, value, paymentType) {
      ecom('add_payment_info', { value: value, payment_type: paymentType, items: items });
    },

    // 購入完了  [サーバー注入ポイント]
    // 本番では transaction_id / items / value / tax / shipping はサーバーが注文確定時に生成し、
    // サンクスページのHTMLに埋め込む(例: window.__ORDER__)。このデモでは store.js が代役。
    purchase: function (order) {
      ecom('purchase', {
        transaction_id: order.transaction_id,
        value: order.value,
        tax: order.tax,
        shipping: order.shipping,
        coupon: order.coupon || undefined,
        items: order.items
      });
    },

    // ログイン / 会員登録。cb を渡すと送信完了(または一定時間)後に cb を実行する(遷移用)。
    login: function (method, cb) { pushEvent({ event: 'login', method: method || 'password' }, cb); },
    signUp: function (method, cb) { pushEvent({ event: 'sign_up', method: method || 'password' }, cb); },

    // ユーザープロパティ + user_id を dataLayer に流す  [サーバー注入ポイント]
    // GTM側で「ユーザープロパティ」「ユーザー提供データ(user_id)」変数にマッピングする。
    // 本番では user_id / 会員ランクはサーバー(会員DB)が認証後に確定して埋め込む。
    setUser: function (user) {
      // ゲスト/ログアウト時は user_id を null で送る(undefinedだとJSONから消え、GTMの
      // データレイヤー変数に前の値が残置されることがある)。GTMのGA4設定タグ側で
      // null/空のときは user_id を送らない設定にする。
      push({
        user_id: (user && user.logged_in) ? user.user_id : null,
        user_properties: {
          login_state: (user && user.logged_in) ? 'logged_in' : 'guest',
          membership_rank: (user && user.logged_in) ? user.membership_rank : 'none'
        }
      });
    }
  };
})();
