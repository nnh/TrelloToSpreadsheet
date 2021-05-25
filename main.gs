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
function filterArray(varNameList, target) {
  const temp = {};
  varNameList.forEach(varName => temp[varName] = target[varName]);
  return temp;
}
function aaa() {
  const cardsInfo = new GetTrelloInformation('/cards').information;
  const cards = cardsInfo.map(card => filterArray(['id', 'name', 'desc', 'idBoard', 'idLabels', 'idList', 'idChecklists', 'idMembers', 'limits', 'url'], card));
  // Set the customfields
  const cardMergeEstimateAndAchievement = getEstimateAndAchievementInfo(cards);
  // Set the board name
  const cardMergeBoard = getBoardName(cardMergeEstimateAndAchievement);
  // Set the member name
  const cardMergeMember = getMemberName(cardMergeBoard);
  // Set the list name
  const cardMergeList = getListInfo(cardMergeMember);
  // Set the lable
  const cardMergeLabel = getLabelInfo(cardMergeList);
  outputSheet(cardMergeLabel);
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
  const customFieldItemsLists = customFieldItemsJson.map(customFieldItem => {
    customFieldItem['varName'] = setEstimateOrAchievementVarName(customFieldItem.name);
    return customFieldItem;
  });
  const cardMergeCustomFields = cards.map(card => {
    card.estimate = '';
    card.achievement = '';
    const customFieldItemsByCardJson = new GetTrelloInformationByCard('/customFieldItems', card.id).getInformation();
    customFieldItemsByCardJson.forEach(customFieldItemsByCard => {
      const fieldInfo = customFieldItemsLists.filter(itemlist =>  itemlist.id == customFieldItemsByCard.idCustomField);
      if (fieldInfo[0].varName == 'estimate') {
        card.estimate = customFieldItemsByCard.value.number;
      }
      if (fieldInfo[0].varName == 'achievement') {
        card.achievement = customFieldItemsByCard.value.number;
      }
    });
    return card;
  }); 
  return cardMergeCustomFields;
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
function outputSheet(target) {
  const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  const sheetName = "trello";
  // Output card information to spreadsheet
  const sheet = SpreadsheetApp.openByUrl(sheetUrl).getSheetByName(sheetName);
  sheet.clear();
  var outputValues = new Array();
  outputValues.push(Object.keys(target[0]));
  for (var i = 0; i < Object.keys(target).length; i++) {
    outputValues.push(Object.values(target[i]));
  }
  sheet.getRange(1, 1, outputValues.length, outputValues[0].length).setValues(outputValues);
}

