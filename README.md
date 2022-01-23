- [1. ビルド手順](#1-ビルド手順)
    - [1.0.1. backend のビルド](#101-backend-のビルド)
  - [1.1. frontend のビルド](#11-frontend-のビルド)
- [2. 本当はやりたいこと](#2-本当はやりたいこと)
- [3. test](#3-test)
# 1. ビルド手順

### 1.0.1. backend のビルド

```
cd backend
make build
```

で`./bin/main` が出来上がる。
※go の CORS 設定は解除しておかないとだめ。

## 1.1. frontend のビルド

まず最初に、global.js の domain_db と domain をコンテナの host に書き換える。
次にデプロイ先のサブディレクトリを指定するために、

```
cd frontend
yarn build
```

このあと、作成された out ファイルを webserver フォルダに移動。
※next の<Image />が入ってるとうまく行かないので、今回は使わない。<img />タグを変わりに使った。

# 2. 本当はやりたいこと

password とか、環境依存系は、環境変数で制御したい。

# 3. test

```plantuml
!theme bluegray
actor Foo1
boundary Foo2
control Foo3
entity Foo4
database Foo5
collections Foo6
Foo1 -> Foo2 : To boundary
Foo1 -> Foo3 : To control
Foo1 -> Foo4 : To entity
Foo1 -> Foo5 : To database
Foo1 -> Foo6 : To collections
```





