/*
 * products.js  ---- サーバー側の商品データ（本番では商品DBに相当）
 *
 * (B) Measurement Protocol の学習用に、「価格や商品名の正しい値をサーバーが持っている」
 * 状態を再現する。ブラウザの data.js とは別に、サーバーが権威ある値として参照する。
 * （注: 学習用の抜粋。実際は data.js の全商品に対応させてもよい）
 */
'use strict';

module.exports = [
  { item_id: '351001', item_name: 'エアリズムコットン オーバーサイズT（半袖）', item_brand: 'PG-Training', item_category: 'ウィメンズ', item_category2: 'トップス', price: 1500 },
  { item_id: '455002', item_name: 'ウルトラライトダウン コンパクトジャケット', item_brand: 'PG-Training', item_category: 'ウィメンズ', item_category2: 'アウター', price: 6990 },
  { item_id: '339003', item_name: 'ワイドフィット カーブパンツ', item_brand: 'PG-Training', item_category: 'ウィメンズ', item_category2: 'ボトムス', price: 3990 },
  { item_id: '446004', item_name: 'ヒートテック リブクルーネックT（長袖）', item_brand: 'PG-Training', item_category: 'メンズ', item_category2: 'トップス', price: 1500 },
  { item_id: '422005', item_name: 'スーピマコットン クルーネックT（半袖）', item_brand: 'PG-Training', item_category: 'メンズ', item_category2: 'トップス', price: 1990 },
  { item_id: '433006', item_name: 'フランネル チェックシャツ（長袖）', item_brand: 'PG-Training', item_category: 'メンズ', item_category2: 'トップス', price: 2990 }
];
