//Start Ins Sabrina
////Function for the dynamic condition creation
function getSociety() {
	var recuperaCampoSoc = 'SELECT COLUMN_SOCIETA FROM "ERPIBERIA_ADN"."ZLISTCONFIGTABLE" WHERE TABNAME =' + "'" + table +
		"' AND VALID_TO =  \'9999-12-31 23:59:59\'",
		resultCampoSoc = conn.executeQuery(recuperaCampoSoc),
		columnNameSoc = resultCampoSoc[0].COLUMN_SOCIETA,
		allSoc = "";
	for (let i = 0; i < group_adfs.length; i++) {
		if (i == group_adfs.length - 1) {
			allSoc = allSoc + "'" + group_adfs[i] + "'";
		} else {
			allSoc = allSoc + "'" + group_adfs[i] + "' " + ' OR ADFS_GROUP = ';
		}
	}
	var recuperaCodiceSoc = 'SELECT COD_SOC FROM "ERPIBERIA_ADN"."ZADFS" WHERE ADFS_GROUP = ' + allSoc,
		resulCodiceSoc = conn.executeQuery(recuperaCodiceSoc);

	if (columnNameSoc != '') {
		conditionAndSoc = ' AND (' + columnNameSoc + ' = ';
		conditonWhereSoc = ' WHERE (' + columnNameSoc + ' = ';
		for (let i = 0; i < resulCodiceSoc.length; i++) {
			if (i == resulCodiceSoc.length - 1) {
				conditionAndSoc = conditionAndSoc + "'" + resulCodiceSoc[i].COD_SOC + "')";
				conditonWhereSoc = conditonWhereSoc + "'" + resulCodiceSoc[i].COD_SOC + "')";
			} else {
				conditionAndSoc = conditionAndSoc + "'" + resulCodiceSoc[i].COD_SOC + "' " + ' OR ' + columnNameSoc + ' = ';
				conditonWhereSoc = conditonWhereSoc + "'" + resulCodiceSoc[i].COD_SOC + "' " + ' OR ' + columnNameSoc + ' = ';
			}
		}
	}
}
////
//End Ins Sabrina
