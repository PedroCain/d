try {
	var conn = $.hdb.getConnection();
	var table = $.request.parameters.get('table');
	var query = 'SELECT column_name FROM CONSTRAINTS WHERE SCHEMA_NAME = \'ERPIBERIA_ADN\' and TABLE_NAME = ?';
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