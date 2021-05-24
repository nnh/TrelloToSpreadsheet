class GetTrelloInformation {
  constructor(target) {
    this.target = target;
  }
  get information(){
    return this.getInformation();
  }
  getTrelloProperties() {
    const trelloInfo = {
      key: PropertiesService.getScriptProperties().getProperty('trelloKey'), 
      token: PropertiesService.getScriptProperties().getProperty('trelloToken'), 
      boardId: PropertiesService.getScriptProperties().getProperty('trelloBoardId')
    }
    return trelloInfo;
  }
  editUrl(target) {
    const trelloInfo = this.getTrelloProperties();
    const url = 'https://trello.com/1/boards/' + trelloInfo.boardId + target + '?key=' + trelloInfo.key + '&token=' + trelloInfo.token + '&fields=all';
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
class GetTrelloInformationByCard extends GetTrelloInformation{
  constructor(target, cardId) {
    super(target);
    this.cardId = cardId;
  }
  editUrl(target, cardId) {
    const trelloInfo = this.getTrelloProperties();
    const url = 'https://api.trello.com/1/cards/' + cardId + '' + target + '?key=' + trelloInfo.key + '&token=' + trelloInfo.token + '&fields=all';
    return url;
  }  
  getInformation() {
    const url = (this.editUrl(this.target, this.cardId));
    return this.getJsonData(url);
  }
}
function aaa() {
  const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  const cards = new GetTrelloInformation('/cards').information;
  const cardMergeEstimateAndAchievement = getEstimateAndAchievementInfo(cards);
  //console.log(cardMergeEstimateAndAchievement);
  //console.log(cards[1]);
  return;
  // Set the board name
  const cardMergeBoard = getBoardName(cards);
  // Set the member name
  const cardMergeMember = getMemberName(cardMergeBoard);
  // Set the list name
  const cardMergeList = getListInfo(cardMergeMember);
  // Set the lable
  const cardMergeLabel = getLabelInfo(cardMergeList);
  console.log(cardMergeLabel[1]);
}
function getBoardName(cards) {
  const boardInfo = new GetTrelloInformation('').information;
  const cardMergeBoard = cards.map(card => {
    card['boardName'] = boardInfo.name;
    return card;
  });
  return cardMergeBoard
}
function getMemberName(cards) {
  const memberJson = new GetTrelloInformation('/members').information;
  const cardMergeMember = cards.map(card => {
    const memberName = card.idMembers.map(idMember => {
      const memberData = memberJson.filter(member => member.id == idMember);
      return memberData[0].fullName;
    });
    card['memberName'] = memberName;
    return card;
  });
  return cardMergeMember;
}
function getListInfo(cards) {
  const listJson = new GetTrelloInformation('/lists').information;
  const cardMergeList = cards.map(card => {
    const targetList = listJson.filter(list => list.id == card.idList);
    card['listName'] = targetList[0].name;
    return card;
  });
  return cardMergeList;
}
function getLabelInfo(cards) {
  const labelJson = new GetTrelloInformation('/labels').information;
  const cardMergeLabel = cards.map(card => {
    const labelName = card.idLabels.map(labelInfo => {
      const labelData = labelJson.filter(label => label.id == labelInfo);
      return labelData[0].name;
    });
    card['labelName'] = labelName;
    return card;
  });
  return cardMergeLabel;
}
function getEstimateAndAchievementInfo(cards) {
  const customFieldItemsJson = new GetTrelloInformation('/customFields').information;
  const customFieldItemsList = customFieldItemsJson.map(customFieldItem => {
    customFieldItem['varName'] = setEstimateOrAchievementVarName(customFieldItem.name);
    return customFieldItem;
  });
  const cardMergeCustomFieldItems = cards.map(card => {
    const customFieldItemsByCardJson = new GetTrelloInformationByCard('/customFieldItems', card.id).getInformation();
    const cardMergeValue = customFieldItemsByCardJson.map(function(customFieldItemsByCard) {
      const customFieldItems = this.filter(customFieldItem => customFieldItem.id == customFieldItemsByCard.idCustomField);
      customFieldItemsByCard['name'] = customFieldItems[0].name;
      customFieldItemsByCard[customFieldItems[0].varName] = customFieldItemsByCard.value.number;
      return customFieldItemsByCard;
    }, customFieldItemsList);
    return cardMergeValue;
  });
  console.log(cardMergeCustomFieldItems);
}
function setEstimateOrAchievementVarName(target) {
  const estimate = 'estimate';
  const achievement = 'achievement';
  var estimateAndAchievement = {};
  estimateAndAchievement[estimate] = '見積';
  estimateAndAchievement[achievement] = '実績';
  if (target == estimateAndAchievement.estimate) {
    var temp = estimate;
  } else if (target == estimateAndAchievement.achievement) {
    var temp = achievement;
  } else {
    var temp = '';
  }
  return temp;
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
