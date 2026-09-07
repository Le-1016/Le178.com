# Le178 Virtual Laboratory

Go、Julia、Python/PyTorch、JupyterLab、PostgreSQLを1つのGitHub Codespaceで扱う仮想研究所です。

> 本リポジトリは、ポートフォリオおよび成果物の閲覧を目的として公開しています。
> 現時点では、コードの再利用・改変・再配布を許可するライセンスを設定していません。

## 設備

| 設備 | 用途 |
|---|---|
| Go | 高速処理・API |
| Julia | 数値計算・科学計算 |
| Python + PyTorch | データ分析・機械学習 |
| JupyterLab | 実験ノート・成果共有 |
| PostgreSQL | 共通データベース |
| Docker Compose | 環境の再現とサービス管理 |

## Codespacesで始める

1. GitHubのリポジトリ画面で **Code → Codespaces → Create codespace on main** を選びます。
2. 初回ビルドと依存関係の準備が終わるまで待ちます。
3. Codespaceのターミナルで接続テストを実行します。

```bash
make check
```

Python、Go、Juliaの3つすべてから、同じPostgreSQLデータを取得できれば成功です。

## JupyterLabを使う

```bash
make jupyter
```

VS Codeの「ポート」タブに表示されるポート`8888`の地球アイコンから開きます。最初の実験は
[`notebooks/00_lab_check.ipynb`](notebooks/00_lab_check.ipynb) です。

## Go APIを使う

```bash
make api
```

転送されたポート`8080`の`/health`で稼働確認、`/experiments`でPostgreSQLのデータをJSONとして確認できます。

## 個別の接続テスト

```bash
make check-python
make check-go
make check-julia
```

## データベース接続

コンテナ間では、PostgreSQLのホスト名は`localhost`ではなく`postgres`です。初期開発用の接続情報は`compose.yaml`に記載しています。本番用パスワードやAPIキーはコミットせず、Codespaces Secretsなどで管理してください。

初期SQLは`sql/init/`に置きます。初期SQLを変更してデータベースを作り直す場合は、保存済みデータが消えることを理解したうえで次を実行します。

```bash
docker compose down --volumes
docker compose up -d
```

## ディレクトリ

```text
.
├── .devcontainer/  # Codespaces開発環境
├── go/             # Goプログラム
├── julia/          # Juliaプロジェクト
├── notebooks/      # 共有する実験ノート
├── python/         # Python・PyTorchコード
└── sql/init/       # PostgreSQL初期化SQL
```

## 公開について

さくらのレンタルサーバには、実行済みNotebookをHTMLへ変換した成果物やポートフォリオサイトを配置します。Docker、PostgreSQL、PyTorch APIの常時稼働が必要になった場合は、VPSなどroot権限のある環境へデプロイします。
