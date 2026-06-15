/*
 * common.js  ---- 共通描画・ユーティリティ
 *
 * 全ページで同一のヘッダー/フッターを描画し、商品カードや価格表示を共通化します。
 * これにより「ページごとの表記ゆれ・崩れ」を構造的に防ぎます。
 * （ヘッダー/フッターはデモの簡潔さのためJSで注入。GTMスニペットは各HTMLのheadに直書きです）
 */
window.App = (function () {

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  // 価格を「¥1,500」の形式で表示
  function yen(n) { return '¥' + Number(n).toLocaleString('ja-JP'); }

  // 価格表示HTML（セールなら定価に取り消し線）
  function priceHtml(p) {
    if (p.salePrice != null) {
      return '<span class="price price--sale">' + yen(p.salePrice) + '</span>' +
             '<span class="price price--strike">' + yen(p.price) + '</span>';
    }
    return '<span class="price">' + yen(p.price) + '</span>';
  }

  // 商品サムネイル（画像の代わりに服のカラーを大きく見せる色ブロック）
  function thumb(p, color) {
    var c = color || (p.colors && p.colors[0]) || 'グレー';
    var hex = (window.DATA.colorHex[c]) || '#cccccc';
    var border = (hex.toLowerCase() === '#ffffff') ? ' thumb__swatch--bordered' : '';
    return '<div class="thumb"><span class="thumb__swatch' + border + '" style="background:' + hex + '"></span></div>';
  }

  // 商品カード（一覧・トップで使用）
  function productCardHtml(p) {
    return '' +
      '<a class="product-card" href="product.html?id=' + p.item_id + '" data-item-id="' + p.item_id + '">' +
        thumb(p) +
        '<div class="product-card__body">' +
          '<p class="product-card__cat">' + p.item_category + ' / ' + p.item_category2 + '</p>' +
          '<p class="product-card__name">' + p.item_name + '</p>' +
          '<p class="product-card__price">' + priceHtml(p) + '</p>' +
        '</div>' +
      '</a>';
  }

  // 商品グリッドを描画し、view_item_list を発火、各カードに select_item を仕込む
  function renderProductGrid(container, products, listId, listName) {
    if (!container) return;
    if (!products.length) {
      container.innerHTML = '<p class="empty">該当する商品がありません。</p>';
      return;
    }
    container.classList.add('product-grid');
    container.innerHTML = products.map(productCardHtml).join('');

    // 計測: 一覧表示
    window.DL.viewItemList(listId, listName, products);

    // 計測: 商品クリック（遷移前に同期で push）
    var cards = container.querySelectorAll('.product-card');
    Array.prototype.forEach.call(cards, function (card, i) {
      card.addEventListener('click', function () {
        var p = window.DATA.getById(card.getAttribute('data-item-id'));
        if (p) window.DL.selectItem(listId, listName, p, i);
      });
    });
  }

  // ---- ヘッダー / フッター ----
  function renderHeader() {
    var el = document.getElementById('site-header');
    if (!el) return;
    var user = window.Store.getUser();
    var accountHref = user.logged_in ? 'mypage.html' : 'login.html';
    var count = window.Store.cartCount();

    var iconSearch = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>';
    var iconUser = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';
    var iconCart = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 4h2l2.2 12.2a2 2 0 0 0 2 1.8h7.6a2 2 0 0 0 2-1.6L22 8H6"/><circle cx="9" cy="21" r="1.4"/><circle cx="18" cy="21" r="1.4"/></svg>';

    var nav = window.DATA.categories.map(function (c) {
      var cls = 'nav-link' + (c.key === 'sale' ? ' nav-link--sale' : '');
      return '<a class="' + cls + '" href="list.html?category=' + c.key + '">' + c.name + '</a>';
    }).join('');

    el.innerHTML = '' +
      '<div class="demo-bar">これは GTM / GA4 計測の検証用デモサイトです（計測IDはプレースホルダ）。実際の購入はできません。</div>' +
      '<header class="site-header">' +
        '<div class="header-inner">' +
          '<a class="logo" href="index.html">UNILO</a>' +
          '<nav class="global-nav">' + nav + '</nav>' +
          '<div class="header-icons">' +
            '<span class="icon-btn" title="検索">' + iconSearch + '</span>' +
            '<a class="icon-btn" href="' + accountHref + '" title="アカウント">' + iconUser + '</a>' +
            '<a class="icon-btn" href="cart.html" title="カート">' + iconCart +
              '<span class="cart-count" data-cart-count' + (count ? '' : ' hidden') + '>' + count + '</span>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</header>';
  }

  function renderFooter() {
    var el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML = '' +
      '<footer class="site-footer">' +
        '<div class="footer-cols">' +
          '<div class="footer-col"><h4>ABOUT UNILO</h4><a href="#">ブランドについて</a><a href="#">サステナビリティ</a><a href="#">店舗一覧</a></div>' +
          '<div class="footer-col"><h4>ヘルプ</h4><a href="#">よくあるご質問</a><a href="#">配送について</a><a href="#">返品・交換</a></div>' +
          '<div class="footer-col"><h4>カテゴリー</h4><a href="list.html?category=women">WOMEN</a><a href="list.html?category=men">MEN</a><a href="list.html?category=kids">KIDS</a></div>' +
          '<div class="footer-col"><h4>フォロー</h4><a href="#">メールマガジン</a><a href="#">アプリ</a><a href="#">SNS</a></div>' +
        '</div>' +
        '<p class="footer-bottom">&copy; 2026 UNILO (demo). GTM / GA4 計測検証用のデモサイトです。</p>' +
      '</footer>';
  }

  function updateCartCount() {
    var badge = document.querySelector('[data-cart-count]');
    if (!badge) return;
    var count = window.Store.cartCount();
    badge.textContent = count;
    if (count) { badge.removeAttribute('hidden'); } else { badge.setAttribute('hidden', ''); }
  }

  function init() {
    renderHeader();
    renderFooter();
  }

  // 計測順序の保証:
  // ユーザープロパティ / user_id は「ページ固有のeコマースイベント(view_item / purchase 等)より
  // 必ず前」に dataLayer へ積む必要がある。common.js は data/store/datalayer の後、body末尾で
  // 読み込まれるので、ここで同期実行すれば、各ページの DOMContentLoaded 内で発火するイベントより
  // 確実に先になる(スクリプトの記述順に依存せず順序を保証できる)。
  window.DL.setUser(window.Store.getUser());

  // ヘッダー / フッターの描画はDOMの準備後でよい
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    getParam: getParam, yen: yen, priceHtml: priceHtml, thumb: thumb,
    productCardHtml: productCardHtml, renderProductGrid: renderProductGrid,
    updateCartCount: updateCartCount
  };
})();
