/**
 * @author Peter Šípoš
 * @version 1.1
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



// Application specific fields: ///////////////////////////////////////////////////////////////

// id of application template document
var APPLICATION_TEMPLATE_FILE_ID;

// id of email body template document
var EMAIL_TEMPLATE_FILE_ID;

// id of folder where final PDFs of applications will be stored
var DESTINATION_FOLDER_ID;

// The name of your scout group as will be displayed in the the final application
var SCOUT_GROUP_NAME;

// The number of your scout group's banking account unto which you accept payments. Use IBAN format
var IBAN;


// Email specific fields: ////////////////////////////////////////////////////////////////////////

// The name of the closest municipality to the campsite
var CAMP_MUNICIPALITY;

// The GPS coordinates of the campsite
var CAMP_COORDINATES;

// The link to your website with information about the camp
var CAMP_WEBSITE;

// Personal information about the camp leader
var CAMP_LEADER_NAME;
var CAMP_LEADER_EMAIL;
var CAMP_LEADER_PHONE;

///////////////////////////////////////////////////////////////////////////////////////////////
// Tags used in the templates that are not questions in the application form
// and therefore we have to create them manually

// Application template tags:
var YEAR_TAG;
var PAY_BY_SQUARE_TAG;
var PARTICIPANT_BIRTH_YEAR_TAG;
var SCOUT_GROUP_NAME_TAG;
var IBAN_TAG;

// Email template tags:
var CAMP_MUNICIPALITY_TAG;
var CAMP_COORDINATES_TAG;
var CAMP_WEBSITE_TAG;
var CAMP_LEADER_NAME_TAG;
var CAMP_LEADER_EMAIL_TAG;
var CAMP_LEADER_PHONE_TAG;

// Names of the fields/questions in the application form
var PARTICIPANT_BIRTHDAY_FIELD;
var PARTICIPANT_FEE_FIELD;
var PARTICIPANT_NAME_FIELD;
var PARTICIPANT_SURNAME_FIELD;
var EMAIL_FIELD;

// Other configurable fields
// The width of the pay by square qr code. For provided template leave as is
var PBS_QR_WIDTH;

// Name of the header for the column containing link to the created PDF
var PDF_URL_HEADER;


// Current year
const CURRENT_YEAR = new Date().getFullYear();

// Special characters that can mess up tag replacement so they need to be escaped
const SPECIAL_CHARACTERS_TO_ESCAPE = './+()*$^?[]|';

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


/**
 * Helper function that escapes special characters in texts that replaces the tags in the template
 * Puts a backward slash ('\') in front of all special characters (see: SPECIAL_CHARACTERS_TO_ESCAPE constant) to escape them
 * Example: 'Meno (1)' -> 'Meno \(1\)'
 * Based on: https://stackoverflow.com/questions/10627356/how-to-use-method-replacetextsearchpattern-replacement-in-documents-service
 * @param s - string to escape
 * @returns {{match_text}} - the new, escaped string that can be safely used to match text when using `document.replaceText`
 */
const escapeRegexChars = (s) => 
  [...s].reduce((acc, x) => {
    if (SPECIAL_CHARACTERS_TO_ESCAPE.includes(x)) {
      return acc + `\\${x}`;
    }

    return acc + x;
  }, '');


/**
 * Helper function that replaces given text with given image.
 * Warning - the text to be replaced needs to be in a paragraph, not in a (bullet)list item.
 * The whole paragraph containing the text is replaced. Therefore it is advised to have the searched text
 * on a separate paragraph. If you need to have the image inserted inline with existing text, put the image tag
 * and the text you want to keep into a table into different cells in the template.
 * Based on: https://gist.github.com/tanaikech/f84831455dea5c394e48caaee0058b26
 * @param body - the body of the opened document
 * @param searchText - the text to be replaced by image
 * @param image - the image to replace the text with
 * @param width - desired width of the image for resizing
 */
