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
class GetTrelloLists extends GetTrelloInformation{
    editUrl() {
    const trelloInfo = this.getTrelloProperties();
    const url = 'https://trello.com/1/boards/' + trelloInfo.boardId + '/lists?key=' + trelloInfo.key + '&token=' + trelloInfo.token + '&fields=all&cards=all&filter=all';
    return url;
  } 
}
class GetTrelloCardsByLists extends GetTrelloInformation{
  editUrl(target) {
    const trelloInfo = this.getTrelloProperties();
    const url = 'https://api.trello.com/1/lists/' + target + '/cards?key=' + trelloInfo.key + '&token=' + trelloInfo.token + '&fields=all&attachments=true&members=true&checkItemStates=true&pluginData=true&stickers=true&customFieldItems=true';
    return url;
  }  
}
function filterArray(varNameList, target) {
  const temp = {};
  varNameList.forEach(varName => temp[varName] = target[varName]);
  return temp;
}
function aaa() {
  const estimate = 'estimate';
  const achievement = 'achievement';
  const lists = new GetTrelloLists().information;
  const rawCards = lists.map(list => new GetTrelloCardsByLists(list.id).information);
  var customFieldsList = new GetTrelloInformation('/customFields').information;
  customFieldsList = customFieldsList.map(customFields => {
    var resCustomFieldsList = {};
    if (customFields.name == '見積') {
      resCustomFieldsList.varName = estimate; 
    } else if (customFields.name == '実績') {
      resCustomFieldsList.varName = achievement;
    }
    resCustomFieldsList.idModel = customFields.idModel;
    resCustomFieldsList.name = customFields.name;
    resCustomFieldsList.id = customFields.id;
    return resCustomFieldsList;
  });
  const cards = rawCards.map(card => {
    const cardInfo = card.map(cardValues => {
      cardValues[estimate] = '';
      cardValues[achievement] = '';
      const labels = cardValues.labels.map(label => label.name);
      const members = cardValues.members.map(member => member.fullName);
/*      const customFields = cardValues.customFieldItems.map(cardValue => {
        var temp = {};
        const field = customFieldsList.filter(fieldList => fieldList.id == cardValue.idCustomField); 
        temp[field[0].varName] = cardValue.value.number;
        return temp;
      });*/
      var target = {};
      target.master = customFieldsList;
      const estimateValue = cardValues.customFieldItems.filter(customField => customField.idCustomField == '5fd8769be5368e375cafd321');

      if (estimateValue.length > 0) {
        cardValues.estimate = estimateValue[0].value.number;
      }
      cardValues.labelList = labels;
      cardValues.memberList = members;
      return cardValues;
    });
    console.log(cardInfo);
  });
  //console.log(rawCards);
  return;

  return;
  const cardsInfo = new GetTrelloInformation('/cards').information;
//  const cards = cardsInfo.map(card => filterArray(['id', 'name', 'desc', 'idBoard', 'idLabels', 'idList', 'idChecklists', 'idMembers', 'limits', 'url'], card));
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
function getCustomFieldValue(target) {
  const master = target.master.filter(masterValues => masterValues.id == target.id);
  target.customFieldItems[master[0].varName] = target.customFieldItems.value.number;
  return target.customFieldItems[master[0].varName];
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

