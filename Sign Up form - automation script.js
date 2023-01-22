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
 * Based on: https://stackoverflow.com/a/59535930
 * @param docxFile - the .docx file that is to be converted into Google Doc file
 */
function convToGoogleDoc(docxFile) {
    var newDoc = Drive.newFile();
    var docxFileBlob = docxFile.getBlob();
    var gdocFile = Drive.Files.insert(newDoc, docxFileBlob, {convert:true});
    return DriveApp.getFileById(gdocFile.id);
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

    // Load the email body from the email template document and close it
    // The email template file must contain HTML tags for proper formatting, as the email body text is sent as HTML
    openDocument = DocumentApp.openById(emailTemplateFile.getId());
    var emailBody = openDocument.getBody().getText();
    openDocument.saveAndClose();

    // Delete the converted copy of the email template if the original was docx
    if (isOriginalEmailTemplateFileDocx){
        emailTemplateFile.setTrashed(true);
    }

    // Send the email with PDF attached
    // Sender email is the one which has set up the trigger
    // Use the specific "E-mail" header to get the recipient's address
    sendEmail(`${responseData[EMAIL_FIELD]}`, emailBody, resultPdfFile);
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
