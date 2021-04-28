sap.ui.define([
	"ManageTechTables/ManageTechTables/controller/BaseController",
	"ManageTechTables/ManageTechTables/model/formatter",
	"sap/m/MessageToast"
], function (BaseController, formatter, MessageToast) {
	"use strict";
	var tempOK;
	var uid, role, table, version;
	var oGenNumb;
	var oListTable = [];

	// Start Insert Angelo
	// The following variables are used to determine if every missing table has been loaded correctly
	var currentCycle; //Current cycle executed
	var missingTables; //Number of missing tables elaborated
	var currentNumTables; //Maximum number of tables (case of success: currentNumTables === missingTables)

	var errorIsReleased;
	// End Insert Angelo

	return BaseController.extend("ManageTechTables.ManageTechTables.controller.Analysis", {
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("analysis").attachPatternMatched(this._attachPatternMatched, this);
		},

		onDownCSVAnalysis: function () {
			var oTable = sap.ui.getCore().getModel("depTables").getData().tables;
			var oName = this.getView().getModel("dep_d").getData()[0].ORI_TABLE + "_ANALYSIS_";
			var oContent = "";
			var oExtFile = ".csv";

			var oRow;

			//Loop to get the title and the name of the table columns
			for (var i = 0; i < oTable.length; i++) {

				if (i === 0) {
					oContent = oContent + oTable[i].title + "\r\n";
				} else {
					oContent = oContent + "\r\n" + oTable[i].title + "\r\n";
				}
				var oColumn = oTable[i].columns.toString().replace(/,/g, ";");

				// Title of the table
				oContent = oContent + oColumn + "\r\n";

				//Loop to get rows of the table
				for (var j = 0; j < oTable[i].rows.length; j++) {

					//Loop to get the number of table columns.
					for (var y = 0; y < oTable[i].columns.length; y++) {

						var oNameColumn = oTable[i].columns[y].split(" (")[0];
						if (y !== oTable[i].columns.length - 1) {
							oRow = oTable[i].rows[j][oNameColumn] + ";";
						} else {
							oRow = oTable[i].rows[j][oNameColumn];
						}
						oContent = oContent + oRow;
					}
					oContent = oContent + "\r\n";
				}
			}
			this.onDownloadErrorLog(oName, oContent, oExtFile);
		},

		onLoadTableA: function () {
			sap.ui.core.BusyIndicator.show(0);

			var that = this;
			var TableURL = "/service/ERPIBERIA_ADN/tables/tablesForDep.xsjs";
			var oDatiModel = this.getView().getModel("dep_d").getData().length;
			var oModel = new sap.ui.model.json.JSONModel();

			// Async flow is restored
			errorIsReleased = false;
			currentCycle = 0;
			missingTables = 0;

			if (oDatiModel >= 1) {
				var tableName = this.getView().getModel("dep_d").getData()[0].ORI_TABLE;

				jQuery.ajax({
					url: TableURL,
					async: true,
					data: {
						table: tableName
					},
					method: "GET",
					dataType: "text",
					success: function (results) {
						oListTable = JSON.parse(results);

						// The LoadTable code is executed only when there are tables that need to be effectively loaded
						if (oListTable.length !== 0) {

							// If a single table is missing, a random number is generated in order to prevent more users to conflict
							oGenNumb = parseInt(Math.random() * 1000, 10);

							oModel.setData(oListTable);
							sap.ui.getCore().setModel(oModel, "loadTempTable");

							currentNumTables = oListTable.length;

							for (var y = 0; y < oListTable.length; y++) {
								// The missing tables are loaded to HANA DB in order to execute the various checks.
								// This operation is executed asyncronously
								that.updateTempTableA(oListTable[y]);
							}
						} else {
							oGenNumb = 0;

							// This code is used to clean the table that contains the table that will be added on the fly
							oListTable = [];

							oModel = sap.ui.getCore().getModel("loadTempTable");
							if (oModel !== undefined) {
								oModel.setData(oListTable);
							}

							// CheckDep is executed
							that.onCheck();
						}
					},
					error: function () {
						// Progress indicator is removed
						sap.ui.core.BusyIndicator.hide();
						that.onCancel();
					}
				});
			}
		},

		onCheck: function () {
			var jurl = "/service/ERPIBERIA_ADN/table_content/checkDep.xsjs";
			var that = this,
				result;

			var rowData;

			jQuery.ajax({
				url: jurl,
				async: false,
				data: {
					table: table,
					noDBTables: oListTable,
					genNum: oGenNumb
				},
				method: "GET",
				dataType: "text",

				success: function (response) {

					// Delete process is executed only when there are tables to be deleted
					if (oListTable.length !== 0) {
						that.onDelTableA();
					}

					rowData = response;

					if (rowData === "[]") {

						that.onPressBack();
						var text = that.getView().getModel("i18n").getResourceBundle().getText("s_noerrdep");
						sap.m.MessageBox.success(text, {
							icon: sap.m.MessageBox.Icon.SUCCESS
						});
					} else {

						// Start Insert Angelo
						that.setTablesData(rowData);

						// If the container is found inside the view, it's desotryed in order to show the new one
						var oVBox = sap.ui.getCore().byId("idVBox");
						if (oVBox !== undefined) {
							oVBox.destroy();
						}

						var oContainer = that.getContainerDynTables(table);

						// Current page on the view is taken directly from XML
						var oPage = that.getView().byId("idPage");

						oPage.addContent(oContainer);

						sap.ui.core.BusyIndicator.hide();

						// Start Delete Angelo
						// that.onSetTable(rowData);
						// that.getView().byId("table_analysis").setVisible(true);
						// End Delete Angelo
					}
				},
				error: function (response) {
					result = "ERROR2";
					sap.ui.core.BusyIndicator.hide();

					that.onDelTableA();

				},

				/*	beforeSend: function () {
						t.getView().byId("table_analysis").setBusyIndicatorDelay(0);
						t.getView().byId("table_analysis").setBusy(true);
					},*/

				complete: function () {
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		onDelTableA: function () {
			var that = this;
			if (sap.ui.getCore().getModel("loadTempTable")) {
				var oModel = sap.ui.getCore().getModel("loadTempTable").getData();
				var oListTable = JSON.stringify(oModel);
				var deleteTableURL = "/service/ERPIBERIA_ADN/tables/tablesDelete.xsjs";

				jQuery.ajax({
					url: deleteTableURL,
					async: false,
					data: {
						tables: oListTable,
						genNum: oGenNumb
					},
					method: "POST",
					dataType: "text",
					success: function (results) {
						sap.ui.getCore().getModel("loadTempTable").setData();
					},
					error: function () {
						sap.ui.core.BusyIndicator.hide();
						sap.ui.getCore().getModel("loadTempTable").setData();
						that.onCancel();
					}
				});
			}
		},

		updateTempTableA: function (oListTable) {
			var that = this;
			// Service Address
			var urlEcc = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
			var oModelEcc = new sap.ui.model.odata.v2.ODataModel(urlEcc);

			// Structure of table is taken from ECC, this logic is used to optimize loading of temporary tables
			var structureFields = [];
			var rowFields = [];

			structureFields.push({
				Structures: "MANDT"
			});

			var oDataDep = this.getView().getModel("dep_d").getData();

			// Cycle for dependencies
			for (var j = 0; j < oDataDep.length; j++) {
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
							async: false,
							data: {
								table: oListTable + oGenNumb,
								columns: OData.ToStructures.results[0].Structures,
								newImport: true
							},
							method: "POST",
							dataType: "text",
							success: function (results) {
								if (results === "OK") {

									// Column names
									var col = that.getColumn(oListTable + oGenNumb);

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

													sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messErrECCPost"), {
														icon: sap.m.MessageBox.Icon.ERROR,
														onClose: that.onCancel()
													});
												}

												if (currentCycle === missingTables && missingTables === currentNumTables) {
													// checkDep is called
													that.onCheck();
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
														table: oListTable + oGenNumb,
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

															sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messErrECCPost"), {
																icon: sap.m.MessageBox.Icon.ERROR,
																onClose: that.onCancel()
															});
														}

														if (currentCycle === missingTables && missingTables === currentNumTables) {
															// checkDep is called
															that.onCheck();
														}

													},
													error: function () {
														that.onDelTableA();

														// Loading indicator is removed
														sap.ui.core.BusyIndicator.hide();

														// The error message is shown only one time
														if (errorIsReleased === false) {
															sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messErrECCPost"), {
																icon: sap.m.MessageBox.Icon.ERROR,
																onClose: that.onCancel()
															});

															errorIsReleased = true;
														}
													}
												});
											}
										},
										error: function () {
											that.onDelTableA();
											// Progress indicator is removed
											sap.ui.core.BusyIndicator.hide();
											that.onCancel();
										}
									});
								} else {
									that.onDelTableA();
									sap.ui.core.BusyIndicator.hide();
									that.onCancel();
								}
							},
							error: function () {
								that.onDelTableA();
								// Progress indicator is removed
								sap.ui.core.BusyIndicator.hide();
								that.onCancel();
							}
						});
					} else {
						that.onDelTableA();

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

					that.onDelTableA();

					// Progress indicator is removed
					sap.ui.core.BusyIndicator.hide();
					// oResult = "KO";
					sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messErrTableExist"), {
						icon: sap.m.MessageBox.Icon.ERROR,
						onClose: that.onCancel()
					});
				}
			});
		},

		onCheckDep: function (oEvent) {

			var oView = this.getView();
			var model = oView.byId("table_analysis").getModel();
			var path = oEvent.getSource().getBindingContext().getPath();
			var obj = model.getProperty(path);

			var oModelDep_d = oView.getModel("dep_d");
			var oModelDep_d_data = oModelDep_d.getData();
			var eText,
				eMess;
			for (var i = 0; i < oModelDep_d_data.length; i++) {
				var nafield_dep = oModelDep_d_data[i].ORI_FIELD + "X";

				if (obj[nafield_dep] === null) {

					var val = obj[oModelDep_d_data[i].ORI_FIELD],
						ori_field = oModelDep_d_data[i].ORI_FIELD,
						dest_tab = oModelDep_d_data[i].DEST_TABLE,
						dest_field = oModelDep_d_data[i].DEST_FIELD;
					eText = this.getView().getModel("i18n").getResourceBundle().getText("e_chk_dep", [val, ori_field, dest_tab, dest_field]);
				}
				if (eText) {
					if (eMess)
						eMess = eMess + ", " + eText;
					else
						eMess = eText;
					eText = "";
				}
			}
			if (eMess) {
				MessageToast.show(eMess, {
					duration: 5000
				});
			}
		},

		onPressBack: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			// Start Delete Angelo
			// The table does not exists anymore on view
			// var oTable = this.getView().byId("table_analysis");
			// oTable.setVisible(false);
			// End Delete Angelo

			oRouter.navTo("home_u", {
				username: uid,
				role: role
			});
		},

		_attachPatternMatched: function (oEvent) {

			var textLabel;
			uid = oEvent.getParameter("arguments").uid;
			role = oEvent.getParameter("arguments").role;
			table = oEvent.getParameter("arguments").table;
			version = oEvent.getParameter("arguments").version;

			var oView = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.Home_u"),
				oMod = oView.getModel("dep_d");
			this.getView().setModel(oMod, "dep_d");

			if (role === "USER") {
				textLabel = uid + " / User";
			} else {
				textLabel = uid + " / Administrator";
			}
			this.getView().byId("username").setText(textLabel);
			var oDep = this.getView().getModel("dep_d").getData().length;
			if (oDep > 0) {
				this.onLoadTableA();
			} else {
				this.onCancel();
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("noDep"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
			}
		},

		onLogin: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("login");
		},

		onSetTable: function (rowData) {

			var columnData;
			var jurl2 = "/service/ERPIBERIA_ADN/table_content/getcolumns.xsjs";

			var t = this;
			jQuery.ajax({
				url: jurl2,
				async: false,
				data: {
					table: table
				},
				method: "GET",
				dataType: "text",
				success: function (response) {
					columnData = response;

					var oModel = new sap.ui.model.json.JSONModel();
					var col = JSON.parse(columnData);

					var ind;
					ind = col.findIndex(function (el) {
						return el.COLUMN_NAME == "VALID_FROM";
					});
					col.splice(ind, 1);
					ind = col.findIndex(function (el) {
						return el.COLUMN_NAME == "VALID_TO";
					});
					col.splice(ind, 1);
					var row = JSON.parse(rowData);
					for (var j = 0; j < row.length; j++) {
						delete row[j].VALID_FROM;
						delete row[j].VALID_TO;
					}

					oModel.setData({
						columns: col,
						rows: row
					});

					var oTable = t.getView().byId("table_analysis");
					oTable.setTitle(table + " v" + version);
					oTable.setModel(oModel);

					oTable.bindColumns("/columns", function (sId, oContext) {
						var columnName = oContext.getObject().COLUMN_NAME;
						return new sap.ui.table.Column({
							label: columnName,
							//////set color of sinlge cell
							filterProperty: columnName,
							template: new sap.ui.commons.TextView().bindProperty("text", {
								parts: [{
									path: columnName
								}, {
									path: columnName + "X"
								}],

								formatter: function (field, fieldx) {
									this.removeStyleClass("myclass_errdep");
									if (fieldx === null) {
										this.addStyleClass("myclass_errdep");
									}
									return field;
								}
							})
						});
					});

					oTable.addColumn(new sap.ui.table.Column({
						template: new sap.m.Button({
							icon: "sap-icon://message-warning",
							type: sap.m.ButtonType.Reject,
							press: [t.onCheckDep, t]
						}),
						enableColumnFreeze: true,
						width: '5%'
					}));

					oTable.bindRows("/rows");

					var binding = oTable.getBinding("rows");
					var count = 20;
					if (binding.iLength < 20) {
						count = binding.iLength;
					} else {
						count = 20;
					}
					t.getView().byId("table_analysis").setProperty("visibleRowCount", count);
				},
				error: function (response) {
					columnData = "ERROR2";
				}
			});
		},
		onCancel: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("home_u", {
				username: uid,
				role: role,
				sel: 1
			});
		},

		onNotify: function () {
			// Start Delete Angelo
			// var row = JSON.stringify(this.byId("table_analysis").getModel().getData().rows);
			// End Delete Angelo
			var t = this;
			var result;
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			// Start Insert Angelo
			var aTables = sap.ui.getCore().getModel("depTables").getData();
			// End Insert Angelo

			var textNotify = this.getView().getModel("i18n").getResourceBundle().getText("a_messageNotify");
			var mailText = this.getView().getModel("i18n").getResourceBundle().getText("mailText", table);
			var mailSubjcet = this.getView().getModel("i18n").getResourceBundle().getText("messSubject", table);
			sap.m.MessageBox.show(textNotify, {
				icon: sap.m.MessageBox.Icon.NONE,
				title: this.getView().getModel("i18n").getResourceBundle().getText("messTitleNotify"),
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
				onClose: function (action) {
					if (action === sap.m.MessageBox.Action.YES) {
						//send email 
						var jurl = "/service/ERPIBERIA_ADN/table_content/sendEmail.xsjs";
						jQuery.ajax({
							url: jurl,
							async: true,
							data: {
								// Start Delete Angelo
								// table: table,
								// //SYSTEMNAME: system,
								// row: row,
								// End Delete Angelo

								// Start Insert Angelo
								depData: JSON.stringify(aTables.tables),
								// End Insert Angelo
								mailText: mailText,
								subject: mailSubjcet
							},
							method: "POST",
							dataType: "text",
							success: function (results) {
								var msgEmail;
								var response = JSON.parse(results);
								var text = '';
								for (var i = 0; i < response.length; i++) {
									if (response[i] != "OK") {
										if (text == '')
											text = response[i];
										else
											text = text + ";" + response[i];
									}

								}
								if (text == '') {
									msgEmail = t.getView().getModel("i18n").getResourceBundle().getText("a_messageEmail");
									sap.m.MessageBox.success(msgEmail, {
										icon: sap.m.MessageBox.Icon.Success
									});
								} else {
									msgEmail = t.getView().getModel("i18n").getResourceBundle().getText("a_messageFailedEmail");
									msgEmail = msgEmail + text;
									sap.m.MessageBox.error(msgEmail, {
										icon: sap.m.MessageBox.Icon.ERROR,
										Title: t.getView().getModel("i18n").getResourceBundle().getText("messTitleNotifyError")
									});
								}
							},

							error: function (xhr) {
								result = "ERROR";
							}
						});
						t.onPressBack();

					} else {

					}

				}
			});

		}
	});

});