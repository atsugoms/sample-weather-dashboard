# App Setup

## Commands

```bash
npm install
npm run dev
npm run build
npm run typecheck
```

## Docker

```bash
npm run docker:build
npm run docker:run
```

## Runtime Config

`/config/runtime-config.json` を参照します。

```json
{
	"defaultDrawingUrl": "/sample-drawing.pdf"
}
```

コンテナ起動時に `DEFAULT_DRAWING_URL` から自動生成されます。
