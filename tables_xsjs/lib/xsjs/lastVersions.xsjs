try {
	var proc;
	var result;
	var arrayContent = [];
	var username = $.request.parameters.get('username');
	if (username) {
		var conn = $.hdb.getConnection();
		// Start Delete Angelo
		// var typeUser = conn.executeQuery('SELECT ADMIN FROM "ERPIBERIA_ADN"."USERS" WHERE USERNAME = ?', username);
		// if (typeUser[0].ADMIN == 'X') {
		// End Delete Angelo
		proc = conn.loadProcedure("ERPIBERIA_ADN", "TABLESV2");
		result = proc();
		for (var i = 0; i < result.TABLESUSER.length; i++) {
			arrayContent.push(result.TABLESUSER[i]);

		}
		// 	Start Delete Angelo
		// 	} else {
		// 		proc = conn.loadProcedure("ERPIBERIA_ADN", "TABLEUSERS2");
		// 		result = proc(username);
		// 		for (var i = 0; i < result.TABLESUSER.length; i++) {
		// 			arrayContent.push(result.TABLESUSER[i]);
		// 		}
		// 	}
		// 	End Delete Angelo
		conn.close();
		$.response.contentType = "application/json";
		$.response.setBody(JSON.stringify(arrayContent));
	}
} catch (e) {
	conn.close();
	$.response.setBody(JSON.stringify(e));
}