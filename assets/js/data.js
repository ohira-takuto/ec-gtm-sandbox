/*
 * data.js  ---- データ層（本番ではサーバーの商品DBに相当）
 *
 * このファイルは「サーバーが返す商品マスタ」の代役です。
 * 本番ECでは、これらの値はDBに入っていて、サーバーが画面ごとに必要な分を返します。
 * 計測の観点では「商品の属性（item_id / 価格 / カテゴリなど）がどこから来るのか」を
 * 押さえるのが重要なので、ここに一元化しています。
 *
 * GA4 eコマースの items[] は、この商品オブジェクトから datalayer.js が組み立てます。
 */
window.DATA = (function () {
  // カラー名 -> 表示色（画像の代わりにCSSの色ブロックで商品を表現する）
  var colorHex = {
    'ホワイト': '#ffffff', 'オフホワイト': '#f5f2ea', 'ブラック': '#1a1a1a',
    'ネイビー': '#1f2a44', 'グレー': '#9aa0a6', 'ライトグレー': '#d5d7da',
    'ダークグレー': '#4a4e54', 'ベージュ': '#d9c7a7', 'ナチュラル': '#e8dfca',
    'ブラウン': '#6f5034', 'ピンク': '#e8a7b8', 'レッド': '#c8102e',
    'ブルー': '#2f6fb0', 'ライトブルー': '#8db6d8', 'インディゴ': '#34425a',
    'グリーン': '#2f7d4f', 'オリーブ': '#6b6f3a', 'カーキ': '#7c7b53',
    'イエロー': '#e8c33b', 'ワイン': '#6e2433', 'アソート': '#c9c4bd'
  };

  var categories = [
    { key: 'women', name: 'WOMEN', jp: 'ウィメンズ' },
    { key: 'men',   name: 'MEN',   jp: 'メンズ' },
    { key: 'kids',  name: 'KIDS',  jp: 'キッズ' },
    { key: 'baby',  name: 'BABY',  jp: 'ベビー' },
    { key: 'sale',  name: 'SALE',  jp: 'セール' }
  ];

  // 商品マスタ。item_id は品番（GA4の item_id にそのまま使う）。
  // price は税込価格(JPY)。salePrice があればセール価格。
  var products = [
    // --- WOMEN ---
    { item_id: '351001', item_name: 'エアリズムコットン オーバーサイズT（半袖）', item_brand: 'UNILO',
      item_category: 'ウィメンズ', item_category2: 'トップス', categoryKey: 'women',
      price: 1500, colors: ['ホワイト', 'ブラック', 'ライトグレー', 'ピンク'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'], desc: 'さらっと快適なエアリズムコットン。一枚でもインナーでも。' },
    { item_id: '455002', item_name: 'ウルトラライトダウン コンパクトジャケット', item_brand: 'UNILO',
      item_category: 'ウィメンズ', item_category2: 'アウター', categoryKey: 'women',
      price: 6990, colors: ['ブラック', 'ネイビー', 'ベージュ', 'オフホワイト'],
      sizes: ['S', 'M', 'L', 'XL'], desc: '軽くて暖かい定番ダウン。専用ポーチで持ち運びもラク。' },
    { item_id: '339003', item_name: 'ワイドフィット カーブパンツ', item_brand: 'UNILO',
      item_category: 'ウィメンズ', item_category2: 'ボトムス', categoryKey: 'women',
      price: 3990, colors: ['ナチュラル', 'ブラック', 'ブラウン'],
      sizes: ['S', 'M', 'L', 'XL'], desc: '体型を拾いにくいカーブシルエット。きれいめにもカジュアルにも。' },
    { item_id: '446004', item_name: 'ヒートテック リブクルーネックT（長袖）', item_brand: 'UNILO',
      item_category: 'ウィメンズ', item_category2: 'インナー', categoryKey: 'women',
      price: 1500, colors: ['ブラック', 'ベージュ', 'グレー', 'ワイン'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'], desc: '発熱・保温の定番インナー。リブ素材で一枚見えもOK。' },
    // --- MEN ---
    { item_id: '422005', item_name: 'スーピマコットン クルーネックT（半袖）', item_brand: 'UNILO',
      item_category: 'メンズ', item_category2: 'トップス', categoryKey: 'men',
      price: 1500, colors: ['ホワイト', 'ブラック', 'ネイビー', 'グレー'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'], desc: '上質なスーピマコットン100%。なめらかな肌触り。' },
    { item_id: '433006', item_name: 'フランネル チェックシャツ（長袖）', item_brand: 'UNILO',
      item_category: 'メンズ', item_category2: 'シャツ', categoryKey: 'men',
      price: 2990, colors: ['レッド', 'ブルー', 'グリーン'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'], desc: '起毛感が暖かいフランネル。羽織りにも一枚にも。' },
    { item_id: '459007', item_name: '感動パンツ（ウールライク）', item_brand: 'UNILO',
      item_category: 'メンズ', item_category2: 'ボトムス', categoryKey: 'men',
      price: 3990, colors: ['ダークグレー', 'ブラック', 'ネイビー'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'], desc: '軽量ストレッチで動きやすい。ビジネスにも休日にも。' },
    { item_id: '455008', item_name: 'ウルトラライトダウン ジャケット', item_brand: 'UNILO',
      item_category: 'メンズ', item_category2: 'アウター', categoryKey: 'men',
      price: 6990, colors: ['ブラック', 'ネイビー', 'オリーブ', 'ベージュ'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'], desc: '軽量で暖かい定番ダウン。インナーダウンとしても。' },
    // --- KIDS ---
    { item_id: '511009', item_name: 'スウェット プルパーカ（長袖）', item_brand: 'UNILO',
      item_category: 'キッズ', item_category2: 'トップス', categoryKey: 'kids',
      price: 1990, colors: ['グレー', 'ネイビー', 'イエロー'],
      sizes: ['100', '110', '120', '130', '140', '150', '160'], desc: '動きやすく丈夫なスウェット。普段使いの定番。' },
    { item_id: '512010', item_name: 'ウルトラストレッチ チノパンツ', item_brand: 'UNILO',
      item_category: 'キッズ', item_category2: 'ボトムス', categoryKey: 'kids',
      price: 1990, colors: ['ベージュ', 'ブラック', 'カーキ'],
      sizes: ['100', '110', '120', '130', '140', '150', '160'], desc: 'よく伸びて動きやすい。元気に遊べるチノパン。' },
    // --- BABY ---
    { item_id: '611011', item_name: 'クルーネックボディスーツ（3枚組）', item_brand: 'UNILO',
      item_category: 'ベビー', item_category2: 'インナー', categoryKey: 'baby',
      price: 1290, colors: ['アソート'],
      sizes: ['60', '70', '80', '90'], desc: '肌にやさしいコットン。使い勝手のよい3枚組。' },
    { item_id: '612012', item_name: 'メッシュ レギンス', item_brand: 'UNILO',
      item_category: 'ベビー', item_category2: 'ボトムス', categoryKey: 'baby',
      price: 990, colors: ['ネイビー', 'ピンク', 'グレー'],
      sizes: ['70', '80', '90', '100'], desc: '通気性のよいメッシュ素材。おむつ替えもしやすい。' },
    // --- SALE（salePrice 付き） ---
    { item_id: '422013', item_name: 'デニムジャケット', item_brand: 'UNILO',
      item_category: 'メンズ', item_category2: 'アウター', categoryKey: 'men',
      price: 3990, salePrice: 2990, colors: ['ライトブルー', 'インディゴ'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'], desc: '定番のデニムジャケット。今だけ特別価格。' },
    { item_id: '351014', item_name: 'リネンブレンド シャツ（長袖）', item_brand: 'UNILO',
      item_category: 'ウィメンズ', item_category2: 'シャツ', categoryKey: 'women',
      price: 2990, salePrice: 1990, colors: ['ホワイト', 'ブルー', 'ベージュ'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'], desc: '春夏に活躍するリネン混。今だけ特別価格。' }
  ];

  function getById(id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].item_id === id) return products[i];
    }
    return null;
  }

  function getByCategory(key) {
    if (key === 'sale') {
      return products.filter(function (p) { return p.salePrice != null; });
    }
    return products.filter(function (p) { return p.categoryKey === key; });
  }

  // トップページのおすすめ（先頭6件）
  function getFeatured() { return products.slice(0, 6); }

  // 実効価格（セールがあればセール価格）
  function effectivePrice(p) { return p.salePrice != null ? p.salePrice : p.price; }

  return {
    brand: 'UNILO',
    currency: 'JPY',
    colorHex: colorHex,
    categories: categories,
    products: products,
    getById: getById,
    getByCategory: getByCategory,
    getFeatured: getFeatured,
    effectivePrice: effectivePrice
  };
})();
