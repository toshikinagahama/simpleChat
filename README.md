# ビルド手順

## backend のビルド

```
cd backend
make build
```

で`./bin/main` が出来上がる。
※go の CORS 設定は解除しておかないとだめ。

## frontend のビルド

まず最初に、global.js の domain_db と domain をコンテナの host に書き換える。
次にデプロイ先のサブディレクトリを指定するために、

```
cd frontend
yarn build
```

このあと、作成された out ファイルを webserver フォルダに移動。
※next の<Image />が入ってるとうまく行かないので、今回は使わない。<img />タグを変わりに使った。

# 本当はやりたいこと

password とか、環境依存系は、環境変数で制御したい。
