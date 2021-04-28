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
 var listaCampiDEP = '';
 var listWhen = '';

 var all = allField.split(",");
 var num = all.length;
 var conditionKey2 = '';
 var conditionOR;
 var listAlias1;
 var listaAlias2;
 var listOn;

 // Start Delete Angelo
 //   function checkDependences() {

 //   	var queryDep = 'SELECT * FROM "ERPIBERIA_ADN"."DEPENDENCIES" WHERE ORI_TABLE  = ?';
 //   	arrayDep = conn.executeQuery(queryDep, table);

 //   	if (arrayDep.length > 0) {
 //   		//  Start Delete Angelo
 //   		// 		listaJoin = ' left join (SELECT DISTINCT ' + arrayDep[0].DEST_FIELD + ' from "ERPIBERIA_ADN"."' + arrayDep[0].DEST_TABLE +
 //   		// 			'" where VALID_TO = \'9999-12-31 23:59:59\') on a.' + arrayDep[0].ORI_FIELD + ' = ' + arrayDep[0].DEST_FIELD;
 //   		// 		listaCampiDEP = ',' + arrayDep[0].DEST_FIELD + ' as ' + arrayDep[0].ORI_FIELD + 'X';
 //   		// 		listWhen = arrayDep[0].DEST_FIELD + ' IS NULL';
 //   		// 	End Delete Angelo

 //   		// Start Insert Angelo
 //   		listaJoin = ' left join (SELECT DISTINCT ' + arrayDep[0].DEST_FIELD + ' from "ERPIBERIA_ADN"."' + arrayDep[0].DEST_TABLE +
 //   			'" where VALID_TO = \'9999-12-31 23:59:59\') as c1 on a.' + arrayDep[0].ORI_FIELD + ' = c1.' + arrayDep[0].DEST_FIELD;
 //   		listaCampiDEP = ',c1.' + arrayDep[0].DEST_FIELD + ' as ' + arrayDep[0].ORI_FIELD + 'X';
 //   		listWhen = 'c1.' + arrayDep[0].DEST_FIELD + ' IS NULL';
 //   		// End Insert Angelo

 //   		for (i = 1; i < arrayDep.length; i++) {
 //   			//  Start Delete Angelo
 //   			// 			listaCampiDEP = listaCampiDEP + ',' + arrayDep[i].DEST_FIELD + ' as ' + arrayDep[i].ORI_FIELD + 'X';
 //   			// 			listaJoin = listaJoin + ' left join (SELECT DISTINCT ' + arrayDep[i].DEST_FIELD + ' from "ERPIBERIA_ADN"."' + arrayDep[i].DEST_TABLE +
 //   			// 				'" where VALID_TO = \'9999-12-31 23:59:59\') on a.' + arrayDep[i].ORI_FIELD + ' = ' + arrayDep[i].DEST_FIELD;
 //   			// 			listWhen = listWhen + ' OR ' + arrayDep[i].DEST_FIELD + ' IS NULL';
 //   			// 	End Delete Angelo

 //   			// Start Insert Angelo
 //   			// Index used on query is updated every loop cycle
 //   			var currentIndex = i + 1;

 //   			listaCampiDEP = listaCampiDEP + ',c' + currentIndex + '.' + arrayDep[i].DEST_FIELD + ' as ' + arrayDep[i].ORI_FIELD + 'X';
 //   			listaJoin = listaJoin + ' left join (SELECT DISTINCT ' + arrayDep[i].DEST_FIELD + ' from "ERPIBERIA_ADN"."' + arrayDep[i].DEST_TABLE +
 //   				'" where VALID_TO = \'9999-12-31 23:59:59\') as c' + currentIndex + ' on a.' + arrayDep[i].ORI_FIELD + ' = c' +
 //   				currentIndex + '.' + arrayDep[i].DEST_FIELD;
 //   			listWhen = listWhen + ' OR ' + 'c' + currentIndex + '.' + arrayDep[i].DEST_FIELD + ' IS NULL';
 //   			// End Insert Angelo 			
 //   		}
 //   		listaCampiDEP = listaCampiDEP + ',CASE WHEN ' + listWhen + ' THEN \'KO\' ELSE \'OK\' END AS CHECKDEP ';
 //   	}
 //   }
 // End Delete Angelo

 function getStatusCode(msg) {
 	var m = msg.match('\\:\\s(\\d+)\\s\\-');
 	return (m) ? parseInt(m[1], 10) : null;
 }

 function afterTmpCommit() {

 	conditionKey2 = conditionKey2 + tableTmp + '.' + arrayFieldsKey[0].COLUMN_NAME + ' = ' + table + '.' + arrayFieldsKey[0].COLUMN_NAME;

 	listAlias1 = 'a."' + arrayFieldsKey[0].COLUMN_NAME + '",';
 	listaAlias2 = 'b."' + arrayFieldsKey[0].COLUMN_NAME + '" IS NULL';
 	listOn = ' on a."' + arrayFieldsKey[0].COLUMN_NAME + '" = b."' + arrayFieldsKey[0].COLUMN_NAME + '"';
 	for (i = 1; i < arrayFieldsKey.length; i++) {
 		conditionKey2 = conditionKey2 + ' AND ' + tableTmp + '."' + arrayFieldsKey[i].COLUMN_NAME + '" = ' + table + '.' +
 			arrayFieldsKey[
 				i]
 			.COLUMN_NAME;
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
 		queryModNew = 'SELECT ' + listAlias1 + ', CASE WHEN b."' + arrayFieldsNoKey[0] + '" is NULL THEN \'N\' WHEN ' + conditionOR +
 			' THEN \'M\' else \'\' END as STAT ' + listaCampiDEP + ' FROM "ERPIBERIA_ADN"."' + tableTmp +
 			'" as a LEFT JOIN (SELECT * FROM "ERPIBERIA_ADN"."' + table +
 			'" WHERE VALID_TO  = \'9999-12-31 23:59:59\') as b ' + listOn + listaJoin;
 	} else {
 		queryModNew = 'SELECT ' + listAlias1 + 'CASE WHEN ' + listaAlias2 + ' THEN \'N\' else \'\' END as STAT ' + listaCampiDEP +
 			' FROM "ERPIBERIA_ADN"."' + tableTmp + '" as a LEFT JOIN (SELECT * FROM "ERPIBERIA_ADN"."' + table +
 			'" WHERE VALID_TO  = \'9999-12-31 23:59:59\') as b ' + listOn + listaJoin;
 	}

 	// $.response.setBody(JSON.stringify(queryModNew));

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

 // Unused
 function getRows() {
 	var allRows = [];

 	rowsInput = JSON.parse(rowsInput);

 	for (var n = 0; n < rowsInput.length; n++) {

 		var rowTemp = [];

 		for (var m = 0; m < all.length - 2; m++) {
 			if (rowsInput[n][all[m]] !== undefined) {
 				rowTemp.push(rowsInput[n][all[m]]);
 			} else {
 				rowTemp.push(" ");
 			}
 		}
 		allRows.push(rowTemp);
 	}

 	return allRows;
 }

 function checkColumns(extractedCols) {

 	var error = false;

 	for (var k = 0; k < all.length - 2; k++) {
 		if (all[k] !== extractedCols[k].COLUMN_NAME) {
 			error = true;
 			break;
 		}
 	}
 	return error;

 }

 try {
 	// Start Delete Angelo
 	// checkDependences();
 	// End Delete Angelo

 	// This extraction is used in order to determine if the current Compare has been launched for the correct table
 	var queryColumns =
 		'SELECT COLUMN_NAME FROM TABLE_COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME <> \'VALID_FROM\' AND COLUMN_NAME <> \'VALID_TO\' ORDER BY POSITION ASC';
 	var currentColumns = conn.executeQuery(queryColumns, table);

 	// Parentesis is removed from the column passed from front end
 	all[0] = all[0].substr(1);

 	var check = checkColumns(currentColumns);

 	// No error has been found
 	if (check !== true) {

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
 		// listaDel = listaDel.substr(1);
 		for (i = 1; i < all.length - 2; i++) {
 			listaDel = listaDel + ',' + all[i];
 		}

 		// var rows = getRows();
 		var rows = JSON.parse(rowsInput);
 		var emptyRow;

 		var argsArray = [];
 		for (i = 0; i < rows.length; i++) {
 		    //start change Andrea
 			//if (rows[i].length > 1) {
 			//fix for table with 1 column
 			if (rows[i].length > 0) {
 			//end change Andrea
 				if (rows[i].length < num - 2) {
 					rows[i].push("");
 				}

 				emptyRow = true;

 				// Check if a row key is completely empty
 				for (var k = 0; k < arrayFieldsKey.length; k++) {
 					if (rows[i][k] !== "") {
 						emptyRow = false;
 						break;
 					}
 				}

 				// 	for (var k = 0; k < rows[i].length; k++) {
 				// 		if (rows[i][k] !== "") {
 				// 			emptyRow = false;
 				// 			break;
 				// 		}
 				// 	}

 				// The row is inserted on the array only if it has valid data
 				if (emptyRow === false) {
 					rows[i].push('9999-12-31 23:59:59');
 					rows[i].push(today); //Current Date
 					argsArray.push(rows[i]);
 				}
 			}
 		}

 		try {

 			// Temporary table is created only when there is data
 			if (argsArray.length > 0) {
 				var query1 = 'INSERT INTO "ERPIBERIA_ADN"."' + tableTmp + '"' + allField + ' VALUES ' + numFields;
 				conn.executeUpdate(query1, argsArray);
 				conn.commit();
 			}
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
 	}

 } catch (e) {
 	if (conn) {
 		conn.close();
 	}
 	$.response.setBody(JSON.stringify(e));
 }