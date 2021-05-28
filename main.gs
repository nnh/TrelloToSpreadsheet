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
    const url = 'https://api.trello.com/1/boards/' + trelloInfo.boardId + '/lists?key=' + trelloInfo.key + '&token=' + trelloInfo.token + '&fields=all&cards=all&filter=all';
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
class GetTrelloItemsByCards extends GetTrelloInformation{
  editUrl(target) {
    const trelloInfo = this.getTrelloProperties();
    const url = 'https://api.trello.com/1/cards/' + target.id + target.item + '?key=' + trelloInfo.key + '&token=' + trelloInfo.token;
    return url;
  }  
}
function outputTrelloToSpreadSheet() {
  const estimate = 'estimate';
  const achievement = 'achievement';
  const lists = new GetTrelloLists().information;
  const rawCards = lists.map(list => new GetTrelloCardsByLists(list.id).information);
  const customFieldsList = new GetTrelloInformation('/customFields').information;
  const cards = rawCards.map(card => {
    const cardInfo = card.map(cardValues => {
      cardValues[estimate] = '';
      cardValues[achievement] = '';
      const checklistTarget = {id: cardValues.id, item:'/checklists'};
      const checkLists = new GetTrelloItemsByCards(checklistTarget).information;
      const targetCheckLists = checkLists.map(checkList => {
        const checkItemValues = checkList.checkItems.map(checkItem => checkItem.name + '(' + checkItem.state + ')').join();
        return checkList.name + ':' + checkItemValues;
      });
      cardValues.checkListList = targetCheckLists;
      const actionsTarget = {id: cardValues.id, item:'/actions'};
      const actionsLists = new GetTrelloItemsByCards(actionsTarget).information;
      const targetActionsLists = actionsLists.filter(actionsList => actionsList.type == 'commentCard' && actionsList.data.text != null);
      cardValues.activity = targetActionsLists.map(targetAction => targetAction.data.text).join();
      const labels = cardValues.labels.map(label => label.name).join();
      const members = cardValues.members.map(member => member.fullName).join();
      const estimateMaster = customFieldsList.filter(customField => customField.name == "見積")[0];
      const achievementMaster = customFieldsList.filter(customField => customField.name == "実績")[0];
      const estimateValue = cardValues.customFieldItems.filter(customField => customField.idCustomField == estimateMaster.id);
      if (estimateValue.length > 0) {
        cardValues[estimate] = estimateValue[0].value.number;
      }
      const achievementValue = cardValues.customFieldItems.filter(customField => customField.idCustomField == achievementMaster.id);
      if (achievementValue.length > 0) {
        cardValues[achievement] = achievementValue[0].value.number;
      }
      cardValues.labelList = labels;
      cardValues.memberList = members;
      return filterArray(['id', 'closed', 'name', 'desc', 'labelList', 'memberList', 'estimate', 'achievement', 'activity', 'checkListList', 'url'],cardValues);
    });
    return cardInfo;
  });
  outputSheet(cards);
}
function filterArray(varNameList, target) {
  const temp = {};
  varNameList.forEach(varName => temp[varName] = target[varName]);
  return temp;
}
function outputSheet(target) {
  const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  const sheetName = "trello";
  // Output card information to spreadsheet
  const sheet = SpreadsheetApp.openByUrl(sheetUrl).getSheetByName(sheetName);
  sheet.clear();
  // Converting arrays to setValues argument form
  const cardTable = target.reduce((valueTable, targetValues) => { 
    valueTable.push(...targetValues);
    return valueTable;
  }, []);
  const outputValues = cardTable.reduce((valueTable, targetValues) => {
    valueTable.push(Object.values(targetValues));
    return valueTable;
  }, [Object.keys(cardTable[0])]);
  sheet.getRange(1, 1, outputValues.length, outputValues[0].length).setValues(outputValues);
}