function replaceTextToImage(body, searchText, image, width) {
    var next = body.findText(searchText);
    if (!next) return;
    var r = next.getElement();
    r.asText().setText("");
    var img = r.getParent().asParagraph().insertInlineImage(0, image);
    if (width && typeof width == "number") {
        var w = img.getWidth();
        var h = img.getHeight();
        img.setWidth(width);
        img.setHeight(width * h / w);
    }
}


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
    documentBody.replaceText(PARTICIPANT_BIRTH_YEAR_TAG, participantYear);
    documentBody.replaceText(SCOUT_GROUP_NAME_TAG, SCOUT_GROUP_NAME);
    documentBody.replaceText(IBAN_TAG, IBAN);
    replaceTextToImage(documentBody, PAY_BY_SQUARE_TAG, payBySquare, PBS_QR_WIDTH);
    documentBody.replaceText(CAMP_MUNICIPALITY_TAG, CAMP_MUNICIPALITY);
    documentBody.replaceText(CAMP_COORDINATES_TAG, CAMP_COORDINATES);
    documentBody.replaceText(CAMP_WEBSITE_TAG, CAMP_WEBSITE);
    documentBody.replaceText(CAMP_LEADER_NAME_TAG, CAMP_LEADER_NAME);
    documentBody.replaceText(CAMP_LEADER_EMAIL_TAG, CAMP_LEADER_EMAIL);
    documentBody.replaceText(CAMP_LEADER_PHONE_TAG, CAMP_LEADER_PHONE);
}


/**
 * Extracts year from a date in "dd.mm.yyyy" format.
 * @param date - the date in dd.mm.yyyy format
 * @returns {string} - the extracted year
 */
function extractYearFromDate(date) {
    const [day, month, year] = date.split('.');
    return year;
}


/**
 * Generates a Pay By Square QR code .png file for easy payment by making a call to external API
 * Currently uses API available at https://www.qrgenerator.sk/
 * If in the future the API becomes unavailable, there are two alternatives:
 *   1) Make use of the official by square generator API - after registration you get 100 generations for free per month
 *      Official by square resource: https://app.bysquare.com/App/api
 *   2) Make calls to their freely available online generator at https://bsqr.co/generator/
 *      The called URL is: https://bsqr.co/generator/qr.php
 *      It expects a POST call with XML payload with ContentType: application/x-www-form-urlencoded
 *      It returns an XML in which there is the generated QR code in a Base64 string
 *      The string needs to be corrected - it contains additional '\' characters which are invalid Base64 characters
 *      Then the string needs to be converted to a .png file
 * @param participantFee - payment amount
 * @param participantName - name of the participant - used in payment_note for assigning payment to participant
 * @param participantSurname - surname of the participant - used in payment_note for assigning payment to participant
 * @param participantYear - year of birth of the participant - used in payment_note for assigning payment to participant
 * @returns {Blob} - the
 */
function generateQrPayment(participantFee, participantName, participantSurname, participantYear) {
    const qrgeneratorskUrl = 'https://api.QRGenerator.sk/by-square/pay/qr.png'
    const queryParams = `?iban=${IBAN}` +
        `&amount=${participantFee}` +
        `&currency=EUR` +
        `&payment_note=Tabor ${CURRENT_YEAR}, ${participantName} ${participantSurname}, ${participantYear}` +
        `&size=128` +
        `&transparent=false`;

    return UrlFetchApp.fetch(qrgeneratorskUrl + queryParams, {muteHttpExceptions: true}).getBlob();
}


/**
 * Helper function to check if a given document is an MS Word .docx file
 * @param file - the checked document file
 * @returns {boolean} - true if the document is .docx file, false otherwise
 */
function isFileDocx(file){
    const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return file.getMimeType() === docxMime;
}


/**
 * Function for converting .docx file to Google Doc file.
 * Google Apps Script can't generally work with Microsoft .docx file so it needs to be converted.
 * Requires for Drive API v2 to be enabled in the Google Apps Script editor
 * Based on: https://gist.github.com/tanaikech/8d639542577a594f6104b7f6fb753064
 * @param file - the .docx file that is to be converted into Google Doc file
 */
