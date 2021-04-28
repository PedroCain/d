//SELECT COLUMN_NAME FROM TABLE_COLUMNS WHERE TABLE_NAME  = 'ZCLIENTES' ORDER BY POSITION ASC
try {
	var conn = $.hdb.getConnection();
	var table = $.request.parameters.get('table');
	var query = 'SELECT COLUMN_NAME FROM TABLE_COLUMNS WHERE TABLE_NAME  = ? AND COLUMN_NAME <> \'VALID_FROM\' AND COLUMN_NAME <> \'VALID_TO\' ORDER BY POSITION ASC ';
	var result = conn.executeQuery(query, table);
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