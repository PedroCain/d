	try {
		var array = $.request.parameters.get('rows');
		var usergroups = JSON.parse(array);
		var username = $.request.parameters.get('user');
		var connection = $.hdb.getConnection();
        if (username !== "new"){
		connection.executeUpdate(
			'DELETE  FROM "ERPIBERIA_ADN"."USER_GROUP" WHERE USERNAME = ?', username);
            connection.commit();  	
 }
        var max = usergroups.length;
		for (var i = 0; i < max; i++) {
			connection.executeUpdate(
				'INSERT INTO "ERPIBERIA_ADN"."USER_GROUP" values (?,?,?)', usergroups[i].USERNAME, usergroups[i].GROUPID, usergroups[i].MODE);
			connection.commit();
		}
		connection.close();
		$.response.setBody("success");
	} catch (e) {
	    connection.close();
		$.response.setBody("Failed to execute action: " + e.toString());
	}