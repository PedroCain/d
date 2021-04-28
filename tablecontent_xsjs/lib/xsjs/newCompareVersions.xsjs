 //Get Parameters
 var table = $.request.parameters.get('table');
 var allField = $.request.parameters.get('allField');

 var system = $.request.parameters.get('system');
 var vers = $.request.parameters.get('version');

 //Declare vars
 var arrayFieldsKey = [];
 var arrayFieldsNoKey = [];
 var i;
 var arrayDep;
 var index = allField.indexOf(',VALID_TO');
 var noValid = allField.substring(1, index);
 noValid = noValid.replace(/,/g, ' ');
 var tableTmp = table + '_TMP';
 var numFields;
 var conn = $.hdb.getConnection();
 var listaJoin = '';
 var listWhen = '';

 var all = allField.split(",");
 var num = all.length;
 var conditionKey2 = '';
 var conditionOR;
 var listAlias1;
 var listaAlias2;
 var listOn;

 //  Variables used to take the interval date between versions
 var last,
 	dateVersionFrom,
 	dateVersionTo;

 function getStatusCode(msg) {
 	var m = msg.match('\\:\\s(\\d+)\\s\\-');
 	return (m) ? parseInt(m[1], 10) : null;
 }

 function getDates() {
 	var queryVersion = 'SELECT * FROM "ERPIBERIA_ADN"."VERSIONS" WHERE TABLENAME = ? AND SYSTEMNAME = ? ORDER BY DATE ASC';
 	var versions = conn.executeQuery(queryVersion, table, system);

 	//  Variables used to create the dynamic date/time string
 	var dateTemp,
 		time,
 		date;

 	// Cycle used to retrieved the Date From and the Date To
 	for (var k = 0; k < versions.length; k++) {
 		if (versions[k].VERSION === vers) {
 			if (k === versions.length - 1) {
 				last = 'X';
 			} else {
 				last = ' ';
 				dateTemp = versions[k].DATE.toJSON();
 				date = dateTemp.substring(0, 10);
 				time = dateTemp.substring(11, 23);
 				dateVersionFrom = '\'' + date + ' ' + time + '\'';

 				var z = k + 1;
 				dateTemp = versions[z].DATE.toJSON();
 				time = dateTemp.substring(0, 10);
 				date = dateTemp.substring(11, 23);
 				dateVersionTo = '\'' + time + ' ' + date + '\'';
 			}
 			// Code execution can be interrupted, dates have been retrieved
 			break;
 		}
 	}
 }

 function afterTmpCommit() {

 	getDates();

 	conditionKey2 = conditionKey2 + tableTmp + '.' + arrayFieldsKey[0].COLUMN_NAME + ' = ' + table + '.' + arrayFieldsKey[0].COLUMN_NAME;

 	listAlias1 = 'a."' + arrayFieldsKey[0].COLUMN_NAME + '",';
 	listaAlias2 = 'b."' + arrayFieldsKey[0].COLUMN_NAME + '" IS NULL';
 	listOn = ' on a."' + arrayFieldsKey[0].COLUMN_NAME + '" = b.' + arrayFieldsKey[0].COLUMN_NAME;

 	//  The list of every column used is created by this cycle
 	for (i = 1; i < arrayFieldsKey.length; i++) {
 		conditionKey2 = conditionKey2 + ' AND ' + tableTmp + '."' + arrayFieldsKey[i].COLUMN_NAME + '" = ' + table + '."' +
 			arrayFieldsKey[
 				i]
 			.COLUMN_NAME + '"';
 		listAlias1 = listAlias1 + 'a."' + arrayFieldsKey[i].COLUMN_NAME + '",';
 		listOn = listOn + ' AND a."' + arrayFieldsKey[i].COLUMN_NAME + '" = b."' + arrayFieldsKey[i].COLUMN_NAME + '"';
 		listaAlias2 = listaAlias2 + ' OR b."' + arrayFieldsKey[i].COLUMN_NAME + '" IS NULL';
 	}

 	var queryModNew;
 	if (arrayFieldsNoKey.length > 0) {
 		conditionOR = 'a."' + arrayFieldsNoKey[0] + '" <> b."' + arrayFieldsNoKey[0] + '"';
 		listAlias1 = listAlias1 + 'a."' + arrayFieldsNoKey[0] + '",b."' + arrayFieldsNoKey[0] + '" as "' + arrayFieldsNoKey[0] + '1"';
 		for (i = 1; i < arrayFieldsNoKey.length; i++) {
 			conditionOR = conditionOR + ' OR a."' + arrayFieldsNoKey[i] + '" <> b."' + arrayFieldsNoKey[i] + '"';
 			listAlias1 = listAlias1 + ',a."' + arrayFieldsNoKey[i] + '",b."' + arrayFieldsNoKey[i] + '" as "' + arrayFieldsNoKey[i] + '1"';

 		}

 		if (last === 'X') {

 			queryModNew = 'SELECT ' + listAlias1 + ', CASE WHEN b."' + arrayFieldsNoKey[0] + '" is NULL THEN \'N\' WHEN ' + conditionOR +
 				' THEN \'M\' else \'\' END as STAT FROM "ERPIBERIA_ADN"."' + tableTmp +
 				'" as a LEFT JOIN (SELECT * FROM "ERPIBERIA_ADN"."' + table +
 				'" WHERE VALID_TO = \'9999-12-31 23:59:59\') as b ' + listOn + listaJoin;
 		} else {
 			queryModNew = 'SELECT ' + listAlias1 + ', CASE WHEN b."' + arrayFieldsNoKey[0] + '" is NULL THEN \'N\' WHEN ' + conditionOR +
 				' THEN \'M\' else \'\' END as STAT FROM "ERPIBERIA_ADN"."' + tableTmp +
 				'" as a LEFT JOIN (SELECT * FROM "ERPIBERIA_ADN"."' + table +
 				'" WHERE VALID_TO >= ' + dateVersionTo + ' AND VALID_FROM <= ' + dateVersionFrom + ') as b ' + listOn + listaJoin;
 		}
 	} else {

 		if (last === 'X') {

 			queryModNew = 'SELECT ' + listAlias1 + 'CASE WHEN ' + listaAlias2 + ' THEN \'N\' else \'\' END as STAT FROM "ERPIBERIA_ADN"."' +
 				tableTmp + '" as a LEFT JOIN (SELECT * FROM "ERPIBERIA_ADN"."' + table +
 				'" WHERE VALID_TO = \'9999-12-31 23:59:59\') as b ' + listOn + listaJoin;

 		} else {
 			queryModNew = 'SELECT ' + listAlias1 + 'CASE WHEN ' + listaAlias2 + ' THEN \'N\' else \'\' END as STAT FROM "ERPIBERIA_ADN"."' +
 				tableTmp + '" as a LEFT JOIN (SELECT * FROM "ERPIBERIA_ADN"."' + table +
 				'" WHERE VALID_TO >= ' + dateVersionTo + ' AND VALID_FROM <= ' + dateVersionFrom + ') as b ' + listOn + listaJoin;
 		}
 	}

 	var insMod = conn.executeQuery(queryModNew);

 	var query3;

 	if (last === 'X') {
 		query3 = 'SELECT ' + listaDel + ',\'D\' as STAT,\'\' as CHECKDEP FROM "ERPIBERIA_ADN"."' + table +
 			'" WHERE VALID_TO = \'9999-12-31 23:59:59\' AND NOT EXISTS (SELECT VALID_FROM FROM "ERPIBERIA_ADN"."' + tableTmp +
 			'" WHERE ' +
 			conditionKey2 + ')';

 	} else {
 		query3 = 'SELECT ' + listaDel + ',\'D\' as STAT,\'\' as CHECKDEP FROM "ERPIBERIA_ADN"."' + table +
 			'" WHERE VALID_TO >= ' + dateVersionTo + ' AND VALID_FROM <= ' + dateVersionFrom +
 			' AND NOT EXISTS (SELECT VALID_FROM FROM "ERPIBERIA_ADN"."' + tableTmp +
 			'" WHERE ' +
 			conditionKey2 + ')';
 	}

 	var deleted = conn.executeQuery(query3);

 	var array = [];
 	for (i = 0; i < insMod.length; i++) {
 		array.push(insMod[i]);
 	}
 	for (i = 0; i < deleted.length; i++) {
 		array.push(deleted[i]);
 	}
 	if (conn) {
 		conn.close();
 	}
 	conn.close();

 	// Last valid response
 	$.response.setBody(JSON.stringify(array));
 }

 try {

 	numFields = '(?';
 	for (var j = 1; j < num; j++) {
 		numFields = numFields + ',?';
 	}
 	numFields = numFields + ')';

 	var queryKey =
 		'SELECT COLUMN_NAME FROM CONSTRAINTS WHERE SCHEMA_NAME = \'ERPIBERIA_ADN\' and TABLE_NAME = ? AND COLUMN_NAME <> \'VALID_FROM\'';
 	arrayFieldsKey = conn.executeQuery(queryKey, table);

 	for (i = all.length - 3; i > arrayFieldsKey.length - 1; i--) {
 		arrayFieldsNoKey.push(all[i]);
 	}

 	var listaDel = all[0];
 	listaDel = listaDel.substr(1);
 	for (i = 1; i < all.length - 2; i++) {
 		listaDel = listaDel + ',' + all[i];
 	}

 	// Code execution start here
 	try {
 		afterTmpCommit();
 	} catch (e) {
 		var code = getStatusCode(e.message);
 		if (code && code === 301) {
 			$.response.setBody('unique constraint violated');
 		} else {
 			$.response.setBody('something else: ' + e.message);
 		}
 		$.response.status = $.net.http.BAD_REQUEST;
 	}

 } catch (e) {
 	if (conn) {
 		conn.close();
 	}
 	$.response.setBody(JSON.stringify(e));
 }