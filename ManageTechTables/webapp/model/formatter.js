sap.ui.define([], function () {
	"use strict";
	return {
		checkSelectedItems: function (Selected) {
			if (Selected === "X") {
				return true;
			} else {
				return false;
			}
		},

		checkLock: function (Lock) {

			var imgLock = "sap-icon://locked";
			var imgUnlock = "sap-icon://unlocked";
			if (Lock === "X") {
				return imgLock;
			} else {
				return imgUnlock;
			}
		},

		tablen: function (Tab) {
			return Tab.length;
		},

		userGroupCount: function (groupid, userGroupArray) {

			var userGroupSelected = userGroupArray.filter(function (el) {
				return el.GROUPID == groupid;
			});
			return userGroupSelected.length;

		},

		/*		version: function (tablename, system, versions) {

					var listVrs = versions;
					var lastvers = "0";
					for (var i = 0; i < listVrs.length; i++) {
						if (listVrs[i].TABLENAME == tablename && listVrs[i].SYSTEMNAME == system) {
							lastvers = listVrs[i].VERSION;
							break;
						}

					}

					return "v" + lastvers;
				},*/

		version: function (vers) {

			// Start Insert Angelo
			if (vers === " ") {
				return " ";
			} else {
				// End Insert Angelo

				var lastvers = "0";
				if (vers)
					lastvers = vers;

				return "v" + lastvers;
				// Start Insert Angelo
			}
			// End Insert Angelo
		},

		visiblerow: function (tab) {

			if (tab.rows.length <= 10)
				return tab.rows.length;
			else
				return 10;

		},

		// Start Insert Angelo
		getOldStructure: function (vStructVersion) {

			var vReturn;

			// This code is used to retrieve the data from older structure versions
			var sServiceVersion = "/service/ERPIBERIA_ADN/versions/getStructVersion.xsjs";

			// Current table is get from the detail model
			var oTableData = this.getView().getModel("detail_tbl").getData();
			var tableName = oTableData.TABLENAME;

			jQuery.ajax({
				url: sServiceVersion,
				async: false,
				data: {
					tableName: tableName
				},
				method: "GET",
				dataType: "text",
				success: function (response) {
					if (vStructVersion !== (JSON.parse(response)).STRUCTVERSION) {
						vReturn = "X";
					}
				}
			});

			return vReturn;
		},

		showCollector: function (vCurrentCollector) {

				if (vCurrentCollector !== this.getView().getModel("i18n").getResourceBundle().getText("noCollector")) {
					return this.getView().getModel("i18n").getResourceBundle().getText("yesCollector");
				} else {
					return vCurrentCollector;
				}
			}
			// End Insert Angelo

	};
});