function convToGoogleDoc(file){
    var filename = file.getName();
    var mime = file.getMimeType();
    var toMime = "application/vnd.google-apps.document";
    var metadata = {
        name: filename,
        mimeType: toMime
    };
    var fields = "id,mimeType,name";
    var url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=" + encodeURIComponent(fields);
    var boundary = "xxxxxxxxxx";
    var data = "--" + boundary + "\r\n";
    data += "Content-Type: application/json; charset=UTF-8\r\n\r\n";
    data += JSON.stringify(metadata) + "\r\n";
    data += "--" + boundary + "\r\n";
    data += "Content-Type: " + mime + "\r\n\r\n";
    var payload = Utilities.newBlob(data).getBytes().concat(file.getBlob().getBytes()).concat(Utilities.newBlob("\r\n--" + boundary + "--").getBytes());
    var res = UrlFetchApp.fetch(url, {
        method: "post",
        headers: {
            "Authorization": "Bearer " + ScriptApp.getOAuthToken(),
            "Content-Type": "multipart/related; boundary=" + boundary
        },
        payload: payload,
        muteHttpExceptions: true
    }).getContentText();
    return DriveApp.getFileById(JSON.parse(res).id);
}

// Original function for converting .docx to Google doc.
// Replaced by a better solution that doesn't require manual enablement of Drive API.
// Can be uncommented and used as is in case the other solution stops working.
// This solution is based on: https://stackoverflow.com/a/59535930
// function convToGoogleDoc(docxFile) {
//     var newDoc = Drive.newFile();
//     var docxFileBlob = docxFile.getBlob();
//     var gdocFile = Drive.Files.insert(newDoc, docxFileBlob, {convert:true});
//     return DriveApp.getFileById(gdocFile.id);
// }


/**
 * The main function that creates and sends the application PDF
 * THIS FUNCTION MUST BE SELECTED IN THE TRIGGER
 */
function createAndSendPdfFromForm() {
    mapParamsFromConfigInLocale();

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
        applicationTemplateFile = convToGoogleDoc(applicationTemplateFile);
    }

    // Create a temp copy of the application template file
    var appTemplateTempCopy = applicationTemplateFile.makeCopy(targetFolder);

    // Open the temp copy
    var openDocument = DocumentApp.openById(appTemplateTempCopy.getId());

    // Get the participant's year, fee, name and surname (needed for payment info)
    var participantYear = extractYearFromDate(`${responseData[PARTICIPANT_BIRTHDAY_FIELD]}`);
    var participantFee = `${responseData[PARTICIPANT_FEE_FIELD]}`;
    var participantName = `${responseData[PARTICIPANT_NAME_FIELD]}`;
    var participantSurname = `${responseData[PARTICIPANT_SURNAME_FIELD]}`;

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

    // Check if email template is .docx and if so, convert it similarly to application template
    var isOriginalEmailTemplateFileDocx = isFileDocx(emailTemplateFile);
    if (isOriginalEmailTemplateFileDocx){
        emailTemplateFile = convToGoogleDoc(emailTemplateFile)
    }

    // Create a temp copy of the email template file
    var emailTemplateTempCopy = emailTemplateFile.makeCopy(targetFolder);

    // Open and populate the email template file
    openDocument = DocumentApp.openById(emailTemplateTempCopy.getId());
    populateTemplate(openDocument, responseData, payBySquare, participantYear);

    // Load the email body from the email template document and close it
    // The email template file must contain HTML tags for proper formatting, as the email body text is sent as HTML
    var emailBody = openDocument.getBody().getText();
    openDocument.saveAndClose();

    // Delete the temp copy of the email template and also the converted copy of the email template if the original was docx
    emailTemplateTempCopy.setTrashed(true);
    if (isOriginalEmailTemplateFileDocx){
        emailTemplateFile.setTrashed(true);
    }

    // Send the email with PDF attached
    // Sender email is the one which has set up the trigger
    // Use the specific "E-mail" header to get the recipient's address
    sendEmail(`${responseData[EMAIL_FIELD]}`, emailBody, resultPdfFile);

    // Add the URL link to the final PDF into the spreadsheet
    addPdfLinkToSheet(sheet, lastRowIndex, headers, resultPdfFile);
}


/**
 * Sends email with attachment to the recipient
 * @param recipient - email address of the recipient
 * @param emailBody - the HTML body of the email from template
 * @param pdfFile - attached application in PDF
 */
