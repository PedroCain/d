try {
	var out;
	var user = $.request.parameters.get('user');
	var conn = $.hdb.getConnection();
	var result;
	result = conn.executeQuery('SELECT * FROM "ERPIBERIA_ADN"."USERS"  WHERE USERNAME = ?', user);
	if (result.length > 0) {
		if (result[0].ADMIN == 'X') {
			out = 'ADMIN';
		} else {

			if (result[0].LOCKED3 == 'X') {
				out = 'BLOCKED';
			} else if (result[0].LOCKED2 == 'X') {
				conn.executeUpdate('UPDATE "ERPIBERIA_ADN"."USERS" SET LOCKED3 = \'X\'  WHERE USERNAME = ?', user);
				conn.commit();
				out = 'BLOCKED';
			} else if (result[0].LOCKED1 == 'X') {
				conn.executeUpdate('UPDATE "ERPIBERIA_ADN"."USERS" SET LOCKED2 = \'X\'  WHERE USERNAME = ?', user);
				conn.commit();
				out = 'LOCKED2';
			} else {
				conn.executeUpdate('UPDATE "ERPIBERIA_ADN"."USERS" SET LOCKED1 = \'X\'  WHERE USERNAME = ?', user);
				conn.commit();
				out = 'LOCKED1';
			}
		}
	} else {
		out = 'NOTEXISTS';
	}
conn.close();
	$.response.setBody(out);
} catch (e) {
    conn.close();
	$.response.setBody(JSON.stringify(e));
}