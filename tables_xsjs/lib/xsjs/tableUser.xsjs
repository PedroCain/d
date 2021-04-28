	try {
		var username = $.request.parameters.get('username');
		if (username){
		var conn = $.hdb.getConnection();

		var userTable = conn.loadProcedure("ERPIBERIA_ADN", "TABLEUSERSSSS");
		// var listTable = userTable.getResultSet();

		var result = userTable(username);
		var arrayContent = [];
		for (var i = 0; i < result.TABLESUSER.length; i++) {
			arrayContent.push(result.TABLESUSER[i]);
		}
conn.close();
		$.response.contentType = "application/json";
		$.response.setBody(JSON.stringify(arrayContent));
	} 
	}catch (e) {
	    conn.close();
		$.response.setBody(JSON.stringify(e));
	}