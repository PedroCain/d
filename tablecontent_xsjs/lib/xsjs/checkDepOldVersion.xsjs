try {
   
	var table = $.request.parameters.get('table');
    var conn = $.hdb.getConnection();
    var arrayDep = [];
    var alias;
    var listActual;
    var listWhen;
    var query = 'SELECT * FROM "ERPIBERIA_ADN"."DEPENDENCIES" WHERE ORI_TABLE  = ?';
	arrayDep = conn.executeQuery(query, table);
    var listaCampi;
    var listaJoin;
    var array = [];
if (arrayDep.length > 0 ){
	var query1 = 'SELECT COLUMN_NAME FROM TABLE_COLUMNS WHERE TABLE_NAME  = ? AND COLUMN_NAME <> \'VALID_FROM\' and COLUMN_NAME <> \'VALID_TO\' ORDER BY POSITION ASC';
	var columns = conn.executeQuery(query1, table);
	var arrayContent = [];
	listaCampi = 'a.'+columns[0].COLUMN_NAME+',';
	for (var i = 1; i < columns.length; i++) {
		listaCampi = listaCampi + 'a.'+columns[i].COLUMN_NAME+',';
	}
	listaJoin  = ' left join (SELECT DISTINCT '+arrayDep[0].DEST_FIELD+' from "ERPIBERIA_ADN"."'+arrayDep[0].DEST_TABLE+'" where VALID_TO = \'9999-12-31 23:59:59\') on a.'+arrayDep[0].ORI_FIELD+' = ' +arrayDep[0].DEST_FIELD;
	listActual = arrayDep[0].DEST_TABLE+'.VALID_TO = \'9999-12-31 23:59:59\'';
	listaCampi = listaCampi + arrayDep[0].DEST_FIELD+' as ' +arrayDep[0].ORI_FIELD+'X';
	listWhen   = arrayDep[0].DEST_FIELD+' is NULL';
    	for (var i = 1; i < arrayDep.length; i++) {
        listaCampi = listaCampi + ','+ arrayDep[i].DEST_FIELD+' as ' +arrayDep[i].ORI_FIELD+'X';
	    listaJoin  = listaJoin + ' left join (SELECT DISTINCT '+arrayDep[i].DEST_FIELD+' from "ERPIBERIA_ADN"."'+arrayDep[i].DEST_TABLE+'" where VALID_TO = \'9999-12-31 23:59:59\') on a.'+arrayDep[i].ORI_FIELD+' = ' +arrayDep[i].DEST_FIELD;
    	listActual = listActual + ' and ' + arrayDep[i].DEST_TABLE+'.VALID_TO = \'9999-12-31 23:59:59\'';
    	listWhen   = listWhen+' OR '+arrayDep[i].DEST_FIELD+' is NULL';
    	}
//    listWhen   = listWhen+arrayDep[arrayDep.length - 1].DEST_FIELD+' is NULL';	
//    listaCampi = listaCampi + arrayDep[arrayDep.length - 1].DEST_FIELD+' as ' +arrayDep[arrayDep.length - 1].ORI_FIELD+'X';
//	  listaJoin  = listaJoin  + ' left join (SELECT DISTINCT '+arrayDep[arrayDep.length - 1].DEST_FIELD+' from "ERPIBERIA"."'+arrayDep[arrayDep.length - 1].DEST_TABLE+'" where VALID_TO = \'9999-12-31 23:59:59\') on a.'+arrayDep[arrayDep.length - 1].ORI_FIELD+' = ' +arrayDep[arrayDep.length - 1].DEST_FIELD;
//    listActual = listActual + ' and ' + arrayDep[arrayDep.length - 1].DEST_TABLE+'.VALID_TO = \'9999-12-31 23:59:59\'';


    var queryJoin = 'SELECT '+listaCampi+' FROM "ERPIBERIA_ADN"."'+table+'" as a '+listaJoin+' WHERE a.VALID_TO = \'9999-12-31 23:59:59\' and ('+listWhen+')';
   var res = conn.executeQuery(queryJoin);
    
	for (i = 0; i < res.length; i++) {
		array.push(res[i]);
	}

}
conn.close();
    $.response.setBody(JSON.stringify(array));
} catch (e) {
    	conn.close();
	$.response.setBody(JSON.stringify(e));
}