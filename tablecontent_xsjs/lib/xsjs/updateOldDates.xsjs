var oldTable = $.request.parameters.get('oldTable');
var currentDay = $.request.parameters.get('date');

var conn = $.hdb.getConnection();

var date = currentDay.substring(0, 10);
var time = currentDay.substring(11, 23);
var dateVersionTo = '\'' + date + ' ' + time + '\'';

var sUpdateDateQuery = 'UPDATE "ERPIBERIA_ADN"."' + oldTable + '" SET VALID_TO = ' + dateVersionTo +
	' WHERE VALID_TO = \'9999-12-31 23:59:59\'';
conn.executeUpdate(sUpdateDateQuery);
conn.commit();

$.response.setBody("OK");