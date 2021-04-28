var conn = $.hdb.getConnection();

var labelsQuery = 'SELECT DISTINCT LABEL FROM "ERPIBERIA_ADN"."LABELS"';
var aLabels = conn.executeQuery(labelsQuery);

var aResult = [];

for (var i = 0; i < aLabels.length; i++) {
	aResult.push({
		LABEL: aLabels[i].LABEL
	});
}

$.response.setBody(JSON.stringify(aResult));