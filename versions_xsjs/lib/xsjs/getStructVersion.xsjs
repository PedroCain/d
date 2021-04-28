var table = $.request.parameters.get('tableName');

var conn = $.hdb.getConnection();

var versionQuery = 'SELECT VERSION, STRUCTVERSION, DATE FROM "ERPIBERIA_ADN"."VERSIONS" WHERE TABLENAME = \'' + table +
	'\' ORDER BY DATE DESC';
var aResult = conn.executeQuery(versionQuery);

$.response.setBody(JSON.stringify(aResult[0]));