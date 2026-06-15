/*
 * store.js  ---- 状態層（本番ではサーバーのセッション/カートDB/会員DBに相当）
 *
 * カート・会員情報・直近の注文を localStorage に保持します。
 * 本番ECでは、これらはサーバー側(セッションやDB)が持ち、サーバーが画面に埋め込みます。
 * 計測の「サーバー注入ポイント」を理解するための代役として用意しています。
 */
window.Store = (function () {
  var K_CART = 'unilo_cart';     // [{id, color, size, qty}]
  var K_USER = 'unilo_user';     // {user_id, name, email, membership_rank, logged_in}
  var K_ORDER = 'unilo_last_order'; // 直近の注文(サンクスページで使用)

  function read(key, def) {
    try { return JSON.parse(localStorage.getItem(key)) || def; }
    catch (e) { return def; }
  }
  function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  // ---- カート ----
  function getCart() { return read(K_CART, []); }

  function addItem(id, color, size, qty) {
    qty = qty || 1;
    var cart = getCart();
    var found = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id && cart[i].color === color && cart[i].size === size) { found = cart[i]; break; }
    }
    if (found) { found.qty += qty; } else { cart.push({ id: id, color: color, size: size, qty: qty }); }
    write(K_CART, cart);
    return cart;
  }

  function updateQty(index, qty) {
    var cart = getCart();
    if (cart[index]) { cart[index].qty = Math.max(1, qty); write(K_CART, cart); }
    return cart;
  }

  function removeItem(index) {
    var cart = getCart();
    var removed = cart.splice(index, 1)[0];
    write(K_CART, cart);
    return removed;
  }

  function clearCart() { write(K_CART, []); }

  // カート行を商品マスタと結合して返す（描画用）
  function cartLines() {
    return getCart().map(function (line, idx) {
      var p = window.DATA.getById(line.id);
      return { index: idx, product: p, color: line.color, size: line.size, qty: line.qty };
    }).filter(function (l) { return l.product; });
  }

  // GA4 eコマースの items[] を組み立てる（カート/チェックアウト/購入で使用）
  function cartDLItems() {
    return cartLines().map(function (l) {
      var variant = [l.color, l.size].filter(Boolean).join(' / ');
      return window.DL.toItem(l.product, { quantity: l.qty, variant: variant });
    });
  }

  function cartValue() {
    return cartLines().reduce(function (sum, l) {
      return sum + window.DATA.effectivePrice(l.product) * l.qty;
    }, 0);
  }

  function cartCount() {
    return getCart().reduce(function (sum, l) { return sum + l.qty; }, 0);
  }

  // ---- 会員 ----
  function getUser() { return read(K_USER, { logged_in: false, membership_rank: 'none' }); }

  // 会員ランクは購入履歴等からサーバーが決める想定。デモではメールのハッシュで擬似的に割当。
  function rankFromEmail(email) {
    var ranks = ['ブロンズ', 'シルバー', 'ゴールド'];
    var h = 0;
    for (var i = 0; i < email.length; i++) { h = (h * 31 + email.charCodeAt(i)) >>> 0; }
    return ranks[h % ranks.length];
  }

  function login(email, name) {
    var user = {
      user_id: 'U' + (function () {
        var h = 0; for (var i = 0; i < email.length; i++) { h = (h * 31 + email.charCodeAt(i)) >>> 0; }
        return h;
      })(),
      name: name || email.split('@')[0],
      email: email,
      membership_rank: rankFromEmail(email),
      logged_in: true
    };
    write(K_USER, user);
    return user;
  }

  function logout() { write(K_USER, { logged_in: false, membership_rank: 'none' }); }

  // ---- 注文 ----
  // 本番では transaction_id はサーバーが採番する。デモでは時刻＋乱数で擬似採番。
  function genTransactionId() {
    return 'T' + Date.now() + Math.floor(Math.random() * 1000);
  }

  function saveOrder(order) { write(K_ORDER, order); }
  function getLastOrder() { return read(K_ORDER, null); }

  // purchase の二重計測防止（リロードで再発火させない）
  function isOrderFired(txid) { return localStorage.getItem('unilo_fired_' + txid) === '1'; }
  function markOrderFired(txid) { localStorage.setItem('unilo_fired_' + txid, '1'); }

  return {
    getCart: getCart, addItem: addItem, updateQty: updateQty, removeItem: removeItem,
    clearCart: clearCart, cartLines: cartLines, cartDLItems: cartDLItems,
    cartValue: cartValue, cartCount: cartCount,
    getUser: getUser, login: login, logout: logout,
    genTransactionId: genTransactionId, saveOrder: saveOrder, getLastOrder: getLastOrder,
    isOrderFired: isOrderFired, markOrderFired: markOrderFired
  };
})();
