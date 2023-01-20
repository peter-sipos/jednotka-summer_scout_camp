/**
 * @author Peter Šípoš
 * @version 1.0
 *
 * Purpose:
 * to parse the data from online application form for a scout summer camp into a document template that will be
 * automatically sent as a PDF via email with a custom body text to the email address specified in the application
 *
 * Based on:
 * https://github.com/automagictv/Apps-Scripts/blob/main/automatic_invoice.gs
 * https://www.youtube.com/watch?v=EpZGvKIHmR8&list=LL&index=3&t=1291s
 * https://www.youtube.com/watch?v=r9uU_KwGgzQ&list=LL&index=5&t=1226s
 *
 * Possible improvements
 * - PDF file name setting in global params in advance
 * - automatic current year fill in into the email template
 */



///////////////////////////////////////////////////////////////////////////////////////////////
// BEGIN EDITS ////////////////////////////////////////////////////////////////////////////////


// FILE ID = string between /d/ and /edit in URL
// EXAMPLE FILE URL: https://docs.google.com/document/d/1wdewdkfeef28nd83s2/edit
// FILE ID = 1wdewdkfeef28nd83s2

// FOLDER ID = string after last / in URL
// EXAMPLE FOLDER URL https://drive.google.com/drive/u/1/folders/37dh8nxnxnd8ghag8ax
// FOLDER ID = 37dh8nxnxnd8ghag8ax

// id of application template document
const APPLICATION_TEMPLATE_FILE_ID = '';

// id of email body template document
const EMAIL_TEMPLATE_FILE_ID = '';

// id of folder where final PDFs of applications will be stored
const DESTINATION_FOLDER_ID = '';

// The name of your scout group as will be displayed in the the final application
const SCOUT_GROUP_NAME = '';

// The number of your scout group's banking account unto which you accept payments. Use IBAN format
const IBAN = '';

// END EDITS //////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
// ----------------------------------------------------------------------------------------- //

// Get current year
const CURRENT_YEAR = new Date().getFullYear();

// These tags used in the application template are not questions in the application form
// Therefore we have to create them manually
const YEAR_TAG = "{{Rok}}";
const PAY_BY_SQUARE_TAG = "{{payBySquare}}";
const PARTICIPANT_BIRTH_YEAR_TAG = "{{Rok narodenia účastníka}}";
const SCOUT_GROUP_NAME_TAG = "{{Názov zboru}}";
const IBAN_TAG = "{{IBAN}}";

/**
 * Creates header-value pairs from separate arrays of headers and values
 * @param values - array of values inputted by the applicant into the Google Form
 * @param headers - array of table headers - question names from the Google Form
 * @returns {{response_data_pairs}} - dictionary containing the paired data of header-value
 */
function createHeaderValuePairs(values, headers) {

    // Initialize empty dictionary
    var headerValuePairs = {};

    // For every value
    for (var i = 0; i < values.length; i++) {

        // Get the corresponding header
        var header = headers[i];

        // Add the header-value pair to the dictionary
        headerValuePairs[header] = values[i];
    }

    return headerValuePairs;
}

// These characters have special meaning in regex
const REGEX_SPECIAL_CHARACTERS = './+()*$^?[]|';

// 
// https://stackoverflow.com/questions/10627356/how-to-use-method-replacetextsearchpattern-replacement-in-documents-service
/**
 * puts a backward slash ('\') in front of all regex special characters (see: REGEX_SPECIAL_CHARACTERS constant)  
 * Example: 'Meno (1)' -> 'Meno \(1\)'
 * 
 * @param s - string to escape
 * @returns {{match_text}} - the new, escaped string that can be safely used to match text when using `document.replaceText`
 */
const escapeRegexChars = (s) => 
  [...s].reduce((acc, x) => {
    if (REGEX_SPECIAL_CHARACTERS.includes(x)) {
      return acc + `\\${x}`;
    }

    return acc + x;
  }, '');

