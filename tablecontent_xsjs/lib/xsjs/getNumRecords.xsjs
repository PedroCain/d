// Service that returns the number of records for the last version uplodaded to ADN
var table = $.request.parameters.get('table');

var conn = $.hdb.getConnection();

var query = 'SELECT COUNT(*) AS COUNT FROM "ERPIBERIA_ADN"."' + table +
	'" WHERE VALID_TO = \'9999-12-31 23:59:59\'';
var numRecords = conn.executeQuery(query);

$.response.setBody(JSON.stringify(numRecords));