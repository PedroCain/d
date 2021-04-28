//Get Parameters
var tables = $.request.parameters.get('tables');
var randNum = $.request.parameters.get('genNum');

var arrayTables = JSON.parse(tables);

var conn = $.hdb.getConnection();

var query;

for (var i = 0; i <= arrayTables.length - 1; i++) {

	if (randNum !== '0') {
		arrayTables[i] = arrayTables[i] + randNum;
	}

	try {
		query = 'DROP TABLE "ERPIBERIA_ADN"."' + arrayTables[i] + '"';
		conn.executeUpdate(query);

		query = 'DROP TABLE "ERPIBERIA_ADN"."' + arrayTables[i] + '_TMP"';
		conn.executeUpdate(query);
	} catch (e) {

	}
}

$.response.setBody('OK');