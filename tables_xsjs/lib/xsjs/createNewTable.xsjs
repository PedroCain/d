// Get Parameters
var table = $.request.parameters.get('table');
var allColumns = $.request.parameters.get('columns');
var newImport = $.request.parameters.get('newImport');

// Array that contains every single column
// var arrayColumns = allColumns.split(",");
var arrayColumns = JSON.parse(allColumns);

var validFromIsSet = false;

// Function used to sort numeric values
function sortNumber(a, b) {
	return a.position - b.position;
}

arrayColumns.sort(sortNumber);

var numColumns = arrayColumns.length;

// When false, means that the VALID_FROM column has not been inserted yet
var checkValidFrom = false;

var currentType, // Current type processed
	currentLength, // Current domain length
	currentColumn, // Current column processed
	keyFields; //Final key fields

function determineType(abapType) {
	currentType = "NVARCHAR"; // Current type processed
	currentLength = ""; // Current domain length
	var integerLen;

	switch (abapType.datatype) {

		case ("FLTP" || "DF34_SCL" || "DF34_RAW" || "DF34_DEC" || "DF16_SCL" ||
			"DF16_RAW" || "DF16_DEC"):
			currentType = "DECIMAL";
			currentLength = abapType.leng + "," + abapType.decimals;
			break;
        
        case "DEC":
            currentType = "DECIMAL";
            currentLength = abapType.leng + "," + abapType.decimals;
			break;

        case "CURR":
            currentType = "DECIMAL";
            currentLength = abapType.leng + "," + abapType.decimals;
			break;
			
        
		case "DATS":
			currentType = "DATE";
			break;

			// Special case for numbers
			// 		case "NUMC":
			// 			currentLength = abapType.leng;
			// 			break;

		default:
			currentLength = abapType.leng;
			break;
	}

	if (currentType === "DATE") {
		currentColumn = currentType + " ";
	} else {
		currentColumn = currentType + "(" + currentLength + ")";
	}
	return currentColumn;
}

// First row is inserted on every possible case, the following needs a separate logic
var currentRow = determineType(arrayColumns[1]);

var queryColumns = '"' + arrayColumns[1].fieldname + '"' + currentRow;
keyFields = '"' + arrayColumns[1].fieldname + '"';

// Logic for fields from 1 to N
for (var i = 2; i < numColumns; i++) {

	currentRow = determineType(arrayColumns[i]);

	// Column is added as primary key
	if (arrayColumns[i].keyflag === "X") {
		queryColumns = queryColumns + ',"' + arrayColumns[i].fieldname + '"' + currentRow;
		keyFields = keyFields + ', "' + arrayColumns[i].fieldname + '"';
	} else {

		// VALID_FROM column must be inserted as last key, no other key fields will be available
		if (checkValidFrom === false) {
			checkValidFrom = true;
			queryColumns = queryColumns + ',' + '"VALID_FROM" TIMESTAMP ';
			keyFields = keyFields + ', ' + '"VALID_FROM"';
			validFromIsSet = true;

			// Current field elaborated is inserted
			queryColumns = queryColumns + ',"' + arrayColumns[i].fieldname + '"' + currentRow;

		} else {
			queryColumns = queryColumns + ', "' + arrayColumns[i].fieldname + '"' + currentRow;
		}
	}
}

if (validFromIsSet === false) {
	queryColumns = queryColumns + ', "VALID_FROM" TIMESTAMP ';
	keyFields = keyFields + ', "VALID_FROM"';
}

// Last column inserted is the VALID_TO field
queryColumns = queryColumns + ', "VALID_TO" TIMESTAMP ';

var queryCreate = 'CREATE TABLE "ERPIBERIA_ADN"."' + table + '" (' + queryColumns + ', PRIMARY KEY(' + keyFields + '));'; //Normal table
var queryCreateTMP = 'CREATE TABLE "ERPIBERIA_ADN"."' + table + '_TMP"' + ' (' + queryColumns + ', PRIMARY KEY(' + keyFields + '));'; //Temporary table

// Connection is established with the DB
var conn = $.hdb.getConnection();

// Temporary table is deleted when a new reimport is executed, the table must be regenerate
if (newImport === 'false') {
	var sDeleteTempTableQuery = 'DROP TABLE "ERPIBERIA_ADN"."' + table + '_TMP"';
	conn.executeUpdate(sDeleteTempTableQuery);
	conn.commit();
}

try {

	// Query for normal table is executed
	conn.executeUpdate(queryCreate);
	conn.commit();

	// Query for temporary table is executed
	var tempTab = conn.executeUpdate(queryCreateTMP);
	conn.commit();

	$.response.setBody('OK');

} catch (e) {
	if (conn) {
		conn.close();
	}
	$.response.setBody(JSON.stringify(e));
}