// Helper function to inject data into the template
/**
 * Replaces all the tags {{TAG}} in the document with the user inputted data
 * @param document - the application template document
 * @param response_data - header-value pairs of the data from form
 * @param payBySquare - personalized QR code for quick payment
 * @param participantYear - the birth year of the participant, used for payment info in the application template
 */
function populateTemplate(document, response_data, payBySquare, participantYear) {

    // Get the document body which contains the text we'll be replacing
    var documentBody = document.getBody();

    // Replace tags in the template with values from the form response
    for (var key in response_data) {
        var match_text = escapeRegexChars(`{{${key}}}`);
        var value = response_data[key];

        documentBody.replaceText(match_text, value);
    }

    // Manually replace tags that aren't part of the application form
    documentBody.replaceText(YEAR_TAG, CURRENT_YEAR);
    documentBody.replaceText(PAY_BY_SQUARE_TAG, payBySquare);
    documentBody.replaceText(PARTICIPANT_BIRTH_YEAR_TAG, participantYear);
    documentBody.replaceText(SCOUT_GROUP_NAME_TAG, SCOUT_GROUP_NAME);
    documentBody.replaceText(IBAN_TAG, IBAN);
}

function extractParticipantYearFromBirthdate(birthdate) {
    const [day, month, year] = birthdate.split('.');
    return year;
}

function generateQrPayment(participantFee, participantName, participantSurname, participantYear) {
    const qrgeneratorskUrl = 'https://api.QRGenerator.sk/by-square/pay/qr.png'
    const queryParams = `?iban=${IBAN}` +
        `&amount=${participantFee}` +
        `&currency=EUR` +
        `&payment_note=Tabor ${CURRENT_YEAR}, ${participantName} ${participantSurname}, ${participantYear}` +
        `&size=128` +
        `&transparent=false`;

    return URLFetchApp.fetch(qrgeneratorskUrl + encodeURIComponent(queryParams)).getBlob();
}

function isFileDocx(file){
    const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return file.getMimeType() === docxMime;
}

/**
 * Function for converting .docx file to Google Doc file.
 * Google Apps Script can't generally work with Microsoft .docx file so it needs to be converted.
 * Based on: https://gist.github.com/tanaikech/8d639542577a594f6104b7f6fb753064
 */
function convToGoogle(fileId) {
    if (fileId == null) throw new Error("No file ID.");
    var file = DriveApp.getFileById(fileId);
    var filename = file.getName();
    var mime = file.getMimeType();
    var ToMime = "application/vnd.google-apps.document";
    var metadata = {
        name: filename,
        mimeType: ToMime
    };
    var fields = "id,mimeType,name";
    var url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=" + encodeURIComponent(fields);
    var boundary = "xxxxxxxxxx";
    var data = "--" + boundary + "\r\n";
    data += "Content-Disposition: form-data; name=\"metadata\";\r\n";
    data += "Content-Type: application/json; charset=UTF-8\r\n\r\n";
    data += JSON.stringify(metadata) + "\r\n";
    data += "--" + boundary + "\r\n";
    data += "Content-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"\r\n";
    data += "Content-Type: " + mime + "\r\n\r\n";
    var payload = Utilities.newBlob(data).getBytes().concat(file.getBlob().getBytes()).concat(Utilities.newBlob("\r\n--" + boundary + "\r\n").getBytes());
    var res = UrlFetchApp.fetch(url, {
        method: "post",
        headers: {
            "Authorization": "Bearer " + ScriptApp.getOAuthToken(),
            "Content-Type": "multipart/related; boundary=" + boundary
        },
        payload: payload,
        muteHttpExceptions: true
    }).getContentText();
    return JSON.parse(res).id;
}

/**
 * The main function that creates and sends the application PDF
 * THIS FUNCTION MUST BE SELECTED IN THE TRIGGER
 */
