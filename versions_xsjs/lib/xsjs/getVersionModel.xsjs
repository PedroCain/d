var table = $.request.parameters.get('table');
var system = $.request.parameters.get('system');

var conn = $.hdb.getConnection();

var versionsQuery = 'SELECT * FROM "ERPIBERIA_ADN"."VERSIONS" WHERE TABLENAME = \'' + table +
	'\' AND SYSTEMNAME = \'' + system +
	'\' ORDER BY VERSION DESC';
var aVersions = conn.executeQuery(versionsQuery);

var labelsQuery = 'SELECT * FROM "ERPIBERIA_ADN"."LABELS" WHERE TABLENAME = \'' + table +
	'\' AND SYSTEM = \'' + system + '\'';
var aLabels = conn.executeQuery(labelsQuery);

var aResult = [];

for (var i = 0; i < aVersions.length; i++) {

	aResult.push({
		TABLENAME: aVersions[i].TABLENAME,
		SYSTEMNAME: aVersions[i].SYSTEMNAME,
		VERSION: aVersions[i].VERSION,
		DATE: aVersions[i].DATE,
		CREATE_USER: aVersions[i].CREATE_USER,
		SOURCE: aVersions[i].SOURCE,
		RECORDS: aVersions[i].RECORDS,
		SAP: aVersions[i].SAP,
		SAPDATE: aVersions[i].SAPDATE,
		STRUCTVERSION: aVersions[i].STRUCTVERSION,
		LABELS: []
	});

	for (var j = 0; j < aLabels.length; j++) {
		if (aVersions[i].TABLENAME === aLabels[j].TABLENAME &&
			aVersions[i].SYSTEMNAME === aLabels[j].SYSTEM &&
			aVersions[i].VERSION === aLabels[j].VERSION) {

			aResult[i].LABELS.push({
				key: aLabels[j].LABEL,
				text: aLabels[j].LABEL
			});
		}
	}
	// 	aVersions[i].LABELS = JSON.stringify(aVersions[i].LABELS);
}

$.response.setBody(JSON.stringify(aResult));