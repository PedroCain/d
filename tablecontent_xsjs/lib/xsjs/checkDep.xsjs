function checkNoDBTables(currentTab, arrayTab) {

	var data;

	for (var n = 0; n < arrayTab.length; n++) {
		if (arrayTab[n] === currentTab) {
			data = arrayTab[n];
			break;
		}
	}

	if (data !== undefined) {
		return true;
	} else {
		return false;
	}

	// Old Code
	// 	var data = arrayTab.filter(function(value) {
	// 		return value === currentTab;
	// 	});

	// 	if (data === currentTab) {
	// 		return true;
	// 	} else {else
	// 	{
	// 	    return false;
	// 	}
	// 		return false;
	// 	}
}

try {
	// Parameters get
	var table = $.request.parameters.get('table');
	var randNum = $.request.parameters.get('genNum');
	var noDBTables = $.request.parameters.get('noDBTables[]');
	var isCSVLoad = $.request.parameters.get('isCSVLoad');

	if (typeof noDBTables === 'string') {
		var temp = noDBTables;
		noDBTables = [];
		noDBTables.push(temp);
	}

	var conn = $.hdb.getConnection();
	var arrayDep = [];
	var listWhen = '';
	var query = 'SELECT * FROM "ERPIBERIA_ADN"."DEPENDENCIES" WHERE ORI_TABLE = ?';
	arrayDep = conn.executeQuery(query, table);

	// Start Insert Angelo
	// This code is used to extract different values from the same origin fields
	var currentAs = 0;
	var specialChar = 'DUP';

	for (var n = 0; n < arrayDep.length; n++) {

		if (arrayDep[n].AS === undefined && arrayDep[n].COLLECTOR === 'NO') {

			for (var m = 0; m < arrayDep.length; m++) {

				if (n === m) {
					// It's the same field, there's no need to check
					continue;
				}

				if (arrayDep[m].ORI_FIELD === arrayDep[n].ORI_FIELD && arrayDep[m].COLLECTOR === 'NO') {
					arrayDep[m].AS = currentAs;
					currentAs++;
				}
			}
		}
	}
	// End Insert Angelo

	// 	Start Insert Angelo
	// 	This code is used to make the checkDep work with the current data passed from CSV
	if (isCSVLoad === 'X') {
		table = table + '_TMP';
	}
	// End Insert Angelo
	var listaCampi = '';
	var listaJoin = '';

	var array = [];

	var selectFields = '';
	var selectDep = '';

	var destTable;

	var check;

	if (arrayDep.length > 0) {

		var currentCombo = arrayDep[0].COLLECTOR;
		var currentJoin = 1; //Variables used to select distinct variables from joined tables

		selectFields = '"' + arrayDep[0].DEST_FIELD + '"';
		selectDep = ' on a."' + arrayDep[0].ORI_FIELD + '" = c' + currentJoin + '."' + arrayDep[0].DEST_FIELD + '"';
		listaCampi = 'a."' + arrayDep[0].ORI_FIELD + '",c' + currentJoin + '."' + arrayDep[0].DEST_FIELD + '" as "' + arrayDep[0].ORI_FIELD + '_' +
			currentCombo + '"';
		listWhen = 'c' + currentJoin + '."' + arrayDep[0].DEST_FIELD + '" is NULL';

		for (var k = 1; k < arrayDep.length; k++) {

			if (currentCombo === arrayDep[k].COLLECTOR && currentCombo !== 'NO') {
				selectFields = selectFields + ',"' + arrayDep[k].DEST_FIELD + '"';
				selectDep = selectDep + ' and a."' + arrayDep[k].ORI_FIELD + '" = c' + currentJoin + '."' + arrayDep[k].DEST_FIELD + '"';

				// This code is used in order to extract the data for two dependencies that have the same exact origin field
				if (arrayDep[k].AS === undefined) {
					listaCampi = listaCampi + ',a."' + arrayDep[k].ORI_FIELD + '",c' + currentJoin + '."' + arrayDep[k].DEST_FIELD + '" as "' + arrayDep[k]
						.ORI_FIELD +
						'_' + currentCombo + '"';
				} else {
					listaCampi = listaCampi + ',a."' + arrayDep[k].ORI_FIELD + '" as "' + arrayDep[k].ORI_FIELD + '_' + specialChar + arrayDep[k].AS +
						'" ,c' +
						currentJoin + '."' + arrayDep[k].DEST_FIELD + '" as "' + arrayDep[k]
						.ORI_FIELD + '_' + specialChar + arrayDep[k].AS +
						'_' + currentCombo + '"';
				}

				listWhen = listWhen + ' OR c' + currentJoin + '."' + arrayDep[k].DEST_FIELD + '" is NULL';
			} else {

				currentCombo = arrayDep[k].COLLECTOR;

				if (randNum !== '0') {
					check = checkNoDBTables(arrayDep[k - 1].DEST_TABLE, noDBTables);

					if (check === true) {
						destTable = arrayDep[k - 1].DEST_TABLE + randNum.toString();
						// 		arrayDep[k - 1].DEST_TABLE = arrayDep[k - 1].DEST_TABLE + randNum.toString();
					} else {
						destTable = arrayDep[k - 1].DEST_TABLE;
					}
				} else {
					destTable = arrayDep[k - 1].DEST_TABLE;
				}

				listaJoin = listaJoin + ' left join (SELECT DISTINCT ' + selectFields + ' from "ERPIBERIA_ADN"."' + destTable +
					'" where VALID_TO = \'9999-12-31 23:59:59\') as c' + currentJoin + selectDep;

				currentJoin++;

				selectFields = '"' + arrayDep[k].DEST_FIELD + '"';
				selectDep = ' on a."' + arrayDep[k].ORI_FIELD + '" = c' + currentJoin + '."' + arrayDep[k].DEST_FIELD + '"';

				// This code is used in order to extract the data for two dependencies that have the same exact origin field
				if (arrayDep[k].AS === undefined) {
					listaCampi = listaCampi + ',a."' + arrayDep[k].ORI_FIELD + '",c' + currentJoin + '."' + arrayDep[k].DEST_FIELD + '" as "' + arrayDep[k]
						.ORI_FIELD +
						'_' + currentCombo + '"';
				} else {
					listaCampi = listaCampi + ',a."' + arrayDep[k].ORI_FIELD + '" as "' + arrayDep[k].ORI_FIELD + '_' + specialChar + arrayDep[k].AS +
						'" ,c' +
						currentJoin + '."' + arrayDep[k].DEST_FIELD + '" as "' + arrayDep[k]
						.ORI_FIELD + '_' + specialChar + arrayDep[k].AS +
						'_' + currentCombo + '"';
				}
				listWhen = listWhen + ' OR c' + currentJoin + '."' + arrayDep[k].DEST_FIELD + '" is NULL';
			}
		}

		if (randNum !== '0') {
			check = checkNoDBTables(arrayDep[k - 1].DEST_TABLE, noDBTables);

			if (check === true) {
				destTable = arrayDep[arrayDep.length - 1].DEST_TABLE + randNum.toString();
				// arrayDep[arrayDep.length - 1].DEST_TABLE = arrayDep[arrayDep.length - 1].DEST_TABLE + randNum;
			} else {
				destTable = arrayDep[arrayDep.length - 1].DEST_TABLE;
			}
		} else {
			destTable = arrayDep[arrayDep.length - 1].DEST_TABLE;
		}

		listaJoin = listaJoin + ' left join (SELECT DISTINCT ' + selectFields + ' from "ERPIBERIA_ADN"."' + destTable +
			'" where VALID_TO = \'9999-12-31 23:59:59\') as c' + currentJoin + selectDep;

		var queryJoin = 'SELECT DISTINCT ' + listaCampi + ' FROM "ERPIBERIA_ADN"."' + table + '" as a ' + listaJoin +
			' WHERE a.VALID_TO = \'9999-12-31 23:59:59\' and (' + listWhen + ')';
		var res = conn.executeQuery(queryJoin);

		for (var j = 0; j < res.length; j++) {
			array.push(res[j]);
		}

	}
	conn.close();
	$.response.setBody(JSON.stringify(array));
} catch (e) {
	conn.close();
	$.response.setBody(JSON.stringify(e));
}