function sendEmail(recipient, emailBody, pdfFile){
    var subject = "Prihláška na skautský tábor " + CURRENT_YEAR;

    /**
     * Google Apps-Script native function for sending emails
     * @param recipient - email address of the recipient
     * @param subject - the subject of the email
     * @param third parameter - empty email body (is replaced with the htmlBody)
     * @param attachments - array od attachments - currently only the application in PDF
     * @param name - displayed sender name
     * @param htmlBody - email body in HTML format
     */
    GmailApp.sendEmail(recipient, subject, '', {
        attachments: [pdfFile],
        name: SCOUT_GROUP_NAME,
        htmlBody: emailBody
    });
}

/**
 * Adds a link to the generated PDF file stored on drive to the sheet with form responses.
 * This way, it's easier to find participant's application in case it gets lost.
 * @param sheet - the sheet containing the form responses
 * @param lastRowIndex - the index of the last row in the sheet, 0-indexed
 * @param headers - the array containg the headers (values of the first row) of the sheet
 * @param pdf - the finalized PDF of the application
 */
function addPdfLinkToSheet(sheet, lastRowIndex, headers, pdf){
    // Get the index of the last column
    var lastColumnIndex = headers.length - 1;

    // Check if the last column contains PDF links, if not, designate the column for it
    if (headers [lastColumnIndex] !== PDF_URL_HEADER){
        // Important - first increment the index -> otherwise you will overwrite the originally last column
        lastColumnIndex++;
        // The cell ranges are 1-indexed, therefore the necessary +1  to the index
        sheet.getRange(1, lastColumnIndex + 1).setValue(PDF_URL_HEADER);
    }

    // Insert the link to the PDF into last column of the last row (where current response data is stored)
    sheet.getRange(lastRowIndex+1, lastColumnIndex +1).setValue(pdf.getUrl());
}

function mapParamsFromConfigInLocale() {
    // Template fields
    APPLICATION_TEMPLATE_FILE_ID = PRIHLASKA_SABLONA_ID_SUBORU;
    EMAIL_TEMPLATE_FILE_ID = EMAIL_SABLONA_ID_SUBORU;
    DESTINATION_FOLDER_ID = PRIECINOK_S_PDF_ID_PRIECINKA;
    SCOUT_GROUP_NAME = NAZOV_ZBORU;
    IBAN = IBAN_ZBORU;
    CAMP_MUNICIPALITY = TABOR_OBEC;
    CAMP_COORDINATES = TABOR_SURADNICE;
    CAMP_WEBSITE = TABOR_WEB;
    CAMP_LEADER_NAME = VODCA_TABORA_MENO;
    CAMP_LEADER_EMAIL = VODCA_TABORA_EMAIL;
    CAMP_LEADER_PHONE = VODCA_TABORA_TELEFON;

    // Tags
    YEAR_TAG = ROK_TAG;
    PAY_BY_SQUARE_TAG = PAY_BY_SQUARE_QR_KOD_TAG;
    PARTICIPANT_BIRTH_YEAR_TAG = ROK_NARODENIA_UCASTNIKA_TAG;
    SCOUT_GROUP_NAME_TAG = NAZOV_ZBORU_TAG;
    IBAN_TAG = IBAN_ZBORU_TAG;
    CAMP_MUNICIPALITY_TAG = TABOR_OBEC_TAG;
    CAMP_COORDINATES_TAG = TABOR_SURADNICE_TAG;
    CAMP_WEBSITE_TAG = TABOR_WEB_TAG;
    CAMP_LEADER_NAME_TAG = VODCA_TABORA_MENO_TAG;
    CAMP_LEADER_EMAIL_TAG = VODCA_TABORA_EMAIL_TAG;
    CAMP_LEADER_PHONE_TAG = VODCA_TABORA_TELEFON_TAG;

    // Application form questions/fields
    PARTICIPANT_BIRTHDAY_FIELD = DATUM_NARODENIA_OTAZKA;
    PARTICIPANT_FEE_FIELD = POPLATOK_OTAZKA;
    PARTICIPANT_NAME_FIELD = MENO_UCASTNIKA_OTAZKA;
    PARTICIPANT_SURNAME_FIELD = PRIEZVISKO_UCASTNIKA_OTAZKA;
    EMAIL_FIELD = EMAIL_OTAZKA;

    // Other fields
    PBS_QR_WIDTH = PAY_BY_SQUARE_SIRKA_QR_KODU;
    PDF_URL_HEADER = PDF_URL_NAZOV_STLPCA;
}