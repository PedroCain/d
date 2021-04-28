try {
	var table = $.request.parameters.get('table');
	var conn = $.hdb.getConnection();
	var dateVersion = '9999-12-31 23:59:59';

	// 	Column names and data types are extracted
	var query2 =
		'SELECT COLUMN_NAME, DATA_TYPE_NAME FROM TABLE_COLUMNS WHERE TABLE_NAME  = ? AND COLUMN_NAME <> \'VALID_FROM\' AND COLUMN_NAME <> \'VALID_TO\' ORDER BY POSITION ASC';
	var columns = conn.executeQuery(query2, table);

	// 	The select for the table is generated dynamically
	var sSelect;

	if (columns[0].DATA_TYPE_NAME !== 'DATE') {
		sSelect = columns[0].COLUMN_NAME;
	} else {
		sSelect = 'TO_VARCHAR(' + columns[0].COLUMN_NAME + ',\'YYYY-MM-DD\') AS ' + columns[0].COLUMN_NAME;
	}

	for (var j = 1; j < columns.length; j++) {
		if (columns[j].DATA_TYPE_NAME !== 'DATE') {
			sSelect = sSelect + ', ' + columns[j].COLUMN_NAME;
		} else {
			sSelect = sSelect + ', TO_VARCHAR(' + columns[j].COLUMN_NAME + ',\'YYYY-MM-DD\') AS ' + columns[j].COLUMN_NAME;
		}
	}

	var query1 = 'SELECT ' + sSelect + ' FROM "ERPIBERIA_ADN"."' + table + '" WHERE VALID_TO = ?';
	var content = conn.executeQuery(query1, dateVersion);

	var arrayContent = [];
	var el;

	for (var i = 0; i < content.length; i++) {
		el = content[i][columns[0].COLUMN_NAME];
		for (var j = 1; j < columns.length; j++) {
			el = el + ';' + content[i][columns[j].COLUMN_NAME];
		}
		arrayContent.push(el);
	}
	conn.close();
	$.response.contentType = "application/json";
	$.response.setBody(JSON.stringify(arrayContent));
} catch (e) {
	conn.close();
	$.response.setBody(JSON.stringify(e));
}

// 	try {
// 		var table = $.request.parameters.get('table');
// 		var conn = $.hdb.getConnection();
// 		var dateVersion = '9999-12-31 23:59:59';
// 		var query1 = 'SELECT * FROM "ERPIBERIA_ADN"."' + table + '" WHERE VALID_TO = ?';
// 		var content = conn.executeQuery(query1, dateVersion);
// 		var query2 =
// 			'SELECT COLUMN_NAME FROM TABLE_COLUMNS WHERE TABLE_NAME  = ? AND COLUMN_NAME <> \'VALID_FROM\' AND COLUMN_NAME <> \'VALID_TO\' ORDER BY POSITION ASC';
// 		var columns = conn.executeQuery(query2, table);
// 		var arrayContent = [];
// 		var el;

// 		for (var i = 0; i < content.length; i++) {
// 			el = content[i][columns[0].COLUMN_NAME];
// 			for (var j = 1; j < columns.length; j++) {
// 				el = el + ';' + content[i][columns[j].COLUMN_NAME];
// 			}
// 			arrayContent.push(el);
// 		}
// 		conn.close();
// 		$.response.contentType = "application/json";
// 		$.response.setBody(JSON.stringify(arrayContent));
// 	} catch (e) {
// 		conn.close();
// 		$.response.setBody(JSON.stringify(e));
// 	}