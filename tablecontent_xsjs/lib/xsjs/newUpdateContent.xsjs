try {
	var conn = $.hdb.getConnection();
	var table = $.request.parameters.get('table');
	var dateFrom = $.request.parameters.get('from');

	var i;
	var today;
	var tableTmp = table + '_TMP';
	var queryKey =
		'SELECT COLUMN_NAME FROM CONSTRAINTS WHERE SCHEMA_NAME = \'ERPIBERIA_ADN\' and TABLE_NAME = ? AND COLUMN_NAME <> \'VALID_FROM\' ORDER BY POSITION ASC';
	var fieldsKey = conn.executeQuery(queryKey, table);
	var arrayFieldsKey = [];
	for (i = 0; i < fieldsKey.length; i++) {
		arrayFieldsKey.push(fieldsKey[i].COLUMN_NAME);
	}

	var queryNoKey =
		'SELECT COLUMN_NAME FROM TABLE_COLUMNS WHERE TABLE_NAME  = ? AND COLUMN_NAME <> \'VALID_FROM\' and COLUMN_NAME <> \'VALID_TO\' ORDER BY POSITION ASC';
	var fieldsNoKey = conn.executeQuery(queryNoKey, table);
	var arrayFieldsNoKey = [];
	var j = fieldsKey.length;
	for (i = j; i < fieldsNoKey.length; i++) {
		arrayFieldsNoKey.push(fieldsNoKey[i].COLUMN_NAME);
	}

	var conditionKey = arrayFieldsKey[0] + ' = ' + tableTmp + '.' + arrayFieldsKey[0];
	var conditionKey2 = arrayFieldsKey[0] + ' = ' + table + '.' + arrayFieldsKey[0];
	for (i = 1; i < arrayFieldsKey.length; i++) {
		conditionKey = conditionKey + ' AND ' + arrayFieldsKey[i] + ' = ' + tableTmp + '.' + arrayFieldsKey[i];
		conditionKey2 = conditionKey2 + ' AND ' + arrayFieldsKey[i] + ' = ' + table + '.' + arrayFieldsKey[i];
	}
	if (arrayFieldsNoKey.length > 0) {
		var conditionOR = arrayFieldsNoKey[0] + ' <> ' + table + '.' + arrayFieldsNoKey[0];
		var conditionOR2 = arrayFieldsNoKey[0] + ' <> ' + tableTmp + '.' + arrayFieldsNoKey[0];
		for (i = 1; i < arrayFieldsNoKey.length; i++) {
			conditionOR = conditionOR + ' OR ' + arrayFieldsNoKey[i] + ' <> ' + table + '.' + arrayFieldsNoKey[i];
			conditionOR2 = conditionOR2 + ' OR ' + arrayFieldsNoKey[i] + ' <> ' + tableTmp + '.' + arrayFieldsNoKey[i];
		}

	}

	today = JSON.parse(dateFrom);

	var queryValidFrom = 'UPDATE "ERPIBERIA_ADN"."' + table + '_TMP" SET VALID_FROM = \'' + today + '\'';

	var queryMod1 = 'UPDATE "ERPIBERIA_ADN"."' + table + '" SET VALID_TO = \'' + today +
		'\' WHERE  VALID_TO = \'9999-12-31 23:59:59\' AND EXISTS (SELECT VALID_TO FROM "ERPIBERIA_ADN"."' + tableTmp + '" WHERE ' + conditionKey2 +
		' AND (' + conditionOR + '))';
	var queryMod2 = 'INSERT INTO "ERPIBERIA_ADN"."' + table + '" (SELECT * from "ERPIBERIA_ADN"."' + tableTmp +
		'" WHERE EXISTS (SELECT VALID_FROM FROM "ERPIBERIA_ADN"."' + table + '" WHERE ' + conditionKey +
		' AND VALID_TO = \'9999-12-31 23:59:59\' AND (' + conditionOR2 + ')))';

	var queryNew = 'INSERT INTO "ERPIBERIA_ADN"."' + table + '" (SELECT * FROM "ERPIBERIA_ADN"."' + tableTmp +
		'" WHERE NOT EXISTS (SELECT VALID_FROM from "ERPIBERIA_ADN"."' + table + '" WHERE ' + conditionKey +
		' AND VALID_TO = \'9999-12-31 23:59:59\'))';
	var queryDel = 'UPDATE "ERPIBERIA_ADN"."' + table + '" SET VALID_TO = \'' + today +
		'\' WHERE  VALID_TO = \'9999-12-31 23:59:59\' AND NOT EXISTS (SELECT VALID_TO FROM "ERPIBERIA_ADN"."' + tableTmp + '" WHERE ' +
		conditionKey2 +
		')';
	conn.executeUpdate(queryValidFrom);
	var r1 = conn.executeUpdate(queryDel);
	if (arrayFieldsNoKey.length > 0) {
		var r3 = conn.executeUpdate(queryMod1);
		var r2 = conn.executeUpdate(queryMod2);
	}
	var r4 = conn.executeUpdate(queryNew);
	conn.commit();
	conn.close();
	$.response.contentType = "application/json";
	$.response.setBody("OK");
} catch (e) {
	conn.close();
	$.response.setBody("ERROR");
}