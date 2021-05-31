/**
* Get Trello information.
*/
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
    //curl https://api.trello.com/1/lists/560bf44ea68b16bd0fc2a9a9/cards?fields=id,name,badges,labels
//    const url = 'https://api.trello.com/1/boards/' + trelloInfo.boardId + '/?fields=name&cards=all&card_fields=all&customFields=true&card_customFieldItems=true&lists=all&list_fields=all' + '&key=' + trelloInfo.key + '&token=' + trelloInfo.token;
    const url = 'https://api.trello.com/1/boards/' + trelloInfo.boardId + '/?fields=name&cards=all&card_fields=all&customFields=true&card_customFieldItems=true&lists=all&list_fields=all&members=all&checklists=all&actions=commentCard&attachments=true' + '&key=' + trelloInfo.key + '&token=' + trelloInfo.token;
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
    const url = 'https://api.trello.com/1/boards/' + trelloInfo.boardId + '/lists?key=' + trelloInfo.key + '&token=' + trelloInfo.token + '&fields=all&cards=all&filter=all&card_fields=all';
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
/**
* Output Trello information to a spreadsheet.
* @param none
* @return none
*/
function outputTrelloToSpreadSheet(){
  const estimate = 'estimate';
  const achievement = 'achievement';
  const trelloInfoList = new GetTrelloInformation().information;
  const estimateMaster = trelloInfoList.customFields.filter(customField => customField.name == "見積")[0];
  const achievementMaster = trelloInfoList.customFields.filter(customField => customField.name == "実績")[0];
  const cards = trelloInfoList.cards.map(card => {
    // customFields
    card[estimate] = '';
    card[achievement] = '';
    const estimateValue = card.customFieldItems.filter(customField => customField.idCustomField == estimateMaster.id);
      if (estimateValue.length > 0) {
        card[estimate] = estimateValue[0].value.number;
      }
      const achievementValue = card.customFieldItems.filter(customField => customField.idCustomField == achievementMaster.id);
      if (achievementValue.length > 0) {
        card[achievement] = achievementValue[0].value.number;
      }
      // checklist
      const targetChecklists = trelloInfoList.checklists.filter(checklistItem => card.id == checklistItem.idCard);
      const checklistValues = targetChecklists.map(targetChecklist => {
        const checkitems = targetChecklist.checkItems.map(checkitem => checkitem.name + '(' + checkitem.state + ')');
        return targetChecklist.name + ':' + checkitems;
      });
    card.checklist = checklistValues;
    // activity
    const targetActivities = trelloInfoList.actions.filter(action => card.id == action.data.card.id);
    card.activity = targetActivities.map(targetActivity => targetActivity.data.text);
    // label, member
    card.labelList = card.labels.map(label => label.name).join();
    const memberList = card.idMembers.map(member => {
      const temp = trelloInfoList.members.filter(memberList => memberList.id == member)[0];
      return temp.fullName;
    });
    card.memberList = memberList;
    return filterArray(['id', 'closed', 'name', 'desc', 'labelList', 'memberList', 'estimate', 'achievement', 'activity', 'checklist', 'url'], card);
  });
  outputSheet(cards);
}
/**
* Extract array elements.
* @param {!Array <string>} varNameList List of keys to be extracted
* @param {Object>} target Associative array of extraction targets
* @return {Object} Associative array 
*/
function filterArray(varNameList, target) {
  const temp = {};
  varNameList.forEach(varName => temp[varName] = target[varName]);
  return temp;
}
/**
* Output to spreadsheet.
* @param {Object>} An associative array of output targets
* @return none
*/
function outputSheet(target){
  const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  const sheetName = "trello";
  // Output card information to spreadsheet
  const sheet = SpreadsheetApp.openByUrl(sheetUrl).getSheetByName(sheetName);
  sheet.clear();
  const body = target.map(targetValue => Object.values(targetValue));
  const outputValues = [[...Object.keys(target[0])], ...body];
  sheet.getRange(1, 1, outputValues.length, outputValues[0].length).setValues(outputValues);
}
