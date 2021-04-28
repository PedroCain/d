try {

	var conn = $.hdb.getConnection();
    var result = conn.executeQuery('SELECT DISTINCT SYSTEM FROM "ERPIBERIA_ADN"."TABLES"');
    conn.close();
	$.response.setBody(JSON.stringify(result));
} catch (e) {
    conn.close();
	$.response.setBody(JSON.stringify(e));
}