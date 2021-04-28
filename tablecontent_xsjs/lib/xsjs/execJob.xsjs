try {
	var table = $.request.parameters.get('table');
	var content = $.request.parameters.get('content');
	var columns = $.request.parameters.get('columns');
	var version = $.request.parameters.get('version');
	var system = $.request.parameters.get('system');
	var user = $.request.parameters.get('user');
	var label = $.request.parameters.get('label');

	var date = new Date();

	var dateJson = JSON.stringify(date);
	var year = dateJson.substring(1, 5);
	var month = dateJson.substring(6, 8);
	var day = dateJson.substring(9, 11);
	var hour = dateJson.substring(12, 14);
	var min = dateJson.substring(15, 17);
	var sec = dateJson.substring(18, 20);

    // Job is scheduled 1 min after this file has been called
	min = (parseInt(min) + 1).toString();

	// There is no need to play with the timezone, it will be managed automatically
	var cron = year + ' ' + month + ' ' + day + ' * ' + hour + ' ' + min + ' ' + sec;
	var myjob = new $.jobs.Job({
		uri: "moveTable.xsjob"
	});

	var id = myjob.schedules.add({
		description: "Massive table movement",
		xscron: cron,
		parameter: {
			"TABLE": table,
			"CONTENT": content,
			"COLUMNS": columns,
			"VERSION": version,
			"SYSTEM": system,
			"USER": user,
			"LABEL": label
		}
	});

	$.response.setBody(cron);
} catch (e) {
	$.response.setBody(JSON.stringify(e));
}