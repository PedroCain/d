var currentTable = $.request.parameters.get('currentTable');
var newTable = $.request.parameters.get('newTable');

var conn = $.hdb.getConnection();

var sRenameQuery = 'RENAME TABLE "ERPIBERIA_ADN"."' + currentTable + '" TO "ERPIBERIA_ADN"."' + newTable + '"';
conn.executeUpdate(sRenameQuery);

$.response.setBody("OK");