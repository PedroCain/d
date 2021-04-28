try {
	// Parameters get
	var conn = $.hdb.getConnection();
	var vTableName = $.request.parameters.get('table');
	var vOldTableName = $.request.parameters.get('oldTable');
	var vSystem = $.request.parameters.get('system');

	var aColumns = conn.executeQuery('SELECT COLUMN_NAME FROM TABLE_COLUMNS WHERE TABLE_NAME = \'' + vTableName + '\'');

	var aOldColumns = conn.executeQuery('SELECT COLUMN_NAME FROM TABLE_COLUMNS WHERE TABLE_NAME = \'' + vOldTableName + '\'');

	var sWhereCondition = '';

	var vIsFound;

	// This check is executed in order to find the missing columns on the new table
	for (var i = 0; i < aOldColumns.length; i++) {

		vIsFound = false;

		for (var j = 0; j < aColumns.length; j++) {
			if (aOldColumns[i].COLUMN_NAME === aColumns[j].COLUMN_NAME) {
				vIsFound = true;
				break;
			}
		}

		// The column is lost, so the dependencies must be deleted
		if (vIsFound === false) {

			// This string contains the columns in where condition that must be removed from the DEPENDENCIES table
			if (sWhereCondition === '') {
				sWhereCondition = 'WHERE (ORI_TABLE = \'' + vTableName + '\' AND ORI_FIELD = \'' + aOldColumns[i].COLUMN_NAME +
					'\' AND ORI_SYSTEM = \'' +
					vSystem + '\') OR (DEST_TABLE = \'' + vTableName + '\' AND DEST_FIELD = \'' + aOldColumns[i].COLUMN_NAME + '\' AND DEST_SYSTEM = \'' +
					vSystem + '\')';
			} else {
				sWhereCondition = sWhereCondition + ' OR (ORI_TABLE = \'' + vTableName + '\' AND ORI_FIELD = \'' + aOldColumns[i].COLUMN_NAME +
					'\' AND ORI_SYSTEM = \'' +
					vSystem + '\') OR (DEST_TABLE = \'' + vTableName + '\' AND DEST_FIELD = \'' + aOldColumns[i].COLUMN_NAME + '\' AND DEST_SYSTEM = \'' +
					vSystem + '\')';
			}
		}
	}

	// The query is executed only if the where condition contains valid data
	if (sWhereCondition !== '') {
		var result = conn.executeUpdate(
			'DELETE FROM "ERPIBERIA_ADN"."DEPENDENCIES" ' + sWhereCondition);
		conn.commit();
		conn.close();
	}
	$.response.setBody("OK");
} catch (e) {
	conn.close();
	$.response.setBody(JSON.stringify(e));
}