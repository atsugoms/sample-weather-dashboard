# sample-weather-dashboard

工事現場向けの 1 画面ダッシュボードです。以下を表示します。

- 気温
- 湿度
- 降雨
- 暑さ指数 (WBGT: 近似値)
- 風速
- 風向
- 図面 (PDF などを埋め込み)

## フォルダ構成

```text
- app/      アプリフォルダ
- README.md 本ファイル
```

## 使用技術

- React
- TypeScript
- Bootstrap
- Vite
- Weather API: Open-Meteo

## 画面仕様

- 上部:
	- 都道府県プルダウン
	- 市区町村プルダウン
	- 予報期間プルダウン (48時間 / 7日)
	- 図面 URL 入力
- 3列構成:
	- 左: 気温、湿度、降雨
	- 中央: 図面
	- 右: WBGT、風速、風向

## クエリパラメータ

画面状態はクエリで指定・保持できます。

- `pref`: 都道府県
- `city`: 市区町村
- `period`: `48h` または `7d`
- `drawingUrl`: 埋め込み図面 URL

例:

```text
http://localhost:5173/?pref=東京都&city=千代田区&period=7d&drawingUrl=https://example.com/sample.pdf
```

## ローカル実行

```bash
cd app
npm install
npm run dev
```

## ビルド

```bash
cd app
npm run build
```

## コンテナ化

```bash
cd app
npm run docker:build
npm run docker:run
```

`http://localhost:8080` で起動します。

## KeyVault 連携方針

フロントエンドは起動時に `/config/runtime-config.json` を読み込みます。
コンテナ内では `DEFAULT_DRAWING_URL` 環境変数からこのファイルを生成します。

```json
{
	"defaultDrawingUrl": "https://example.blob.core.windows.net/drawings/site-a.pdf"
}
```

Azure 環境では以下いずれかで `DEFAULT_DRAWING_URL` を供給してください。

- Azure Container Apps / App Service の KeyVault 参照付き環境変数
- デプロイ時に KeyVault から取得して環境変数注入 (CI/CD)

アプリ内に API キーを直書きせず、KeyVault 管理のシークレットを環境変数経由で渡す構成を想定しています。

## SQLite について

本アプリは Open-Meteo から都度取得する構成のため、現時点で永続化は必須ではありません。
履歴蓄積や監査ログが必要になった場合は別途 API 層を追加し、SQLite を利用してください。
