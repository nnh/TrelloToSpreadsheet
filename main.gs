/*
参考）Trello APIを使ってボードをスプレッドシートに出力する｜ＧＭＯアドパートナーズ：https://techblog.gmo-ap.jp/2019/12/05/trello_to_spreadsheet/
*/
class GetTrelloInformation {
  constructor(target) {
    this.target = target;
  }
  get information(){
    return this.getInformation();
  }
  editUrl(target) {
    const trelloKey = PropertiesService.getScriptProperties().getProperty('trelloKey');
    const trelloToken = PropertiesService.getScriptProperties().getProperty('trelloToken');
    const trelloBoardId = PropertiesService.getScriptProperties().getProperty('trelloBoardId');
    const url = 'https://trello.com/1/boards/' + trelloBoardId + target + '?key=' + trelloKey + '&token=' + trelloToken + '&fields=all';
    return url;
  }
  getJsonData(url) {
    const res = UrlFetchApp.fetch(url, {'method':'get'});  
    return JSON.parse(res.getContentText());
  }
  getInformation() {
    const url = (this.editUrl(this.target));
    return this.getJsonData(url);
  }
}
function aaa() {
  const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  const cards = new GetTrelloInformation('/cards').information;
  // Set the board name
  const cardMergeBoard = getBoardName(cards);
  // Set the member name
  const cardMergeMember = getMemberName(cardMergeBoard);
  // Set the list name
  const cardMergeList = getListInfo(cardMergeMember);
  console.log(cardMergeList);
  // Set the lable
}
function getBoardName(cards) {
  const boardInfo = new GetTrelloInformation('').information;;
  const cardMergeBoard = cards.map(function(card) {
    if (card.idBoard == boardInfo.id) {
      card['boardName'] = boardInfo.name;
    } else {
      card['boardName'] = 'board-machigai';
    }
    return card;
  });
  return cardMergeBoard
}
function getMemberName(cards) {
  const memberJson = new GetTrelloInformation('/members').information;
  const cardMergeMember = cards.map(function(card) {
    const targetMember = card.idMembers.map(function(idMember) {
      const memberData = this.filter(member => member.id == idMember);
      return memberData[0];
    }, memberJson);
    if (targetMember.length == 1) {
      card['memberName'] = targetMember[0].fullName;
    } else {
      card['memberName'] = 'namae-naiyo-';
    }
    return card;
  });
  return cardMergeMember;
}
function getListInfo(cards) {
  const listJson = new GetTrelloInformation('/lists').information;
  const cardMergeList = cards.map(function(card) {
    const temp_list = this.filter(list => list.id == card.idList);
    card['listName'] = temp_list[0].name;
    return card;
  }, listJson);
  return cardMergeList;
}
function getLabelInfo(cards) {
  const labelJson = new GetTrelloInformation('/labels').information;
  const cardMergeLabel = cards.map(function(card) {

  });
}
function getEstimateAndAchievement() {

  const trelloKey = PropertiesService.getScriptProperties().getProperty('trelloKey');
  const trelloToken = PropertiesService.getScriptProperties().getProperty('trelloToken');
  const cardId = '';
//  var url = 'https://api.trello.com/1/boards/' + trelloBoard + '/?fields=name&cards=visible&card_fields=name&customFields=true&card_customFieldItems=true&key=' + trelloKey + '&token=' + trelloToken;
  var url = 'https://api.trello.com/1/cards/' + cardId + '/?fields=name&customFieldItems=true&key=' + trelloKey + '&token=' + trelloToken;
  const cardJson = getJsonData(url);
  console.log(cardJson);
  console.log(cardJson.customFieldItems);
 // console.log(cardJson[0]);
}

function getCustomFields() {
  const url = (editUrl('/customFields'));
  console.log(getJsonData(url));
  
  return getJsonData(url);

}


function getCheckLists() {
  const url = (editUrl('/checklists'));
  console.log(getJsonData(url));
  return getJsonData(url);
}
function outputSheet(targetSheet, valueList) {
  const sheetName = "trello";
  const header = Object.keys(cardJson[1]);
  // Output card information to spreadsheet
  const sheet = SpreadsheetApp.openByUrl(sheetUrl).getSheetByName(sheetName);
  sheet.clear();
  const column_count = header.length;
  const headerRange = sheet.getRange(1, 1, 1, column_count);
  headerRange.setValues([header]);
  for(var i = 0; i < cardJson.length; i++){
    // id設定
    sheet.getRange(1, i + 1).setValue((header[i]));
  }  
  for(var i = 0; i < cardJson.length; i++){
    // 各カラム設定
    for(var j = 0; j < header.length; j++) {
      if (cardItem[j] == '') {
        continue;
      }
      var getElement = cardJson[i][header[j]];
      sheet.getRange(2 + i, 1 + j).setValue(getElement);
    }
  }
  //writeSheet(cardJson, sheetUrl, sheetName, cardItem, true);
}

/*
Trelloからjson形式のデータを取得。
スプレッドシートに書込み。
*/
function writeSheet(cardJson, sheetUrl, sheetName, cardItem, isCards) {
  var startRow = 2;
  if (isCards) {
    startRow = 3;
  }
  // Output spreadsheet information
  const sheet = SpreadsheetApp.openByUrl(sheetUrl).getSheetByName(sheetName);
  sheet.clear();
  // 見出し出力
  for(var i = 0; i < cardItem.length; i++) {
    var columnName = '';
    if (cardItem[i] == '') {
      continue;
    } else if (isCards && cardItem[i] == 'name') {
      columnName = 'カード'
    } else if (isCards && cardItem[i] == 'desc') {
      columnName = '内容'
    }　else {
      columnName = cardItem[i];
    }
    
    sheet.getRange(1,2+i).setValue(columnName);
  }

  // カード情報取得  
  for(var i = 0; i < cardJson.length; i++){
    var writeRow = 1;
    // id設定
    sheet.getRange(startRow + i,1).setValue((i+1));

    // 各カラム設定
    for(var j = 0; j < cardItem.length; j++) {
      writeRow++;
      if (cardItem[j] == '') {
        continue;
      }
      var getElement = cardJson[i][cardItem[j]];
      sheet.getRange(startRow + i,writeRow).setValue(getElement);
    }
  }
}
