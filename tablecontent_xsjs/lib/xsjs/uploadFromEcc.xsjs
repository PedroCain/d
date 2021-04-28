 //Get Parameters
 var table = $.request.parameters.get('table');
 var today = $.request.parameters.get('today');
 var rowsInput = $.request.parameters.get('rows');
 var allField = $.request.parameters.get('allField');

 var index = allField.indexOf(',VALID_TO');
 var noValid = allField.substring(1, index);
 noValid = noValid.replace(/,/g, ' ');

 var tableTmp = table + '_TMP';
 var numFields;

 // The current temporary table used is cleaned
 var conn = $.hdb.getConnection();
 var delQuery = 'DELETE FROM "ERPIBERIA_ADN"."' + tableTmp + '"';
 conn.executeUpdate(delQuery);

 // Number of columns is calculated
 var all = allField.split(",");
 var num = all.length;

 // allField string is updated in order to put the "" symbols for each field
 allField = allField.replace(/\(/g, '("');
 allField = allField.replace(/\)/g, '")');
 allField = allField.replace(/,/g, '","');

 function getStatusCode(msg) {
 	var m = msg.match('\\:\\s(\\d+)\\s\\-');
 	return (m) ? parseInt(m[1], 10) : null;
 }

 try {

 	numFields = '(?';

 	for (var j = 1; j < num; j++) {
 		numFields = numFields + ',?';
 	}
 	numFields = numFields + ')';

 	var rows = JSON.parse(rowsInput);

 	// The array used to perform the updated is cleaned
 	var argsArray = [];

 	for (var i = 0; i < rows.length; i++) {
 		var elArray = rows[i].split(";");
 		if (elArray.length < num - 2) {
 			elArray.push("");
 		}
 		elArray.push('9999-12-31 23:59:59');
 		elArray.push(today); //Current date
 		argsArray.push(elArray);
 	}

 	try {
 		// Data is inserted into the temporary table
 		var query1 = 'INSERT INTO "ERPIBERIA_ADN"."' + tableTmp + '"' + allField + ' VALUES ' + numFields;

 		conn.executeUpdate(query1, argsArray);
 		conn.commit();

 		// The operation has been executed without errors
 		$.response.setBody("OK");

 	} catch (e) {
 		var code = getStatusCode(e.message);
 		if (code && code === 301) {
 			$.response.setBody('unique constraint violated');
 		} else {
 			$.response.setBody('something else: ' + e.message);
 		}
 		$.response.status = $.net.http.BAD_REQUEST;
 	}

 } catch (e) {
 	if (conn) {
 		conn.close();
 	}
 	$.response.setBody(JSON.stringify(e));
 }