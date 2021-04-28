function handleUpdate(conn) {
	var aCmd = $.request.parameters.get('user');
	var obj = JSON.parse(aCmd);
	var operation = $.request.parameters.get('operation');
	var result;
	var locked = "";
	var username = obj.USERNAME;
	var password = obj.PASSWORD;
	var name = obj.NAME;
	var surname = obj.SURNAME;
	var surname2 = obj.SURNAME2;
	var contact = obj.CONTACT;
	var email = obj.EMAIL;
	var country = obj.COUNTRY;
	var language = obj.LANGUAGE;
	var admin = obj.ADMIN;
	var department = obj.DEPARTMENT;
	var company = obj.COMPANY;
	var lock1 = obj.LOCKED1;
	var lock2 = obj.LOCKED2;
	var lock3 = obj.LOCKED3;
	var dele  = obj.DELETED;
	switch (operation) {
		case "update":
			result = conn.executeUpdate(
'UPDATE "ERPIBERIA_ADN"."USERS" set LOCKED1 = ?, LOCKED2 = ?, LOCKED3 = ?,PASSWORD = ?, NAME = ?, SURNAME = ?, SURNAME2 = ?, CONTACT = ?, EMAIL = ?, COUNTRY = ?, LANGUAGE = ?, ADMIN = ?, DEPARTMENT = ?, COMPANY = ?,DELETED = ?  WHERE USERNAME = ?',
				lock1, lock2, lock3,password,name,surname,surname2,contact,email,country,language, admin, department, company,dele,username);
			conn.commit();
			$.response.contentType = "application/json";
			$.response.setBody(JSON.stringify(result));

			break;
		case "create":

			result = conn.executeQuery(
				'SELECT * FROM "ERPIBERIA_ADN"."USERS"  WHERE USERNAME = ?', username);
			if (result && result.length > 0) {
				result = "USEREXISTS";
			} else {

				result = conn.executeUpdate(
					'INSERT INTO "ERPIBERIA_ADN"."USERS" (USERNAME,PASSWORD,NAME,SURNAME,EMAIL,ADMIN,CONTACT,COUNTRY,LANGUAGE,LOCKED1,LOCKED2,LOCKED3,SURNAME2,COMPANY,DEPARTMENT,DELETED) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
					username, password, name, surname, email, admin, contact, country, language, locked, locked, locked,surname2,company,department,dele);
				conn.commit();
			}
			$.response.contentType = "application/json";
			$.response.setBody(JSON.stringify(result));
			break;
		default:
			result = "";
			$.response.contentType = "application/json";
			$.response.setBody(JSON.stringify(result));
	}
}
// Request process
function processRequest() {
	var conn = $.hdb.getConnection();
	try {
		switch ($.request.method) {
			// Handle your GET calls here
			case $.net.http.GET:
				handleUpdate(conn);
				break;
			case $.net.http.POST:
			    handleUpdate(conn);
				break;
				// Handle your other methods: PUT, DELETE
			default:
				$.response.status = $.net.http.METHOD_NOT_ALLOWED;
				$.response.setBody("Wrong request method");
				break;
		}
		$.response.contentType = "application/json";
	} catch (e) {
		$.response.setBody("Failed to execute action: " + e.toString());
	}

	if (conn) {
		conn.close();
	}
}
// Call request processing
processRequest();