try {
	var conn = $.hdb.getConnection();

	// 	Parameters get
	var ori_field = $.request.parameters.get('ori_field');
	var ori_table = $.request.parameters.get('ori_table');
	var ori_system = $.request.parameters.get('ori_system');
	var dest_field = $.request.parameters.get('dest_field');
	var dest_table = $.request.parameters.get('dest_table');
	var dest_system = $.request.parameters.get('dest_system');
	var collector = $.request.parameters.get('collector');

	var result = conn.executeUpdate(
		'DELETE  FROM "ERPIBERIA_ADN"."DEPENDENCIES" WHERE ORI_FIELD = ? AND ORI_TABLE = ? AND ORI_SYSTEM = ? AND DEST_FIELD = ? AND DEST_TABLE = ? AND DEST_SYSTEM = ? AND COLLECTOR = ?',
		ori_field, ori_table, ori_system, dest_field, dest_table, dest_system, collector);
	conn.commit();
	conn.close();
	// 	$.response.setBody(result);
	$.response.setBody("OK");
} catch (e) {
	conn.close();
	$.response.setBody(JSON.stringify(e));
}