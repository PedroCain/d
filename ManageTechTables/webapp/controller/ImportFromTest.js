sap.ui.define([
	"ManageTechTables/ManageTechTables/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("ManageTechTables.ManageTechTables.controller.Labels", {
		// formatter: formatter,

		onImportFromTest: function () {

			// Progress indicator is shown
			sap.ui.core.BusyIndicator.show(0);

			var aDetails = this.getView().getModel("detail_tbl").getData();

			// The user can select the version that must be imported
			var vSelectedRows = this.getView().byId("table_vers").getSelectedItems().length;

			if (vSelectedRows < 1 || vSelectedRows > 1) {
				sap.ui.core.BusyIndicator.hide();

				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("selectErrExport"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
			} else {

				var aDataSelected = this.getView().byId("table_vers").getSelectedItems();

				var firstSelection = aDataSelected[0].getCells();

				// Those variables contains data about the row selected
				var vSystem = firstSelection[1].getText();
				var vVersion = firstSelection[2].getText();
				var vOldStructure = firstSelection[8].getText();

				// It's impossibile to export a table that have an older structure
				if (vOldStructure === "X") {
					sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("exportOldStructure"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
				} else {
					// The operation is executed only if the structures are equal between Production and Test
					if (this.compareStructures(aDetails.TABLENAME)) {
						this.compareVersions(aDetails.TABLENAME, vVersion, vSystem);
					}
				}
			}
		},

		compareStructures: function (vTableName) {

			var aTestColumns;
			var aCurrentColumns;

			var sURL = "/service/ERPIBERIA_ADN/table_content/getcolumns.xsjs";
			var sURLProd = "/serviceProd/ERPIBERIA_ADN/table_content/getcolumns.xsjs";

			var that = this;

			// Test columns are read
			jQuery.ajax({
				url: sURLProd,
				async: false,
				data: {
					table: vTableName
				},
				method: "GET",
				dataType: "text",
				success: function (response) {
					aTestColumns = JSON.parse(response);
				}
			});

			// Current columns are read
			jQuery.ajax({
				url: sURL,
				async: false,
				data: {
					table: vTableName
				},
				method: "GET",
				dataType: "text",
				success: function (response) {
					aCurrentColumns = JSON.parse(response);
				}
			});

			// If there are no columns on production, means that no table has been imported on that system
			if (aTestColumns.length === 0) {
				sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("testStructuresErrorEmpty"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});

				// Progress indicator is removed
				sap.ui.core.BusyIndicator.hide();

				return false;
			}

			// If the number of columns is different between the two tables, the export will be interrupted
			if (aCurrentColumns.length !== aTestColumns.length) {
				sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("testStructuresError"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});

				// Progress indicator is removed
				sap.ui.core.BusyIndicator.hide();

				return false;
			}

			// If the structures doesn't match, an error is shown
			for (var i = 0; i < aCurrentColumns.length; i++) {
				if (aCurrentColumns[i].COLUMN_NAME !== aTestColumns[i].COLUMN_NAME) {
					sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("testStructuresError"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});

					// Progress indicator is removed
					sap.ui.core.BusyIndicator.hide();

					return false;
				}
			}

			var aImport = {
				columns: aCurrentColumns
			};

			var oModel = new JSONModel(aImport);
			this.getView().setModel(oModel, "importTest");

			return true;
		},

		compareVersions: function (vTableName, vVersion, vSystem) {

			var vProductionVersion;
			var vCurrentVersion;
			// var vProductionSystem;

			var that = this;

			// Production Version is read
			var sURLTest = "/serviceProd/ERPIBERIA_ADN/versions/getVersions.xsodata";
			var oModel = new sap.ui.model.odata.v2.ODataModel(sURLTest);
			var sEntity = "/versions";

			var aFilter = [];

			aFilter.push(new Filter({
				path: "TABLENAME",
				operator: FilterOperator.EQ,
				value1: vTableName
			}));

			oModel.read(sEntity, {
				filters: aFilter,
				method: "GET",
				success: function (result) {

					// Test Version
					vProductionVersion = result.results[result.results.length - 1].VERSION;
					// vProductionSystem = result.results[result.results.length - 1].SYSTEMNAME;

					var vUpdate = that.writeTestTable(vTableName, vSystem, result.results[result.results.length - 1].SYSTEMNAME, vVersion);

					// The current rows that will be passed are taken inside this function
					if (vUpdate) {

						// Current Version
						vCurrentVersion = that.getView().getModel("ver_d").getData()[0].VERSION;

						// If the current version on test is bigger than the one on production,
						// the version used on production will be the same as the one used on test
						if (vCurrentVersion > vProductionVersion) {
							that.onFinishImportTest(vCurrentVersion, vCurrentVersion);
						} else {
							that._selectVersionDialog("TEST", vProductionVersion);
						}
					}
				}
			});
		},

		// Function that writes the table taken from TEST on PRODUCTION
		writeTestTable: function (vTableName, vTestSystem, vProdSystem, vTestVersion) {

			var that = this;

			var aRows = [];
			var oDate = new Date();

			// A new model is created to pass additional informations to the last section of this import
			var aData = {
				date: oDate,
				system: vTestSystem,
				prodSystem: vProdSystem
			};

			var oModel = new JSONModel(aData);
			this.getView().setModel(oModel, "importData");

			// Data is taken from the test system
			var jurl = "/service/ERPIBERIA_ADN/table_content/getcontent.xsjs";
			jQuery.ajax({
				url: jurl,
				async: false,
				data: {
					table: vTableName,
					system: vTestSystem,
					version: vTestVersion,
					oldTable: ""
				},
				method: "GET",
				dataType: "text",
				success: function (response) {
					aRows = JSON.parse(response);

					for (var i = 0; i < aRows.length; i++) {
						// Dates are removed
						delete aRows[i].VALID_FROM;
						delete aRows[i].VALID_TO;
					}
				}
			});

			var aImport = that.getView().getModel("importTest").getData();

			// The data is loaded on the temporary table
			// sAllFields logic, this string contains every column of the table
			var sAllFields = "(";
			for (var i = 0; i < aImport.columns.length; i++) {
				if (aImport.columns[i].COLUMN_NAME !== "VALID_FROM" && aImport.columns[i].COLUMN_NAME !== "VALID_TO") {
					var vColumn = aImport.columns[i].COLUMN_NAME;
					sAllFields = sAllFields + vColumn + ",";
				}
			}
			var sRows = JSON.stringify(aRows);
			sAllFields = sAllFields + "VALID_TO,VALID_FROM)";

			var urlUpload = "/serviceProd/ERPIBERIA_ADN/table_content/uploadFromEccJSON.xsjs";

			jQuery.ajax({
				url: urlUpload,
				async: false,
				data: {
					table: vTableName,
					rows: sRows,
					today: oDate.toJSON(),
					allField: sAllFields
				},
				method: "POST",
				dataType: "text",
				success: function (oData) {
					// Data has been loaded correctly on the temporary table
				}
			});

			// Data is written to the DB on Production
			// In case of success, the real table is updated on HANA
			var sUpdateURL = "/serviceProd/ERPIBERIA_ADN/table_content/newUpdateContent.xsjs";
			jQuery.ajax({
				url: sUpdateURL,
				async: false,
				data: {
					// table: modelDetail.TABLENAME,
					table: vTableName,
					from: JSON.stringify(oDate)
				},
				method: "POST",
				dataType: "text",
				success: function (result) {
					// Error Case
					if (result !== "OK") {
						// Progress indicator is removed
						sap.ui.core.BusyIndicator.hide();

						// An error message is shown at the user
						sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("e_update_rec"), {
							icon: sap.m.MessageBox.Icon.ERROR
						});
						return false;
					}
				}
			});
			return true;
		},

		onFinishImportTest: function (vVersion, vTestVersion) {
			var that = this;

			// Useful data is taken from Models
			var aDetails = this.getView().getModel("detail_tbl").getData();
			var aImportData = this.getView().getModel("importData").getData();

			// Username
			var vUserName = this.getUserName();

			// Number of records
			var rowsNumber = this.getNumRecords(aDetails.TABLENAME);

			var sTestString = "TEST (" + vTestVersion + ")";

			// New row creation for "VERSIONS" table
			var newRow = this.createNewRowVers(aDetails.TABLENAME, aImportData.prodSystem, vVersion, aImportData.date, vUserName, sTestString,
				rowsNumber, "");
			this.createDBEccProduction("versions", "true", "versions/getVersions.xsodata", newRow);

			// Loading wait is removed
			sap.ui.core.BusyIndicator.hide();

			sap.m.MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText("s_update_rec", vVersion), {
				icon: sap.m.MessageBox.Icon.SUCCESS,
				onClose: that.setCurrentTable() //Data refresh
			});
		},

		createDBEccProduction: function (entitySet, asyncr, methodECC, newRow) {
			var results;
			// Service Address
			var serviceURL = "/serviceProd/ERPIBERIA_ADN/" + methodECC;
			// Model creation
			var oModel = new sap.ui.model.odata.ODataModel(serviceURL, true);
			// Model read from SAP
			oModel.create(entitySet, newRow, null, function (oData) {
				results = "SUCCESS";
			}, function (e) {
				// Error reading oData
				results = "ERROR";
			});
			return results;
		}
	});
});