function createAndSendPdfFromForm() {

    // Get the active sheet of the response data table (the sheet that is linked to the form and collects responses)
    var sheet = SpreadsheetApp.getActiveSheet();

    // Get all the data from the spreadsheet
    var sheetData = sheet.getDataRange();

    // Get the index of last row
    var lastRowIndex = sheet.getLastRow() - 1;

    // Get the data from the last row
    var lastRowData = sheetData.getValues()[lastRowIndex];

    // Extract the headers
    var headers = sheetData.getValues()[0];

    // Create the header-value pairs
    var responseData = createHeaderValuePairs(lastRowData, headers);

    // Retrieve the template files and destination folder from Google Drive
    var applicationTemplateFile = DriveApp.getFileById(APPLICATION_TEMPLATE_FILE_ID);
    var emailTemplateFile = DriveApp.getFileById(EMAIL_TEMPLATE_FILE_ID);
    var targetFolder = DriveApp.getFolderById(DESTINATION_FOLDER_ID);

    // Check if the original application template file is DOCX. If yes, convert it to Google Doc so it can be worked on
    // by the script. The converted copy will get deleted at the end.
    var isOriginalAppTemplateFileDocx = isFileDocx(applicationTemplateFile)
    if (isOriginalAppTemplateFileDocx){
        applicationTemplateFile = DriveApp.getFileById(convToGoogle(APPLICATION_TEMPLATE_FILE_ID));
    }

    // Create a temp copy of the application template file
    var appTemplateTempCopy = applicationTemplateFile.makeCopy(targetFolder);

    // Open the temp copy
    var openDocument = DocumentApp.openById(appTemplateTempCopy.getId());

    // Get the participant's year, fee, name and surname (needed for payment info)
    var participantYear = extractParticipantYearFromBirthdate(`${responseData["Dátum narodenia"]}`);
    var participantFee = `${responseData["Účastnícky poplatok"]}`;
    var participantName = `${responseData["Meno"]}`;
    var participantSurname = `${responseData["Priezvisko"]}`;

    // Generate the PayBySquare QR code for the participant
    var payBySquare = generateQrPayment(participantFee, participantName, participantSurname, participantYear);

    // Populate the template with form responses and save it
    populateTemplate(openDocument, responseData, payBySquare, participantYear);
    openDocument.saveAndClose();

    // Convert the populated template to PDF
    var documentCopyPdf = appTemplateTempCopy.getAs(MimeType.PDF);

    // Uniquely name the PDF after the participant
    var filename = `Prihláška na skautský tábor ` + CURRENT_YEAR + ` - ` + participantName + ` ` + participantSurname;

    // Save the PDF to target folder
    var resultPdfFile = targetFolder.createFile(documentCopyPdf).setName(filename);

    // Delete the temp copy of the template and also the converted copy if the original was docx
    appTemplateTempCopy.setTrashed(true);
    if (isOriginalAppTemplateFileDocx){
        applicationTemplateFile.setTrashed(true);
    }

    // Load the email body from the email template document and close it
    // The email template file must contain HTML tags for proper formatting, as the email body text is sent as HTML
    openDocument = DocumentApp.openById(emailTemplateFile.getId());
    var emailBody = openDocument.getBody().getText();
    openDocument.saveAndClose();

    // Send the email with PDF attached
    // Sender email is the one which has set up the trigger
    // Use the specific "E-mail" header to get the recipient's address
    sendEmail(`${responseData["E-mail"]}`, emailBody, resultPdfFile);
}

/**
 * Sends email with attachment to the recipient
 * @param recipient - email address of the recipient
 * @param emailBody - the HTML body of the email from template
 * @param pdfFile - attached application in PDF
 */
function sendEmail(recipient, emailBody, pdfFile){
    /**
     * Google Apps-Script native function for sending emails
     * @param recipient - email address of the recipient
     * @param - email subject
     * @param - empty email body (is replaced with the htmlBody)
     * @param attachments - array od attachments
     * @param name - sender name
     * @param htmlBody - email body in HTML format
     */
    GmailApp.sendEmail(recipient, "Prihláška na skautský tábor " + CURRENT_YEAR , '', {
        attachments: [pdfFile],
        name: '1.zbor Baden-Powella',
        htmlBody: emailBody
    });
}
