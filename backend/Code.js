function doGet() {
  
}

/******************************************************************************************************************************/

var Route={};

Route.path = function(route,callback){
  Route[route]= callback;
}


function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


function doGet(e) {
  if (e.parameter.v != null && e.parameter.v != ""){
    return render(e.parameter.v,{title:"IT PwC AppScript CA Extra Sistema"});
  }
  else {
    return render("index", {title:"IT PwC AppScript CA Extra Sistema"} )
  }
  
}


function render(file, argsObject){

   var tmp = HtmlService.createTemplateFromFile(file);
   if(argsObject){
      var keys = Object.keys(argsObject);
      keys.forEach(function(key){
         tmp[key]=argsObject[key];
      });
   }
   return tmp.evaluate();
   
}

function getScriptUrl() {
 var url = ScriptApp.getService().getUrl();;
 if(ScriptApp.getService().getUrl().indexOf("/exec")>0){
  return url;
 }else{
  return ScriptApp.getService().getUrl();
 }
}


/********************************************************************************************************************** */

function setFormQuestion(form){

  // Add a new question to the form for "domanda1"
  form.addTextItem().setTitle('domanda1');

  // Add a new question to the form for "domanda2"
  form.addTextItem().setTitle('domanda2');

  return form;

}

function setFormOptions(form){

  // Set the spreadsheet as the destination for form responses
  form.setDestination(FormApp.DestinationType.SPREADSHEET, MASTERDATA);
  form.setAllowResponseEdits(true);
  form.setCollectEmail(true);

  return form;

}

function createNewForm() {

  var response = {

    formUrl: null,
    formId:null,

  }

  // Get the folder where the form should be saved
  const folder = DriveApp.getFolderById(ROOTFOLDER);

  // Create a new Google Form in the specified folder
  var form = FormApp.create('New Form');
  folder.addFile(DriveApp.getFileById(form.getId()));

  form = setFormQuestion(form)
  form = setFormOptions(form);

  response.formUrl = form.getPublishedUrl();
  response.formId = form.getId();

  // Return the form ID
  return response;
}

function checkIfCustomerHasBeenVerified(customersVerified,customerId){

  const response = {

    verified: false,
    link : null
  }

  if(customersVerified.length >1 ){

    for(let i=customersVerified.length-1; i>=0  ; i--){

      const currentCustomer = customersVerified[i];

      if(currentCustomer[1]==customerId){

        response.verified = true
        response.link = currentCustomer[2];
        response.id = currentCustomer[3]
        response.customerRow = i;

        break;

      }

    }

    
  }

  return response

}

function GetForm(customerId,operationType) {

  var response = {};

  // Get the spreadsheet by ID
  const spreadsheetId = MASTERDATA;
  var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('Join');

  switch(operationType){

    case "create":

      //create new form

      const formCreationResponse = createNewForm();

      const formUrl = formCreationResponse.formUrl
      const formId = formCreationResponse.formId
      const currentUser = Session.getActiveUser().getEmail();

      // Generate the new record
      const newRecord = [currentUser, customerId, formUrl,formId, new Date()];

      // Append the new record to the sheet
      sheet.appendRow(newRecord);

      response.link = formUrl;

      break;

    case "update":

      const customersVerified = sheet.getDataRange().getValues();
      var checkResponse = checkIfCustomerHasBeenVerified(customersVerified,customerId)
    
      if(checkResponse.verified){
    
        //update form 
    
        const form = FormApp.openById(checkResponse.id)
        const responses = form.getResponses()
    
        if(responses.length>0){
    
          response.link = responses[0].getEditResponseUrl()
          sheet.getRange(checkResponse.customerRow+1 ,6).setValue(response.link)
          sheet.getRange(checkResponse.customerRow+1 ,7).setValue(new Date())
    
        }else{
    
          response.message = "form creato ma nessuna risposta fornita, ecco il link di pubblicazione"
          response.link = checkResponse.link
        }

      }

      break;

    default:

      break;


  }

  return response;
  
}





