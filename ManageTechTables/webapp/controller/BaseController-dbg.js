sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"ManageTechTables/ManageTechTables/model/formatter",
	"sap/ui/model/Filter",
	"sap/m/Dialog",
	"sap/ui/model/FilterOperator",
	"ManageTechTables/ManageTechTables/libs/smtp"
], function (Controller, formatter, Filter, Dialog, FilterOperator) {
	"use strict";
	var method;

	// Start Insert Angelo
	// The following variables are used to determine if every missing table has been loaded correctly
	var currentCycle; //Current cycle executed
	var missingTables; //Number of missing tables elaborated
	var currentNumTables; //Maximum number of tables (case of success: currentNumTables === missingTables)

	var errorIsReleased;
	// End Insert Angelo

	return Controller.extend("ManageTechTables.ManageTechTables.controller.BaseController", {
		onInit: function () {},

		// Start Insert Angelo
		getUserName: function () {
			var aUserData = this.getOwnerComponent().getModel("user");
			var sUserName = aUserData.name;
			if (aUserData.surname !== undefined) {
				sUserName = sUserName + " " + aUserData.surname;
			}
			return sUserName;
		},
		// Encd Insert Angelo

		onDownloadErrorLog: function (oName, oContent, oExtFile) {
			sap.ui.core.BusyIndicator.show(0);
			//Create the file name
			var d = new Date();
			var oDate = ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "." + d.getFullYear() + "_" + d.getHours() +
				"." + d.getMinutes();
			var oFileName = oName + oDate + oExtFile;
			//Create object Blob to download
			var oBlob = new Blob([oContent], {
				type: "text/plain;charset=utf-8"
			});
			//Create HTML element
			var a = document.createElement("a");
			//Generate URL for download
			var oFileUrl = window.URL.createObjectURL(oBlob);
			//Application settings in HTML element
			a.href = oFileUrl;
			a.download = oFileName;
			//Simulate click for download
			a.click();
			sap.ui.core.BusyIndicator.hide();
		},

		onLoadTable: function (tablenName, isCSVLoad) {

			// Progress indicator is shown
			sap.ui.core.BusyIndicator.show(0);

			var that = this;
			var TableURL = "/service/ERPIBERIA_ADN/tables/tablesForDep.xsjs";
			var oDatiModel = this.getView().getModel("dep_d").getData().length;
			var oModel = new sap.ui.model.json.JSONModel();

			// Async flow is restored
			errorIsReleased = false;
			currentCycle = 0;
			missingTables = 0;

			// Start Insert Angelo
			var oListTable;
			// End Insert Angelo

			if (oDatiModel >= 1) {
				var tableName = this.getView().getModel("dep_d").getData()[0].ORI_TABLE;
				jQuery.ajax({
					url: TableURL,
					async: false,
					data: {
						table: tableName
					},
					method: "GET",
					dataType: "text",
					success: function (results) {
						oListTable = JSON.parse(results);

						// No additional table needs to be loaded
						if (oListTable.length === 0) {
							// CheckDep is executed
							that.executeCheckDep(tableName, oListTable, isCSVLoad);
						} else {

							oModel.setData(oListTable);
							sap.ui.getCore().setModel(oModel, "loadTempTable");

							currentNumTables = oListTable.length;

							for (var y = 0; y < oListTable.length; y++) {

								// The missing tables are loaded to HANA DB in order to execute the various checks.
								// This operation is executed asyncronously
								that.updateTempTable(oListTable[y], isCSVLoad);
							}
						}
					}
				});
			} else {
				// This code is used to clean the table that contains the table that will be added on the fly
				oListTable = [];

				oModel = sap.ui.getCore().getModel("loadTempTable");
				if (oModel !== undefined) {
					oModel.setData(oListTable);
				}

				// CheckDep is executed
				that.executeCheckDep(tableName, oListTable, isCSVLoad);
			}
		},

		updateTempTable: function (oListTable, isCSVLoad) {

			var that = this;
			// Service Address
			var urlEcc = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
			var oModelEcc = new sap.ui.model.odata.v2.ODataModel(urlEcc);

			// Structure of table is taken from ECC, this logic used to optimize loading of temporary tables
			var structureFields = [];
			var rowFields = [];

			structureFields.push({
				Structures: "MANDT"
			});

			var oDataDep = this.getView().getModel("dep_d").getData();

			// Cycle for dependencies
			for (var j = 0; j < oDataDep.length; j++) {

				if (j === 0) {
					var tableName = oDataDep[j].ORI_TABLE;
				}

				if (oDataDep[j].DEST_TABLE === oListTable) {

					structureFields.push({
						Structures: oDataDep[j].DEST_FIELD
					});
				}
			}

			var entityEcc = {
				"d": {
					Nametable: oListTable,
					ToStructures: structureFields
				}
			};

			oModelEcc.create("/tablesSet", entityEcc, {
				success: function (OData) {

					// Other tables have been loaded correctly
					if (currentCycle !== -1) {

						// XSJS service is called to create the tables
						var createTableURL = "/service/ERPIBERIA_ADN/tables/createNewTable.xsjs";

						jQuery.ajax({
							url: createTableURL,
							data: {
								table: oListTable,
								columns: OData.ToStructures.results[0].Structures,
								newImport: true
							},
							method: "POST",
							dataType: "text",
							success: function (results) {
								if (results === "OK") {
									// Column names
									var col = that.getColumn(oListTable);

									// Using the columns directly from the structure is useful to set every column in the right order 
									for (var k = 0; k < col.length; k++) {
										rowFields.push({
											Rows: col[k].COLUMN_NAME
										});
									}

									entityEcc = {
										"d": {
											Nametable: oListTable,
											ToRows: rowFields
										}
									};

									oModelEcc.create("/tablesSet", entityEcc, {
										success: function (oData) {

											currentCycle++;

											var rowsNumber;

											if (oData.ToRows === null) {
												rowsNumber = 0;
											} else {
												rowsNumber = oData.ToRows.results.length;
											}

											// Case of no data existing on ECC
											if (rowsNumber === 0) {

												// Loading has been executed for the current table
												missingTables++;

												if (currentCycle !== missingTables) {
													// The number of tables does not match, so the flow is interrupted 
													currentCycle = -1;
													that.onDelTable();
												}

												if (currentCycle === missingTables && missingTables === currentNumTables) {
													// checkDep is called
													that.executeCheckDep(tableName, oListTable, isCSVLoad);
												}

											} else {

												// Data from ECC has been taken correctly
												var arrayECC = [];

												for (var i = 0; i < oData.ToRows.results.length; i++) {
													arrayECC.push(oData.ToRows.results[i].Rows);
												}
												// The data retrieved from ECC is converted to a String, in order to be passed at the HANA XS service
												arrayECC = JSON.stringify(arrayECC);

												// The new procedure is called
												var urlUploadDirect = "/service/ERPIBERIA_ADN/table_content/uploadFromEccDirect.xsjs";

												// Current date is taken from object D   
												var newDay = new Date();
												var today = newDay.toJSON();

												var allField = "(";
												for (i = 0; i < col.length; i++) {
													var column = col[i].COLUMN_NAME;
													allField = allField + column + ",";
												}
												allField = allField + "VALID_TO,VALID_FROM)";

												// Upload from ECC direct
												jQuery.ajax({
													url: urlUploadDirect,
													async: false,
													data: {
														table: oListTable,
														rows: arrayECC,
														today: today,
														allField: allField
													},
													method: "POST",
													dataType: "text",
													success: function () {
														// The table has been loaded correctly
														missingTables++;

														if (currentCycle !== missingTables) {
															// The number of tables does not match, so the flow is interrupted 
															currentCycle = -1;
															that.onDelTable();
														}

														if (currentCycle === missingTables && missingTables === currentNumTables) {
															// checkDep is called
															that.executeCheckDep(tableName, oListTable, isCSVLoad);
														}
													},
													error: function () {
														that.onDelTable();
														// Loading indicator is removed
														sap.ui.core.BusyIndicator.hide();

														// The error message is shown only one time
														if (errorIsReleased === false) {

															sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messErrECCPost"), {
																icon: sap.m.MessageBox.Icon.ERROR
															});

															errorIsReleased = true;
														}

														currentCycle = -1;
													}
												});
											}
										},
										error: function () {
											that.onDelTable();
											// Progress indicator is removed
											sap.ui.core.BusyIndicator.hide();
											currentCycle = -1;
										}
									});
								} else {
									that.onDelTable();
									// Progress indicator is removed
									sap.ui.core.BusyIndicator.hide();
									currentCycle = -1;
								}
							},
							error: function () {
								that.onDelTable();
								// Progress indicator is removed
								sap.ui.core.BusyIndicator.hide();
								currentCycle = -1;
							}
						});
					} else {
						that.onDelTable();

						// Progress indicator is removed
						sap.ui.core.BusyIndicator.hide();

						// The error message is shown only one time
						if (errorIsReleased === false) {

							sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messErrECCPost"), {
								icon: sap.m.MessageBox.Icon.ERROR
							});

							errorIsReleased = true;
						}

					}
				},
				error: function (response) {
					that.onDelTable();
					// Progress indicator is removed
					sap.ui.core.BusyIndicator.hide();
					currentCycle = -1;
				}
			});
		},

		onDelTable: function () {
			if (sap.ui.getCore().getModel("loadTempTable")) {
				var oModel = sap.ui.getCore().getModel("loadTempTable").getData();

				// Start Insert Angelo
				if (oModel.length !== 0) {

					var oListTable = JSON.stringify(oModel);
					// End Insert Angelo

					var deleteTableURL = "/service/ERPIBERIA_ADN/tables/tablesDelete.xsjs";

					jQuery.ajax({
						url: deleteTableURL,
						async: true,
						data: {
							tables: oListTable,
							genNum: 0
						},
						method: "POST",
						dataType: "text",
						success: function (results) {
							sap.ui.getCore().getModel("loadTempTable").setData();
						},
						error: function () {
							sap.ui.core.BusyIndicator.hide();
							sap.ui.getCore().getModel("loadTempTable").setData();
						}
					});
					// Start Insert Angelo
				}
				// End Insert Angelo
			}
		},

		_selectVersionDialog: function (redirect, vers) {

			var minorVersion = this._newMinorVers(vers);
			var majorVersion = this._newMajorVers(vers);

			var minorLabel = this.getView().getModel("i18n").getResourceBundle().getText("sMinorVersion", minorVersion);
			var majorLabel = this.getView().getModel("i18n").getResourceBundle().getText("sMajorVersion", majorVersion);

			var that = this;
			method = redirect;

			// Global parameters are set
			// currVers = vers;

			var oDialog = new sap.m.Dialog("dialogVerProg", {
				title: "{i18n>sTitleVerDialog}",
				type: "Message",
				contentWidth: "500px",
				icon: "sap-icon://multiselect-all",
				content: new sap.m.Text({
					text: "{i18n>sDialogVerText}"
				}),
				buttons: [
					new sap.m.Button("", {
						// text: "{i18n>sMinorVersion}",
						text: minorLabel,
						// press: that._onPressVerChoose
						press: function () {
							switch (method) {
							case "ECC":
								// Start Insert Angelo
								that.notifyDep(minorVersion, "ECC", oDialog);
								// End Insert Angelo

								// Start Delete Angelo
								// that.onUploadECCAfter(minorVersion);
								// oDialog.close();
								// oDialog.destroy();
								// End Delete Angelo
								break;
							case "CSV":
								// Start Insert Angelo
								that.notifyDep(minorVersion, "CSV", oDialog);
								// End Insert Angelo

								// Start Delete Angelo
								// that.onUploadCSVAfter(minorVersion);
								// oDialog.close();
								// oDialog.destroy();
								// End Delete Angelo
								break;

								// Start Insert Angelo
							case "IMPORT":
								oDialog.close();
								oDialog.destroy();
								that.onFinishImport(minorVersion);
								break;
								// End Insert Angelo

								// Start Insert Angelo
							case "TEST":
								oDialog.close();
								oDialog.destroy();
								that.onFinishImportTest(minorVersion, vers);
								// End Insert Angelo
								// End Insert Angelo
							}
						}
					}),
					new sap.m.Button("", {
						// text: "{i18n>sMajorVersion}",
						text: majorLabel,
						// press: that._onPressVerChoose
						press: function () {
							switch (method) {
							case "ECC":
								// Start Insert Angelo
								that.notifyDep(majorVersion, "ECC", oDialog);
								// End Insert Angelo

								// Start Delete Angelo
								// that.onUploadECCAfter(majorVersion);
								// oDialog.close();
								// oDialog.destroy();
								// End Delete Angelo
								break;
							case "CSV":
								// Start Insert Angelo
								that.notifyDep(majorVersion, "CSV", oDialog);
								// End Insert Angelo

								// Start Delete Angelo
								// that.onUploadCSVAfter(majorVersion);
								// oDialog.close();
								// oDialog.destroy();
								// End Delete Angelo
								break;

								// Start Insert Angelo
							case "IMPORT":
								oDialog.close();
								oDialog.destroy();
								that.onFinishImport(majorVersion);
								break;
								// End Insert Angelo

								// Start Insert Angelo
							case "TEST":
								oDialog.close();
								oDialog.destroy();
								that.onFinishImportTest(majorVersion, vers);
								// End Insert Angelo
							}
						}
					})
				]
			});

			this.getView().addDependent(oDialog);
			oDialog.open();
		},

		notifyDep: function (version, curMethod, oDialog) {

			// Start Delete Angelo
			// var that = this;

			// var aTables = sap.ui.getCore().getModel("depTables").getData();

			// if (aTables.tables.length > 0 && aTables.tables[0] !== []) {

			// 	var alertText = this.getView().getModel("i18n").getResourceBundle().getText("alertNotify");

			// 	sap.m.MessageBox.confirm(alertText, {
			// 		// icon: sap.m.MessageBox.Icon.Warning,
			// 		onClose: function (oAction) {
			// 			if (oAction === "OK") {
			// 				// User is retrieved from login screen 
			// 				var user = that.getOwnerComponent().getModel("user").getData().user;

			// 				// Table is retrieved from the dependencies table
			// 				var table = sap.ui.getCore().getModel("model_Dep")[0].ORI_TABLE;

			// 				// var mailText = this.getView().getModel("i18n").getResourceBundle().getText("mailText", table);
			// 				var mailSubjcet = that.getView().getModel("i18n").getResourceBundle().getText("messSubject", table);

			// 				var family = that.getOwnerComponent().getModel("tables").getData().filter(function (value) {
			// 					return value.TABLENAME === table;
			// 				});

			// 				if (family.GROUPID === undefined) {
			// 					family.GROUPID = "(No Family)";
			// 				}

			// 				var arrayReplace = [];
			// 				arrayReplace.push(version);
			// 				arrayReplace.push(table);
			// 				arrayReplace.push(family.GROUPID);

			// 				var jurl = "/service/ERPIBERIA_ADN/table_content/newSendMail.xsjs";
			// 				jQuery.ajax({
			// 					url: jurl,
			// 					async: true,
			// 					data: {
			// 						depData: JSON.stringify(aTables.tables),
			// 						mailText1: that.getView().getModel("i18n").getResourceBundle().getText("spanishMail1", arrayReplace),
			// 						mailText2: that.getView().getModel("i18n").getResourceBundle().getText("spanishMail2"),
			// 						mailText3: that.getView().getModel("i18n").getResourceBundle().getText("spanishMail3"),
			// 						mailTextDyn: that.getView().getModel("i18n").getResourceBundle().getText("spanishMailDyn"),
			// 						mailTextEnd: that.getView().getModel("i18n").getResourceBundle().getText("spanishMailEnd"),
			// 						subject: mailSubjcet,
			// 						user: user
			// 					},
			// 					method: "POST",
			// 					dataType: "text",
			// 					success: function (results) {

			// 						var finalResult = JSON.parse(results);

			// 						for (var i = 0; i < finalResult.length; i++) {

			// 							Email.send({
			// 								SecureToken: '1748a0ce-1d9a-4d81-a868-403c53f8fc74',
			// 								To: finalResult[i].to,
			// 								From: "eneladn@hotmail.com",
			// 								Subject: finalResult[i].subject,
			// 								Body: finalResult[i].body
			// 							});

			// 						}
			// 					}
			// 				});

			// 				if (curMethod === "ECC") {
			// 					that.onUploadECCAfter(version);
			// 				} else {
			// 					that.onUploadCSVAfter(version);
			// 				}

			// 				oDialog.close();
			// 				oDialog.destroy();
			// 			} else {
			// 				// No mail will be sent
			// 				if (curMethod === "ECC") {
			// 					that.onUploadECCAfter(version);
			// 				} else {
			// 					that.onUploadCSVAfter(version);
			// 				}

			// 				oDialog.close();
			// 				oDialog.destroy();
			// 			}
			// 		}
			// 	});
			// } else {
			// End Delete Angelo
			// There are no dependencies, but the version should be created
			if (curMethod === "ECC") {
				this.onUploadECCAfter(version);
			} else {
				this.onUploadCSVAfter(version);
			}

			oDialog.close();
			oDialog.destroy();
			// Start Delete Angelo
			// }
			// End Delete Angelo
		},

		_newMajorVers: function (currVers) {
			var newVersione;
			if (currVers !== "0") {
				var add = parseFloat("1.0");
				var verOld = parseFloat(currVers);
				newVersione = Math.floor(verOld + add).toFixed(1);
			} else {
				newVersione = "1.0";
			}

			return newVersione;
		},

		_newMinorVers: function (currVers) {
			var newVersione;
			if (currVers !== "0") {
				var add = parseFloat("0.1");
				var verOld = parseFloat(currVers);
				newVersione = (verOld + add).toFixed(1);
			} else {
				newVersione = "1.0";
			}

			return newVersione;
		},

		getColumn: function (tablename) {
			var results;
			var jurl = "/service/ERPIBERIA_ADN/table_content/getFields.xsjs";
			jQuery.ajax({
				url: jurl,
				async: false,
				data: {
					table: tablename
				},
				method: "GET",
				dataType: "text",
				success: function (response) {
					results = response;
				},
				error: function (xhr) {
					results = "ERROR";
				}
			});
			results = JSON.parse(results);
			if (results !== "ERROR") {
				return results;
			}
		},

		_filterSAP: function (array) {
			return array.SAP === "X";
		},

		createDBEcc: function (entitySet, asyncr, methodECC, newRow) {
			var results;
			// Service Address
			var serviceURL = "/service/ERPIBERIA_ADN/" + methodECC;
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
		},

		// Function that creates a new row for the "VERSIONS" table
		createNewRowVers: function (tablename, system, version, date, user, source, rowsNumber, sap, structVersion) {

			if (sap === "X") {
				var sapdate = date;
			}

			// Start Insert Angelo
			if (structVersion === undefined) {
				var sServiceVersion = "/service/ERPIBERIA_ADN/versions/getStructVersion.xsjs";

				jQuery.ajax({
					url: sServiceVersion,
					async: false,
					data: {
						tableName: tablename
					},
					method: "GET",
					dataType: "text",
					success: function (response) {
						structVersion = (JSON.parse(response)).STRUCTVERSION;
					}
				});
			}
			// End Insert Angelo

			// Number of rows is always converted to number
			rowsNumber = parseInt(rowsNumber, 10);

			var item = {
				TABLENAME: tablename,
				SYSTEMNAME: system,
				VERSION: version,
				DATE: date,
				CREATE_USER: user,
				SOURCE: source,
				RECORDS: JSON.stringify(rowsNumber),
				SAP: sap,
				SAPDATE: sapdate,
				STRUCTVERSION: structVersion
			};
			return item;
		},

		// Unused code
		_onRefreshPage: function (rowData) {
			var currentItem = this.getView().byId("tables_id").getSelectedItem();
			this.getView().byId("tables_id").setSelectedItem(currentItem, true, true);
		},

		// Start Insert Angelo
		setTablesData: function (JSONData) {

			var currentTable;
			var currentCombo;
			var checkColumn;

			var rowData = JSON.parse(JSONData);

			// List of the tables that will be shown at the user
			var aTables = sap.ui.getCore().getModel("depTables").getData();

			// Main array is cleared
			aTables.tables = [];

			// Current dependencies list
			// There is no need to get the data, because the model is already the data itself
			var aDepData = sap.ui.getCore().getModel("model_Dep");

			var noCollector = this.getView().getModel("i18n").getResourceBundle().getText("noCollector");
			var title;

			// Start Insert Angelo
			// This code is used to extract different values from the same origin fields
			var currentAs = 0;

			for (var n = 0; n < aDepData.length; n++) {

				if (aDepData[n].AS === undefined && aDepData[n].COLLECTOR === noCollector) {

					for (var m = 0; m < aDepData.length; m++) {

						if (n === m) {
							// It's the same field, there's no need to check
							continue;
						}

						if (aDepData[m].ORI_FIELD === aDepData[n].ORI_FIELD && aDepData[m].COLLECTOR === noCollector) {
							aDepData[m].AS = currentAs;
							aDepData[m].ORI_FIELD = aDepData[m].ORI_FIELD + "_DUP" + currentAs;
							currentAs++;
						}
					}
				}
			}
			// End Insert Angelo

			for (var j = 0; j < rowData.length; j++) {

				currentCombo = noCollector;
				currentTable = -1;

				for (var i = 0; i < aDepData.length; i++) {

					if (currentCombo === aDepData[i].COLLECTOR && aDepData[i].COLLECTOR !== noCollector) {
						// Rows must not be reinserted
						checkColumn = aTables.tables[currentTable].columns.filter(function (value) {
							return value === aDepData[i].ORI_FIELD + " (" + aDepData[i].DEST_FIELD + ")";
						});

						if (checkColumn.length === 0) {
							aTables.tables[currentTable].columns.push(aDepData[i].ORI_FIELD + " (" + aDepData[i].DEST_FIELD + ")");
						}

					} else {
						currentCombo = aDepData[i].COLLECTOR;
						currentTable++;

						// A new record is inserted into the array, this is valid only for the first row of the dep. check
						if (j === 0) {
							aTables.tables.push({
								title: "",
								rows: [],
								columns: []
							});

							// The title is set when a combination is 'NO' or a new combinated one is processed
							if (aDepData[i].COLLECTOR === noCollector) {
								title = this.getView().getModel("i18n").getResourceBundle().getText("singleDepTitle", aDepData[i].DEST_TABLE);
							} else {
								title = this.getView().getModel("i18n").getResourceBundle().getText("multiDepTitle", aDepData[i].DEST_TABLE);
							}
							aTables.tables[currentTable].title = title;
						}

						// We need to check if the current dependency has not been respected
						if (rowData[j][aDepData[i].ORI_FIELD + "_" + aDepData[i].COLLECTOR] === null) {

							// Start Insert Angelo
							// The name of the field must be restored to it's original value
							if (currentCombo === noCollector) {
								var correctName = aDepData[i].ORI_FIELD.split("_");
								try {
									if (correctName.length > 1 && correctName[correctName.length - 1].match(/DUP/g).length > 0) {
										aDepData[i].ORI_FIELD = "";
										for (var k = 0; k <= correctName.length - 2; k++) {
											aDepData[i].ORI_FIELD = aDepData[i].ORI_FIELD + correctName[k];
										}
									}
								} catch (e) {}
							}

							// Columns already existing are not inserted anymore
							checkColumn = aTables.tables[currentTable].columns.filter(function (value) {
								return value === aDepData[i].ORI_FIELD + " (" + aDepData[i].DEST_FIELD + ")";
							});

							// Current column does not exist on the table
							if (checkColumn.length === 0) {
								aTables.tables[currentTable].columns.push(aDepData[i].ORI_FIELD + " (" + aDepData[i].DEST_FIELD + ")");
							}
							// Old Code
							// aTables.tables[currentTable].rows.push(rowData[j]);

							// New Code to prevent duplicates on single dependencies
							if (aDepData[i].COLLECTOR !== noCollector) {
								aTables.tables[currentTable].rows.push(rowData[j]);
							} else {
								var rowExists = aTables.tables[currentTable].rows.filter(function (row) {
									return row[aDepData[i].ORI_FIELD] === rowData[j][aDepData[i].ORI_FIELD];
								});

								// No rows exists with the same value
								if (rowExists.length === 0) {
									aTables.tables[currentTable].rows.push(rowData[j]);
								}
							}
						}
					}
				}
			}
		},

		getContainerDynTables: function (tab) {

			var aTables = sap.ui.getCore().getModel("depTables").getData();
			var maxRows;

			// The VBox is used to contain every table generated from the loop. This method allows to generate multiple tables inside
			// a function by only passing a single container
			var oVBox = new sap.m.VBox("idVBox", {
				width: "80%"
			});

			// Start Insert Angelo
			// Name of the current table processed
			var boxTitle = new sap.m.Text("idText", {
				text: "Table " + tab
			});
			boxTitle.addStyleClass("myclass_dep");
			oVBox.addItem(boxTitle);
			// End Insert Angelo

			for (var i = 0; i < aTables.tables.length; i++) {

				// If the current dependencies rows are empty, the logic goes to the next iteration
				if (aTables.tables[i].rows.length === 0) {
					continue;
				}

				// Start Insert Angelo
				if (aTables.tables[i].rows.length > 5) {
					maxRows = 5;
				} else {
					maxRows = aTables.tables[i].rows.length;
				}
				// End Insert Angelo

				var oTable = new sap.ui.table.Table("dynTab" + i, {
					selectionMode: "None",
					// Start Delete Angelo
					// visibleRowCount: aTables.tables[i].rows.length,
					// End Delete Angelo
					// Start Insert Angelo
					visibleRowCount: maxRows,
					// End Insert Angelo
					visibleRowCountMode: sap.ui.table.VisibleRowCountMode.Fixed
				});

				oTable.setTitle(aTables.tables[i].title);
				oTable.addStyleClass("sapUiSmallMarginBottom");

				var oModelTable = new sap.ui.model.json.JSONModel();

				oModelTable.setData({
					rows: aTables.tables[i].rows,
					columns: aTables.tables[i].columns
				});

				oTable.setModel(oModelTable);

				oTable.bindColumns("/columns", function (sId, oContext) {
					var columnName = oContext.getObject();
					var columnSplit = columnName.split(" (");
					return new sap.ui.table.Column({
						label: columnName,
						template: new sap.ui.commons.TextView().bindProperty("text", {
							parts: [{
								path: columnSplit[0]
							}]
						})
					});
				});
				oTable.bindRows("/rows");

				oVBox.addItem(oTable);
			}

			return oVBox;
		},

		executeCheckDep: function (table, oListTable, isCSVLoad) {
			var jurl = "/service/ERPIBERIA_ADN/table_content/checkDep.xsjs";
			var that = this;

			// Start Delete Angelo
			// var oGenNumb = parseInt(Math.random() * 1000, 10);
			// End Delete Angelo

			var rowData;

			// Start Insert Angelo
			if (isCSVLoad !== "X") {
				isCSVLoad = "N";
			}
			// End Insert Angelo

			jQuery.ajax({
				url: jurl,
				async: false,
				data: {
					table: table,
					noDBTables: oListTable,
					// Start Delete Angelo
					// genNum: oGenNumb
					// End Delete Angelo
					// Start Insert Angelo
					genNum: 0,
					// End Insert Angelo
					// Start Insert Angelo
					isCSVLoad: isCSVLoad
						// End Insert Angelo
				},
				method: "GET",
				dataType: "text",

				success: function (response) {

					rowData = response;

					if (rowData !== "[]") {
						that.setTablesData(rowData);
					}

					// Temporary tables are deleted
					if (oListTable.length !== 0) {
						that.onDelTable();
					}

					if (isCSVLoad === "X") {
						that.onUpload();
					} else {
						that.toCompare();
					}

					// Start Delete Angelo
					// that.onPressBack();
					// var text = that.getView().getModel("i18n").getResourceBundle().getText("s_noerrdep");
					// sap.m.MessageBox.success(text, {
					// icon: sap.m.MessageBox.Icon.SUCCESS
					// });
					// End Delete Angelo
				}
			});
		},

		getAllFamilies: function () {
			var aComboData = {
				comboData: []
			};

			var tables = this.getOwnerComponent().getModel("tables").getData();

			for (var j = 0; j < tables.length; j++) {

				if (tables[j].GROUPID !== null) {

					var checkDuplicates = aComboData.comboData.filter(function (value) {
						return value.family === tables[j].GROUPID;
					});

					// The new family can be appended
					if (checkDuplicates.length === 0) {
						aComboData.comboData.push({
							family: tables[j].GROUPID
						});
					}
				}
			}

			aComboData.comboData.push({
				family: "All"
			});

			// Combo model is global
			var comboModel = new sap.ui.model.json.JSONModel(aComboData);
			this.getOwnerComponent().setModel(comboModel, "combo");
		},

		// Start Insert Angelo
		lockManagement: function (oEvent) {
			// This id contains useless informations about the current view
			var sInvalidId = oEvent.getSource().getId();

			var aId = sInvalidId.split('-');
			var vCurrentId = aId[aId.length - 1];

			if (vCurrentId === "b_comp") {
				var sMethod = "COMPARE";
			} else {
				sMethod = "CSV";
			}

			// Start Delete Angelo
			// var vUser = this.getOwnerComponent().getModel("user").getData().user;
			// End Delete Angelo
			// Start Insert Angelo
			var vUser = this.getUserName();
			// End Insert Angelo

			var vTableName = this.getView().getModel("detail_tbl").getData().TABLENAME;

			this.checkLock(vTableName, vUser, sMethod);
		},

		checkLock: function (vTableName, vUser, sMethod) {

			var that = this;

			var sURL = "/service/ERPIBERIA_ADN/tables/getLock.xsodata";

			// Model creation
			var oModel = new sap.ui.model.odata.v2.ODataModel(sURL);

			// Filters creation
			var aFilters = [];
			aFilters.push(new Filter({
				path: 'TABLENAME',
				operator: FilterOperator.EQ,
				value1: vTableName
			}));

			var sEntity = "/lock";

			// Model read from SAP
			oModel.read(sEntity, {
				filters: aFilters,
				success: function (result) {
					if (result.results.length === 0) {
						that.insertLock(vTableName, vUser, sMethod);
					} else {
						that.checkDate(result, sMethod);
					}
				}
			});
		},

		insertLock: function (vTableName, vUser, sMethod) {

			var that = this;

			var aLock = {
				TABLENAME: vTableName,
				LOCKED: "X",
				USER: vUser,
				DATE: new Date()
			};

			var sURL = "/service/ERPIBERIA_ADN/tables/getLock.xsodata";

			// Model creation
			var oModel = new sap.ui.model.odata.v2.ODataModel(sURL);

			var sEntity = "/lock";

			// Model read from SAP
			oModel.create(sEntity, aLock, {
				success: function (result) {
					// Lock has been inserted and the user can proceed
					if (sMethod === "COMPARE") {
						that.loadGlobalDependencies(sMethod);
					} else {
						that.onOpenDialogUpl();
					}
				}
			});
		},

		checkDate: function (aCurrentRecord, sMethod) {

			var vCurrentDate = new Date();

			var vCurrentLock = aCurrentRecord.results[0].DATE;

			if (((vCurrentDate - vCurrentLock) / 1000 / 60) <= 30) {
				// Lock is still valid
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("lockError"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
			} else {
				// Lock is not valid anymore, so it's updated
				this.updateLock(aCurrentRecord.results[0].TABLENAME, aCurrentRecord.results[0].USER, sMethod);
			}
		},

		updateLock: function (vTableName, vUser, sMethod) {

			var that = this;

			var sURL = "/service/ERPIBERIA_ADN/tables/getLock.xsodata";

			// Model creation
			var oModel = new sap.ui.model.odata.v2.ODataModel(sURL);

			var sEntity = "/lock('" + vTableName + "')";

			// Model read from SAP
			oModel.remove(sEntity, {
				success: function (result) {
					// A new record is inserted on the table
					that.insertLock(vTableName, vUser, sMethod);
				}
			});
		},

		removeLock: function (vTableName) {

			var sURL = "/service/ERPIBERIA_ADN/tables/getLock.xsodata";

			// Model creation
			var oModel = new sap.ui.model.odata.v2.ODataModel(sURL);

			var sEntity = "/lock('" + vTableName + "')";

			// Model read from SAP
			oModel.remove(sEntity, {
				success: function (result) {}
			});
		},

		// This function returns an old table if exists
		determineOldTable: function (vTable, vVersion) {

			var that = this;

			var oldTable;

			// This code is used to retrieve the data from older structure versions
			var sServiceVersion = "/service/ERPIBERIA_ADN/versions/getStructVersion.xsjs";

			jQuery.ajax({
				url: sServiceVersion,
				async: false,
				data: {
					tableName: vTable
				},
				method: "GET",
				dataType: "text",
				success: function (response) {
					var aVersionData = that.getView().getModel("ver_d").getData();
					var aStructVersion = aVersionData.filter(function (value) {
						return value.VERSION === vVersion;
					});

					if (aStructVersion[0].STRUCTVERSION === null) {
						aStructVersion[0].STRUCTVERSION = 0;
					}

					var lastStructure;

					if ((JSON.parse(response)).STRUCTVERSION === null) {
						lastStructure = 0;
					} else {
						lastStructure = (JSON.parse(response)).STRUCTVERSION;
					}

					if (aStructVersion[0].STRUCTVERSION !== lastStructure) {
						var vStructure = aStructVersion[0].STRUCTVERSION + 1;
						oldTable = "OLD_" + vTable + "_" + vStructure;
					}
				}
			});

			// Value calculated is returned
			return oldTable;
		},

		getColumnsForDetail: function (vTable) {

			var columnData;

			var jurl2 = "/service/ERPIBERIA_ADN/table_content/getcolumns.xsjs";
			jQuery.ajax({
				url: jurl2,
				async: false,
				data: {
					table: vTable
				},
				method: "GET",
				dataType: "text",
				success: function (response) {
					columnData = response;
				},
				error: function (response) {
					columnData = "ERROR2";
				}
			});

			return columnData;
		},

		// Service that returns the number of the records for the last version table
		getNumRecords: function (table) {
			var recordsURL = "/service/ERPIBERIA_ADN/table_content/getNumRecords.xsjs";
			var num;
			jQuery.ajax({
				url: recordsURL,
				async: false,
				data: {
					table: table
				},
				method: "POST",
				dataType: "text",
				success: function (result) {
					num = result;
				},
				error: function (result) {
					return "ERROR";
				}
			});

			if (num !== "ERROR") {
				num = JSON.parse(num);
				return num[0].COUNT;
			}
		},
		// End Insert Angelo
	});
});