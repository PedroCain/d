try {
	var conn = $.hdb.getConnection();
	var ori_table = $.request.parameters.get('ori_table');
	var collector = $.request.parameters.get('collector');
	var result = conn.executeUpdate(
		'DELETE  FROM "ERPIBERIA_ADN"."DEPENDENCIES" WHERE ORI_TABLE = ? AND COLLECTOR = ?', ori_table, collector);
	conn.commit();
	conn.close();
	// 	$.response.setBody(result);
	$.response.setBody("OK");
} catch (e) {
	conn.close();
	$.response.setBody(JSON.stringify(e));
}