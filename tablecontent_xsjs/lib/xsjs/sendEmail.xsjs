var responseArr = [];

function sendUserEmail(dest, text, to, subject, family) {

	var client = new $.net.http.Client();
	var req = new $.web.WebRequest($.net.http.POST, "/messages");

	req.headers.set('Content-Type', encodeURIComponent("application/x-www-form-urlencoded"));
	req.parameters.set("domain", "sandbox51716250ebf348be9fbc56b53e2c42ce.mailgun.org");
	req.parameters.set("from", "no-reply@enel.com");
	req.parameters.set("to", to);
	req.parameters.set("subject", subject);
	req.parameters.set("text", text);
	client.request(req, dest);
	let response = client.getResponse();
	let res = response.body.asString();
	let pushResponse = "OK";
	if (res.indexOf('"id\"') <= 0) {
		pushResponse = family;
	}
	responseArr.push(pushResponse);
}

try {
	//	var responseArr = [];
	var conn = $.hdb.getConnection();
	var destination_package = "ERPIBERIA_ADN.table_content";
	var destination_name = "mailgun";
	var dest = $.net.http.readDestination(destination_package, destination_name);

	var oriFieldX;

	// 	Parameters from front-end
	var stringData = $.request.parameters.get('depData');
	var mailText = $.request.parameters.get('mailText');
	var subject = $.request.parameters.get('subject');

	var depData = JSON.parse(stringData);

	var mailText1 = '';
	var arrayMailText = [];
	var listWhere = '';

	var tableStrings;
	var tableName;

	// 	At least, there is one record
	if (depData.length > 0) {

		// The name of the table is contained inside one string, it's the last word
		tableStrings = depData[0].title.split(' ');
		tableName = tableStrings[tableStrings.length - 1];

		listWhere = ' A1.TABLENAME = \'' + tableName + '\'';
		mailText1 = mailText.replace('$', tableName);
		arrayMailText.push(mailText1);

		for (var i = 1; i < depData.length; i++) {

			// The name of the table is contained inside one string, it's the last word
			tableStrings = depData[i].title.split(' ');
			tableName = tableStrings[tableStrings.length - 1];

			mailText1 = mailText.replace('$', tableName);
			arrayMailText.push(mailText1);

			listWhere = listWhere + ' OR A1.TABLENAME = \'' + tableName + '\'';
		}

		var queryMail =
			'SELECT A1.GROUPID, A1.TABLENAME, A2.USERNAME, A3.EMAIL FROM "ERPIBERIA_ADN"."TABLE_GROUP" AS A1 INNER JOIN "ERPIBERIA_ADN"."USER_GROUP" AS A2 ON A1.GROUPID = A2.GROUPID INNER JOIN "ERPIBERIA_ADN"."USERS" AS A3 ON A2.USERNAME = A3.USERNAME WHERE ' +
			listWhere + 'ORDER BY A1.GROUPID ASC, A1.TABLENAME ASC';
		var resultMail = conn.executeQuery(queryMail);
	}
	var to = '';
	var completeText = '';
	var text;
	var groupId = resultMail[0].GROUPID;
	var tableDest1 = '';

	for (i = 0; i < resultMail.length; i++) {
		if (groupId !== resultMail[i].GROUPID) {
			sendUserEmail(dest, completeText, to, subject, groupId);
			groupId = resultMail[i].GROUPID;
			to = '';
			completeText = '';
			tableDest1 = '';
		}
		if (i == resultMail.length - 1) {
			if (to == '')
				to = resultMail[i].EMAIL;
			else
				to = to + ';' + resultMail[i].EMAIL;

			if (tableDest1 !== resultMail[i].TABLENAME) {
				tableDest1 = resultMail[i].TABLENAME;
				text = mailText.replace('$', resultMail[i].TABLENAME);
				completeText = completeText + text;
			}
			sendUserEmail(dest, completeText, to, subject, resultMail[i].GROUPID);
			break;
		}
		if (to == '')
			to = resultMail[i].EMAIL;
		else
			to = to + ';' + resultMail[i].EMAIL;
		if (tableDest1 !== resultMail[i].TABLENAME) {
			tableDest1 = resultMail[i].TABLENAME;
			text = mailText.replace('$', resultMail[i].TABLENAME);
			completeText = completeText + text;
		}

	}
	conn.close();
	$.response.contentType = "application/json";
	$.response.setBody(JSON.stringify(responseArr));
} catch (e) {
	conn.close();
	$.response.setBody(JSON.stringify(e));
}