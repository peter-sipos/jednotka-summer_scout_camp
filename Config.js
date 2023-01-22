/**
 * @author Peter Šípoš
 * @version 1.1
 *
 * Purpose:
 * Configuration file for the accompanying script for application automation.
 * To customize the script for your use, edit only values in this config file - no need to edit the main script file.
 */


/////// GENERAL INFORMATION //////

// FILE ID = string between /d/ and /edit in URL
// EXAMPLE FILE URL: https://docs.google.com/document/d/1wdewdkfeef28nd83s2/edit
// FILE ID = 1wdewdkfeef28nd83s2

// FOLDER ID = string after last / in URL
// EXAMPLE FOLDER URL https://drive.google.com/drive/u/1/folders/37dh8nxnxnd8ghag8ax
// FOLDER ID = 37dh8nxnxnd8ghag8ax

// Insert specific info for your files and data below, into the fields between the "BEGIN EDITS" and "END EDITS" marks.
// Insert them between the '' marks.
// There is no need to edit anything else for as is functionality.

// ----------------------------------------------------------------------------------------- //



///////////////////////////////////////////////////////////////////////////////////////////////
// BEGIN EDITS ////////////////////////////////////////////////////////////////////////////////

// Application specific fields: ///////////////////////////////////////////////////////////////

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

// The width of the pay by square qr code. For provided template leave as is
const PBS_QR_WIDTH = 128;


// Email specific fields: ////////////////////////////////////////////////////////////////////////

// The name of the closest municipality to the campsite
const CAMP_MUNICIPALITY = '';

// The GPS coordinates of the campsite
const CAMP_COORDINATES = '';

// The link to your website with information about the camp
const CAMP_WEBSITE = '';

// Personal information about the camp leader
const CAMP_LEADER_NAME = '';
const CAMP_LEADER_EMAIL = '';
const CAMP_LEADER_PHONE = '';

// END EDITS //////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////



// ----------------------------------------------------------------------------------------- //
//////////////////// DO NOT EDIT ANYTHING UNDER THIS LINE UNLESS NECESSARY ////////////////////
/////////////////// E.G. ONLY IN CASE OF CHANGING TAG NAMES IN THE TEMPLATES //////////////////
// ----------------------------------------------------------------------------------------- //

///////////////////////////////////////////////////////////////////////////////////////////////
// Tags used in the templates that are not questions in the application form
// and therefore we have to create them manually

// Application template tags:
const YEAR_TAG = "{{Rok}}";
const PAY_BY_SQUARE_TAG = "{{payBySquare}}";
const PARTICIPANT_BIRTH_YEAR_TAG = "{{Rok narodenia účastníka}}";
const SCOUT_GROUP_NAME_TAG = "{{Názov zboru}}";
const IBAN_TAG = "{{IBAN}}";

// Email template tags:
const CAMP_MUNICIPALITY_TAG = "{{Tábor - obec}}";
const CAMP_COORDINATES_TAG = "{{Tábor - súradnice}}";
const CAMP_WEBSITE_TAG = "{{Tábor - web}}";
const CAMP_LEADER_NAME_TAG = "{{Vodca - meno}}";
const CAMP_LEADER_EMAIL_TAG = "{{Vodca - email}}";
const CAMP_LEADER_PHONE_TAG = "{{Vodca - mobil}}";



// Names of the fields/questions in the application form that are used in the script
// Data from these fields is directly used in the script, e.g. for file naming, generating payment info or sending email
// Therefore it is crucial that these fields really do match with tha names in the application form and thus also with
// the corresponding headers in the table with application responses.
const PARTICIPANT_BIRTHDAY_FIELD = "Dátum narodenia";
const PARTICIPANT_FEE_FIELD = "Účastnícky poplatok";
const PARTICIPANT_NAME_FIELD = "Meno";
const PARTICIPANT_SURNAME_FIELD = "Priezvisko";
const EMAIL_FIELD = "E-mail";



// Other fields and properties used in the script that are not obtained directly from the response
// and thus need to be obtained manually

// Current year
const CURRENT_YEAR = new Date().getFullYear();

// Special characters that can mess up tag replacement so they need to be escaped
const SPECIAL_CHARACTERS_TO_ESCAPE = './+()*$^?[]|';
