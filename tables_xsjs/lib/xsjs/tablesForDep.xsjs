//Get Parameters
var table = $.request.parameters.get('table');

var conn = $.hdb.getConnection();

var query =
	'SELECT CASE WHEN tab.TABLENAME IS NULL THEN dep.DEST_TABLE ELSE \'KO\' END AS TABLENAME FROM "ERPIBERIA_ADN"."DEPENDENCIES" as dep LEFT JOIN "ERPIBERIA_ADN"."TABLES" as tab on dep.DEST_TABLE = tab.TABLENAME WHERE dep.ORI_TABLE = \'' +
	table + '\'';

var result = conn.executeQuery(query);

var output = [];
for (var i = 0; i < result.length; i++) {
	if (result[i].TABLENAME !== 'KO') {

		// Check if the value is a duplicate
		var filter = output.filter(function(value) {
			return value === result[i].TABLENAME;
		});

		// The data doesn't exist, so it's possibile to add the new record
		if (filter.length === 0) {
			output.push(result[i].TABLENAME);
		}
	}
}

$.response.setBody(JSON.stringify(output));