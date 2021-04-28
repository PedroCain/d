 //Get Parameters
var table = $.request.parameters.get('table');
var today = $.request.parameters.get('today');
var rowsInput = $.request.parameters.get('rows');
var allField = $.request.parameters.get('allField');

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
var delQuery = 'DELETE FROM "ERPIBERIA_ADN"."' + tableTmp + '"';
conn.executeUpdate(delQuery);
var listaJoin = '';

 // Start Insert Angelo
 //   var fieldDepOri = ""; //Variable used to store every origin field that must be check for dependencies
var fieldDepDest = ''; //Variable used to store every destination field that must be check for dependencies
var fieldDepCond = ''; //Variable that contains the conditions for the dependencies check
 // End Insert Angelo

var listaCampiDEP = '';
var listWhen = '';

var all = allField.split(",");
var num = all.length;
var conditionKey2 = '';
var conditionOR;
var listAlias1;
var listaAlias2;
var listOn;

function checkDependences() {

	var queryDep = 'SELECT * FROM "ERPIBERIA_ADN"."DEPENDENCIES" WHERE ORI_TABLE  = ?';
	arrayDep = conn.executeQuery(queryDep, table);

	if (arrayDep.length > 0) {
		var currentCombo = arrayDep[0].COLLECTOR;
		fieldDepDest = arrayDep[0].DEST_FIELD;
		fieldDepCond = 'ON a.' + arrayDep[0].ORI_FIELD + ' = c0' + '.' + arrayDep[0].DEST_FIELD;
		listaCampiDEP = ',c0.' + arrayDep[0].DEST_FIELD + ' as ' + arrayDep[0].ORI_FIELD + '_' + arrayDep[0].COLLECTOR;
		listWhen = 'c0.' + arrayDep[0].DEST_FIELD + ' IS NULL';

		var currentIndex = 0;

		for (i = 1; i < arrayDep.length; i++) {

			// Case when the dependency is a combinated one
			if (currentCombo === arrayDep[i].COLLECTOR && arrayDep[i] !== 'NO') {
				fieldDepDest = fieldDepDest + ', ' + arrayDep[i].DEST_FIELD;
				fieldDepCond = fieldDepCond + ' AND a.' + arrayDep[i].ORI_FIELD + ' = c' + currentIndex + '.' + arrayDep[i].DEST_FIELD;
				listaCampiDEP = listaCampiDEP + ',c' + currentIndex + '.' + arrayDep[i].DEST_FIELD + ' as ' + arrayDep[i].ORI_FIELD +
					'_' +
					arrayDep[i].COLLECTOR;
				listWhen = listWhen + ' OR ' + 'c' + currentIndex + '.' + arrayDep[i].DEST_FIELD + ' IS NULL';
			} else {
				listaJoin = listaJoin + ' left join (SELECT DISTINCT ' + fieldDepDest + ' from "ERPIBERIA_ADN"."' + arrayDep[i - 1].DEST_TABLE +
					'" where VALID_TO = \'9999-12-31 23:59:59\') as c' + currentIndex + ' ' + fieldDepCond;
				// 			listWhen = listWhen + ' OR c' + currentIndex + '.' + arrayDep[i - 1].DEST_FIELD + ' IS NULL';

				// From this point, a new query will be produced
				currentIndex++;
				currentCombo = arrayDep[i].COLLECTOR;
				fieldDepDest = arrayDep[i].DEST_FIELD;
				fieldDepCond = 'ON a.' + arrayDep[i].ORI_FIELD + ' = c' + currentIndex + '.' + arrayDep[i].DEST_FIELD;
				listaCampiDEP = listaCampiDEP + ',c' + currentIndex + '.' + arrayDep[i].DEST_FIELD + ' as ' + arrayDep[i].ORI_FIELD +
					'_' +
					arrayDep[i].COLLECTOR;
				listWhen = listWhen + ' OR c' + currentIndex + '.' + arrayDep[i].DEST_FIELD + ' IS NULL';
			}
		}

		// At the end of the loop, the last row elaborated is inserted into the final query
		listaJoin = listaJoin + ' left join (SELECT DISTINCT ' + fieldDepDest + ' from "ERPIBERIA_ADN"."' + arrayDep[arrayDep.length -
			1]
			.DEST_TABLE +
			'" where VALID_TO = \'9999-12-31 23:59:59\') as c' + currentIndex + ' ' + fieldDepCond;
	}
}

function getStatusCode(msg) {
	var m = msg.match('\\:\\s(\\d+)\\s\\-');
	return (m) ? parseInt(m[1], 10) : null;
}

