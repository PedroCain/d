	try {
		var array = $.request.parameters.get('rows');
		var tablegroups = JSON.parse(array);

		var groupid = $.request.parameters.get('group');
		var connection = $.hdb.getConnection();
        if (groupid !== "new"){
		connection.executeUpdate(
			'DELETE  FROM "ERPIBERIA_ADN"."TABLE_GROUP"  WHERE GROUPID = ?', groupid);
			connection.commit();
        }	
		for (var i = 0; i < tablegroups.length; i++) {
			connection.executeUpdate(
				'INSERT INTO "ERPIBERIA_ADN"."TABLE_GROUP" values (?,?,?,?)', tablegroups[i].GROUPID, tablegroups[i].TABLENAME, tablegroups[i].SYSTEMNAME,tablegroups[i].DESCRIPTION);
			connection.commit();
			
		}
		connection.close();
		$.response.setBody("success");
	} catch (e) {
	    connection.close();
		$.response.setBody("Failed to execute action: " + e.toString());
	}