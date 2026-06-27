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

  // 商品画像: カテゴリ別の衣服シルエットをSVGで描き、選択カラーで塗る(外部画像に依存しない)
  function garment(shape, hex) {
    var S = '#00000026';
    var body = function (d) { return '<path d="' + d + '" fill="' + hex + '" stroke="#00000033" stroke-width="1.6" stroke-linejoin="round"/>'; };
    var det = function (d) { return '<path d="' + d + '" fill="none" stroke="' + S + '" stroke-width="1.3" stroke-linecap="round"/>'; };
    var dot = function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="1.4" fill="' + S + '"/>'; };
    var ls = 'M38 22 L30 17 L12 33 L18 74 L29 70 L31 104 L69 104 L71 70 L82 74 L88 33 L70 17 L62 22 C57 30 43 30 38 22 Z';
    var g;
    switch (shape) {
      case 'longsleeve': g = body(ls) + det('M40 21 Q50 28 60 21'); break;
      case 'hoodie': g = body('M37 22 Q50 4 63 22 Q56 31 50 31 Q44 31 37 22 Z') + body('M38 24 L30 19 L12 35 L18 76 L29 72 L31 104 L69 104 L71 72 L82 76 L88 35 L70 19 L62 24 C57 31 43 31 38 24 Z') + det('M37 80 L63 80 L59 97 L41 97 Z') + det('M46 30 L45 42') + det('M54 30 L55 42'); break;
      case 'jacket': g = body(ls) + body('M40 20 L50 27 L44 34 Z') + body('M60 20 L50 27 L56 34 Z') + det('M50 27 L50 104') + det('M33 50 L67 50') + det('M33 66 L67 66') + det('M33 82 L67 82'); break;
      case 'shirt': g = body(ls) + body('M40 19 L50 29 L43 33 Z') + body('M60 19 L50 29 L57 33 Z') + det('M50 29 L50 104') + dot(50, 46) + dot(50, 60) + dot(50, 74) + dot(50, 88); break;
      case 'pants': g = body('M33 22 L67 22 L69 104 L55 104 L50 60 L45 104 L31 104 Z') + det('M33 29 L67 29') + det('M50 29 L50 60'); break;
      case 'leggings': g = body('M38 22 L62 22 L64 104 L53 104 L50 62 L47 104 L36 104 Z') + det('M38 28 L62 28') + det('M50 28 L50 62'); break;
      case 'bodysuit': g = body('M38 24 L31 20 L16 31 L24 44 L33 38 L33 82 Q50 100 67 82 L67 38 L76 44 L84 31 L69 20 L62 24 C57 31 43 31 38 24 Z') + det('M40 23 Q50 30 60 23') + dot(45, 90) + dot(50, 91) + dot(55, 90); break;
      default: g = body('M38 22 L30 17 L13 30 L21 45 L31 39 L31 104 L69 104 L69 39 L79 45 L87 30 L70 17 L62 22 C57 30 43 30 38 22 Z') + det('M40 21 Q50 28 60 21');
    }
    return '<svg class="garment" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + g + '</svg>';
  }

  // 商品サムネイル（衣服SVGを選択カラーで塗って表示）
  function thumb(p, color) {
    var c = color || (p.colors && p.colors[0]) || 'グレー';
    var hex = (window.DATA.colorHex[c]) || '#cccccc';
    var shape = window.DATA.shapeOf ? window.DATA.shapeOf(p) : 'tshirt';
    return '<div class="thumb">' + garment(shape, hex) + '</div>';
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

    // ハンバーガー(モバイルのみCSSで表示)。アイコンは3本線。
    var iconMenu = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';

    el.innerHTML = '' +
      '<div class="demo-bar">これは GTM / GA4 計測の検証用デモサイトです（計測IDはプレースホルダ）。実際の購入はできません。</div>' +
      '<header class="site-header">' +
        '<div class="header-inner">' +
          '<button class="nav-toggle" type="button" aria-label="メニュー" aria-expanded="false" aria-controls="global-nav">' + iconMenu + '</button>' +
          '<a class="logo" href="index.html">PG-Training</a>' +
          '<nav class="global-nav" id="global-nav">' + nav + '</nav>' +
          '<div class="header-icons">' +
            '<span class="icon-btn" title="検索">' + iconSearch + '</span>' +
            '<a class="icon-btn" href="' + accountHref + '" title="アカウント">' + iconUser + '</a>' +
            '<a class="icon-btn" href="cart.html" title="カート">' + iconCart +
              '<span class="cart-count" data-cart-count' + (count ? '' : ' hidden') + '>' + count + '</span>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</header>';

    // ハンバーガーのトグル(モバイル)。デスクトップはCSSでボタン非表示のため無影響。
    var header = el.querySelector('.site-header');
    var toggle = el.querySelector('.nav-toggle');
    if (toggle && header) {
      toggle.addEventListener('click', function () {
        var open = header.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  }

  function renderFooter() {
    var el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML = '' +
      '<footer class="site-footer">' +
        '<div class="footer-cols">' +
          '<div class="footer-col"><h4>ABOUT PG-Training</h4><a href="#">ブランドについて</a><a href="#">サステナビリティ</a><a href="#">店舗一覧</a></div>' +
          '<div class="footer-col"><h4>ヘルプ</h4><a href="#">よくあるご質問</a><a href="#">配送について</a><a href="#">返品・交換</a></div>' +
          '<div class="footer-col"><h4>カテゴリー</h4><a href="list.html?category=women">WOMEN</a><a href="list.html?category=men">MEN</a><a href="list.html?category=kids">KIDS</a></div>' +
          '<div class="footer-col"><h4>フォロー</h4><a href="#">メールマガジン</a><a href="#">アプリ</a><a href="#">SNS</a></div>' +
        '</div>' +
        '<p class="footer-bottom">&copy; 2026 PG-Training (demo). GTM / GA4 計測検証用のデモサイトです。</p>' +
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
