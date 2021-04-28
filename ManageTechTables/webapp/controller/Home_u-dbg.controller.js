/* global XLSX:true */
sap.ui.define([
	// "sap/ui/core/mvc/Controller",
	"ManageTechTables/ManageTechTables/controller/Labels",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"jquery.sap.global",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/m/Dialog",
	"ManageTechTables/ManageTechTables/model/formatter",
	"sap/ui/model/Sorter",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/FilterOperator",
	"sap/m/Token",
	"ManageTechTables/ManageTechTables/libs/jszip",
	"ManageTechTables/ManageTechTables/libs/xlsx"
], function (Labels, JSONModel, Filter, jQuery, MessageToast, Fragment, Dialog, formatter, Sorter, DateFormat, FilterOperator, Token) {
	"use strict";
	var role, uid, fname, ncsv;

	return Labels.extend("ManageTechTables.ManageTechTables.controller.Home_u", {
		formatter: formatter,

		onInit: function () {

			// Start Insert Angelo
			// Every possible label is loaded, a suggestion list is created
			this.loadAllLabelsSuggestions();
			// End Insert Angelo

			// Start Insert Angelo
			var aExportVisibility = {
				visible: false
			};

			var oModel = new JSONModel(aExportVisibility);
			this.getOwnerComponent().setModel(oModel, "exportVisible");
			// End Insert Angelo

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("home_u").attachPatternMatched(this._attachPatternMatched,
				this);
				
			
		},

		setExportVisibility: function () {

			var that = this;

			// Description of the table is taken from SAP
			var urlEcc = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
			var oModelDesc = new sap.ui.model.odata.v2.ODataModel(urlEcc);
			var entityDesc = "/tableDetailsSet('ZLISTCONFIGTABLE')";

			var aExportModel = this.getOwnerComponent().getModel("exportVisible");
			var aExportVisibility = aExportModel.getData();

			oModelDesc.read(entityDesc, {
				success: function (OData) {
					//if (OData.System === "SDD") {
					if (OData.System === "DIS") {
						aExportVisibility.visible = true;
					} else {
						aExportVisibility.visible = false;
					}

					// Current model used is refreshed
					aExportModel.refresh();
				}
			});
		},

		_attachPatternMatched: function (oEvent) {

			// Start Insert Angelo
			// This model is used in the app to manage the dynamic tables generated from dependencies check
			var aDynTable = {
				tables: [{
					title: "",
					rows: [],
					columns: []
				}]
			};

			var oDynModel = new sap.ui.model.json.JSONModel(aDynTable);
			sap.ui.getCore().setModel(oDynModel, "depTables");
			// End Insert Angelo

			// Start Insert Angelo
			var aTokens = {
				version: "",
				tokens: []
			};

			var oTokenModel = new JSONModel(aTokens);
			this.getView().setModel(oTokenModel, "tokens");
			// End Insert Angelo

			role = oEvent.getParameter("arguments").role;
			var user = oEvent.getParameter("arguments").username;

			// Start Insert Angelo
			// The Select All checkbox is removed
			var oVersTable = this.getView().byId("table_vers");
			oVersTable._getSelectAllCheckbox().setVisible(false);
			// End Insert Angelo

			if (uid !== user) {
				uid = user;
				var textLabel;

				// Start Delete Angelo
				// var oView = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.login");
				// var idView = oView.getId();
				// var username = sap.ui.getCore().byId(idView + "--uid").getValue();
				// End Delete Angelo

				// Start Insert Angelo
				var username = this.getUserName();
				// End Insert Angelo
				if (role === "USER" || !role) {

					this.readDBtableslist("tables", "", true, "tables/lastVersions.xsjs", "", username);

					textLabel = user + " / User";
					this.getView().byId("bcrea_dep").setVisible(false);
					this.getView().byId("table_dep").setMode(sap.m.ListMode.None);
					this.getView().byId("b_admin_view").setVisible(false);
					this.getView().byId("b_analysis").setVisible(false);
				} else {
					textLabel = user + " / Administrator";
					this.getView().byId("b_analysis").setVisible(true);
					// Start Delete Angelo
					// oView = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.Home");
					// var oMod = oView.getModel("tables");
					// this.getView().setModel(oMod, "tables");
					// End Delete Angelo
					this.getView().byId("bcrea_dep").setVisible(true);
					this.getView().byId("table_dep").setMode(sap.m.ListMode.Delete);
					this.getView().byId("b_admin_view").setVisible(true);

					this.setCurrentTable();
				}
				this.getView().byId("head_user").setText(textLabel);
			} else {
				this.setCurrentTable();
			}
			
			//start insert andrea
			if(!this.getView().getModel("tables")){
			var tables = this.readDBtableslista("tables", "", false, "tables/lastVersions.xsjs", "", this.getUserName());
			var oModelJson = new sap.ui.model.json.JSONModel();
			oModelJson.setData(tables);
			this.getOwnerComponent().setModel(oModelJson, "tables");
			}
			//end insert andrea
			
		},

		// This function sets the current table on the master list
		// When no table is selected, an empty page will be shown
		setCurrentTable: function () {

			var blankPage = this.getView().getModel("i18n").getResourceBundle().getText("blankPage");

			// Model for title
			var aEmptyPage = {
				TABLENAME: blankPage,
				VERSION: " "
			};

			// Model for visibility
			var aVisible = {
				visible: false
			};

			var firstItem = this.getView().byId("tables_id").getSelectedItem();
			if (!firstItem) {
				// Start Insert Angelo
				// No table has been selected
				// Model for title is set
				var emptyModel = new JSONModel(aEmptyPage);
				this.getView().setModel(emptyModel, "detail_tbl");

				// Model for visibility is set
				var visibleModel = new JSONModel(aVisible);
				this.getView().setModel(visibleModel, "mainVisible");
				// End Insert Angelo

				// The Icon for the first empty page is removed
				this.getView().byId("iconHeaderDetail").setVisible(false);

				// Start Delete Angelo
				// firstItem = this.getView().byId("tables_id").getItems()[0];
				// End Delete Angelo
			}
			this.getView().byId("tables_id").setSelectedItem(firstItem, true, true);
		},

		changeformatdate: function (array) {
			if (array) {
				for (var i = 0; i < array.length; i++) {
					var dat = new Date(array[i].CREATIONDATE);
					array[i].CREATIONDATE = dat;
				}
			}
		},

		readDBtableslist: function (entitySet, filters, asyncr, method, order, username, tableName) {

			var jurl = "/service/ERPIBERIA_ADN/" + method;
			var result;
			var that = this;
			jQuery.ajax({
				url: jurl,
				async: true,
				data: {
					username: username
				},
				method: "GET",
				dataType: "text",
				success: function (response) {
					result = JSON.parse(response);
					that.changeformatdate(result);
					var oModTables = new sap.ui.model.json.JSONModel();
					oModTables.setData(result);
					// Start Delete Angelo
					// t.getView().setModel(oModTables, "tables");
					// tables model is maintained global, otherwise some functions will stop working
					that.getOwnerComponent().setModel(oModTables, "tables");
					// End Delete Angelo

					// Start Insert Angelo
					if (tableName !== undefined) {
						var firstItem = that.getView().byId("tables_id").getItems().filter(function (value) {
							return value.TABLENAME === tableName;
						});

						that.getView().byId("tables_id").setSelectedItem(firstItem, true, true);
						that.getView().byId("tables_id").setBusy(false);
					} else {
						that.setCurrentTable();
						that.getView().byId("tables_id").setBusy(false);
					}

					// The families are taken from the BaseController
					that.getAllFamilies();
					// End Insert Angelo

					// Start Delete Angelo
					// var firstItem = t.getView().byId("tables_id").getItems()[0];
					// t.getView().byId("tables_id").setSelectedItem(firstItem, true, true);
					// t.getView().byId("tables_id").setBusy(false);
					// End Delete Angelo
				},
				error: function (xhr) {
					result = "ERROR";
					that.getView().byId("tables_id").setBusy(false);
				},

				beforeSend: function () {
					that.getView().byId("tables_id").setBusyIndicatorDelay(0);
					that.getView().byId("tables_id").setBusy(true);
				}
			});
			if (result !== "ERROR") {
				/*				return result;*/
			}

		},
		readDB: function (entitySet, filters, asyncr, method, order, NameModel, idBusy, vers_old) {
			var results;
			var filter = [];
			// indirizzo del servizio
			var serviceURL = "/service/ERPIBERIA_ADN/" + method;
			if (filters !== "") {
				filter = filters;
			}
			// creo il modello
			var oModel = new sap.ui.model.odata.ODataModel(serviceURL, true);
			var that = this;
			if (idBusy) {
				this.getView().byId(idBusy).setBusyIndicatorDelay(0);
				this.getView().byId(idBusy).setBusy(true);
			}
			var entity = entitySet;
			if (order) {
				entity = entity + order;
			}
			oModel.read(entity, {
				filters: filter,
				async: asyncr,
				success: function (oData) {
					results = oData.results;

					var oModelJson_dep = new sap.ui.model.json.JSONModel();
					oModelJson_dep.setData(results);
					that.getView().setModel(oModelJson_dep, NameModel);

					// if (entitySet === "versions") {

					// if (results && results.length > 0) {

					// 	// Start Insert Angelo
					// 	var oMod = new JSONModel();

					// 	oMod = that.getView().getModel("detail_tbl");
					// 	var oDataTab_d = oMod.getData();

					// 	// Number of records
					// 	var numText = that.getView().getModel("i18n").getResourceBundle().getText("numRecDet");

					// 	numText = numText + " " + results[0].RECORDS;
					// 	that.getView().byId("numRecDetail").setText(numText);

					// 	// Last Update Date
					// 	var lastDate = results.filter(function (value) {
					// 		return value.SAP === "X";
					// 	});

					// 	// The date is inserted only when there is a valid version row
					// 	if (lastDate.length !== 0) {

					// 		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					// 			pattern: "dd/MM/yyyy"
					// 		});

					// 		// Start Insert Angelo
					// 		var aSystem = that.getOwnerComponent().getModel("tables").getData().filter(function (value) {
					// 			return value.TABLENAME === oDataTab_d.TABLENAME;
					// 		});
					// 		// End Insert Angelo

					// 		var dateText = that.getView().getModel("i18n").getResourceBundle().getText("lastUpdDet") + " " + aSystem[0].SYSTEM + ": " +
					// 			oDateFormat.format(new Date(
					// 				lastDate[0].DATE));

					// 		that.getView().byId("lastUpdDetail").setText(dateText);
					// 	}
					// 	// End Insert Angelo

					// 	var vers_new = results[0].VERSION;
					// 	if (vers_new !== vers_old) {

					// 		// Start Delete Angelo
					// 		// var oMod = new JSONModel();

					// 		// oMod = t.getView().getModel("detail_tbl");
					// 		// var oDataTab_d = oMod.getData();
					// 		// End Delete Angelo

					// 		oDataTab_d.VERSION = vers_new;
					// 		oMod.updateBindings(true);

					// 		oMod = new JSONModel();
					// 		oMod = that.getView().getModel("tables");
					// 		var oDataTab = oMod.getData();

					// 		var filterTab = oDataTab.filter(function (el) {
					// 			return el.TABLENAME === oDataTab_d.TABLENAME;
					// 		});
					// 		if (filterTab.length > 0) {
					// 			oDataTab.VERSION = vers_new;
					// 			oMod.updateBindings(true);
					// 		}

					// 	}
					// }
					// // Start Insert Angelo
					// else {
					// 	that.getView().byId("numRecDetail").setText("");
					// 	that.getView().byId("lastUpdDetail").setText("");
					// }
					// // End Insert Angelo
					// }

					if (idBusy) {
						that.getView().byId(idBusy).setBusy(false);
					}

				},
				error: function (e) {
					results = [];
					that.getView().byId(idBusy).setBusy(false);
				}
			});
			return results;
		},
		createDB: function (entitySet, filters, asyncr, method, dep) {
			var results;
			// indirizzo del servizio
			var serviceURL = "/service/ERPIBERIA_ADN/" + method;
			// creo il modello
			var oModel = new sap.ui.model.odata.ODataModel(serviceURL, true);
			// Leggo il modello da SAP
			oModel.create(entitySet, dep, null, function (oData) {
				results = "SUCCESS";
			}, function (e) {
				// errore lettura oData
				results = "ERROR";
			});
			return results;
		},
		deleteDB: function (entitySet, filters, asyncr, method, dep) {
			// indirizzo del servizio
			var serviceURL = "/service/ERPIBERIA_ADN/" + method;
			// creo il modello
			var oModel = new sap.ui.model.odata.ODataModel(serviceURL, true);
			var results;
			// Leggo il modello da SAP
			var a = entitySet + "(ORI_TABLE='ZORDENES_PM',ORI_SYSTEM='SAP ECC,DEST_TABLE='ZORDENES_PM',DEST_SYSTEM='SAP ECC') ";
			oModel.remove(a);
			return results;
		},

		onOrientationChange: function (oEvent) {
			oEvent.getParameter("landscape");
		},
		onPressNavToDetail: function (oEvent) {
			var oItem = oEvent.getParameter("listItem"),
				sPath = oItem.getBindingContext("ver_d").getPath();
			var idx = sPath.split("/")[1];
			var e = this.getView().getModel("ver_d").getData();
			var vers_d = e[idx].VERSION;
			var table_d = e[idx].TABLENAME;
			var page = this.getView().byId("detailDetail");
			if (page && page !== null) {
				page.setTitle(table_d);
			}
			this.readDBTable(vers_d, idx);
		},
		onPressDetailBack: function () {
			this.getSplitAppObj().backDetail();
			var page = this.getView().byId("detailDetail");
			if (page && page !== null) {
				page.scrollTo(0, 0);
			}

			// Start Insert Angelo
			var oBox = this.getView().byId("boxContent");
			oBox.destroyItems();
			// End Insert Angelo

			// Start Delete Angelo
			// var oTable = this.getView().byId("table_ver_d");
			/*			oTable.rerender();*/
			// oTable.setFirstVisibleRow(1);
			// End Delete Angelo
		},
		onPressMasterBack: function () {
			this.getSplitAppObj().backMaster();
		},
		onPressGoToMaster: function () {
			this.getSplitAppObj().toMaster(this.createId("master2"));
		},

		// Start Insert Angelo
		// Function that gets the current model for the versions. Also includes every single label
		getModelVersions: function (sTableName, sSystem, sOldVersion) {

			// Progress indicator is shown for the versions table
			this.getView().byId("table_vers").setBusyIndicatorDelay(0);
			this.getView().byId("table_vers").setBusy(true);

			var that = this;

			var sURL = "/service/ERPIBERIA_ADN/versions/getVersionsModel.xsjs";
			jQuery.ajax({
				url: sURL,
				async: true,
				data: {
					table: sTableName,
					system: sSystem
				},
				method: "POST",
				dataType: "text",
				success: function (data) {

					var results = JSON.parse(data);

					for (var i = 0; i < results.length; i++) {
						results[i].DATE = new Date(results[i].DATE);
						results[i].SAPDATE = new Date(results[i].SAPDATE);
					}

					// Model is set for the versions
					var oModelVersion = new JSONModel();
					oModelVersion.setData(results);
					that.getView().setModel(oModelVersion, "ver_d");

					if (results && results.length > 0) {

						var oMod = new JSONModel();

						oMod = that.getView().getModel("detail_tbl");
						var oDataTab_d = oMod.getData();

						// Number of records on detail
						var numText = that.getView().getModel("i18n").getResourceBundle().getText("numRecDet");

						numText = numText + " " + results[0].RECORDS;
						that.getView().byId("numRecDetail").setText(numText);

						// Last Update Date
						var lastDate = results.filter(function (value) {
							return value.SAP === "X";
						});

						// The date is inserted only when there is a valid version row
						if (lastDate.length !== 0) {

							var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
								pattern: "dd/MM/yyyy"
							});

							var aSystem = that.getOwnerComponent().getModel("tables").getData().filter(function (value) {
								return value.TABLENAME === oDataTab_d.TABLENAME;
							});

							var dateText = that.getView().getModel("i18n").getResourceBundle().getText("lastUpdDet") + " " + aSystem[0].SYSTEM + ": " +
								oDateFormat.format(new Date(
									lastDate[0].DATE));

							that.getView().byId("lastUpdDetail").setText(dateText);
						}

						var vers_new = results[0].VERSION;
						if (vers_new !== sOldVersion) {

							oDataTab_d.VERSION = vers_new;
							oMod.updateBindings(true);

							oMod = new JSONModel();
							oMod = that.getView().getModel("tables");
							var oDataTab = oMod.getData();

							var filterTab = oDataTab.filter(function (el) {
								return el.TABLENAME === oDataTab_d.TABLENAME;
							});
							if (filterTab.length > 0) {
								oDataTab.VERSION = vers_new;
								oMod.updateBindings(true);
							}
						}
					} else {
						that.getView().byId("numRecDetail").setText("");
						that.getView().byId("lastUpdDetail").setText("");
					}

					// Progress indicator is removed for the versions table
					that.getView().byId("table_vers").setBusy(false);

				},
				error: function (data) {}
			});
		},
		// End Insert Angelo

		onListItemPress: function (oEvent) {

			var isVisible = this.getView().getModel("mainVisible").getData();
			isVisible.visible = true;

			// Start Insert Angelo
			// This function determine the current system in which the appplication has been launched
			// If the system is DIS, the button can be shown
			this.setExportVisibility();
			// End Insert Angelo

			var page = this.getView().byId("detail");
			if (page && page !== null) {
				page.scrollTo(0, 0);
			}

			var oItem = oEvent.getParameter("listItem"),
				sPath = oItem.getBindingContext("tables").getPath();
			var idx = sPath.split("/")[1];
			var sToPageId = oEvent.getParameter("listItem").getCustomData()[0].getValue();
			var sToPageTitle = oEvent.getParameter("listItem").getTitle();

			var oModTables = this.getView().getModel("tables");

			var oDataTables = oModTables.getData();
			var oDataTable_d = oDataTables[idx];

			var oTable_d = new JSONModel();
			oTable_d.setData(oDataTable_d);
			this.getView().setModel(oTable_d, "detail_tbl");

			var tablename = sToPageTitle,
				systemname = oDataTable_d.SYSTEM,
				vers_old = oDataTable_d.VERSION;

			// Start Insert Angelo
			// This oData returns a flag that tells if the current structure on ADN is updated
			var sURL = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
			var oModel = new sap.ui.model.odata.v2.ODataModel(sURL);
			var sEntity = "/tableSet('" + tablename + "')/tableStructureSet";

			var oIcon = this.getView().byId("iconHeaderDetail");

			// Model read from SAP, using tablename
			oModel.read(sEntity, {
				method: "GET",
				success: function (result) {
					if (result.results[0].Flag === "KO") {
						oIcon.setVisible(true);
					} else {
						oIcon.setVisible(false);
					}
				}
			});
			// End Insert Angelo

			if (role === "USER") {
				if (oDataTable_d.MODE === "CHANGE") {
					this.getView().byId("bupl_ver").setVisible(true);
					// Start Delete Angelo
					// this.getView().byId("b_import").setVisible(true);
					// End Delete Angelo
				} else {
					this.getView().byId("bupl_ver").setVisible(false);
					// Start Delete Angelo
					// this.getView().byId("b_import").setVisible(false);
					// End Delete Angelo
				}
			} else {
				this.getView().byId("bupl_ver").setVisible(true);
				// Start Delete Angelo
				// this.getView().byId("b_import").setVisible(true);
				// End Delete Angelo
			}

			var aFilters_dep = [];

			// Start Delete Angelo
			// 	aFilters_vers = [];

			// var filter_vers = new Filter({
			// 	filters: [
			// 		new Filter({
			// 			path: 'TABLENAME',
			// 			operator: FilterOperator.EQ,
			// 			value1: tablename
			// 		}),
			// 		new Filter({
			// 			path: 'SYSTEMNAME',
			// 			operator: FilterOperator.EQ,
			// 			value1: systemname
			// 		}),

			// 	],
			// 	and: true
			// });

			// aFilters_vers.push(filter_vers);

			// this.readDB("versions", aFilters_vers, true, "versions/getVersions.xsodata/", "?$orderby=DATE%20desc", "ver_d", "table_vers",
			// 	vers_old);
			// End Delete Angelo

			// Start Insert Angelo
			this.getModelVersions(tablename, systemname, vers_old);
			// End Insert Angelo

			var filter_dep = new Filter({
				filters: [
					new Filter({
						path: 'ORI_TABLE',
						operator: FilterOperator.EQ,
						value1: tablename
					}),
					new Filter({
						path: 'ORI_SYSTEM',
						operator: FilterOperator.EQ,
						value1: systemname
					}),

				],
				and: true
			});
			aFilters_dep.push(filter_dep);

			// Start Insert Angelo
			// Additional fields are set through controller
			// Family
			var familyText = this.getView().getModel("i18n").getResourceBundle().getText("familyDet");
			var currentTable = oModTables.getData().filter(function (value) {
				return value.TABLENAME === tablename;
			});

			if (currentTable[0].GROUPID !== null) {
				familyText = familyText + " " + currentTable[0].GROUPID;
			} else {
				familyText = familyText + " No Family";
			}
			this.getView().byId("familyDetail").setText(familyText);
			// End Insert Angelo	

			this.readDB("dependencies", aFilters_dep, true, "dependencies/getDep.xsodata/", "?$orderby=COLLECTOR%20asc", "dep_d", "table_dep");

			this.getSplitAppObj().toDetail(this.createId(sToPageId));
		},

		getSplitAppObj: function () {
			var result = this.byId("SplitApp");
			if (!result) {
				var text = this.getView().getModel("i18n").getResourceBundle().getText("upl_splitapp");
				jQuery.sap.log.info(text);
			}
			return result;
		},
		detail2: function (oEvent) {
			this.getSplitAppObj().to(this.createId("detail2"));
		},

		onSearchTbl: function (oEvent) {
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter_table = new Filter("TABLENAME", sap.ui.model.FilterOperator.Contains, sQuery);
				var allfilter = new sap.ui.model.Filter([filter_table], false);
				aFilters.push(allfilter);
			}
			// update list binding
			var list = this.byId("tables_id");
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");
		},

		onLogin: function (oEvent) {
			// Start Insert Angelo
			// On logout, the tables showed in the details are cleared
			var aEmpty = {
				aData: []
			};

			var oEmptyModel = new JSONModel(aEmpty);

			this.getView().setModel(oEmptyModel, "ver_d");
			this.getView().setModel(oEmptyModel, "dep_d");
			// End Insert Angelo

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("login");
		},

		toUpload: function (Table, Syst, Vers, filename, n_csv) {
			if (!Vers)
				Vers = "0";

			// Start Insert Angelo
			// This is a trick to use version model into the upload controller 
			var oModelVers = this.getView().getModel("ver_d");
			sap.ui.getCore().setModel(oModelVers, "versions");
			// End Insert Angelo

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("upload", {
				table: Table,
				system: Syst,
				vers: Vers,
				uid: uid,
				role: role,
				fname: filename,
				ncsv: n_csv,
				source: "csv"
			});
		},
		toLog: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var tbl_d_data = this.getView().getModel("detail_tbl").getData();
			var table = tbl_d_data.TABLENAME;
			oRouter.navTo("log", {
				table: table,
				username: uid,
				role: role
			});
		},
		recuperaLastVersion: function (tab, syst) {
			var lastvers = "0";
			var e = this.getView().getModel("ver_d").getData();
			if (e.length > 0) {
				lastvers = e[0].VERSION; //Is already sorted by Version
			}
			return lastvers;
		},

		toAdminView: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			// Start Insert Angelo
			// On logout, the tables showed in the details are cleared
			var aEmpty = {};

			var oEmptyModel = new JSONModel(aEmpty);

			this.getView().setModel(oEmptyModel, "ver_d");
			this.getView().setModel(oEmptyModel, "dep_d");
			// End Insert Angelo

			var navHome = "home";
			oRouter.navTo(navHome);
		},
		onUplDialog: function () {
			this.onOpenDialogUpl();
		},
		_getDialogUpl: function () {
			if (!this._oDialogUpl) {
				this._oDialogUpl = sap.ui.xmlfragment("Upload", "ManageTechTables.view.fragment.Upload", this);
				this.getView().addDependent(this._oDialogUpl);
			}
			return this._oDialogUpl;
		},
		onOpenDialogUpl: function () {

			// Start Inserty Angelo
			// Thedialog will be open only when the structures will be the same
			if (!this.getView().byId("iconHeaderDetail").getVisible()) {
				// End Insert Angelo
				this._getDialogUpl().open();

				// Start Insert Angelo
			} else {

				// An error message is shown
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("oldStructureError"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});

				// Progress indicator is removed
				sap.ui.core.BusyIndicator.hide();

				// Lock is removed
				var aData = this.getView().getModel("detail_tbl").getData();
				this.removeLock(aData.TABLENAME);
			}
			// End Insert Angelo
		},
		onCloseDialogUpl: function () {
			var fragmentId = "Upload";
			var fU = sap.ui.core.Fragment.byId(fragmentId, "idfileUploader");
			fU.clear();
			this._getDialogUpl().close();

			// Start Insert Angelo
			// If the user press cancel on the upload popup, the lock must be removed
			var aData = this.getView().getModel("detail_tbl").getData();
			this.removeLock(aData.TABLENAME);
			// End Insert Angelo
		},

		handleTypeMissmatch: function (oEvent) {
			var aFileTypes = oEvent.getSource().getFileType();
			jQuery.each(aFileTypes, function (key, value) {
				aFileTypes[key] = "*." + value;
			});
			var sSupportedFileTypes = aFileTypes.join(", ");
			var a = this.getView().getModel("i18n").getResourceBundle().getText("upl_1");
			var b = this.getView().getModel("i18n").getResourceBundle().getText("upl_2");
			MessageToast.show(a + oEvent.getParameter("fileType") + " " + b + " " + sSupportedFileTypes);
		},
		handleValueChange: function (oEvent) {
			/*			MessageToast.show("Press 'Upload File' to upload file '" + oEvent.getParameter("newValue") + "'");*/
		},
		handleFileSize: function (oEvent) {
			var dim = this.getView().getModel("i18n").getResourceBundle().getText("upl_fsize");
			var text = this.getView().getModel("i18n").getResourceBundle().getText("upl_exceed", dim);
			MessageToast.show(text);
		},
		handleFileNameLength: function (oEvent) {
			var text = this.getView().getModel("i18n").getResourceBundle().getText("upl_fname_exceed");
			MessageToast.show(text);
		},

		// NewCompare for CSV is executed BEFORE the checkDep. This is mandatory to perform the correct check based on the data of the CSV
		executeNewCompareForCSV: function () {

			// Progress indicator is shown
			sap.ui.core.BusyIndicator.show(0);

			var that = this;

			var fragmentId = "Upload";
			var fU = sap.ui.core.Fragment.byId(fragmentId, "idfileUploader");
			if (fU) {

				var tbl_d_data = that.getView().getModel("detail_tbl").getData();
				var tableName = tbl_d_data.TABLENAME;

				var domRef = fU.getFocusDomRef();
				var file = domRef.files[0];
				if (typeof file !== "undefined") {

					fname = fU.getValue(); //Global variable

					// fname = file.name; //Global variable
					var reader = new FileReader();

					reader.onload = function (oEvent, callback) {

						// Start Insert Angelo
						var excelData = oEvent.target.result;
						var result = [];
						var wb = XLSX.read(excelData, {
							type: "binary"
						});
						wb.SheetNames
							.forEach(function (sheetName) {
								var roa = XLSX.utils
									.sheet_to_row_object_array(wb.Sheets[sheetName], {
										header: 1,
										defval: ""
									});
								if (roa.length > 0) {
									result[sheetName] = roa;
								}
							});

						try {
							// All the columns of the excel file
							var excelColumns = result["SAP Document Export"][0];

							// Columns are removed from the result
							result["SAP Document Export"].splice(0, 1);
							result = JSON.stringify(result["SAP Document Export"]);

							var tbl_d_data2 = that.getView().getModel("detail_tbl").getData();
							var dynTable2 = tbl_d_data2.TABLENAME;
							var tbl_d_data = that.getView().getModel("detail_tbl").getData();
							var event = new Date();
							var jsonDate = event.toJSON();

							// All field string creation
							var allField = "(";

							// VALID_TO and VALID_FROM are ignored
							for (var n = 0; n < excelColumns.length; n++) {
								allField = allField + excelColumns[n] + ",";
							}

							allField = allField + "VALID_TO,VALID_FROM)";

							var rowData;

							var jurlProva = "/service/ERPIBERIA_ADN/table_content/newCompareExcel.xsjs";
							jQuery.ajax({
								url: jurlProva,
								async: false,
								data: {
									table: dynTable2,
									rows: result,
									today: jsonDate,
									allField: allField
								},
								method: "POST",
								dataType: "text",
								success: function (response) {
									rowData = response;
								},
								error: function (response) {
									rowData = "ERROR";
								}
							});

							if (rowData[0] !== "[" || rowData === "ERROR") {
								sap.ui.core.BusyIndicator.hide();
								that.onCloseDialogUpl();
								sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("e_csv"), {
									icon: sap.m.MessageBox.Icon.ERROR
								});

								// Start Insert Angelo
								that.removeLock(tableName);
								// End Insert Angelo

							} else {

								var rows = JSON.parse(rowData);
								var oModel = new sap.ui.model.json.JSONModel();

								// Array for columns is rebuild
								var aColumns = [];

								for (var m = 0; m < excelColumns.length; m++) {
									aColumns.push({
										COLUMN_NAME: excelColumns[m]
									});
								}

								oModel.setData({
									columns: aColumns,
									rows: rows
								});
								ncsv = rows.length; //Global variable
								that.getView().setModel(oModel, "tables_d_new");
								that.onLoadTable(tableName, "X");
							}

							that.onCloseDialogUpl();

						} catch (e) {
							// Error message, the template used is not valid
							sap.ui.core.BusyIndicator.hide();
							sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("errorTemplate"), {
								icon: sap.m.MessageBox.Icon.ERROR
							});
						}
					};
					reader.readAsBinaryString(file);
				} else {
					sap.ui.core.BusyIndicator.hide();
					sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("e_csv_select"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
				}
			}
		},

		// Upload from CSV button from HOME_U controller 
		onUpload: function (e) {

			var oGeneralData = this.getView().getModel("detail_tbl").getData();
			var dynTable = oGeneralData.TABLENAME,
				dynSyst = oGeneralData.SYSTEM,
				dynVers = this.recuperaLastVersion(dynTable, dynSyst);

			this.toUpload(dynTable, dynSyst, dynVers, fname, ncsv);
		},

		createNewRowLog: function (date, newVers) {
			var modelDetail = this.getView().getModel("detail_tbl").getData();

			var item = {
				TABLENAME: modelDetail.TABLENAME,
				SYSTEMNAME: modelDetail.SYSTEM,
				VERSION: newVers,
				USERNAME: uid,
				CSV_FILENAME: fname,
				N_CSV: ncsv,
				DATE: date
			};
			return item;
		},

		// Start Insert Angelo
		createNewRowLogDirect: function (date, newVers, tableName) {
			var modelDetail = this.getView().getModel("detail_tbl").getData();

			var item = {
				TABLENAME: tableName,
				SYSTEMNAME: modelDetail.SYSTEM,
				VERSION: newVers,
				USERNAME: uid,
				CSV_FILENAME: fname,
				N_CSV: ncsv,
				DATE: date
			};
			return item;
		},
		// End Insert Angelo

		onSearchTable: function (oEvent) {
			var aFilter = [];

			aFilter.push(new Filter("Tablename", FilterOperator.Contains, oEvent.getSource()._sSearchFieldValue));

			// Binding of the list is taken from oEvent parameter
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilter);
		},

		onShowImportDialog: function () {

			var that = this;

			sap.ui.core.BusyIndicator.show(0);

			var urlZTables = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
			var entityEcc = "/listTableSet";
			var oModelEcc = new sap.ui.model.odata.v2.ODataModel(urlZTables);

			// Dialog fragment load
			if (!this._oDialogImp) {
				this._oDialogImp = sap.ui.xmlfragment("import", "ManageTechTables.view.fragment.import", this);
				this.getView().addDependent(this._oDialogImp);
			}

			oModelEcc.read(entityEcc, {
				success: function (OData) {
					// Model is set
					that.getView().setModel(new JSONModel(OData.results), "importList");

					// Dialog is opened
					that._oDialogImp.open();
					sap.ui.core.BusyIndicator.hide();

				},
				error: function (e) {
					sap.ui.core.BusyIndicator.hide();
					sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("messErrECCTable"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
				}
			});
		},

		// Import functionality, after the table has been selected
		handleSelect: function (oEvent) {

			// Progress indicator is shown
			sap.ui.core.BusyIndicator.show(0);

			var that = this;

			var aCurrentTable = oEvent.getParameter("selectedContexts");
			var tableName = aCurrentTable.map(function (oContext) {
				return oContext.getObject().Tablename;
			});

			// All blank spaces are removed
			tableName[0] = tableName[0].replace(/\s/g, "");

			// Start Insert Angelo
			// This oData returns a flag that tells if the current structure on ADN is updated
			var sStructureService = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";

			var oModel = new sap.ui.model.odata.v2.ODataModel(sStructureService);

			var sEntityStructure = "/tableSet('" + tableName[0] + "')/tableStructureSet";

			// Model read from SAP, using tablename
			oModel.read(sEntityStructure, {
				method: "GET",
				success: function (result) {

					if (result.results[0].Flag === "KO") {
						// Table "TABLES" is updated, with a structure overwrite

						// A message is shown to the user
						sap.m.MessageBox.confirm(that.getView().getModel("i18n").getResourceBundle().getText("overwriteStructureText"), {
							icon: sap.m.MessageBox.Icon.CONFIRM,
							title: that.getView().getModel("i18n").getResourceBundle().getText("messTitleConfirm"),
							actions: [
								sap.m.MessageBox.Action.YES,
								sap.m.MessageBox.Action.NO
							],
							onClose: function (action) {
								if (action === sap.m.MessageBox.Action.YES) {
									that.updateTableDB(tableName[0], false);
								} else {
									// Progress indicator is removed
									sap.ui.core.BusyIndicator.hide();
								}
							}
						});
					} else {
						// Table "TABLES" is updated, with a new structure
						that.updateTableDB(tableName[0], true);
					}
				},
				error: function (e) {}
			});
			// End Insert Angeloc
		},

		updateTableDB: function (tableName, newImport) {

			var that = this;

			// Description of the table is taken from SAP
			var urlEcc = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
			var oModelDesc = new sap.ui.model.odata.v2.ODataModel(urlEcc);
			var entityDesc = "/tableDetailsSet('" + tableName + "')";

			oModelDesc.read(entityDesc, {
				success: function (OData) {

						// Start Insert Angelo
						var newTableName;
						var newStructureVersion;

						// This code is executed when the current structure must be overwritten
						if (newImport === false) {

							// Service that retrieves the current version of the structure
							var vServiceGetVersion = "/service/ERPIBERIA_ADN/versions/getStructVersion.xsjs";
							jQuery.ajax({
								url: vServiceGetVersion,
								async: false,
								data: {
									tableName: tableName
								},
								method: "POST",
								dataType: "text",
								success: function (results) {
									newStructureVersion = JSON.parse(results);
									if (newStructureVersion.STRUCTVERSION === null) {
										newStructureVersion.STRUCTVERSION = 0;
									}
									newStructureVersion.STRUCTVERSION++;
									newTableName = "OLD_" + tableName + "_" + newStructureVersion.STRUCTVERSION;
								}
							});

							// Service that renames the current table used by ADN
							var vServiceNewStructure = "/service/ERPIBERIA_ADN/tables/renameTable.xsjs";
							jQuery.ajax({
								url: vServiceNewStructure,
								async: false,
								data: {
									currentTable: tableName,
									newTable: newTableName
								},
								method: "POST",
								dataType: "text",
								success: function (results) {
									if (results === "OK") {
										// Case of already existing structure
										// Every necessary data is saved into a model, in order to retrieve the data
										// later during the code execution. This decisione has been take in order to
										// left the dialog popup about version free from other parameters
										var aDataImport = {
											tableName: tableName,
											oldTableName: newTableName,
											system: OData.System,
											newImport: newImport,
											newStructureVersion: newStructureVersion.STRUCTVERSION
										};

										var oModelImport = new JSONModel(aDataImport);
										that.getView().setModel(oModelImport, "import");

										that._selectVersionDialog("IMPORT", newStructureVersion.VERSION);
									} else {

										// Progress indicator is removed
										sap.ui.core.BusyIndicator.hide();
										sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText(
											"errorRename"), {
											icon: sap.m.MessageBox.Icon.ERROR
										});
									}
								}
							});

						}

						if (newImport === true) {
							// A new row on table "TABLES" must be created
							that.createNewTableRow(tableName, OData.Description, OData.System, newImport);
						}
					}
					// End Insert Angelo
			});
		},

		createNewTableRow: function (tableName, description, system, newImport) {

			var that = this;

			// Service Address
			var serviceURL = "/service/ERPIBERIA_ADN/tables/tables.xsodata";

			// Model creation
			var oModel = new sap.ui.model.odata.v2.ODataModel(serviceURL);

			var newTableRow = that._getNewTableRow(tableName, description, system);

			// Model read from SAP (table name, row)
			oModel.create("/tables", newTableRow, {
				method: "POST",
				success: function (data) {

					//A model containing data is created, in order to have it available in the next functions
					var aDataImport = {
						tableName: tableName,
						system: system,
						newImport: newImport,
						newStructureVersion: 0
					};

					var oModelImport = new JSONModel(aDataImport);
					that.getView().setModel(oModelImport, "import");

					that.onFinishImport("1.0");
				},
				error: function (response) {

					// Progress indicator is removed
					sap.ui.core.BusyIndicator.hide();

					sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messErrTableExist"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
				}
			});
		},

		// Function that created a new structure overwriting the old    
		onFinishImport: function (version) {

			// This block of code must be reviewed
			var oImportData = this.getView().getModel("import").getData();

			var that = this;

			var urlEcc = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";

			// Current day must be the same for every operation executed
			var newDay = new Date();

			// This code is executed when a new OLD table is generated. The service rewrites the dates inserted
			// on the table, in order to make the getContent work again
			if (oImportData.newImport === false) {
				var sURLDates = "/service/ERPIBERIA_ADN/table_content/updateOldDates.xsjs";

				var vOldTable = "OLD_" + oImportData.tableName + "_" + oImportData.newStructureVersion;

				jQuery.ajax({
					url: sURLDates,
					async: false,
					data: {
						oldTable: vOldTable,
						date: newDay.toJSON()
					},
					method: "POST",
					dataType: "text",
					success: function (results) {}
				});
			}

			// Table structure section
			var oModelEcc = new sap.ui.model.odata.v2.ODataModel(urlEcc);

			// Structure of table is taken from ECC
			var entityEcc = "/tableSet('" + oImportData.tableName + "')/tableStructureSet";

			// A filter is set for the table structure
			var oFilter = new Filter({
				path: "Flag",
				operator: FilterOperator.EQ,
				value1: "X"
			});

			var aFilter = [];
			aFilter.push(oFilter);

			// Structure is readed from ECC
			oModelEcc.read(entityEcc, {
				filters: aFilter,
				success: function (OData) {

					// XSJS service is called to create the tables
					var createTableURL = "/service/ERPIBERIA_ADN/tables/createNewTable.xsjs";

					jQuery.ajax({
						url: createTableURL,
						async: false,
						data: {
							table: oImportData.tableName,
							columns: OData.results[0].Structure,
							newImport: oImportData.newImport
						},
						method: "POST",
						dataType: "text",
						success: function (results) {

							// If the tables are created, the data from ECC must copied to HANA XS
							if (results === "OK") {

								// Content of the current table is readed from ECC
								entityEcc = "/tableSet('" + oImportData.tableName + "')/rowContentSet";

								oModelEcc.read(entityEcc, {
									success: function (oData) {

										// Start Insert Angelo
										// This code is used to remove every dependency created using the current table
										// It's necessary because the new imported structure cannot have some of the fields
										if (oImportData.newImport === false) {
											var sURL = "/service/ERPIBERIA_ADN/dependencies/delDepFromTable.xsjs";

											jQuery.ajax({
												url: sURL,
												async: false,
												data: {
													table: oImportData.tableName,
													oldTable: oImportData.oldTableName,
													system: oImportData.system
												},
												method: "POST",
												dataType: "text",
												success: function () {}
											});
										}
										// End Insert Angelo

										var rowsNumber = oData.results.length;

										// Case of no data existing on ECC
										if (rowsNumber === 0) {

											var newRowNoData = that.createNewRowVers(oImportData.tableName, oImportData.system, version, newDay,
												uid,
												oImportData.system,
												0, null, oImportData.newStructureVersion);
											that.createDBEcc("versions", "true", "versions/getVersions.xsodata", newRowNoData);

											// Loading indicator is removed
											sap.ui.core.BusyIndicator.hide();

											sap.m.MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText("s_update_new",
												version), {
												icon: sap.m.MessageBox.Icon.SUCCESS,
												onClose: that.readDBtableslist("tables", "", false, "tables/lastVersions.xsjs", "", uid, oImportData.tableName) //To refresh data
											});
										} else {

											// Data from ECC has been taken correctly
											var arrayECC = [];

											for (var i = 0; i < oData.results.length; i++) {
												arrayECC.push(oData.results[i].Row);
											}
											// The data retrieved from ECC is converted to a String, in order to be passed at the HANA XS service
											arrayECC = JSON.stringify(arrayECC);

											// The new procedure is called
											var urlUploadDirect = "/service/ERPIBERIA_ADN/table_content/uploadFromEccDirect.xsjs";

											// Current date is taken from object Date   
											var today = newDay.toJSON();

											// Column names
											var col = that.getColumn(oImportData.tableName);

											var allField = "(";
											for (i = 0; i < col.length; i++) {
												var column = col[i].COLUMN_NAME;
												allField = allField + column + ",";
											}
											allField = allField + "VALID_TO,VALID_FROM)";

											// Upload from ECC direct
											jQuery.ajax({
												url: urlUploadDirect,
												async: true,
												data: {
													table: oImportData.tableName,
													rows: arrayECC,
													today: today,
													allField: allField
												},
												method: "POST",
												dataType: "text",
												success: function () {

													var newRow = that.createNewRowVers(oImportData.tableName, oImportData.system, version, newDay,
														uid,
														oImportData.system,
														rowsNumber,
														"X", oImportData.newStructureVersion);
													that.createDBEcc("versions", "true", "versions/getVersions.xsodata", newRow);

													// var newRowLog = that.createNewRowLogDirect(new Date(), "1.0", tableName);
													// that.createDBEcc("log", "true", "log/getLog.xsodata", newRowLog);

													// Loading indicator is removed
													sap.ui.core.BusyIndicator.hide();

													sap.m.MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText(
														"s_update_new",
														version), {
														icon: sap.m.MessageBox.Icon.SUCCESS,
														onClose: that.readDBtableslist("tables", "", false, "tables/lastVersions.xsjs", "", uid,
																oImportData.tableName) //To refresh data
													});
												},
												error: function () {
													// Loading indicator is removed
													sap.ui.core.BusyIndicator.hide();

													sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText(
														"messErrECCUpdateDirect"), {
														icon: sap.m.MessageBox.Icon.ERROR,
														// Start Insert Angelo
														onClose: that.readDBtableslist("tables", "", false, "tables/lastVersions.xsjs", "", uid,
																oImportData.tableName) //To refresh data
															// End Insert Angelo
													});
												}
											});
										}

									}, //End success rowContentSet
									error: function () {
										// Loading indicator is removed
										sap.ui.core.BusyIndicator.hide();

										sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText(
											"messErrECCGetData"), {
											icon: sap.m.MessageBox.Icon.ERROR
										});
									}
								});
							}
						}, //End success createNewTable
						error: function () {
							// Progress indicator is removed
							sap.ui.core.BusyIndicator.hide();

							sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText(
								"messErrECCTableCreation"), {
								icon: sap.m.MessageBox.Icon.ERROR
							});
						}

					});

				}, //End success tableStructureSet
				error: function () {
					// Progress indicator is removed
					sap.ui.core.BusyIndicator.hide();

					sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messErrECCStructure"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
				}
			});
		},

		_cleanTableRow: function (oModel, tableName) {

			var deleteRow;

			// Table creation is failed, the record inserted on "tables" must be removed
			oModel.remove("/tables('" + tableName + "')", {
				method: "DELETE",
				success: function () {
					deleteRow = "OK";
				},
				error: function () {
					deleteRow = "KO";
				}
			});
		},

		_getNewTableRow: function (tableName, description, vSystem) {

			// Date object
			var date = new Date();

			// Row creation
			var tableRow = {
				TABLENAME: tableName,
				// SYSTEM: modelDetail.SYSTEM,
				SYSTEM: vSystem,
				DESCRIPTION: description,
				RESPONSIBLE: uid,
				CREATIONDATE: date
			};

			return tableRow;
		},
		// End Insert Angelo

		readDBTable: function (vers, idx) {

			var that = this;

			var tbl_d_data = this.getView().getModel("detail_tbl").getData();
			var dynTable = tbl_d_data.TABLENAME,
				dynSyst = tbl_d_data.SYSTEM;
			var dynVers;
			if (vers) {
				dynVers = vers;
			} else {
				dynVers = this.recuperaLastVersion(dynTable, dynSyst);
			}

			// Start Insert Angelo
			var oldTable = this.determineOldTable(dynTable, vers);

			// oldTable must be an empty string if it's undefined
			if (oldTable === undefined) {
				oldTable = "";
			}
			// End Insert Angelo

			// A model for the threaded logic is set
			var aDataThread = {
				table: dynTable,
				system: dynSyst,
				version: dynVers,
				oldTable: oldTable
			};

			var oModelThread = new JSONModel(aDataThread);
			that.getView().setModel(oModelThread, "thread");
			// End Insert Angelo

			var rowData;
			var jurl = "/service/ERPIBERIA_ADN/table_content/getcontent.xsjs";

			jQuery.ajax({
				url: jurl,
				async: true,
				data: {
					table: dynTable,
					system: dynSyst,
					version: dynVers,
					oldTable: oldTable
				},
				method: "GET",
				dataType: "text",
				complete: function () {
					// sap.ui.core.BusyIndicator.hide();
				},
				beforeSend: function () {
					sap.ui.core.BusyIndicator.show(0);
				},
				success: function (response) {
					rowData = response;
					var columnData;

					// Start Insert Angelo
					// var vCurrentTable;
					if (oldTable !== "") {
						columnData = that.getColumnsForDetail(oldTable);
					} else {
						columnData = that.getColumnsForDetail(dynTable);
					}
					// End Insert Angelo

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

					// Start Insert Angelo
					// "{ path: 'table_ver_d>/', formatter: '.formatter.visiblerow' }"

					var visibleRows;

					if (row.length < 10) {
						visibleRows = row.length;
					} else {
						visibleRows = 20;
					}

					var oTable = new sap.ui.table.Table("table_ver_d", {
						selectionMode: "None",
						visibleRowCount: visibleRows,
						// visibleRowCount: "auto",
						firstVisibleRow: 1,
						enableColumnReordering: true,
						width: "100%"
					});

					var oHBox = that.byId("boxContent");
					oHBox.addItem(oTable);

					var flag = true;

					oTable.addEventDelegate({
						onAfterRendering: function () {
							if (flag === true) {
								for (var i = 0; i < oTable.getColumns().length; i++) {

									oTable.autoResizeColumn(i);

									if (i === 0) {
										var currentWidth = oTable.getColumns()[i].getWidth();
									}

									if (currentWidth === oTable.getColumns()[i].getWidth()) {
										if (flag !== false) {
											flag = true;
										}
									} else {
										// If at least one column have a different width, the "onAfterRendering" is not recalled
										flag = false;
									}
									currentWidth = oTable.getColumns()[i].getWidth();
								}
								if (oTable.getColumns().length !== 0) {
									// The scroll is delayed by 100ms in order to allow the columns to be set
									that.getView().byId("scrollContainer").scrollTo(0, 0, 100);

									// Progress indicator is removed
									sap.ui.core.BusyIndicator.hide();
								}
							}
						}

					});
					// End Insert Angelo

					var e = that.getView().getModel("ver_d").getData();
					var vers_d = e[idx].VERSION;
					var table_d = e[idx].TABLENAME;
					that.getView().setModel(oModel, "table_ver_d");
					that.dyn_tab(table_d, vers_d);

					that.getSplitAppObj().to(that.createId("detailDetail"));

				},
				error: function (response) {
					rowData = "ERROR";
				}
			});
		},

		dyn_tab: function (table_d, vers_d) {

			var oView = this.getView();
			var oMod = oView.getModel("table_ver_d");
			// var oTable = oView.byId("table_ver_d");
			var oTable = sap.ui.getCore().byId("table_ver_d");

			// Start Insert Angelo
			// Code that retrieve the fields description
			var sURL = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
			var oModel = new sap.ui.model.odata.v2.ODataModel(sURL);
			var sEntity = "/tableSet('" + table_d + "')/descriptionFieldSet";

			// Start Insert Angelo
			var sNoDescription = this.getView().getModel("i18n").getResourceBundle().getText("noDescription");
			// End Insert Angelo

			oModel.read(sEntity, {
				method: "GET",
				success: function (result) {

					// Start Insert Angelo
					var aFieldDesc = JSON.parse(result.results[0].Structure);
					// End Insert Angelo

					oTable.setTitle(table_d + " v" + vers_d);
					oTable.setModel(oMod);
					oTable.bindColumns("/columns", function (sId, oContext) {
						var columnName = oContext.getObject().COLUMN_NAME;

						var key = oContext.getObject().KEY;

						var oLabel = new sap.m.Label("", {
							text: columnName
						});

						// If the current field is a key field, it will be shown in bold characters
						if (key !== null) {
							oLabel.setDesign(sap.m.LabelDesign.Bold);
						}

						// Start Insert Angelo
						var sCurrentDesc = aFieldDesc.filter(function (value) {
							return value.field === columnName;
						});

						// If the description is not found, the same name will be replicated on both labels
						if (sCurrentDesc.length === 0) {
							sCurrentDesc.push({
								desc: columnName
							});
						}

						// This logic is applied when a blank descriptio is returned
						if (sCurrentDesc.length === 1) {
							if (sCurrentDesc[0].desc === undefined) {
								sCurrentDesc[0].desc = sNoDescription
							}
						}
						// End Insert Angelo

						return new sap.ui.table.Column({
							multiLabels: [
								new sap.ui.commons.Label({
									text: sCurrentDesc[0].desc
								}),
								oLabel
							],
							filterProperty: columnName,
							template: columnName,
							autoResizable: true,
							width: "auto"
						});
					});
					oTable.bindRows("/rows");

				}
			});
			// End Insert Angelo
		},

		onDwn_vers: function () {
			sap.ui.core.BusyIndicator.show(0);
			jQuery.sap.require("sap.ui.core.util.Export");
			jQuery.sap.require("sap.ui.core.util.ExportTypeCSV");
			var oTable = this.getView().byId("table_ver_d");
			var oModel = oTable.getModel();
			//oTable : tabella dinamica che hai costruito e per cui hai settato un modello con "columns" e "rows"
			var arrayColumns = oModel.getData().columns;
			var columnsDyn = [];
			for (var i = 0; i < arrayColumns.length; i++) {
				if (arrayColumns[i].COLUMN_NAME != "VALID_FROM" && arrayColumns[i].COLUMN_NAME != "VALID_TO") {
					var col = {
						name: "",
						template: {
							content: ""
						}
					};
					col.name = arrayColumns[i].COLUMN_NAME;
					col.template.content = "{" + arrayColumns[i].COLUMN_NAME + "}";
					columnsDyn.push(col);
				}
			}
			var oExport = new sap.ui.core.util.Export({
				exportType: new sap.ui.core.util.ExportTypeCSV({
					separatorChar: ";"
				}),
				models: oModel,
				rows: {
					path: "/rows/"
				},
				columns: columnsDyn
			});

			var tabname = this.getView().byId("table_ver_d").getTitle().getText();

			var d = new Date();
			var date = ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "." + d.getFullYear() + "_" + d.getHours() +
				"." + d.getMinutes();
			var fname_dwn = tabname + "_" + date;
			oExport.saveFile(fname_dwn).always(function () {
				this.destroy();
			});
			sap.ui.core.BusyIndicator.hide();
		},

		onFragmentCSVPress: function (oEvent) {
			this.loadGlobalDependencies("CSV");
		},

		loadGlobalDependencies: function (sFunction) {
			// Dependencies data is loaded globally
			var oModDep = this.getView().getModel("dep_d").getData();
			sap.ui.getCore().setModel(oModDep, "model_Dep");

			// Name of the table   
			var tableName = this.getView().getModel("detail_tbl").getData().TABLENAME;

			// This logic is used to determine from where this function has been called
			// Start Delete Angelo
			// if (oEvent.getSource().getId().substr(oEvent.getSource().getId().lastIndexOf("-") + 1) === "uploadCSVFragment") {
			// End Delete Angelo

			// Start Insert Angelo
			if (sFunction === "CSV") {
				// End Insert Angelo

				// Here we need to load the temporary table first, in order to execute the correct checkDep
				this.executeNewCompareForCSV();
			} else {
				this.onLoadTable(tableName);
			}
		},

		// Compare button on HOME_U view
		toCompare: function (oEvent) {

			// Start Insert Angelo
			var modelDetail = this.getView().getModel("detail_tbl").getData();

			if (!this.getView().byId("iconHeaderDetail").getVisible()) {
				// End Insert Angelo

				sap.ui.core.BusyIndicator.show(0);

				var that = this;
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				var urlEcc = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
				var oModelEcc = new sap.ui.model.odata.v2.ODataModel(urlEcc);

				var entityEcc = "/tableSet('" + modelDetail.TABLENAME + "')/rowContentSet";
				oModelEcc.read(entityEcc, {
					//				async:true,
					success: function (oData) {

						var arrayECC = [];

						for (var i = 0; i < oData.results.length; i++) {
							arrayECC.push(oData.results[i].Row);
						}
						arrayECC = JSON.stringify(arrayECC);
						var urlCompare = "/service/ERPIBERIA_ADN/table_content/newCompare.xsjs";
						var newDay = new Date();
						var today = newDay.toJSON();
						var col = that.getColumn(modelDetail.TABLENAME);

						// allField logic
						var allField = "(";
						for (var j = 0; j < col.length; j++) {
							var column = col[j].COLUMN_NAME;
							allField = allField + column + ",";
						}
						allField = allField + "VALID_TO,VALID_FROM)";

						jQuery.ajax({
							url: urlCompare,
							async: true,
							data: {
								table: modelDetail.TABLENAME,
								rows: arrayECC,
								today: today,
								allField: allField
							},
							method: "POST",
							dataType: "text",
							success: function (response) {

								// Start Delete Angelo
								// Function that deletes every temporary table created
								// that.onDelTable();
								// End Delete Angelo

								if (response.substr(0, 1) === "[") {
									var rowData = response;
									var rowTable = JSON.parse(rowData);
									var oModel = new sap.ui.model.json.JSONModel();
									oModel.setData({
										columns: col,
										rows: rowTable
									});
									that.getView().setModel(oModel, "tables_d_new");

									// This is a trick to use version model into the upload controller 
									var oModelVers = that.getView().getModel("ver_d");
									sap.ui.getCore().setModel(oModelVers, "versions");

									oRouter.navTo("upload", {
										table: modelDetail.TABLENAME,
										system: modelDetail.SYSTEM,
										vers: modelDetail.VERSION,
										uid: uid,
										role: role,
										fname: "X",
										ncsv: "X",
										source: "ECC",
										// Start Insert Angelo
										mode: modelDetail.MODE
											// End Insert Angelo
									});
								} else {
									sap.ui.core.BusyIndicator.hide();
									sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messErrECCComp"), {
										icon: sap.m.MessageBox.Icon.ERROR
									});
								}
							},
							error: function (e) {

								// Start Delete Angelo
								// that.onDelTable();
								// End Delete Angelo

								sap.ui.core.BusyIndicator.hide();
								sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messErrECCComp"), {
									icon: sap.m.MessageBox.Icon.ERROR
								});
							}
						});
						// Start Delete Angelo
						// }
						// End Delete Angelo
					},
					error: function (e) {
						sap.ui.core.BusyIndicator.hide();
						sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messErrECC"), {
							icon: sap.m.MessageBox.Icon.ERROR
						});
					}
				});
			}
			// Start Insert Angelo
			else {
				// Error message is showed
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("oldStructureError"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});

				// Progress indicator is removed
				sap.ui.core.BusyIndicator.hide();

				// Lock for the current table is removed
				this.removeLock(modelDetail.TABLENAME);
			}
			// End Insert Angelo
		},

		// Analyze button on HOME_U view
		toAnalyze: function (oEvent) {

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var tbl = this.getView().getModel("detail_tbl").getData();
			var table = tbl.TABLENAME;
			var version = this.recuperaLastVersion();

			// Start Insert Angelo
			// We need the current depency data showed on the home for the user
			var oModDep = this.getView().getModel("dep_d").getData();
			sap.ui.getCore().setModel(oModDep, "model_Dep");
			// End Insert Angelo

			oRouter.navTo("analysis", {
				table: table,
				uid: uid,
				role: role,
				version: version
			});
		},
		tocreateDep: function () {
			var tbl_d_data = this.getView().getModel("detail_tbl").getData();
			var tab = tbl_d_data.TABLENAME,
				syst = tbl_d_data.SYSTEM;
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var oModDep = this.getView().getModel("dep_d").getData();
			sap.ui.getCore().setModel(oModDep, "model_Dep");
			oRouter.navTo("dep", {
				uid: uid,
				role: role,
				tab: tab,
				syst: syst
			});
		},

		onDelDep: function (oEvent) {
			var //oList = oEvent.getSource(),
				oItem = oEvent.getParameter("listItem"),
				sPath = oItem.getBindingContext("dep_d").getPath();
			var oModel = this.getView().getModel("dep_d");
			var idx = sPath.split("/")[1];
			var oData = oModel.getData();
			var that = this;

			jQuery.sap.require("sap.m.MessageBox");

			// Value of single dependences is taken
			var noCollector = this.getView().getModel("i18n").getResourceBundle().getText("noCollector");

			// A different message is shown based on the type of dependence selected
			if (oData[idx].COLLECTOR !== noCollector) {
				// Combinated dependencies logic
				sap.m.MessageBox.confirm(that.getView().getModel("i18n").getResourceBundle().getText("messDelDepCombo"), {
					icon: sap.m.MessageBox.Icon.CONFIRM,
					title: that.getView().getModel("i18n").getResourceBundle().getText("messTitleConfirm"),
					actions: [
						sap.m.MessageBox.Action.YES,
						sap.m.MessageBox.Action.NO
					],
					onClose: function (action) {
						if (action === sap.m.MessageBox.Action.YES) {
							var jurl = "/service/ERPIBERIA_ADN/dependencies/delDepCollector.xsjs";
							var result;
							jQuery.ajax({
								url: jurl,
								async: false,
								data: {
									ori_table: oData[idx].ORI_TABLE,
									collector: oData[idx].COLLECTOR
								},
								method: "POST",
								dataType: "text",
								success: function (response) {
									result = response;
								},
								error: function (response) {
									result = "ERROR";
								}
							});
							// Result is OK only when multiple field have been deleted
							// if (result !== "1") {
							if (result === "OK") {
								sap.m.MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText("s_success_deldep"), {
									icon: sap.m.MessageBox.Icon.SUCCESS
								});
								// Filter function retrieves only the data that will remain on the table
								oData = oData.filter(function (value) {
									return value.COLLECTOR !== oData[idx].COLLECTOR;
								});
								oModel.setData(oData);
								oModel.refresh();
							} else {
								sap.m.MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText("messDepDeleError"), {
									icon: sap.m.MessageBox.Icon.ERROR
								});
							}
						}
					}
				});

			} else {
				// Single dependence logic
				sap.m.MessageBox.confirm(that.getView().getModel("i18n").getResourceBundle().getText("messdeleDepConfirm"), {
					icon: sap.m.MessageBox.Icon.CONFIRM,
					title: that.getView().getModel("i18n").getResourceBundle().getText("messTitleConfirm"),
					actions: [
						sap.m.MessageBox.Action.YES,
						sap.m.MessageBox.Action.NO
					],
					onClose: function (action) {
						if (action === sap.m.MessageBox.Action.YES) {
							var jurl = "/service/ERPIBERIA_ADN/dependencies/deleDep.xsjs";
							var result;
							jQuery.ajax({
								url: jurl,
								async: false,
								data: {
									ori_field: oData[idx].ORI_FIELD,
									ori_system: oData[idx].ORI_SYSTEM,
									ori_table: oData[idx].ORI_TABLE,
									dest_field: oData[idx].DEST_FIELD,
									dest_system: oData[idx].DEST_SYSTEM,
									dest_table: oData[idx].DEST_TABLE,
									collector: oData[idx].COLLECTOR
								},
								method: "POST",
								dataType: "text",
								success: function (response) {
									result = response;
								},
								error: function (response) {
									result = "ERROR";
								}
							});
							// if (result === "1") {
							if (result === "OK") {
								sap.m.MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText("s_success_deldep"), {
									icon: sap.m.MessageBox.Icon.SUCCESS
								});
								oData.splice(idx, 1);
								oModel.updateBindings(true);
							} else {
								sap.m.MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText("messDepDeleError"), {
									icon: sap.m.MessageBox.Icon.ERROR
								});
							}
						}
					}
				});
			}
		},

		onCompareVersions: function () {

			// Progress indicator is shown
			sap.ui.core.BusyIndicator.show(0);

			var oSelectedRows = this.getView().byId("table_vers").getSelectedItems().length;

			if (oSelectedRows <= 1 || oSelectedRows > 2) {
				sap.ui.core.BusyIndicator.hide();

				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("messErrCompVers"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
			} else {

				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

				var aDataSelected = this.getView().byId("table_vers").getSelectedItems();
				// var tbl_d_data = this.getView().byId("table_vers").getSelectedItem().getCells();

				var firstSelection = aDataSelected[0].getCells();
				var lastSelection = aDataSelected[1].getCells();

				// This variables contains the first version selected 
				var firstTable = firstSelection[0].getText(),
					firstSyst = firstSelection[1].getText(),
					firstVers = firstSelection[2].getText();

				// This variables contains the latest version selected
				var lastTable = lastSelection[0].getText(),
					lastSyst = lastSelection[1].getText(),
					lastVers = lastSelection[2].getText();

				if (firstSelection[8].getText() === "X" || lastSelection[8].getText() === "X") {
					// Progress indicator is removed
					sap.ui.core.BusyIndicator.hide();

					sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("oldStructureError"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
				} else {

					var rowData;

					var that = this;

					// First table will be loaded on temporary table on HANA DB
					var jurl = "/service/ERPIBERIA_ADN/table_content/getcontent.xsjs";
					jQuery.ajax({
						url: jurl,
						async: true,
						data: {
							table: firstTable,
							system: firstSyst,
							version: firstVers,
							oldTable: ""
						},
						method: "GET",
						dataType: "text",
						complete: function () {
							// sap.ui.core.BusyIndicator.hide();
						},
						beforeSend: function () {
							// sap.ui.core.BusyIndicator.show(0);
						},
						success: function (response) {
							rowData = response;
							var columnData;
							var jurl2 = "/service/ERPIBERIA_ADN/table_content/getcolumns.xsjs";
							jQuery.ajax({
								url: jurl2,
								async: false,
								data: {
									table: firstTable
								},
								method: "GET",
								dataType: "text",
								success: function (columns) {
									columnData = columns;
								},
								error: function (columns) {
									columnData = "ERROR";
								}
							});
							var oModel = new sap.ui.model.json.JSONModel();
							var col = JSON.parse(columnData);

							// Columns like VALID_FROM or VALID_TO are removed from the list that will be passed to the
							// uploadFromEcc service	
							var ind;
							ind = col.findIndex(function (el) {
								return el.COLUMN_NAME === "VALID_FROM";
							});
							col.splice(ind, 1);
							ind = col.findIndex(function (el) {
								return el.COLUMN_NAME === "VALID_TO";
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
							var urlUpload = "/service/ERPIBERIA_ADN/table_content/uploadFromEccJSON.xsjs";
							var newDay = new Date();
							var today = newDay.toJSON();

							// allField logic, the field contains every columns
							var allField = "(";
							for (var i = 0; i < col.length; i++) {
								var column = col[i].COLUMN_NAME;
								allField = allField + column + ",";
							}
							row = JSON.stringify(row);
							allField = allField + "VALID_TO,VALID_FROM)";

							jQuery.ajax({
								url: urlUpload,
								async: true,
								data: {
									table: firstTable,
									rows: row,
									today: today,
									allField: allField
								},
								method: "POST",
								dataType: "text",
								success: function (oData) {

									// Last table will be passed to perform the comparison
									var urlCompare = "/service/ERPIBERIA_ADN/table_content/newCompareVersions.xsjs";
									var compareData;

									jQuery.ajax({
										url: urlCompare,
										async: false,
										data: {
											table: lastTable,
											allField: allField,
											system: lastSyst,
											version: lastVers
										},
										method: "POST",
										dataType: "text",
										success: function (oDataCompare) {
											compareData = oDataCompare;
										},
										error: function (oDataCompare) {
											compareData = "ERROR";
										}
									});

									if (compareData[0] !== "[" || compareData === "ERROR") {
										// Progress indicator is removed
										sap.ui.core.BusyIndicator.hide();

										sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("versionCompareFailed"), {
											icon: sap.m.MessageBox.Icon.ERROR
										});
									} else {

										var rowTable = JSON.parse(compareData);
										var oModelCompare = new sap.ui.model.json.JSONModel();
										oModelCompare.setData({
											columns: col,
											rows: rowTable
										});
										that.getView().setModel(oModelCompare, "tables_d_new");

										// This is a trick to use version model into the upload controller 
										var oModelVers = that.getView().getModel("ver_d");
										sap.ui.getCore().setModel(oModelVers, "versions");

										// Progress indicator is removed
										sap.ui.core.BusyIndicator.hide();

										oRouter.navTo("upload", {
											table: firstTable,
											system: firstSyst,
											vers: firstVers + " compared to " + lastTable + " " + lastVers,
											uid: uid,
											role: role,
											fname: "X",
											ncsv: "K",
											source: "ECC",
											// Start Insert Angelo
											mode: "NULL"
												// End Insert Angelo
										});
									}
								},
								error: function (oData) {
									rowData = "ERROR";
								}
							});
						},
						error: function () {

							// Progress indicator is removed
							sap.ui.core.BusyIndicator.hide();

							sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("versionCompareFailed"), {
								icon: sap.m.MessageBox.Icon.ERROR
							});
						}
					});
				}
			}
		},

		goToStructure: function () {

			var oModelData = this.getView().getModel("detail_tbl").getData();
			var tableName = oModelData.TABLENAME;

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Structure", {
				table: tableName,
				uid: uid,
				role: role
			});
		},

		selectFamily: function (oEvent) {

			var aFilter = [];

			var family = oEvent.getParameters().value;

			// Filter is created only when the filter needs to be applied
			if (family !== "All") {

				var oFilter = new sap.ui.model.Filter({
					path: "GROUPID",
					operator: FilterOperator.EQ,
					value1: family
				});

				aFilter.push(oFilter);
			}

			var oListBinding = this.getView().byId("tables_id").getBinding("items");
			oListBinding.filter(aFilter);
		},

		onDownloadExcel: function () {

			var that = this;

			// A message is shown to the user, the popup must not be closed in order to download the excel
			sap.m.MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("popupExcelWarning"), {
				icon: sap.m.MessageBox.Icon.CONFIRM,
				title: this.getView().getModel("i18n").getResourceBundle().getText("messTitleConfirm"),
				actions: sap.m.MessageBox.Action.OK,
				onClose: function (action) {
					// Columns are generated at runtime
					var aColumns = that.createExcelColumns();

					// URL creation for the new page 
					var sRootPath = jQuery.sap.getModulePath("ManageTechTables");
					var sURL = sRootPath + "/excel.html";

					// This model contains the data used to perform again the data extraction
					// This is necessary because it's impossibile to transfer large amount of data between tabs
					var aDataThread = that.getView().getModel("thread").getData();

					var sURLParams = "?table=" + encodeURIComponent(aDataThread.table) +
						"&system=" + encodeURIComponent(aDataThread.system) +
						"&version=" + encodeURIComponent(aDataThread.version) +
						"&oldTable=" + encodeURIComponent(aDataThread.oldTable) +
						"&reqLocal=false" + //No localStorage required
						"&columns=" + encodeURIComponent(JSON.stringify(aColumns));

					window.open(sURL + sURLParams, "ExcelWindow", "noopener,width");
				}
			});
		},

		createExcelColumns: function () {

			var aColumns = [];

			var columns = this.getView().getModel("table_ver_d").getData().columns;

			for (var i = 0; i < columns.length; i++) {
				aColumns.push({
					property: columns[i].COLUMN_NAME,
					type: "string"
				});
			}

			return aColumns;
		},

		// Start Insert Angelo
		toLabels: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			oRouter.navTo("Labels", {});
		},
		// End Insert Angelo
		//Start Insert Andrea
		toMassiveLog: function () {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				var tbl_d_data = this.getView().getModel("detail_tbl").getData();
				var table = tbl_d_data.TABLENAME;
				oRouter.navTo("massiveLog", {
					table: table,
					username: uid,
					role: role
				});
		},
		readDBtableslista: function (entitySet, filters, asyncr, method, order, username) {
			var jurl = "/service/ERPIBERIA_ADN/" + method;

			var result;
			jQuery.ajax({
				url: jurl,
				async: asyncr,
				data: {
					username: username
				},
				method: "GET",
				dataType: "text",
				success: function (response) {
					result = JSON.parse(response);
				},
				error: function (xhr) {
					result = "ERROR";
				}
			});
			if (result != "ERROR") {
				this.changeformatdate(result);
				return result;
			}
		}
		//End Insert Andrea
	});
});