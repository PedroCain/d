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
	var table = $.request.parameters.get('table');
	//	var SYSTEMNAME = $.request.parameters.get('system');
	var rows = JSON.parse($.request.parameters.get('row'));
	var mailText = $.request.parameters.get('mailText');
	var subject = $.request.parameters.get('subject');
	
	var queryDep = 'SELECT DEST_FIELD, DEST_TABLE, ORI_FIELD FROM "ERPIBERIA_ADN"."DEPENDENCIES" WHERE ORI_TABLE = ?;';
	var resultDep = conn.executeQuery(queryDep, table);
	var arrayDestTable = [];
	for (var i = 0; i < resultDep.length; i++) {
		for (var j = 0; j < rows.length; j++) {
			oriFieldX = resultDep[i].ORI_FIELD + 'X';
			if (rows[j][oriFieldX] == null) {
				arrayDestTable.push(resultDep[i].DEST_TABLE);
				break;
			}
		}
	}
	var mailText1 = '';
	var arrayMailText = [];
	var listWhere = '';
	if (arrayDestTable.length > 0) {

		listWhere = ' A1.TABLENAME = \'' + arrayDestTable[0] + '\'';
		mailText1 = mailText.replace('$', arrayDestTable[0]);
		arrayMailText.push(mailText1);
		for (i = 1; i < arrayDestTable.length; i++) {

			mailText1 = mailText.replace('$', arrayDestTable[i]);
			arrayMailText.push(mailText1);

			listWhere = listWhere + ' OR A1.TABLENAME = \'' + arrayDestTable[i] + '\'';

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
		    sendUserEmail(dest, completeText, to, subject,groupId); 
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
			sendUserEmail(dest, completeText, to, subject,resultMail[i].GROUPID);
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