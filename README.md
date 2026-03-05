# 気象ダッシュボード (Weather Dashboard)

工事現場向けの気象予報ダッシュボード Web アプリです。気温・湿度・降水量・暑さ指数(WBGT)・風速・風向きをリアルタイムで表示します。

## 機能

- **3カラムレイアウト**
  - 左列: 気温・湿度・降水量グラフ
  - 中列: 図面ビューア（PDF 埋め込み）
  - 右列: 暑さ指数(WBGT)・風速・風向きグラフ
- **拠点選択**: 都道府県・市区町村のプルダウン（47都道府県対応）
- **予報期間選択**: 48時間 / 7日間
- **URL クエリパラメーター対応**: `?location=東京都,東京&period=48h`
- **Open-Meteo API** を利用（API キー不要・無料）

## 技術スタック

- TypeScript
- React
- Bootstrap / React-Bootstrap
- Recharts（グラフ表示）
- Axios（API クライアント）
- Docker / Nginx

## クイックスタート

### ローカル開発

```bash
cd app
npm install
npm start
```

ブラウザで `http://localhost:3000` を開きます。

### Docker ビルド & 起動

```bash
cd app
docker build -t weather-dashboard .
docker run -p 8080:80 weather-dashboard
```

ブラウザで `http://localhost:8080` を開きます。

## URL クエリパラメーター

| パラメーター | 値の例 | 説明 |
|---|---|---|
| `location` | `東京都,東京` | `<都道府県>,<市区町村>` の形式 |
| `period` | `48h` / `7d` | 予報期間（48時間 / 7日間） |

例: `http://localhost:3000/?location=大阪府,大阪市&period=7d`

## インフラ構成

Azure 上に以下のリソースをデプロイします。

```
Azure Container Apps  ← Weather Dashboard コンテナ
Azure Container Registry  ← Docker イメージの保管
Azure Key Vault  ← シークレット管理
Azure Log Analytics  ← ログ収集
```

### Terraform デプロイ

```bash
cd infra

# 初期化
terraform init

# 実行計画の確認
terraform plan -out=tfplan

# デプロイ
terraform apply tfplan
```

#### 変数のカスタマイズ

`infra/variables.tf` の変数を上書きする場合は `terraform.tfvars` を作成します。

```hcl
# infra/terraform.tfvars
prefix              = "my-weather"
resource_group_name = "rg-my-weather"
location            = "japaneast"
acr_name            = "myweatheracr"
key_vault_name      = "my-weather-kv"
```

### コンテナイメージのプッシュ

```bash
# ACR へのログイン
az acr login --name <acr_name>

# イメージのビルド & プッシュ
cd app
docker build -t <acr_login_server>/weather-dashboard:latest .
docker push <acr_login_server>/weather-dashboard:latest
```

## フォルダ構成

```
.
├── app/                    # フロントエンド React アプリ
│   ├── src/
│   │   ├── components/     # React コンポーネント
│   │   ├── data/           # 日本の都道府県・市区町村データ
│   │   ├── hooks/          # カスタム React フック
│   │   └── services/       # API クライアント
│   ├── Dockerfile          # マルチステージ Docker ビルド
│   └── nginx.conf          # Nginx 設定
├── infra/                  # Terraform インフラ構成
│   ├── main.tf             # リソース定義
│   ├── variables.tf        # 変数定義
│   └── outputs.tf          # 出力値定義
├── docs/                   # ドキュメント
└── README.md               # このファイル
```

## 気象データについて

[Open-Meteo](https://open-meteo.com/) の無料 API を使用しています。API キーは不要です。

取得データ:
- 気温 (temperature_2m)
- 相対湿度 (relative_humidity_2m)
- 降水量 (precipitation)
- 風速 (windspeed_10m)
- 風向き (winddirection_10m)

**暑さ指数(WBGT)** は取得した気温・湿度から以下の近似式で計算します:

```
湿球温度(Tw) ≈ Stull の近似式
WBGT = 0.7 × Tw + 0.3 × T
```

WBGT の危険度レベル:
| WBGT (°C) | 危険度 |
|---|---|
| < 21 | ほぼ安全 |
| 21–25 | 注意 |
| 25–28 | 警戒 |
| 28–31 | 厳重警戒 |
| ≥ 31 | 危険 |
