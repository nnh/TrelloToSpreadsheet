function registerScriptProperty(){
  PropertiesService.getScriptProperties().deleteAllProperties;
  PropertiesService.getScriptProperties().setProperty('trelloBoardId', '');
  PropertiesService.getScriptProperties().setProperty('trelloKey', '');
  PropertiesService.getScriptProperties().setProperty('trelloToken', '');  
}
