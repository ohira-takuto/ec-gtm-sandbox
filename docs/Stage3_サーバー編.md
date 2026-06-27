# Stage3 サーバー編 ランブック（(B) Measurement Protocol）

サーバー側の役割を「手を動かして」学ぶ回。GitHub Codespaces（無料）で動かす前提。

## これで学べること
- 核(1) サーバーレンダリング: サーバーが注文の確定値を dataLayer としてHTMLに埋め込む
- 核(2) Measurement Protocol: サーバーが GA4 へイベントを直接送る（GTMもブラウザも通らない）

## 1. Codespacesで開く
1. GitHubのリポジトリページ → 緑の「Code」→「Codespaces」→「Create codespace on main」
2. 自動で環境が立ち上がる（`.devcontainer` により Node が用意され、`npm install` も自動実行される）
3. マシンは「2-core」を選ぶ（無料枠を長く使える）

## 2. GA4の認証情報を用意
1. GA4管理画面 → 管理 → データストリーム → 対象ストリーム
   - 「測定ID」(G-XXXXXXXXXX) を控える
   - 「Measurement Protocol API シークレット」→ 作成 → 値を控える
2. ターミナルで `cp server/.env.example server/.env`
3. `server/.env` を開き、測定IDとAPIシークレットを貼る（`GA4_MP_DEBUG=1` のままでOK）

## 3. 起動して確認
1. ターミナルで `npm start`
2. ポート3000が自動転送される → ブラウザのプレビューで開く
3. `/demo/purchase` を開く
   - 画面に「サーバーが作った dataLayer」と「MP送信結果」が表示される
4. GA4の「DebugView」を開く → いま送った `purchase` が表示される（`GA4_MP_DEBUG=1` のため）

## 4. 本番反映（任意）
- `server/.env` の `GA4_MP_DEBUG` を `0`（または行ごと削除）にすると、通常のレポートに記録される
- デバッグ用エンドポイントはレポートに残らない（検証専用）ので注意

## 5. 発展課題（ハンズオン）
- `checkout.html` を改造して、購入時に `/api/purchase` へ cart を POST し、戻ってきた dataLayer で完了画面を描く（＝クライアント主導からサーバー主導へ）
- 二重計測を体験: ブラウザのGTM購入タグ＋サーバーMPの両方を有効にし、`transaction_id` で重複除外する設定を入れる
- 返金 (`refund`) イベントをサーバーから送ってみる（ブラウザには無いイベント）

## ファイル
- `server/server.js` … サーバー本体（静的配信 + `/api/purchase` + `/demo/purchase`）
- `server/ga4.js` … Measurement Protocol 送信モジュール
- `server/products.js` … サーバー側の商品データ（本番ではDB）
- `server/.env.example` … 認証情報のひな形（コピーして `server/.env` を作る）
- `.devcontainer/devcontainer.json` … Codespaces の環境定義

## 注意
- `server/.env`（実際の鍵入り）は Git にコミットしない（`.gitignore` 済み）
- これは計測パターンのうち (B) Measurement Protocol。(C) サーバーサイドGTM(sGTM) は別物（発展）。
