try {

	var user = $.request.parameters.get('user');
	var conn = $.hdb.getConnection();
    conn.executeUpdate('UPDATE "ERPIBERIA_ADN"."USERS" SET LOCKED1 = \'\', LOCKED2 = \'\', LOCKED3 = \'\'  WHERE USERNAME = ?', user);
	conn.commit();
	conn.close();
	$.response.setBody('unlocked');
} catch (e) {
    conn.close();
	$.response.setBody(JSON.stringify(e));
}