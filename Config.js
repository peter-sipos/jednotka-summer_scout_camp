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

// The width of the pay by square qr code. For provided template leave as is.
const PBS_QR_WIDTH = 128;

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

// Special characters that can mess up tag replacement so they need to be escaped
const SPECIAL_CHARACTERS_TO_ESCAPE = './+()*$^?[]|';

// Important application form field/questions
const PARTICIPANT_BIRTHDAY_FIELD = "Dátum narodenia";
const PARTICIPANT_FEE_FIELD = "Účastnícky poplatok";
const PARTICIPANT_NAME_FIELD = "Meno";
const PARTICIPANT_SURNAME_FIELD = "Priezvisko";
const EMAIL_FIELD = "E-mail";