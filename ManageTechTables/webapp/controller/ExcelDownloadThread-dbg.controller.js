sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/export/Spreadsheet",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel"
], function (Controller, Spreadsheet, MessageToast, JSONModel) {
	"use strict";

	return Controller.extend("ManageTechTables.ManageTechTables.controller.ExcelDownloadThread", {

		onInit: function () {
			// Popup size is reduced
			window.resizeTo(400, 320);
		},

		onAfterRendering: function () {

			var that = this;

			// Logo is loaded
			var sRootPath = jQuery.sap.getModulePath("ManageTechTables");
			var finalPath = sRootPath + "/img/enelADN2.png";
			var aLogo = {
				sPath: finalPath
			};

			var oModelLogo = new JSONModel(aLogo);
			this.getView().setModel(oModelLogo, "logoExcel");

			// Parameters are get from the URL
			// Current URL of the page   
			var sURL = new URL(window.location.href);

			// Tablename
			var sTable = decodeURIComponent(sURL.searchParams.get("table"));
			// System
			var sSystem = decodeURIComponent(sURL.searchParams.get("system"));
			// Version
			var sVersion = decodeURIComponent(sURL.searchParams.get("version"));
			// OldTable
			var sOldTable = decodeURIComponent(sURL.searchParams.get("oldTable"));
			// Local is requested
			var reqLocal = sURL.searchParams.get("reqLocal");
			// Columns
			var aColumns = JSON.parse(decodeURIComponent(sURL.searchParams.get("columns")));

			// Local Storage is set for the beginning of the download
			if (reqLocal === "true") {
				this.setLocalStorage(sTable, sSystem, sVersion, "Download Started");
			}

			// Rows are taken directly from DB
			var aRowsData;
			var jurl = "/service/ERPIBERIA_ADN/table_content/getcontent.xsjs";

			jQuery.ajax({
				url: jurl,
				async: false,
				data: {
					table: sTable,
					system: sSystem,
					version: sVersion,
					oldTable: sOldTable
				},
				method: "GET",
				dataType: "text",

				success: function (response) {
					aRowsData = JSON.parse(response);
				}
			});

			// Current status is put in progress
			if (reqLocal === "true") {
				this.setLocalStorage(sTable, sSystem, sVersion, "In Progress");
			}

			// Date creation
			var date = new Date();
			var finalDate = ("0" + date.getDate()).slice(-2) + "." + ("0" + (date.getMonth() + 1)).slice(-2) + "." + date.getFullYear() +
				"_" +
				date.getHours() +
				"." + date.getMinutes();

			// File name creation
			var fileName = sTable;
			fileName = fileName + " " + finalDate + ".xlsx";

			var oSettings = {
				workbook: {
					columns: aColumns
				},
				dataSource: aRowsData,
				worker: true,
				fileName: fileName,
				showProgress: true
			};

			// Current object for excel file is created
			var oSheet = new Spreadsheet(oSettings);

			// Current status is released for the excel file (it's useless, returns only 0 or 50)
			// oSheet.onprogress = function (iValue) {
			// 	that.setLocalStorage(sTable, sSystem, sVersion, iValue);
			// };

			// Actual excel creation starts here{
			oSheet.build()
				.then(function () {
					// Local Storage is set for the beginning of the download
					if (reqLocal === "true") {
						that.setLocalStorage(sTable, sSystem, sVersion, "Completed");
					}
					window.close();
				})
				.finally(function () {});
		},

		setLocalStorage: function (sTable, sSystem, sVersion, sStatus) {
			// LocalStorage is used to determine the current status of the download

			// Name of the current item
			var sCurrentItem = sTable + sSystem + sVersion;

			// The array is get from local storage
			var aCurrentStatus = JSON.parse(window.localStorage.getItem(sCurrentItem));

			// An update is executed
			aCurrentStatus.status = sStatus;
			// Date is updated only at the start of the thread
			if (sStatus === "Download Started") {
				aCurrentStatus.date = new Date();
			}

			// Local storage is update again with the most recent data
			window.localStorage.setItem(sCurrentItem, JSON.stringify(aCurrentStatus));
		}
	});
});