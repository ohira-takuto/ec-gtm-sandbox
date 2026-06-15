# ec-gtm-sandbox

GTM / GA4 計測の検証・学習用の **疑似アパレルEC（デモ）** です。ユニクロのUIを参考にしたデモで、ブランド名 **UNILO** は架空のものです。実在の企業・商品とは一切関係ありません。

GA4 eコマースの推奨イベント（`view_item_list` / `view_item` / `add_to_cart` / `purchase` など）を `window.dataLayer` への push として一通り実装してあり、GTMコンテナを差し替えるだけで実測検証・学習に使えます。

> 運用・設計の詳細はNotionで管理します。本READMEはセットアップと全体像のみ。

## ディレクトリ構成

```
ec-gtm-sandbox/
├─ index.html        トップ（ヒーロー / カテゴリタイル / おすすめ）
├─ list.html         商品一覧（カテゴリ別。?category=women など）
├─ product.html      商品詳細 PDP（?id=351001 など。色/サイズ/数量選択）
├─ cart.html         カート（数量変更・削除）
├─ checkout.html     チェックアウト（お届け先 / 配送 / 支払い）
├─ complete.html     注文完了（サンクスページ。purchase 発火）
├─ login.html        ログイン / 会員登録
├─ mypage.html       マイページ（会員情報・user_id / ランク表示）
├─ assets/
│  ├─ css/style.css  全画面共通のスタイル
│  └─ js/
│     ├─ data.js       データ層: 商品マスタ（本番のサーバー商品DBの代役）
│     ├─ store.js      状態層: カート/会員/注文を localStorage で保持（セッション/DBの代役）
│     ├─ datalayer.js  計測実装層: 要件を dataLayer への push に変換（最重要・要件定義の実装先）
│     └─ common.js     共通描画: ヘッダー/フッター/商品カード/グリッド描画
└─ docs/              計測要件定義書などのドキュメント置き場
```

計測の流れは `[サイトのコード] → push → dataLayer → 読み取り → GTM → 変換 → GA4`。`datalayer.js` がいちばんの見どころです（`[サーバー注入ポイント]` のコメント箇所は、本番ではサーバーが値を生成してHTMLに埋め込む部分）。

## ローカルでの起動

`file://` で開くとGTMが正しく動かない（CORS等の制約）ため **HTTP配信が必須** です。リポジトリ直下で簡易サーバーを立てます。

```bash
cd /Users/oohiratakuhito/projects/ec-gtm-sandbox
python3 -m http.server 8000
```

ブラウザで http://localhost:8000 を開きます。

## 計測IDの差し替え

各HTMLの `<head>` にプレースホルダが入っています。実コンテナIDへ置換してください。

- **必須**: 全HTMLの `GTM-XXXXXX` を実際のGTMコンテナIDに置換（GTMスニペット2箇所 + noscriptの計3箇所 / ファイル）。
- **任意**: `G-XXXXXX` を GA4測定IDに置換。これは学習用にコメントアウトされた gtag.js 直接計測の例です。GTM経由のGA4と二重計測になるため、使う場合はGTM側のGA4設定タグを止めること。

一括置換の例:

```bash
cd /Users/oohiratakuhito/projects/ec-gtm-sandbox
sed -i '' 's/GTM-XXXXXX/GTM-ABCDE12/g' *.html
```

## 計測の確認方法

1. **コンソールの発火ログ**: 各ページで `window.__DL_DEBUG__ = true` が立っており、`dataLayer` への push がブラウザコンソールに `[dataLayer] {...}` として出力されます。`window.dataLayer` を直接覗いても確認できます。
2. **GTMプレビュー（Tag Assistant）**: GTM管理画面の Preview で対象URLに接続し、イベント受信とタグ発火を確認。
3. **GA4 DebugView**: GTMプレビュー接続中（またはdebug_mode有効時）に、GA4の DebugView でイベント・パラメータの到達を確認。

## 画面一覧と発火する主なGA4イベント

| 画面 | ファイル | 主なイベント |
|---|---|---|
| トップ | index.html | `view_item_list`（おすすめ）、`select_item`（商品クリック） |
| 一覧 | list.html | `view_item_list`、`select_item` |
| 商品詳細 | product.html | `view_item`、`add_to_cart` |
| カート | cart.html | `view_cart`、`remove_from_cart` |
| チェックアウト | checkout.html | `begin_checkout`、`add_shipping_info`、`add_payment_info` |
| 完了 | complete.html | `purchase`（リロード再発火を抑止） |
| ログイン/登録 | login.html | `login`、`sign_up` |
| マイページ | mypage.html | （`user_id` / ユーザープロパティの送信確認） |

補足:
- `page_view` はGTMのGA4設定タグが自動発火する想定のため、サイト側では手動pushしません。
- 全ページで `window.DL.setUser()` により `user_id` と `user_properties`（`login_state` / `membership_rank`）を流します。
- eコマースイベントは push 前に `ecommerce: null` でリセットし、前イベントの `items` 混入を防いでいます。

## GitHub Pages での公開

1. リポジトリの **Settings > Pages** を開く。
2. Source を **Deploy from a branch** にし、Branch を **main** / **/(root)** に設定して Save。
3. 数分後に発行されるURL（`https://<user>.github.io/ec-gtm-sandbox/`）でアクセス可能。GitHub PagesはHTTP配信のためGTMも正しく動作します。

## 注意

これは計測検証用のデモです。**実際の決済・注文・出荷は一切行われません。** カート・会員・注文情報はブラウザの localStorage にのみ保存される擬似データです。
