# 熊本時刻表ジェネレーター

# 開発環境

| software | version |
| -------- | ------- |
| node     | 16.17.1 |
| npm      | 8.15.0  |

# 開発方法

## ライブラリインストール
```shell
npm ci
```

## 開発中
jsやscssなど保存すると即時反映される
```shell
npm run dev
```

## テスト
```shell
npm test
```

日本、UTC、米国東部・西部、インドのタイムゾーンで、表示時刻、検索日、祝日、特別日の除外、24時超の表記、日またぎの所要時間を検証する。

## デプロイ方法
```shell
rm -rf dist
npm run build
# git commit -m "適当に"
git push
npm run publish # github pagesへ反映
```