function afterTmpCommit() {

	conditionKey2 = conditionKey2 + tableTmp + '.' + arrayFieldsKey[0].COLUMN_NAME + ' = ' + table + '.' + arrayFieldsKey[0].COLUMN_NAME;

	listAlias1 = 'a.' + arrayFieldsKey[0].COLUMN_NAME + ',';
	listaAlias2 = 'b.' + arrayFieldsKey[0].COLUMN_NAME + ' IS NULL';
	listOn = ' on a.' + arrayFieldsKey[0].COLUMN_NAME + ' = b.' + arrayFieldsKey[0].COLUMN_NAME;
	for (i = 1; i < arrayFieldsKey.length; i++) {
		conditionKey2 = conditionKey2 + ' AND ' + tableTmp + '.' + arrayFieldsKey[i].COLUMN_NAME + ' = ' + table + '.' +
			arrayFieldsKey[
				i]
			.COLUMN_NAME;
		listAlias1 = listAlias1 + 'a.' + arrayFieldsKey[i].COLUMN_NAME + ',';
		listOn = listOn + ' AND a.' + arrayFieldsKey[i].COLUMN_NAME + ' = b.' + arrayFieldsKey[i].COLUMN_NAME;
		listaAlias2 = listaAlias2 + ' OR b.' + arrayFieldsKey[i].COLUMN_NAME + ' IS NULL';
	}

	var queryModNew;
	if (arrayFieldsNoKey.length > 0) {
		conditionOR = 'a.' + arrayFieldsNoKey[0] + ' <> b.' + arrayFieldsNoKey[0];
		listAlias1 = listAlias1 + 'a.' + arrayFieldsNoKey[0] + ',b.' + arrayFieldsNoKey[0] + ' as ' + arrayFieldsNoKey[0] + '1';
		for (i = 1; i < arrayFieldsNoKey.length; i++) {
			conditionOR = conditionOR + ' OR a.' + arrayFieldsNoKey[i] + ' <> b.' + arrayFieldsNoKey[i];
			listAlias1 = listAlias1 + ',a.' + arrayFieldsNoKey[i] + ',b.' + arrayFieldsNoKey[i] + ' as ' + arrayFieldsNoKey[i] + '1';

		}
		queryModNew = 'SELECT ' + listAlias1 + ', CASE WHEN b.' + arrayFieldsNoKey[0] + ' is NULL THEN \'N\' WHEN ' + conditionOR +
			' THEN \'M\' else \'\' END as STAT ' + listaCampiDEP + ' FROM "ERPIBERIA_ADN"."' + tableTmp +
			'" as a LEFT JOIN (SELECT * FROM "ERPIBERIA_ADN"."' + table +
			'" WHERE VALID_TO  = \'9999-12-31 23:59:59\') as b ' + listOn + listaJoin;
	} else {
		queryModNew = 'SELECT ' + listAlias1 + 'CASE WHEN ' + listaAlias2 + ' THEN \'N\' else \'\' END as STAT ' + listaCampiDEP +
			' FROM "ERPIBERIA_ADN"."' + tableTmp + '" as a LEFT JOIN (SELECT * FROM "ERPIBERIA_ADN"."' + table +
			'" WHERE VALID_TO  = \'9999-12-31 23:59:59\') as b ' + listOn + listaJoin;
	}

	var insMod = conn.executeQuery(queryModNew);

	var query3 = 'SELECT ' + listaDel + ',\'D\' as STAT,\'\' as CHECKDEP FROM "ERPIBERIA_ADN"."' + table +
		'" WHERE VALID_TO = \'9999-12-31 23:59:59\' AND NOT EXISTS (SELECT VALID_FROM FROM "ERPIBERIA_ADN"."' + tableTmp +
		'" WHERE ' +
		conditionKey2 + ')';

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

	//  	Last valid response
	$.response.setBody(JSON.stringify(array));
}

try {
	checkDependences();

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

	var rows = JSON.parse(rowsInput);

	var argsArray = [];
	for (i = 0; i < rows.length; i++) {
		var elArray = rows[i].split(";");
		if (elArray.length > 1) {
			if (elArray.length < num - 2) {
				elArray.push("");
			}
			elArray.push('9999-12-31 23:59:59');
			elArray.push(today); //sarà la data di oggi
			argsArray.push(elArray);
		}
	}

	//DEBUG
	// 	$.response.setBody(JSON.stringify(argsArray));
	// 	    if(0){

	try {
		var query1 = 'INSERT INTO "ERPIBERIA_ADN"."' + tableTmp + '"' + allField + ' VALUES ' + numFields;
		conn.executeUpdate(query1, argsArray);
		conn.commit();
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

	//DEBUG
	// 	}

} catch (e) {
	if (conn) {
		conn.close();
	}
	$.response.setBody(JSON.stringify(e));
}