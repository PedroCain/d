var responseArr = [];

// Useless
// function sendUserEmail(dest, text, to, subject, family) {

// 	var client = new $.net.http.Client();
// 	var req = new $.web.WebRequest($.net.http.POST, "/messages");

// 	req.headers.set('Content-Type', encodeURIComponent("application/x-www-form-urlencoded"));
// 	req.parameters.set("domain", "sandbox51716250ebf348be9fbc56b53e2c42ce.mailgun.org");
// 	req.parameters.set("from", "no-reply@enel.com");
// 	req.parameters.set("to", to);
// 	req.parameters.set("subject", subject);
// 	req.parameters.set("text", text);
// 	client.request(req, dest);
// 	let response = client.getResponse();
// 	let res = response.body.asString();
// 	let pushResponse = "OK";
// 	if (res.indexOf('"id\"') <= 0) {
// 		pushResponse = family;
// 	}
// 	responseArr.push(pushResponse);
// }

try {
	//	var responseArr = [];
	var conn = $.hdb.getConnection();
	var destination_package = "ERPIBERIA_ADN.table_content";
	var destination_name = "mailgun";
	var dest = $.net.http.readDestination(destination_package, destination_name);

	var oriFieldX;

	// 	Parameters from front-end
	var stringData = $.request.parameters.get('depData');

	// 	Strings for the content of the eMail
	var mailTextHead1 = $.request.parameters.get('mailText1');
	var mailTextHead2 = $.request.parameters.get('mailText2');
	var mailTextHead3 = $.request.parameters.get('mailText3');
	var mailTextDyn = $.request.parameters.get('mailTextDyn');
	var mailTextEnd = $.request.parameters.get('mailTextEnd');

	// 	var mailText = $.request.parameters.get('mailText');
	var subject = $.request.parameters.get('subject');
	var user = $.request.parameters.get('user');
	// 	var version = $.request.parameters.get('version');

	// Start Insert Angelo
	// Extraction for Name and Surname
	var userQuery =
		'SELECT USERNAME, NAME, SURNAME FROM "ERPIBERIA_ADN"."USERS" WHERE USERNAME = \'' + user + '\'';
	var userData = conn.executeQuery(userQuery);
	// End Insert Angelo

	var depData = JSON.parse(stringData);

	// 	var mailText1 = '';
	var arrayMailText = [];
	var listWhere = '';

	var tableStrings;
	var tableName;

	mailTextHead1 = mailTextHead1.replace("&", userData[0].SURNAME + ', ' + userData[0].NAME);

	// 	At least, there is one record
	if (depData.length > 0) {

		// The name of the table is contained inside one string, it's the last word
		tableStrings = depData[0].title.split(' ');
		depData[0].title = tableStrings[tableStrings.length - 1];

		listWhere = ' A1.TABLENAME = \'' + tableName + '\'';

		for (var i = 1; i < depData.length; i++) {

			// The name of the table is contained inside one string, it's the last word
			tableStrings = depData[i].title.split(' ');
			depData[i].title = tableStrings[tableStrings.length - 1];

			listWhere = listWhere + ' OR A1.TABLENAME = \'' + depData[i].title + '\'';
		}

		// New query
		var queryMail =
			'SELECT A1.TABLENAME, A1.RESPONSIBLE, A2.EMAIL, A3.GROUPID FROM "ERPIBERIA_ADN"."TABLES" AS A1 INNER JOIN "ERPIBERIA_ADN"."USERS" AS A2 ON A1.RESPONSIBLE = A2.USERNAME LEFT JOIN "ERPIBERIA_ADN"."TABLE_GROUP" AS A3 ON A1.TABLENAME = A3.TABLENAME WHERE ' +
			listWhere + ' ORDER BY A1.RESPONSIBLE ASC';

		// Old query
		// 		var queryMail =
		// 			'SELECT A1.GROUPID, A1.TABLENAME, A2.USERNAME, A3.EMAIL FROM "ERPIBERIA_ADN"."TABLE_GROUP" AS A1 INNER JOIN "ERPIBERIA_ADN"."USER_GROUP" AS A2 ON A1.GROUPID = A2.GROUPID INNER JOIN "ERPIBERIA_ADN"."USERS" AS A3 ON A2.USERNAME = A3.USERNAME WHERE ' +
		// 			listWhere + 'ORDER BY A1.GROUPID ASC, A1.TABLENAME ASC';
		var resultMail = conn.executeQuery(queryMail);
	}
	// 	var to = '';
	// 	var completeText = '';
	// 	var text;
	// 	var groupId = resultMail[0].GROUPID;
	// 	var tableDest1 = '';

	var allTablesDep = "";
	var dynSection;

	var responsible = resultMail[0].RESPONSIBLE;
	var currentTable;
	var dynFields;
	var beforeFields;

	var mailData = {
		to: "",
		subject: "",
		body: ""
	};

	var currentColumn; //Array that contains the true name of the column
	var aResponse = [];

	for (i = 0; i < resultMail.length; i++) {

		if (responsible === resultMail[i].RESPONSIBLE) {
			allTablesDep = allTablesDep + resultMail[i].TABLENAME;
		} else {
			allTablesDep = resultMail[i].TABLENAME;

			responsible = resultMail.RESPONSIBLE;

			var mailBody;

			// Dynamic section of the mail
			beforeFields = mailTextDyn.replace("&1", resultMail[i].TABLENAME);
			beforeFields = beforeFields.replace("&2", resultMail[i].GROUPID);

			// Mail is completed and a new one, if necessary, is generated
			mailBody = mailTextHead1 + mailTextHead2 + allTablesDep + mailTextHead3 + beforeFields + dynFields + mailTextEnd;

			mailData.to = resultMail[i].EMAIL;
			mailData.subject = subject;
			mailData.body = mailBody;

			aResponse.push(mailData);
		}

		// The content of the body is created dynamically
		currentTable = depData.filter(function(value) {
			return value.title === resultMail[i].TABLENAME;
		});

		if (currentTable.length !== 0) {

			// Section that creates the list of the fields
			for (var j = 0; j < currentTable[0].columns.length; j++) {

				// Name of the current column
				dynFields = currentTable[0].columns[j];

				// List of all values is created
				// Name of the current row is taken using the split function
				currentColumn = currentTable[0].columns[j].split(" ");
				for (var k = 1; k < currentTable[0].rows.length; k++) {
					dynFields = dynFields + "<br>" + currentTable[0].rows[k][currentColumn[0]];
				}

				dynFields = dynFields + "<br><br>";
			}

			if (i === resultMail.length - 1) {

				// Dynamic section of the mail
				beforeFields = mailTextDyn.replace("&1", resultMail[i].TABLENAME);
				beforeFields = beforeFields.replace("&2", resultMail[i].GROUPID);

				// Mail is completed and a new one, if necessary, is generated
				mailBody = mailTextHead1 + mailTextHead2 + allTablesDep + mailTextHead3 + beforeFields + dynFields + mailTextEnd;

				mailData.to = resultMail[i].EMAIL;
				mailData.subject = subject;
				mailData.body = mailBody;

				aResponse.push(mailData);
			}
		}
	}

	$.response.contentType = "application/json";
	$.response.setBody(JSON.stringify(aResponse));

} catch (e) {
	conn.close();
	$.response.setBody(JSON.stringify(e));
}