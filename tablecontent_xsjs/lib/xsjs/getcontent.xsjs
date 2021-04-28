	try {
		var dateVersion;
		var dateVersionFrom;
		var dateVersionTo;
		var query;
		var last;
		var result;
		var j;

		// Parameters
		var table = $.request.parameters.get('table');
		var system = $.request.parameters.get('system');
		var vers = $.request.parameters.get('version');
		var oldTable = $.request.parameters.get('oldTable');

		var tableName = "\"ERPIBERIA_ADN\"." + "\"" + table + "\"";
		var conn = $.hdb.getConnection();
		var queryVersion = 'SELECT * FROM "ERPIBERIA_ADN"."VERSIONS" WHERE TABLENAME = ? AND SYSTEMNAME = ? ORDER BY DATE ASC';
		var versions = conn.executeQuery(queryVersion, table, system);
		for (j = 0; j < versions.length; j++) {
			if (versions[j].VERSION === vers) {
				if (j === versions.length - 1) {
					dateVersion = '9999-12-31 23:59:59';
					last = 'X';
				} else {
					last = ' ';
					dateVersionFrom = versions[j].DATE;
					var i = j + 1;
					dateVersionTo = versions[i].DATE;
				}
				break;
			}
		}

		// Start Insert Angelo
		// If the old table is passed, the data must be taken from a different table
		if (oldTable !== '') {
			tableName = '"ERPIBERIA_ADN"."' + oldTable + '"';
		}
		// End Insert Angelo

		// Start Insert Angelo (dates management)
		// Column names and data types are extracted
		var queryColumns =
			'SELECT COLUMN_NAME, DATA_TYPE_NAME FROM TABLE_COLUMNS WHERE TABLE_NAME  = ? AND COLUMN_NAME <> \'VALID_FROM\' AND COLUMN_NAME <> \'VALID_TO\' ORDER BY POSITION ASC';
		var columns = conn.executeQuery(queryColumns, table);

		// 	The select for the table is generated dynamically
		var sSelect;

		if (columns[0].DATA_TYPE_NAME !== 'DATE') {
			sSelect = columns[0].COLUMN_NAME;
		} else {
			sSelect = 'TO_VARCHAR(' + columns[0].COLUMN_NAME + ',\'YYYY-MM-DD\') AS ' + columns[0].COLUMN_NAME;
		}

		for (var k = 1; k < columns.length; k++) {
			if (columns[k].DATA_TYPE_NAME !== 'DATE') {
				sSelect = sSelect + ', ' + columns[k].COLUMN_NAME;
			} else {
				sSelect = sSelect + ', TO_VARCHAR(' + columns[k].COLUMN_NAME + ',\'YYYY-MM-DD\') AS ' + columns[k].COLUMN_NAME;
			}
		}
		// End Insert Angelo (dates management)

		if (last === 'X') {
			dateVersion = '9999-12-31 23:59:59';
			query = 'SELECT ' + sSelect + ' FROM ' + tableName + ' WHERE VALID_TO = ?';
			result = conn.executeQuery(query, dateVersion);
		} else {
			query = 'SELECT ' + sSelect + ' FROM ' + tableName + ' WHERE VALID_FROM <= ? AND VALID_TO >= ?';
			result = conn.executeQuery(query, dateVersionFrom, dateVersionTo);
		}

		var arrayContent = [];
		for (var i = 0; i < result.length; i++) {
			arrayContent.push(result[i]);
		}

		conn.close();
		$.response.contentType = "application/json";
		$.response.setBody(JSON.stringify(arrayContent));
	} catch (e) {
		conn.close();
		$.response.setBody(JSON.stringify(e));
	}

	// 	try {
	// 		var dateVersion;
	// 		var dateVersionFrom;
	// 		var dateVersionTo;
	// 		var query;
	// 		var last;
	// 		var result;
	// 		var j;

	// 		// Parameters
	// 		var table = $.request.parameters.get('table');
	// 		var system = $.request.parameters.get('system');
	// 		var vers = $.request.parameters.get('version');
	// 		var oldTable = $.request.parameters.get('oldTable');

	// 		var tableName = "\"ERPIBERIA_ADN\"." + "\"" + table + "\"";
	// 		var conn = $.hdb.getConnection();
	// 		var queryVersion = 'SELECT * FROM "ERPIBERIA_ADN"."VERSIONS" WHERE TABLENAME = ? AND SYSTEMNAME = ? ORDER BY DATE ASC';
	// 		var versions = conn.executeQuery(queryVersion, table, system);
	// 		for (j = 0; j < versions.length; j++) {
	// 			if (versions[j].VERSION === vers) {
	// 				if (j === versions.length - 1) {
	// 					dateVersion = '9999-12-31 23:59:59';
	// 					last = 'X';
	// 				} else {
	// 					last = ' ';
	// 					dateVersionFrom = versions[j].DATE;
	// 					var i = j + 1;
	// 					dateVersionTo = versions[i].DATE;
	// 				}
	// 				break;
	// 			}
	// 		}

	// 		// Start Insert Angelo
	// 		// If the old table is passed, the data must be taken from a different table
	// 		if (oldTable !== '') {
	// 			tableName = '"ERPIBERIA_ADN"."' + oldTable + '"';
	// 		}
	// 		// End Insert Angelo

	// 		if (last === 'X') {
	// 			dateVersion = '9999-12-31 23:59:59';
	// 			query = 'SELECT * FROM ' + tableName + ' WHERE VALID_TO = ?';
	// 			result = conn.executeQuery(query, dateVersion);
	// 		} else {
	// 			query = 'SELECT * FROM ' + tableName + ' WHERE VALID_FROM <= ? AND VALID_TO >= ?';
	// 			result = conn.executeQuery(query, dateVersionFrom, dateVersionTo);
	// 		}

	// 		var arrayContent = [];
	// 		for (var i = 0; i < result.length; i++) {
	// 			arrayContent.push(result[i]);
	// 		}

	// 		conn.close();
	// 		$.response.contentType = "application/json";
	// 		$.response.setBody(JSON.stringify(arrayContent));
	// 	} catch (e) {
	// 		conn.close();
	// 		$.response.setBody(JSON.stringify(e));
	// 	}