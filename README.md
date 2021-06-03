# 概要
Trelloの情報を取得してスプレッドシートに出力するプログラム  
# 事前準備
## APIキー、トークンの取得
Trelloにログインした状態でhttps://trello.com/app-key
にアクセスする。  
参考：API Introduction  
https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/
## Board IDの取得
URLの後ろに'.json'を付加（例：https://trello.com/b/xxxxxxx/xxx.json）
して一行目の最初に出力される"id"  
参考：How to get Trello Board ID  
https://community.atlassian.com/t5/Trello-questions/How-to-get-Trello-Board-ID/qaq-p/1347525
## プロパティの設定
取得したAPIキー、トークン、ボードIDをregister-property.gsのregisterScriptProperty functionを用いて設定する
# 実行手順
main.gsを開き、outputTrelloToSpreadSheetを実行する
