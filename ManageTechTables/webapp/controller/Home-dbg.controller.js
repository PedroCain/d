sap.ui.define([
	"ManageTechTables/ManageTechTables/controller/BaseController",
	// "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"ManageTechTables/model/formatter",
	"sap/ui/core/Fragment",
	"sap/ui/model/ValidateException",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"jquery.sap.global"
], function (BaseController, JSONModel, Filter, formatter, Fragment, ValidateException, FilterOperator, MessageBox, jQuery) {
	"ule strict";
	return BaseController.extend("ManageTechTables.ManageTechTables.controller.Home", {
		formatter: formatter,
		onInit: function () {

			// Start Insert Angelo
			// Logo is loaded only at the launch of the application
			var sRootPath = jQuery.sap.getModulePath("ManageTechTables");
			var finalPath = sRootPath + "/img/enelADN2.png";
			var aLogo = {
				sPath: finalPath
			};

			// Start Insert Angelo
			var oBusyDialog = new sap.m.BusyDialog("", {
				customIcon: finalPath,
				customIconHeight: "100%",
				customIconWidth: "100%",
				customIconRotationSpeed: 0,
				text: "Table Management"
			});

			oBusyDialog.open();

			// End of first loading
			jQuery.sap.delayedCall(2500, this, function () {
				oBusyDialog.close();
				/* Start Insert Javi */
				if(this._checkUser()){
					if (!this.escapePreventDialog) {
						this.escapePreventDialog = new sap.m.Dialog({
							title: this.getView().getModel("i18n").getResourceBundle().getText("noAccess"),
							content: new sap.m.Text({
								text: this.getView().getModel("i18n").getResourceBundle().getText("noAccessText")
							}),     
							buttons: [
								new sap.m.Button({
									text : 'Ok',
									press : function() {
										window.close();
										this.escapePreventDialog.close();
									}.bind(this)
								})
							]
						});
					}
					this.escapePreventDialog.open();
				}
				/* End Insert Javi */
			});
			// End Insert Angelo

			var oLogoModel = new JSONModel(aLogo);
			this.getOwnerComponent().setModel(oLogoModel, "logo");

			// User management
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.loadData("/services/userapi/attributes?multiValuesAsArrays=true", null, false);
			var aUserData = oModel.getData();
			this.getOwnerComponent().setModel(aUserData, "user");
			// End Insert Angelo
			
			//Start Insert Andrea
			var that = this;
			// Description of the table is taken from SAP
			var urlEcc = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
			var oModelDesc = new sap.ui.model.odata.v2.ODataModel(urlEcc);
			var entityDesc = "/tableDetailsSet('ZLISTCONFIGTABLE')";

			oModelDesc.read(entityDesc, {
				async: false,
				success: function (OData) {
					var system = {
						system: OData.System
					};

					var oSysModel = new sap.ui.model.json.JSONModel(system);
					that.getOwnerComponent().setModel(oSysModel, "systemName");
				}
			});
			//End Insert Andrea

			if(!this._checkUser()){
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("home").attachPatternMatched(this._attachPatternMatched, this);
			}
			// Start Delete Angelo
			// var idView = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.login").getId();
			// var username = sap.ui.getCore().byId(idView + "--uid").getValue();

			// sap.ui.core.BusyIndicator.show(0);
			// this.readDBalltable("users", username);
			// End Delete Angelo
		},

		/* Start Insert Javier Mesa */
		_checkUser : function() {
			var bToDisconnect = true;
			var oNameGroups = {
				"prod" : "ADN-IBERIA-ADMIN-PROD"
			};
			var aGroups = this.getOwnerComponent().getModel("user").Groups;
			
			for(var group in oNameGroups){
				for(var i = 0; i < aGroups.length; i++){
					if(aGroups[i].includes(oNameGroups[group])){
						bToDisconnect = false;
					}
				}
			}
			
			return bToDisconnect;

		},
		/* End Insert Javier Mesa */
		
		_attachPatternMatched: function (oEvent) {
			// Start Insert Angelo
			// var idView = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.login").getId();
			// var textLabel = sap.ui.getCore().byId(idView + "--uid").getValue() + " / Administrator";
			// End Insert Angelo

			// Start Insert Angelo
			var sUserName = this.getUserName();
			var textLabel = sUserName + " / Administrator";
			// End Insert Angelo
			this.getView().byId("head_user").setText(textLabel);

			// Start Delete Angelo
			// This block of code must be executed every time a login by an Administrator is executed
			// idView = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.login").getId();
			// var username = sap.ui.getCore().byId(idView + "--uid").getValue();

			// sap.ui.core.BusyIndicator.show(0);
			// End Delete Angelo

			this.readDBalltable("users", sUserName);
		},

		onExit: function () {
			if (this._oPopPsw) {
				this._oPopPsw.destroy();
			}
		},
		onClosePop: function () {
			if (this._oPopPsw) {
				sap.ui.core.Fragment.byId("PopPsw", "new_psw_1").setValue("");
				sap.ui.core.Fragment.byId("PopPsw", "new_psw_2").setValue("");
				sap.ui.core.Fragment.byId("PopPsw", "new_psw_2").setValueState(sap.ui.core.ValueState.none);
				this._oPopPsw.close();
			}
		},
		action: function (oEvent) {
			var that = this;
			var actionParameters = JSON.parse(oEvent.getSource().data("wiring").replace(/'/g, "\""));
			var eventType = oEvent.getId();
			var aTargets = actionParameters[eventType].targets || [];
			aTargets.forEach(function (oTarget) {
				var oControl = that.byId(oTarget.id);
				if (oControl) {
					var oParams = {};
					for (var prop in oTarget.parameters) {
						oParams[prop] = oEvent.getParameter(oTarget.parameters[prop]);
					}
					oControl[oTarget.action](oParams);
				}
			});
			var oNavigation = actionParameters[eventType].navigation;
			if (oNavigation) {
				var oParams = {};
				(oNavigation.keys || []).forEach(function (prop) {
					oParams[prop.name] = encodeURIComponent(JSON.stringify({
						value: oEvent.getSource().getBindingContext(oNavigation.model).getProperty(prop.name),
						type: prop.type
					}));
				});
				if (Object.getOwnPropertyNames(oParams).length !== 0) {
					this.getOwnerComponent().getRouter().navTo(oNavigation.routeName, oParams);
				} else {
					this.getOwnerComponent().getRouter().navTo(oNavigation.routeName);
				}
			}
		},
		onSearch: function (oEvt) {
			// add filter for search
			var aFilters = [];
			var sQuery = oEvt.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter_username = new Filter("USERNAME", sap.ui.model.FilterOperator.Contains, sQuery);
				var filter_name = new Filter("NAME", sap.ui.model.FilterOperator.Contains, sQuery);
				var filter_surname = new Filter("SURNAME", sap.ui.model.FilterOperator.Contains, sQuery);
				var allfilter = new sap.ui.model.Filter([
					filter_username,
					filter_name,
					filter_surname
				], false);
				aFilters.push(allfilter);
			}
			// update list binding
			var list = this.byId("table1");
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");
		},
		_getDialogLockUser: function () {
			if (!this._oLockUser) {
				this._oLockUser = sap.ui.xmlfragment("ManageTechTables.view.fragment.lockuser", this);
				this.getView().addDependent(this._oLockUser);
			}
			return this._oLockUser;
		},
		onOpenDialogLockUser: function () {
			if (this.getView().byId("table1").getSelectedItem()) {
				if (this.getView().byId("table1").getSelectedItem().getCells()[4].getSelected() == true) {
					sap.m.MessageBox.warning(this.getView().getModel("i18n").getResourceBundle().getText("w_cantlock"), {
						icon: sap.m.MessageBox.Icon.WARNING
					});
				} else {
					this._getDialogLockUser().open();
				}
			}
		},
		onCloseDialogLockUser: function () {
			this._getDialogLockUser().close();
		},
		handleResponsivePopPswPress: function (oEvent) {
			if (this.getView().byId("table1").getSelectedItem()) {
				if (!this._oPopPsw) {
					this._oPopPsw = sap.ui.xmlfragment("PopPsw", "ManageTechTables.view.fragment.PopPsw", this);
					this.getView().addDependent(this._oPopPsw);
				}
				sap.ui.core.Fragment.byId("PopPsw", "new_psw_1").setValue("");
				sap.ui.core.Fragment.byId("PopPsw", "new_psw_2").setValue("");
				sap.ui.core.Fragment.byId("PopPsw", "new_psw_2").setValueState(sap.ui.core.ValueState.none);
				this._oPopPsw.openBy(oEvent.getSource());
			}
		},
		toUserCreate: function (oEvent) {
			var username = "new";
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("users_d", {
				username: username
			});
		},
		toUserEdit: function (oEvent) {
			var username = this.getView().byId("table1").getSelectedItem().getCells()[0].getText();
			if (username) {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("users_d", {
					username: username
				});
			}
		},
		toGroupCreate: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var group = "new";
			var group_descr = "new";
			oRouter.navTo("group_d", {
				group: group,
				group_descr: group_descr
			});
		},
		toGroupDetail: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var group = this.getView().byId("tableGroup").getSelectedItem().getCells()[0].getText();
			var group_descr = this.getView().byId("tableGroup").getSelectedItem().getCells()[1].getText();
			oRouter.navTo("group_d", {
				group: group,
				group_descr: group_descr
			});
		},
		lock: function (oEvent) {
			var userList = this.getView().getModel("users").getData();
			var uid = this.getView().byId("table1").getSelectedItem().getCells()[0].getText();
			if (uid !== "") {
				var filterUser = userList.filter(function (el) {
					return el.USERNAME == uid;
				});
				if (filterUser.length > 0)
					this.updatelock(filterUser, "X");
				var text = this.getView().getModel("i18n").getResourceBundle().getText("messboxlock");
				sap.m.MessageBox.warning(text, {
					icon: sap.m.MessageBox.Icon.WARNING
				});
				var oModelUsers = this.getView().getModel("users");
				oModelUsers.updateBindings(true);
			}
		},
		unlock: function (oEvent) {
			var userList = this.getView().getModel("users").getData();
			var uid = this.getView().byId("table1").getSelectedItem().getCells()[0].getText();
			if (uid !== "") {
				var filterUser = userList.filter(function (el) {
					return el.USERNAME == uid;
				});
				if (filterUser.length > 0)
					this.updatelock(filterUser, " ");
				var text = this.getView().getModel("i18n").getResourceBundle().getText("messboxunlock");
				sap.m.MessageBox.warning(text, {
					icon: sap.m.MessageBox.Icon.WARNING
				});
				var oModelUsers = this.getView().getModel("users");
				oModelUsers.updateBindings(true);
			}
		},
		updatelock: function (User, LockUnlock) {
			User[0].LOCKED3 = LockUnlock;
			User[0].LOCKED2 = LockUnlock;
			User[0].LOCKED1 = LockUnlock;
			var jurl = "/service/ERPIBERIA_ADN/users/updateUsers.xsjs";
			var datavalue = JSON.stringify(User[0]);
			jQuery.ajax({
				url: jurl,
				async: false,
				data: {
					user: datavalue,
					operation: "update"
				},
				method: "POST",
				dataType: "text"
			});
		},

		onLogin: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var oModelUsers = this.getView().getModel("users");
			oRouter.getView("ManageTechTables.view.login").setModel(oModelUsers, "users");
			oRouter.navTo("login");
		},
		onChangePsw: function () {
			var uid = this.getView().byId("table1").getSelectedItem().getCells()[0].getText();
			var result;
			if (uid) {
				var psw_1 = sap.ui.core.Fragment.byId("PopPsw", "new_psw_1").getValue();
				var psw_2 = sap.ui.core.Fragment.byId("PopPsw", "new_psw_2").getValue();
				if (psw_1 === psw_2) {
					var userList = this.getView().getModel("users").getData();
					var filterUser = userList.filter(function (el) {
						return el.USERNAME == uid;
					});
					if (filterUser.length > 0) {
						result = this.updatepsw(filterUser, psw_1);
						if (result == true) {
							var text = this.getView().getModel("i18n").getResourceBundle().getText("s_psw_chg");
							sap.m.MessageBox.success(text, {
								icon: sap.m.MessageBox.Icon.SUCCESS
							});
							var oModelUsers = this.getView().getModel("users");
							oModelUsers.updateBindings(true);
						}
					}
					this.onClosePop();
				} else {
					/*
															var text1 = this.getView().getModel("i18n").getResourceBundle().getText("e_psw_chg");
																sap.m.MessageBox.error(text1, {
																icon: sap.m.MessageBox.Icon.ERROR
															});
															*/
				}
			}
		},
		updatepsw: function (User, NewPassword) {
			User[0].PASSWORD = NewPassword;
			var jurl = "/service/ERPIBERIA_ADN/users/updateUsers.xsjs";
			var datavalue = JSON.stringify(User[0]);
			var result;
			jQuery.ajax({
				url: jurl,
				async: false,
				data: {
					user: datavalue,
					operation: "update"
				},
				method: "POST",
				dataType: "text",
				success: function (response) {
					result = response;
				},
				error: function (xhr) {
					result = "ERROR";
				}
			});
			if (result == "ERROR" || result != 1) {
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("e_psw_err"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
				return false;
			} else {
				return true;
			}
		},

		readDB: function (entitySet, filters, asyncr, method) {
			var results;
			var filter = [];
			// indirizzo del servizio
			var serviceURL = "/service/ERPIBERIA_ADN/" + method;
			if (filters !== "") {
				filter = filters;
			}
			// creo il modello
			var oModel = new sap.ui.model.odata.ODataModel(serviceURL, true);
			// Leggo il modello da SAP
			oModel.read(entitySet, {
				filters: filter,
				async: asyncr,
				success: function (oData) {
					results = oData.results;
				},
				error: function (e) {
					// errore lettura oData
					results = [];
				}
			});
			return results;
		},

		readDBtableslist: function (entitySet, filters, asyncr, method, order, username) {
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
		},

		changeformatdate: function (array) {
			if (array) {
				for (var i = 0; i < array.length; i++) {
					var dat = new Date(array[i].CREATIONDATE);
					array[i].CREATIONDATE = dat;
				}
			}
		},

		readDBalltable: function (entitySet, username) {

			// Start Insert Angelo
			var that = this;
			// End Insert Angelo

			// Start Delete Angelo
			// var results;
			// var filter = [];
			// var filterD = new Filter("DELETED", sap.ui.model.FilterOperator.NE, "X");
			// filter.push(filterD);

			// var serviceURL = "/service/ERPIBERIA_ADN/" + "users/getUsers.xsodata/";
			// // var oModel = new sap.ui.model.odata.v2.ODataModel(serviceURL, true);
			// var oModel = new sap.ui.model.odata.ODataModel(serviceURL, true);

			// oModel.read(entitySet, {
			// 	filters: filter,
			// 	async: true,
			// 	success: function (oData) {
			// 		results = oData.results;

			var oModelJson = new sap.ui.model.json.JSONModel();
			// 		oModelJson.setData(results);
			// 		that.getOwnerComponent().setModel(oModelJson, "users");
			// End Delete Angelo

			var tableGroupArray = that.readDB("tablegroup", "", false, "tableGroup/tablegroup.xsodata/");
			oModelJson = new sap.ui.model.json.JSONModel();
			oModelJson.setData(tableGroupArray);
			that.getView().setModel(oModelJson, "tablegroup");

			var userGroupArray = that.readDB("usergroup", "", false, "userGroup/usergroup.xsodata/");
			oModelJson = new sap.ui.model.json.JSONModel();
			oModelJson.setData(userGroupArray);
			that.getView().setModel(oModelJson, "usergroup");

			// Start Insert Angelo
			// Code that read the entire TABLES table
			that.readTablesForTab();
			// End Insert Angelo

			var tableGroupArrayNoDup = [];
			tableGroupArray.forEach(function (element) {
				if (!tableGroupArrayNoDup.find(function (obj) {
						return obj.GROUPID === element.GROUPID;
					})) {
					tableGroupArrayNoDup.push(element);
				}
			});
			oModelJson = new sap.ui.model.json.JSONModel();
			oModelJson.setData(tableGroupArrayNoDup);
			that.getView().setModel(oModelJson, "tablegroupnodup");

			// Start Delete Angelo
			// var tables = that.readDBtableslist("tables", "", false, "tables/lastVersions.xsjs", "", username);
			// oModelJson = new sap.ui.model.json.JSONModel();
			// oModelJson.setData(tables);

			// // t.getView().setModel(oModelJson, "tables");

			// that.getOwnerComponent().setModel(oModelJson, "tables");
			// End Delete Angelo

			// Start Insert Angelo
			// The families are taken from the BaseController
			that.getAllFamilies();
			// End Insert Angelo

			sap.ui.core.BusyIndicator.hide();
			// Start Delete Angelo
			// 	},
			// 	error: function (e) {
			// 		results = [];

			// 		sap.ui.core.BusyIndicator.hide();
			// 	},
			// 	complete: function () {
			// 		sap.ui.core.BusyIndicator.hide();
			// 	}
			// });
			// 
			// return results;
			// End Delete Angelo
		},

		readTablesForTab: function () {
			// Start Insert Angelo
			var tables = this.readDBtableslist("tables", "", false, "tables/lastVersions.xsjs", "", this.getUserName());
			var oModelJson = new sap.ui.model.json.JSONModel();
			oModelJson.setData(tables);
			this.getOwnerComponent().setModel(oModelJson, "tables");
			// End Insert Angelo

			// Start Delete Angelo
			// var aTablesTab = this.readDB("tables", "", false, "tables/tables.xsodata/");
			// var oModelJson = new sap.ui.model.json.JSONModel();
			// oModelJson.setData(aTablesTab);
			// this.getView().setModel(oModelJson, "tablesTab");
			// End Delete Angelo
		},

		onSearchFamily: function (oEvt) {
			var aFilters = [];
			var sQuery = oEvt.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter_group = new Filter("GROUPID", sap.ui.model.FilterOperator.Contains, sQuery);
				var filter_descr = new Filter("DESCRIPTION", sap.ui.model.FilterOperator.Contains, sQuery);
				var allfilter = new sap.ui.model.Filter([
					filter_group,
					filter_descr
				], false);
				aFilters.push(allfilter);
			}
			// update list binding
			var list = this.byId("tableGroup");
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");
		},
		liveChangePsw: function () {
			var psw_1 = sap.ui.core.Fragment.byId("PopPsw", "new_psw_1").getValue();
			var psw_2 = sap.ui.core.Fragment.byId("PopPsw", "new_psw_2").getValue();
			if (psw_1 != psw_2) {
				sap.ui.core.Fragment.byId("PopPsw", "new_psw_2").setValueState(sap.ui.core.ValueState.Error);
				sap.ui.core.Fragment.byId("PopPsw", "new_psw_2").setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText(
					"e_psw_chg"));
			} else {
				sap.ui.core.Fragment.byId("PopPsw", "new_psw_2").setValueState(sap.ui.core.ValueState.none); //	sap.ui.core.Fragment.byId("Popover", "new_psw_2").setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("e_psw_chg"));
			}
		},
		onDeleteUser: function (oEvent) {
			var userList = this.getView().getModel("users").getData();
			var uid = this.getView().byId("table1").getSelectedItem().getCells()[0].getText();
			if (uid !== "") {
				var filterUser = userList.filter(function (el) {
					return el.USERNAME == uid;
				});
				if (filterUser.length > 0) {
					var result = this.updateDelUser(filterUser, "X");
					this.onCloseDialogDelUser();
					if (result == true) {
						sap.m.MessageBox.success(this.getView().getModel("i18n").getResourceBundle().getText("s_del_user"), {
							icon: sap.m.MessageBox.Icon.SUCCESS
						});
						this.deleteUserGrp(uid);
					} else {
						sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("e_del_err"), {
							icon: sap.m.MessageBox.Icon.ERROR
						});
					}
				}
			}
		},
		updateDelUser: function (User, Del) {
			User[0].DELETED = Del;
			User[0].LOCKED1 = "";
			User[0].LOCKED2 = "";
			User[0].LOCKED3 = "";
			var jurl = "/service/ERPIBERIA_ADN/users/updateUsers.xsjs";
			var datavalue = JSON.stringify(User[0]);
			var result;
			jQuery.ajax({
				url: jurl,
				async: false,
				data: {
					user: datavalue,
					operation: "update"
				},
				method: "POST",
				dataType: "text",
				success: function (response) {
					result = response;
				},
				error: function (xhr) {
					result = "ERROR";
				}
			});
			if (result == "ERROR" || result != 1) {
				return false;
			} else {
				var username = User[0].USERNAME;
				var oModel = this.getView().getModel("users");
				var e = this.getView().getModel("users").getData();
				var idx = e.findIndex(function (el) {
					return el.USERNAME == username;
				});
				if (idx !== -1) {
					e.splice(idx, 1);
					//					oModel.setData(e);
					oModel.updateBindings(true);
				}
				return true;
			}
		},
		_getDialogDelUser: function () {
			if (!this._oDialogDelUser) {
				this._oDialogDelUser = sap.ui.xmlfragment("ManageTechTables.view.fragment.deluser", this);
				this.getView().addDependent(this._oDialogDelUser);
			}
			return this._oDialogDelUser;
		},
		onOpenDialogDelUser: function () {
			if (this.getView().byId("table1").getSelectedItem()) {
				this._getDialogDelUser().open();
			}
		},
		onCloseDialogDelUser: function () {
			this._getDialogDelUser().close();
		},
		deleteUserGrp: function (uid) {
			var user = uid;
			var oGroupList = [];
			var jurl = "/service/ERPIBERIA_ADN/userGroup/updateUserGroup.xsjs";
			var newUserFam = JSON.stringify(oGroupList);
			var result2;
			jQuery.ajax({
				url: jurl,
				async: false,
				data: {
					rows: newUserFam,
					user: user
				},
				method: "POST",
				dataType: "text",
				success: function (response) {
					result2 = response;
				},
				error: function (xhr) {
					result2 = "ERROR";
				}
			});

			if (!result2) {
				// messaggio
			}
			var oModel = this.getView().getModel("usergroup");
			var oList = oModel.getData();
			for (var i = 0; i < oList.length; i++) {
				if (oList[i].USERNAME == uid) {
					oList.splice(i, 1);
					i = i - 1;
				}
			}
			oModel.updateBindings(true);
		},

		toUserView: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			// Start Delete Angelo
			// var idView = oRouter.getView("ManageTechTables.view.login").getId();
			// var uid = sap.ui.getCore().byId(idView + "--uid").getValue();
			// End Delete Angelo

			// Start Insert Angelo
			var uid = this.getUserName();
			// End Insert Angelo

			var navHome = "home_u"; //User
			var role = "ADMIN";
			oRouter.navTo(navHome, {
				username: uid,
				role: role
			});
		},

		// Start Insert Angelo
		onSearchTables: function (oEvent) {
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				// Tablename filter
				aFilters.push(new Filter("TABLENAME", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("SYSTEM", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("DESCRIPTION", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("RESPONSIBLE", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("CREATIONDATE", FilterOperator.EQ, sQuery));
				aFilters.push(new Filter("GROUPID", FilterOperator.Contains, sQuery));

				var aFinalFilter = new sap.ui.model.Filter(aFilters, false);
			}
			// update list binding
			var list = this.byId("tableTables");
			var binding = list.getBinding("items");
			binding.filter(aFinalFilter, "Application");
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
												that.getUserName(),
												oImportData.system,
												0, null, oImportData.newStructureVersion);
											that.createDBEcc("versions", "true", "versions/getVersions.xsodata", newRowNoData);

											// Loading indicator is removed
											sap.ui.core.BusyIndicator.hide();

											sap.m.MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText("s_update_new",
												version), {
												icon: sap.m.MessageBox.Icon.SUCCESS,
												onClose: that.readTablesForTab() //To refresh data
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
														that.getUserName(),
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
														onClose: that.readTablesForTab() //To refresh data
													});
												},
												error: function () {
													// Loading indicator is removed
													sap.ui.core.BusyIndicator.hide();

													sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText(
														"messErrECCUpdateDirect"), {
														icon: sap.m.MessageBox.Icon.ERROR,
														// Start Insert Angelo
														onClose: that.readTablesForTab() //To refresh data
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

		_getNewTableRow: function (tableName, description, vSystem) {

			// Date object
			var date = new Date();

			// Row creation
			var tableRow = {
				TABLENAME: tableName,
				SYSTEM: vSystem,
				DESCRIPTION: description,
				RESPONSIBLE: this.getUserName(),
				CREATIONDATE: date
			};

			return tableRow;
		},

		onSearchTable: function (oEvent) {
				var aFilter = [];

				aFilter.push(new Filter("Tablename", FilterOperator.Contains, oEvent.getSource()._sSearchFieldValue));

				// Binding of the list is taken from oEvent parameter
				var oBinding = oEvent.getSource().getBinding("items");
				oBinding.filter(aFilter);
			}
			// End Insert Angelo
	});
});