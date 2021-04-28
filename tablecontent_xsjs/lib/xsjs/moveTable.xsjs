function run(input) {

	//Get parameters
//	var table = $.request.parameters.get('table');
//	var content = $.request.parameters.get('content');
//	var columns = $.request.parameters.get('columns');
//	var version = $.request.parameters.get('version');
//	var system = $.request.parameters.get('system');
//	var user = $.request.parameters.get('user');
//	var label = $.request.parameters.get('label');

 	var table = input.TABLE;
 	var content = input.CONTENT;
 	var columns = input.COLUMNS;
 	var version = input.VERSION;
 	var system = input.SYSTEM;
 	var user = input.USER;
 	var label = input.LABEL;
	var sapTarget;
	var startEnvironment;
	var logLabelStart;
	var logLabelTarget;

	function getStatusCode(msg) {
		var m2 = msg.match('\\:\\s(\\d+)\\s\\-');
		return (m2) ? parseInt(m2[1], 10) : null;
	}

	// Same logics as UploadFromEcc.xsjs -----------------------------------------------------------------------------
	function uploadToTempTable(conn, date, columns, table, rows) {

		// UpdateContent logic
		var i;

		var aColumns = JSON.parse(columns);
		var sColumns = '(' + aColumns[0].COLUMN_NAME;

		for (i = 1; i < aColumns.length; i++) {
			if (aColumns[i].COLUMN_NAME !== 'VALID_FROM' && aColumns[i].COLUMN_NAME !== 'VALID_TO') {
				sColumns = sColumns + ',' + aColumns[i].COLUMN_NAME;
			}
		}

		sColumns = sColumns + ',VALID_TO,VALID_FROM)';

		var tableTmp = table + '_TMP';
		var numFields;

		// The current temporary table used is cleaned
		var delQuery = 'DELETE FROM "ERPIBERIA_ADN"."' + tableTmp + '"';
		conn.executeUpdate(delQuery);

		var num = aColumns.length;

		try {

			numFields = '(?';

			for (i = 1; i < num; i++) {
				numFields = numFields + ',?';
			}
			numFields = numFields + ')';

			// The array used to perform the updated is cleaned
			var argsArray = [];

			for (i = 0; i < rows.length; i++) {

				var elArray = [];

				// The compiler does not accept the FOR IN without an IF statement
				// but in this case all fields are needed
				for (var j in rows[i]) {
					elArray.push(rows[i][j]);
				}
				elArray.push('9999-12-31 23:59:59'); //Valid to 
				elArray.push(date); //Valid from
				argsArray.push(elArray);
			}

			try {

				// Data is inserted into the temporary table
				var query1 = 'INSERT INTO "ERPIBERIA_ADN"."' + tableTmp + '"' + sColumns + ' VALUES ' + numFields;

				conn.executeUpdate(query1, argsArray);
				conn.commit();
				// The operation has been executed without errors
				// $.response.setBody("OK");

			} catch (e) {
				var code = getStatusCode(e.message);
				if (code && code === 301) {
					// $.response.setBody('unique constraint violated');
				} else {
					// $.response.setBody('something else: ' + e.message);
				}
				// $.response.status = $.net.http.BAD_REQUEST;
			}
		} catch (e) {
			// 			$.response.setBody(JSON.stringify(e));
		}
	}

	//Begin Insert Andrea
	function checkLock(conn) {
		try {
			//check if table is alerady locked
			var queryLock = 'SELECT DATE FROM "ERPIBERIA_ADN"."LOCK" WHERE TABLENAME = \'' + table + '\'';
			var lockResults = conn.executeQuery(queryLock);
			if (lockResults.length === 0) {
				// Lock has been inserted and elaboration can proceed
				var elLock = [];
				var argLock = [];
				elLock.push(table); //TABLENAME
				elLock.push("X"); //LOCKED
				elLock.push(user); //USER;
				elLock.push(new Date()); //DATE
				argLock.push(elLock);
				var insertLock = 'INSERT INTO "ERPIBERIA_ADN"."LOCK" VALUES(?,?,?,?)';
				conn.executeUpdate(insertLock, argLock);
				conn.commit();
				return false;
			} else {
				//lock already exist, check if it is still valid
				var currentDate = new Date();
				if (((currentDate - lockResults[0].DATE) / 1000 / 60) > 30) {
					var updateLock = 'UPDATE "ERPIBERIA_ADN"."LOCK" SET DATE=?, USER=? WHERE TABLENAME=?';
					conn.executeUpdate(updateLock, new Date(), user, table);
					conn.commit();
					return false;
				} else {
					return true;
				}

			}
		} catch (e) {

		}

	}

	function insertLog(conn, date, mess) {
		try {
			// Table version is updated on production
			var sQueryUpdateLog = 'INSERT INTO "ERPIBERIA_ADN"."LOG_MASSIVE" VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
			var aResultUpdate = conn.executeUpdate(sQueryUpdateLog, user, date, table, label, logLabelStart, logLabelTarget, version, mess);
			conn.commit();
		} catch (e) {

		}
	}

	//End Insert Andrea
	// Same logics as newUpdateContent.xsjs ---------------------------------------------------------------------------
	function updateContent(conn, table, date) {

		try {

			var i;
			// 		var today;
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

			var currentDate = JSON.stringify(date);
			currentDate = JSON.parse(currentDate);

			var queryValidFrom = 'UPDATE "ERPIBERIA_ADN"."' + table + '_TMP" SET VALID_FROM = \'' + currentDate + '\'';

			var queryMod1 = 'UPDATE "ERPIBERIA_ADN"."' + table + '" SET VALID_TO = \'' + currentDate +
				'\' WHERE  VALID_TO = \'9999-12-31 23:59:59\' AND EXISTS (SELECT VALID_TO FROM "ERPIBERIA_ADN"."' + tableTmp + '" WHERE ' +
				conditionKey2 +
				' AND (' + conditionOR + '))';
			var queryMod2 = 'INSERT INTO "ERPIBERIA_ADN"."' + table + '" (SELECT * from "ERPIBERIA_ADN"."' + tableTmp +
				'" WHERE EXISTS (SELECT VALID_FROM FROM "ERPIBERIA_ADN"."' + table + '" WHERE ' + conditionKey +
				' AND VALID_TO = \'9999-12-31 23:59:59\' AND (' + conditionOR2 + ')))';

			var queryNew = 'INSERT INTO "ERPIBERIA_ADN"."' + table + '" (SELECT * FROM "ERPIBERIA_ADN"."' + tableTmp +
				'" WHERE NOT EXISTS (SELECT VALID_FROM from "ERPIBERIA_ADN"."' + table + '" WHERE ' + conditionKey +
				' AND VALID_TO = \'9999-12-31 23:59:59\'))';
			var queryDel = 'UPDATE "ERPIBERIA_ADN"."' + table + '" SET VALID_TO = \'' + currentDate +
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

            insertLog(conn, date, 'Processing completed successfully');

			// 			$.response.contentType = "application/json";
			// 			$.response.setBody("OK");
		} catch (e) {
			// 			$.response.setBody("ERROR");
		}
	}

	// Start of logics ------------------------------------------------------------------------------------------------
	var rows = JSON.parse(content);

	var date = new Date();

	var i;

    if (system === 'DIS'){
        sapTarget = 'DIP';
        startEnvironment = 'TEST (';
        logLabelStart = 'ADN TEST';
        logLabelTarget = 'ADN PRD';
    }else{
        logLabelStart = 'ADN DEV';
        logLabelTarget = 'ADN TEST';        
        sapTarget = 'DIS';
        startEnvironment = 'DEV (';
    }

	// Columns from production are taken using the same logics as the getcolumns.xsjs file
	try {
		var conn = $.hdb.getConnection();
		var query =
			'SELECT T1.COLUMN_NAME, T2.COLUMN_NAME AS KEY FROM TABLE_COLUMNS AS T1 LEFT JOIN CONSTRAINTS AS T2 ON T1.TABLE_NAME = T2.TABLE_NAME AND T1.COLUMN_NAME = T2.COLUMN_NAME WHERE T1.TABLE_NAME = ? ORDER BY T1.POSITION ASC';
		var aProdColumns = conn.executeQuery(query, table);

		var aTestColumns = JSON.parse(columns);

		var sError = false;

		// Check to determine if structures are equal between test and production
		if (aTestColumns.length === aProdColumns.length) {
			for (i = 0; i < aTestColumns.length; i++) {
				// 	for (var j = 0; j < aProdColumns.length; j++) {
				// 		if (aTestColumns[k].COLUMN_NAME === aProdColumns[j].COLUMN_NAME) {
				// 			break;
				// 		}
				// 		if (j === aTestColumns.length - 1) {
				// 			sError = true;
				// 		}
				// 	}
				if (aTestColumns[i].COLUMN_NAME !== aProdColumns[i].COLUMN_NAME) {
					sError = true;
					break;
				}
			}

			//begin insert Andrea
			//check lock on current table
			var bCheck = checkLock(conn);
			//end insert Andrea
			// Next version is taken only if the structures between test and production are equal
			if (sError === false
				//begin insert Andrea
				&& bCheck === false
				//end insert Andrea
			) {

				// Same logic as UploadFromEcc.xsjs
				uploadToTempTable(conn, date, columns, table, rows);

				// Same logics as newUpdateContent.xsjs
				updateContent(conn, table, date);

				// Maximum version available is extracted from Production system
				var sQueryVersion =
					'SELECT TABLENAME, SYSTEMNAME, MAX(VERSION) AS VERSION, MAX(STRUCTVERSION) AS STRUCTVERSION FROM "ERPIBERIA_ADN"."VERSIONS" WHERE TABLENAME = ? AND SYSTEMNAME = ? GROUP BY TABLENAME, SYSTEMNAME';
				var resultVersion = conn.executeQuery(sQueryVersion, table, sapTarget);

				var sFinalVersion;

				if (resultVersion[0].VERSION >= version) {
					sFinalVersion = (parseFloat(resultVersion[0].VERSION) + 0.1).toFixed(1);
				} else {
					sFinalVersion = version;
				}

				// Table version is updated on production
				var sQueryUpdateVersion = 'INSERT INTO "ERPIBERIA_ADN"."VERSIONS" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
				var aResultUpdate = conn.executeUpdate(sQueryUpdateVersion, table, sapTarget, sFinalVersion, date, user, 'TEST (' + version + ')', rows.length
					.toString(), '', '', resultVersion[0].STRUCTVERSION);
				conn.commit();

				//Begin insert Andrea
				//Creation of the label for the new table version
				var sQueryUpdateLabel = 'INSERT INTO "ERPIBERIA_ADN"."LABELS" VALUES (?, ?, ?, ?)';
				aResultUpdate = conn.executeUpdate(sQueryUpdateLabel, table, sapTarget, sFinalVersion, startEnvironment + version + ')');
				conn.commit();
                sQueryUpdateLabel = 'INSERT INTO "ERPIBERIA_ADN"."LABELS" VALUES (?, ?, ?, ?)';
				aResultUpdate = conn.executeUpdate(sQueryUpdateLabel, table, sapTarget, sFinalVersion, label);
				conn.commit();
				
				
				//delete Lock
				var delLock = 'DELETE FROM "ERPIBERIA_ADN"."LOCK" WHERE TABLENAME=?';
				conn.executeUpdate(delLock, table);
				conn.commit();
				//end insert Andrea

			} else {
				if (sError === true) {
                    insertLog(conn, date, 'Different structure between test and Production Environment');
				} else {
                    insertLog(conn, date, 'Table already locked by other user');
				}
			}
		}

		// Connection is closed at the end of the elaboration
		conn.close();

		// $.response.contentType = "application/json";
		// $.response.setBody(JSON.stringify('OK'));

	} catch (e) {
		conn.close();
		// $.response.setBody(JSON.stringify(e));
	}
}