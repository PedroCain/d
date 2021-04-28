sap.ui.define([
	"ManageTechTables/ManageTechTables/controller/BaseController",
	// "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/commons/MessageBox"
], function (BaseController, JSONModel, Filter, FilterOperator, MessageBox) {
	"use strict";
	var role, uid, tab, syst, showMessage = true;
	var CController = BaseController.extend("ManageTechTables.ManageTechTables.controller.dep", {
		onInit: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("dep").attachPatternMatched(this._attachPatternMatched, this);
		},
		_attachPatternMatched: function (oEvent) {

			var that = this;

			// Start Insert Angelo
			var aData = {
				fields: [{
					oriField: "",
					destField: ""
				}],
				oriHelp: [],
				destHelp: [],
				tableStandardDest: "",
				tableCustDest: ""
			};

			var oModel = new JSONModel(aData);
			this.getView().setModel(oModel, "fieldModel");

			var aSettings = {
				standardVisible: true,
				customVisible: false
			};

			var oModelSettings = new JSONModel(aSettings);
			this.getView().setModel(oModelSettings, "fieldModelSettings");

			// Code that retrieves the customizing tables
			var result;

			var urlEcc = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
			var oModelEcc = new sap.ui.model.odata.v2.ODataModel(urlEcc);

			var entityEcc = "/listTableCustomSet";
			oModelEcc.read(entityEcc, {
				success: function (oData) {
					var oModelCust = new JSONModel(oData.results);
					that.getView().setModel(oModelCust, "customizingTables");
				},
				error: function (oData) {
					result = "KO";
				}
			});
			// End Angelo

			role = oEvent.getParameter("arguments").role;
			uid = oEvent.getParameter("arguments").uid;
			tab = oEvent.getParameter("arguments").tab;
			syst = oEvent.getParameter("arguments").syst;

			this.getView().byId("systemOri").setValue(syst);
			this.getView().byId("tableOri").setValue(tab);

			var fieldOri = "fieldOri";
			this.ongetfields(tab, fieldOri, true);
			if (role === "ADMIN" || !role) {
				// Start Delete Angelo
				// var idView = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.login").getId();
				// var textLabel = sap.ui.getCore().byId(idView + "--uid").getValue() + " / Administrator";
				// End Delete Angelo
				// Start Insert Angelo
				var textLabel = this.getUserName() + " / Administrator";
				// End Insert Angelo
				this.getView().byId("userLog").setText(textLabel);
			}
		},

		onFieldDest: function (oEvent) {
			// this.byId("fieldDest").setValueState(sap.ui.core.ValueState.None);
		},
		onFieldOri: function (oEvent) {
			// this.byId("fieldOri").setValueState(sap.ui.core.ValueState.None);

			var oItem = oEvent.getSource().getSelectedItem().getText(),
				oSelectedItems = oEvent.getSource().getBindingContext("fieldModel").getModel().getData().fields,
				oId = parseInt(oEvent.getSource().getBindingContext("fieldModel").getPath().split("/fields/")[1], 10),
				oRow = this.byId("idDependenceFields").getItems();

			for (var i = 0; i < oSelectedItems.length; i++) {
				if (i !== oId) {
					if (oItem === oSelectedItems[i].oriField) {
						sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("messExistingField"), {
							icon: sap.m.MessageBox.Icon.ERROR
						});
						oRow[oId].getCells()[0].setValueState(sap.ui.core.ValueState.Error);
						break;
					} else {
						oRow[oId].getCells()[0].setValueState(sap.ui.core.ValueState.None);
						oRow[i].getCells()[0].setValueState(sap.ui.core.ValueState.None);
					}
				}
			}
		},
		onAccept: function () {
			// If one of the fields is still in error, the dependeces creation is interrupted
			var oSelectedItems = this.byId("idDependenceFields").getItems(),
				oCompare = oSelectedItems.length,
				sError;

			for (var k = 0; k < oCompare; k++) {
				if (oSelectedItems[k].getCells()[0].getValueState() === (sap.ui.core.ValueState.Error)) {
					sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("messExistingField"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
					sError = "x";
					break;
				}
			}
			if (!sError) {

				var URL = "/service/ERPIBERIA_ADN/dependencies/getDep.xsodata";

				var oModel = new sap.ui.model.odata.ODataModel(URL, true);

				showMessage = true;

				var aDataFields = this.getView().getModel("fieldModel").getData();
				var numRec = 0;
				var validArray = [];
				var collector;

				// Every valid combination of Origin Field and Destination Field must be saved to HANA DB
				for (var i = 0; i < aDataFields.fields.length; i++) {
					if (aDataFields.fields[i].oriField && aDataFields.fields[i].destField) {
						// A valid set has been found, it can be written on DB
						// Current number of valid records is increased
						numRec++;

						// Start Insert Angelo
						// We need the destination table in order to perform the validation check
						aDataFields.fields[i].destTable = aDataFields.tableCustDest;
						// End Insert Angelo

						// Data is written in a clean Array
						validArray.push(aDataFields.fields[i]);
					}
				}

				// if (!FieldOri.getSelectedItem() || !FieldDest.getSelectedItem() || !TableDest.getSelectedItem() || !SystemDest.getSelectedItem()) {
				// No valid records have been found
				if (numRec === 0) {
					var msg = this.getView().getModel("i18n").getResourceBundle().getText("messFieldNotValue");
					jQuery.sap.require("sap.m.MessageBox");
					sap.m.MessageBox.alert(msg, {
						icon: sap.m.MessageBox.Icon.ALERT,
						title: this.getView().getModel("i18n").getResourceBundle().getText("messTitleAlert"),
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function (action) {
							if (action === sap.m.MessageBox.Action.OK) {}
						}
					});
				} else {

					// String for independent dependency
					var noCollector = this.getView().getModel("i18n").getResourceBundle().getText("noCollector");

					// Success logic
					// If the number of valid records is greater than 1, means that is a collective dependence, so the last incremental
					// number used must be retrieved from HANA DB
					if (numRec > 1) {

						// Filters are created in order to get the less possibile amount of data from DB
						var filterDep = new Filter({
							filters: [
								new Filter({
									path: "ORI_TABLE",
									operator: FilterOperator.EQ,
									value1: this.getView().byId("tableOri").getValue()
								}),
								new Filter({
									path: "ORI_SYSTEM",
									operator: FilterOperator.EQ,
									value1: this.getView().byId("systemOri").getValue()
								}),
								new Filter({
									path: "COLLECTOR",
									operator: FilterOperator.NE,
									value1: noCollector
								})
							],
							and: true
						});
						var filterDepFinal = [];
						filterDepFinal.push(filterDep);

						oModel.read("/dependencies?$orderby=COLLECTOR%20desc", {
							filters: filterDepFinal,
							async: false,
							success: function (oData) {
								if (oData.results.length === 0) {
									collector = "0";
								} else {
									collector = JSON.stringify(parseInt(oData.results[0].COLLECTOR, 10) + 1);
								}
							},
							error: function (oData) {
								collector = "0";
							}
						});
					} else {
						collector = noCollector;
					}

					// This check is executed to determine if the dependency has been inserted by using a Standard Table or by
					// a Customizing table
					var aSettings = this.getView().getModel("fieldModelSettings").getData();

					var destinationTab,
						resp;

					// Standard Table case
					if (aSettings.standardVisible === true &&
						aSettings.customVisible === false) {

						destinationTab = aDataFields.tableStandardDest;
						// Start Delete Angelo
						// resp = "DIP (100)";
						// End Delete Angelo
					} else {
						// Customizing Table case
						destinationTab = aDataFields.tableCustDest;
						// Start Delete Angelo
						// resp = "DIP (100)";
						// End Delete Angelo
					}

					// Start Insert Angelo
					var sURLEcc = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
					var oModelEcc = new sap.ui.model.odata.v2.ODataModel(sURLEcc);
					var sEntityEcc = "/tableDetailsSet('" + destinationTab + "')";

					var that = this;

					oModelEcc.read(sEntityEcc, {
						success: function (OData) {
							resp = OData.System;

							jQuery.sap.require("sap.m.MessageBox");

							sap.m.MessageBox.confirm(that.getView().getModel("i18n").getResourceBundle()
								.getText("messCreateDep"), {
									icon: sap.m.MessageBox.Icon.CONFIRM,
									title: that.getView().getModel("i18n").getResourceBundle().getText("messTitleConfirm"),
									actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
									onClose: function (action) {
										if (action === sap.m.MessageBox.Action.YES) {

											// var URL = "/service/ERPIBERIA_ADN/dependencies/getDep.xsodata";
											var msg1 = that.getView().getModel("i18n").getResourceBundle().getText("messDepCreateSucc");
											var msg2 = that.getView().getModel("i18n").getResourceBundle().getText("messDepCreateError");
											var date = new Date();
											// var oModel = new sap.ui.model.odata.ODataModel(URL, true);
											var newEntry = {};
											var oKo;
											// Valid fields are written to DB, respecting the COLLECTOR logic

											var oModDep = sap.ui.getCore().getModel("model_Dep");
											if (validArray.length < 2) {
												for (var s = 0; s < oModDep.length; s++) {
													// Check for single dependencies
													if (isNaN(oModDep[s].COLLECTOR)) {
														// Start Delete Angelo
														// if (validArray[0].oriField === oModDep[s].ORI_FIELD) {
														// End Delete Angelo
														// Start Insert Angelo
														if (validArray[0].oriField === oModDep[s].ORI_FIELD && validArray[0].destField === oModDep[s].DEST_FIELD &&
															validArray[0].destTable === oModDep[s].DEST_TABLE) {
															// End Insert Angelo
															sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messExistingFieldSaved"), {
																icon: sap.m.MessageBox.Icon.ERROR

															});
															oKo = "x";
															break;
														}

													}
												}
											} else {
												// Check for combinated dependencies
												for (var m = 0; m < collector; m++) {
													var oCount = 0;
													var oArray = [];
													for (var j = 0; j < oModDep.length; j++) {
														if (oModDep[j].COLLECTOR === m) {
															oArray.push(oModDep[j]);
														}
													}
													if (oArray.length === validArray.length) {
														for (var t = 0; t < oArray.length; t++) {
															for (var n = 0; n < validArray.length; n++) {
																if (oArray[t].ORI_FIELD === validArray[n].oriField) {
																	oCount = oCount + 1;
																	break;
																}
															}
														}
														if (oCount === validArray.length) {
															oKo = "x";
															sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messExistingFieldSaved"), {
																icon: sap.m.MessageBox.Icon.ERROR
															});
															break;
														}
													}
												}
											}
											if (oKo !== "x") {

												for (var j = 0; j < validArray.length; j++) {

													newEntry.ORI_FIELD = validArray[j].oriField;
													newEntry.ORI_TABLE = that.getView().byId("tableOri").getValue();
													newEntry.ORI_SYSTEM = that.getView().byId("systemOri").getValue();
													newEntry.DEST_FIELD = validArray[j].destField;
													newEntry.DEST_TABLE = destinationTab;
													newEntry.DEST_SYSTEM = resp;
													newEntry.OWNER_DEST = resp;
													newEntry.CREATION_DATE = date;
													newEntry.COLLECTOR = collector;

													oModel.create("/dependencies", newEntry, null, function (oEntry) {

															if (showMessage === true) {
																showMessage = false;
																sap.m.MessageBox.show(msg1, {
																	icon: sap.m.MessageBox.Icon.SUCCESS,
																	title: that.getView().getModel("i18n").getResourceBundle().getText("messTitleDepSucc"),
																	actions: [sap.m.MessageBox.Action.OK],
																	onClose: function (action) {
																		if (action === sap.m.MessageBox.Action.OK) {
																			that.onPressBack();
																		}
																	}
																});
															}
														},
														function (err) {

															if (showMessage === true) {
																showMessage = false;

																var msgErrorDuplicateDep = that.getView().getModel("i18n").getResourceBundle().getText("messDepErrorDuplicate");
																err = JSON.parse(err.response.body).error.message.value;
																if (err.includes("[301]")) {
																	sap.m.MessageBox.show(msgErrorDuplicateDep, {
																		icon: sap.m.MessageBox.Icon.ERROR,
																		title: that.getView().getModel("i18n").getResourceBundle().getText("messTitleDepError"),
																		actions: [sap.m.MessageBox.Action.OK]
																	});
																} else {
																	sap.m.MessageBox.show(msg2, {
																		icon: sap.m.MessageBox.Icon.ERROR,
																		title: that.getView().getModel("i18n").getResourceBundle().getText("messTitleDepError"),
																		actions: [sap.m.MessageBox.Action.OK]
																	});
																}
															}
														}
													);
												}
											}
										}
									}
								});
						}
					});
				}
			}
		},

		onPressBack: function () {
			if (this.getView().getModel("Fields"))
				this.getView().getModel("Fields").setData(null);
			if (this.getView().getModel("Tables"))
				this.getView().getModel("Tables").setData(null);
			if (this.getView().getModel("System"))
				this.getView().getModel("System").setData(null);

			// Radio Button Management
			this.getView().byId("rb1").setSelected(true);
			this.getView().byId("rb2").setSelected(false);

			// this.getView().byId("systemDest").setSelectedKey(null);
			// this.getView().byId("tableDest").setSelectedKey(null);
			// this.getView().byId("fieldDest").setSelectedKey(null);
			// this.getView().byId("fieldOri").setSelectedKey(null);
			// this.byId("tableDest").setValueState(sap.ui.core.ValueState.None);
			// this.byId("systemDest").setValueState(sap.ui.core.ValueState.None);
			// this.byId("fieldDest").setValueState(sap.ui.core.ValueState.None);
			// this.byId("fieldOri").setValueState(sap.ui.core.ValueState.None);

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			oRouter.navTo("home_u", {
				username: uid,
				role: role
			});
		},

		ongetfields: function (table, fieldOri, ori) {
			var results1;
			var jurl = "/service/ERPIBERIA_ADN/table_content/getFields.xsjs";
			jQuery.ajax({
				url: jurl,
				async: false,
				data: {
					table: table
				},
				method: "GET",
				dataType: "text",
				success: function (response) {
					results1 = response;
				},
				error: function (xhr) {
					results1 = "ERROR";
				}
			});
			results1 = JSON.parse(results1);
			// var oModelJson = new sap.ui.model.json.JSONModel();
			// oModelJson.setData(results1);

			var oTableData = this.getView().getModel("fieldModel");
			var aTableData = oTableData.getData();
			var oModelJson = new sap.ui.model.json.JSONModel(results1);

			if (ori === true) {
				this.getView().setModel(oModelJson, "FieldOrigin");
				aTableData.oriHelp = results1;
				// fieldDestO.setModel(this.getView().getModel("FieldOrigin"));
			} else {
				this.getView().setModel(oModelJson, "Fields");
				aTableData.destHelp = results1;
				// fieldDestO.setModel(this.getView().getModel("Fields"));
			}

			oTableData.refresh();

			// var results1;
			// var jurl = "/service/ERPIBERIA_ADN/table_content/getFields.xsjs";
			// jQuery.ajax({
			// 	url: jurl,
			// 	async: false,
			// 	data: {
			// 		table: table
			// 	},
			// 	method: "GET",
			// 	dataType: "text",
			// 	success: function (response) {
			// 		results1 = response;
			// 	},
			// 	error: function (xhr) {
			// 		results1 = "ERROR";
			// 	}
			// });
			// results1 = JSON.parse(results1);
			// var oModelJson = new sap.ui.model.json.JSONModel();
			// oModelJson.setData(results1);
			// var oItemSelectTemplate = new sap.ui.core.Item({
			// 	text: "{COLUMN_NAME}"
			// });
			// var fieldDestO = this.getView().byId("fieldOri");
			// if (ori === true) {
			// 	this.getView().setModel(oModelJson, "FieldOrigin");
			// 	fieldDestO.setModel(this.getView().getModel("FieldOrigin"));
			// } else {
			// 	this.getView().setModel(oModelJson, "Fields");
			// 	fieldDestO.setModel(this.getView().getModel("Fields"));
			// }
			// fieldDestO.bindAggregation("items", "/", oItemSelectTemplate);
		},

		addNewDep: function () {
			var oRows = this.getView().byId("idDependenceFields").getItems();
			var sError;
			for (var x = 0; x < oRows.length; x++) {
				if (!oRows[x].getCells()[0].getSelectedItem() || !oRows[x].getCells()[1].getSelectedItem()) {
					sError = "x";
					break;
				}
			}
			if (!sError) {

				// A new row is added to the dependences list
				var oModel = this.getView().getModel("fieldModel");
				var aData = oModel.getData();
				aData.fields.push({
					oriField: "",
					destField: ""
				});

				oModel.refresh();
			}
		},

		onLogin: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("login");
		},

		onDelete: function (oEvent) {
			var oView = this.getView();
			var oModel = oView.getModel("fieldModel");
			var oItems = oView.getModel("fieldModel").getData().fields;
			var sPath = oEvent.getSource().getBindingContext("fieldModel").getPath().split("/fields/")[1];

			sap.m.MessageBox.confirm(oView.getModel("i18n").getResourceBundle().getText("messDepDel"), {
				actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						// oItems.splice(sPath);
						oItems.splice(sPath, 1);
						oModel.updateBindings(true);
						oModel.refresh();
					}
				}
			});
		},

		onSelectRadio: function (oEvent) {

			// Start Insert Angelo
			var oModel = this.getView().getModel("fieldModel");
			var aData = oModel.getData();

			aData.fields = [];
			aData.fields.push({
				oriField: "",
				destField: ""
			});
			// Start Insert Angelo
			aData.destHelp = [];
			// End Insert Angelo
			aData.tableStandardDest = "";
			aData.tableCustDest = "";

			oModel.refresh();
			// End Insert Angelo

			var index = oEvent.getParameters().selectedIndex;

			var oModelSettings = this.getView().getModel("fieldModelSettings");
			var aSettings = oModelSettings.getData();

			switch (index) {

				// Standard table case
			case 0:
				aSettings.standardVisible = true;
				aSettings.customVisible = false;
				break;

				// Customizing table case
			case 1:
				aSettings.standardVisible = false;
				aSettings.customVisible = true;
				break;
			}

			oModelSettings.refresh();
		},

		onCustomizingValueHelp: function () {

			// Dialog customizing fragment load
			if (!this._oDialogCust) {
				this._oDialogCust = sap.ui.xmlfragment("custDialog", "ManageTechTables.view.fragment.customizing", this);
				this.getView().addDependent(this._oDialogCust);
			}

			this._oDialogCust.open();
		},

		handleSelectCustomizing: function (oEvent) {

			var aCurrentTable = oEvent.getParameter("selectedContexts");
			var tableName = aCurrentTable.map(function (oContext) {
				return oContext.getObject().Tablename;
			});

			var oModel = this.getView().getModel("fieldModel");
			var aData = oModel.getData();

			// Start Insert Angelo
			aData.fields = [];
			aData.fields.push({
				oriField: "",
				destField: ""
			});
			aData.tableStandardDest = "";

			oModel.refresh();
			// End Insert Angelo

			aData.tableCustDest = tableName[0];

			oModel.refresh();

			// The structure of the table must be read from SAP
			var urlEcc = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
			var oModelEcc = new sap.ui.model.odata.v2.ODataModel(urlEcc);
			// Start Delete Angelo
			// var entityEcc = "/tableSet('" + tableName[0] + "')/tableSturctureSet";
			// End Delete Angelo

			// Start Insert Angelo
			var entityEcc = "/tableSet('" + tableName[0] + "')/tableStructureSet";
			// End Insert Angelo

			// Structure is readed from ECC
			oModelEcc.read(entityEcc, {
				success: function (oData) {

					// New model for the search help is created
					aData.destHelp = [];

					var tables = JSON.parse(oData.results[0].Structure);

					// Start Insert Angelo
					// MANDT field is removed from the possibile fields od the table
					var mandtIndex = tables.findIndex(function (value) {
						return value.position === 1;
					});

					tables.splice(mandtIndex, 1);
					// End Insert Angelo

					for (var i = 0; i < tables.length; i++) {
						aData.destHelp.push({
							COLUMN_NAME: tables[i].fieldname
						});
					}

					oModel.refresh();
				},
				error: function (oData) {}
			});

		},

		onSearchCustomizingTable: function (oEvent) {
			var aFilter = [];

			aFilter.push(new Filter("Tablename", FilterOperator.Contains, oEvent.getSource()._sSearchFieldValue));

			// Binding of the list is taken from oEvent parameter
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilter);
		},

		onTab: function () {
			if (!this._oImportDialog) {
				this._oImportDialog = sap.ui.xmlfragment("ManageTechTables.view.fragment.import", this);
				this.getView().addDependent(this._oImportDialog);
			}
			this._onShowList();
			this._oImportDialog.open();
		},

		_onShowList: function () {
			sap.ui.core.BusyIndicator.show();
			var oView = this.getView();
			var oUrlTable = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
			var oEntity = "/listTableSet";
			var oModel = new sap.ui.model.odata.v2.ODataModel(oUrlTable);
			oModel.read(oEntity, {
				success: function (OData) {
					oView.setModel(new JSONModel(OData.results), "importList");
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (Error) {
					sap.ui.core.BusyIndicator.hide();
					sap.m.MessageBox.error(oView.getModel("i18n").getResourceBundle().getText("messErrECCTable"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
				}
			});
		},

		onSearchTable: function (oEvent) {
			var oFilter = [],
				oSuccessEvent = oEvent.getSource(),
				oBinding = oSuccessEvent.getBinding("items");
			oFilter.push(new Filter("Tablename", FilterOperator.Contains, oSuccessEvent._sSearchFieldValue));
			oBinding.filter(oFilter);
		},

		handleSelect: function (oEvent) {
			// Start Delete Angelo
			// var oView = this.getView();
			// var oItemSelect = this.getView().byId("idDependenceFields").getItems()[0].getCells();
			// var oModelfield = oView.getModel("fieldModel");
			// var oItems = oModelfield.getData().fields;
			// var oCount = oModelfield.getData().fields.length;
			// oItemSelect[0].setSelectedItem(null);
			// oItemSelect[1].setSelectedItem(null);
			// oItems.splice(1, oCount);
			// oModelfield.refresh();
			// End Delete Angelo

			var that = this;

			// Code that retrieves the current value selected by the user
			var aCurrentTable = oEvent.getParameter("selectedContexts");
			var tableName = aCurrentTable.map(function (oContext) {
				return oContext.getObject().Tablename;
			});
			// Start Modify Angelo
			// var oModel = oView.getModel("fieldModel");
			var oModel = this.getView().getModel("fieldModel");
			// End Modify Angelo
			var aData = oModel.getData();

			// The user can select the same table to create dependencies, this operation is not permitted
			if (tab === tableName[0]) {
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("messErrSameTableDep"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
			} else {

				// Start Insert Angelo
				// Old data elaborated is refreshed
				aData.fields = [];
				aData.fields.push({
					oriField: "",
					destField: ""
				});
				aData.tableCustDest = "";
				// End Insert Angelo

				// 	fields: [{
				// 		oriField: "",
				// 		destField: ""
				// 	}],
				// 	oriHelp: [],
				// 	destHelp: [],
				// 	tableStandardDest: "",
				// 	tableCustDest: ""
				// };

				// Start Modify Angelo
				// aData.tableCustDest = tableName[0];
				aData.tableStandardDest = tableName[0];
				// End Modify Angelo

				oModel.refresh();

				// The structure of the table must be read from SAP
				var urlEcc = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
				var oModelEcc = new sap.ui.model.odata.v2.ODataModel(urlEcc);

				// Start Delete Angelo
				// var entityEcc = "/tableSet('" + tableName[0] + "')/tableSturctureSet";
				// End Delete Angelo

				// Start Insert Angelo
				var entityEcc = "/tableSet('" + tableName[0] + "')/tableStructureSet";
				// End Insert Angelo

				// Structure is readed from ECC
				oModelEcc.read(entityEcc, {
					success: function (oData) {

						// New model for the search help is created
						aData.destHelp = [];

						var tables = JSON.parse(oData.results[0].Structure);

						// Start Insert Angelo
						// MANDT field is removed from the possibile fields od the table
						var mandtIndex = tables.findIndex(function (value) {
							return value.position === 1;
						});

						tables.splice(mandtIndex, 1);
						// End Insert Angelo

						for (var i = 0; i < tables.length; i++) {
							aData.destHelp.push({
								COLUMN_NAME: tables[i].fieldname
							});
						}

						oModel.refresh();
					},
					error: function (Error) {
						sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messErrECCPost"), {
							icon: sap.m.MessageBox.Icon.ERROR
						});
					}
				});
			}
		}
	});
	return CController;
});