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

// END EDITS //////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
// ----------------------------------------------------------------------------------------- //

// Get current year
const CURRENT_YEAR = new Date().getFullYear();

// The question "Year" isn't part of the application form, therefore we have to create the tag manually
const YEAR_TAG = "{{Rok}}";

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
 */
function populateTemplate(document, response_data) {

    // Get the document body which contains the text we'll be replacing
    var documentBody = document.getBody();

    // Replace tags in the template with values from the form response
    for (var key in response_data) {
        var match_text = escapeRegexChars(`{{${key}}}`);
        var value = response_data[key];

        documentBody.replaceText(match_text, value);
    }

    // Manually replace the year tag (which isn't part of the response data)
    documentBody.replaceText(YEAR_TAG, CURRENT_YEAR)
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

    // Create a temp copy of the application template file
    var appTemplateTempCopy = applicationTemplateFile.makeCopy(targetFolder);

    // Open the temp copy
    var openDocument = DocumentApp.openById(appTemplateTempCopy.getId());

    // Populate the template with form responses and save it
    populateTemplate(openDocument, responseData);
    openDocument.saveAndClose();

    // Convert the populated template to PDF
    var documentCopyPdf = appTemplateTempCopy.getAs(MimeType.PDF);

    // Use the values of the specific headers in the file name
    var filename = `Prihláška na skautský tábor ` + CURRENT_YEAR + ` - ${responseData["Meno"]} ${responseData["Priezvisko"]}`;

    // Save the PDF to target folder
    var resultPdfFile = targetFolder.createFile(documentCopyPdf).setName(filename);

    // Delete the temp copy of the template
    appTemplateTempCopy.setTrashed(true);


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
