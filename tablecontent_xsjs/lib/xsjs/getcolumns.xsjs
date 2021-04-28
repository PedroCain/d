//SELECT COLUMN_NAME FROM TABLE_COLUMNS WHERE TABLE_NAME  = 'ZCLIENTES' ORDER BY POSITION ASC
try {
	var conn = $.hdb.getConnection();
	var table = $.request.parameters.get('table');
	var query =
		'SELECT T1.COLUMN_NAME, T2.COLUMN_NAME AS KEY FROM TABLE_COLUMNS AS T1 LEFT JOIN CONSTRAINTS AS T2 ON T1.TABLE_NAME = T2.TABLE_NAME AND T1.COLUMN_NAME = T2.COLUMN_NAME WHERE T1.TABLE_NAME = ? ORDER BY T1.POSITION ASC';
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