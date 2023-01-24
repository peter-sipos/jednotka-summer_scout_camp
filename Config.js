/**
 * @author Peter Šípoš
 * @version 1.1
 *
 * Ciel:
 * Konfiguracny subor pre prilozeny skript zabezpecujuci automatizovane spracovanie prihlasok.
 * Pre prisposobnie skriptu pre specificke uzitie uprav len tento subor, respektive jeho cast.
 * Nie je nutne a ani odporucanie nijak zasahovat do samotneho skriptu, ktory je ulozeny v inom subore.
 */


/////// VSEOBECNE INFO //////

// Do poli ohranicenych pomocu znaciek "ZACIATOK UPRAV" a "KONIEC UPRAV" vloz specificke info pre tvoje subory a zbor.
// Udaje do poli vkladaj medzi znacky ''.
// Pre funkcionalitu s prilozenymi sablona nie je potrebne editovat ziadne dalsie polia ani nic ine


// Ako ziskat nizsie pozadovane IDcka a co su vlastne zac

// ID SUBORU = retazec medzi /d/ a /edit v URL suboru
// PRIKLAD URL SUBORU: https://docs.google.com/document/d/1wdewdkfeef28nd83s2/edit
// ID SUBORU = 1wdewdkfeef28nd83s2

// ID PRIECINKA = retazec po poslednom / v URL priecinka
// EXAMPLE FOLDER URL https://drive.google.com/drive/u/1/folders/37dh8nxnxnd8ghag8ax
// ID PRIECINKA = 37dh8nxnxnd8ghag8ax


// ----------------------------------------------------------------------------------------- //



///////////////////////////////////////////////////////////////////////////////////////////////
// ZACIATOK UPRAV /////////////////////////////////////////////////////////////////////////////

// Polia pre sablonu prihlasky: ///////////////////////////////////////////////////////////////

// Id suboru sablony prihlasky
const PRIHLASKA_SABLONA_ID_SUBORU = '';

// Id suboru sablony sprievodneho mailu
const EMAIL_SABLONA_ID_SUBORU = '';

// Id priecinka kam sa budu ukladat vygenerovane PDFka prihlasok
const PRIECINOK_S_PDF_ID_PRIECINKA = '';

// Nazov tvojho zboru
const NAZOV_ZBORU = '';

// IBAN uctu tvojho zboru na ktory prijmate poplatky za tabor. Validny je IBAN s medzerami aj bez
const IBAN_ZBORU = '';


// Polia pre sablonu sprievodneho emailu: ///////////////////////////////////////////////////////

// Nazov najblizsej obce pri taborisku
const TABOR_OBEC = '';

// GPS suradnice luky taboriska
const TABOR_SURADNICE = '';

// Link na web stranku s informaciami o vasom tabore
const TABOR_WEB = '';

// Osobne udaje vodcu tabora
const VODCA_TABORA_MENO = '';
const VODCA_TABORA_EMAIL = '';
const VODCA_TABORA_TELEFON = '';

// KONIEC UPRAV ///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////



// ----------------------------------------------------------------------------------------- //
// NEEDITUJ NIC CO JE ODTIALTO NIZSIE POKIAL TO NIE JE VYSLOVENE NEVYHNUTNE!!!
// NEVYHNUTNOST ZMIEN JE  NAPR. V PRIPADE ZMENY TAGOV V SABLONACH KTORE SA NENACHADZAJU
// V PRIHLASOVACOM FORMULARI AKO OTAZKY ALEBO V PRIPADE ZMENY ZNENIA DOLEZITYCH OTAZOK
// V SAMOTNOM PRIHLASOVACOM FORMULARI (VID NIZSIE)
// ----------------------------------------------------------------------------------------- //

///////////////////////////////////////////////////////////////////////////////////////////////
// Tagy pouzite v sablonach ktore nefiguruju v prihlasovacom formulari ako otazky

// Tagy v sablone prilasky:
const ROK_TAG = "{{Rok}}";
const PAY_BY_SQUARE_QR_KOD_TAG = "{{payBySquare}}";
const ROK_NARODENIA_UCASTNIKA_TAG = "{{Rok narodenia účastníka}}";
const NAZOV_ZBORU_TAG = "{{Názov zboru}}";
const IBAN_ZBORU_TAG = "{{IBAN}}";

// Tagy v sablone sprievodneho emailu:
const TABOR_OBEC_TAG = "{{Tábor - obec}}";
const TABOR_SURADNICE_TAG = "{{Tábor - súradnice}}";
const TABOR_WEB_TAG = "{{Tábor - web}}";
const VODCA_TABORA_MENO_TAG = "{{Vodca - meno}}";
const VODCA_TABORA_EMAIL_TAG = "{{Vodca - email}}";
const VODCA_TABORA_TELEFON_TAG = "{{Vodca - mobil}}";


// Nazvy otazok v prihlasovacom formulari ktore su priamo pouzite v skripte
// Data z tychto otazok (teda odpovede na ne) su priamo pouzitie v skripte, napr. pre generovanie nazvu suboru
// generovaneho PDFka, generovanie personalizovanych plaobnych udajov vratane QR kodu na platbu ci ziskanie emailovej
// adresy na ktoru sa nasledne prihlaska odosle.
// Preto je vynimocne dolezite, aby sa hodnota poli nizsie presne zhodovala ako s nazvom otazok v prihlasovacom
// formulari tak aj s hlavickami danych stlpcov v tabulke s odpovedami z formulara
const DATUM_NARODENIA_OTAZKA = "Dátum narodenia";
const POPLATOK_OTAZKA = "Účastnícky poplatok";
const MENO_UCASTNIKA_OTAZKA = "Meno";
const PRIEZVISKO_UCASTNIKA_OTAZKA = "Priezvisko";
const EMAIL_OTAZKA = "E-mail";


// Ine konfiguracne parametre

// Name of the header for the column containing link to the created
// Nazov hlavicky stlpca do ktoreho sa budu pridavat linky na vygenerovane PDFka s prihlaskami pre konkretnych ucastnikov
const PDF_URL_NAZOV_STLPCA = 'PDF link';

// Sirka vygenerovaneho Pay By Square QR kodu pre rychlu platbu. Pre prilozenu sablonu je velkost nastavena akurat
const PAY_BY_SQUARE_SIRKA_QR_KODU = 128;
