sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Filter",
		"sap/m/MessageBox",
		"sap/ui/model/FilterOperator",
		"ManageTechTables/ManageTechTables/model/formatter"
	],
	function (Controller, JSONModel, Filter, MessageBox, FilterOperator, formatter) {
		"use strict";

		return Controller.extend("ManageTechTables.ManageTechTables.controller.login", {
			formatter: formatter,

			onInit: function () {

				var sRootPath = jQuery.sap.getModulePath("ManageTechTables");
				var finalPath = sRootPath + "/img/enelADN.png";
				var aLogo = {
					sPath: finalPath
				};

				var oLogoModel = new JSONModel(aLogo);
				this.getOwnerComponent().setModel(oLogoModel, "logo");
			},

			onLoginTap: function () {
				var aFilters = [];
				var sQuery = "X";
				var sQuery1 = this.getView().byId("uid").getValue();
				var sQuery2 = this.getView().byId("pasw").getValue();
				if (sQuery1.length > 0) {
					var filter_del = new Filter({
						filters: [
							new Filter({
								path: "DELETED",
								operator: FilterOperator.NE,
								value1: sQuery
							}),
							new Filter({
								path: "USERNAME",
								operator: FilterOperator.EQ,
								value1: sQuery1
							}),
							new Filter({
								path: "PASSWORD",
								operator: FilterOperator.EQ,
								value1: sQuery2
							})
						],
						and: true
					});
					aFilters.push(filter_del);

					var results = this.readDB("users", aFilters, false, "users/getUsers.xsodata/");
					if (results) {
						if (results.length > 0) {

							// naviga alla pagina corrispondente a seconda del tipo utente(vedi sotto)
							var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
							var role;
							var navHome;
							var uid = this.getView().byId("uid").getValue();

							// Start Insert Angelo
							// This model contains the current user logged in
							var aData = {
								user: uid
							};

							this.getOwnerComponent().setModel(new JSONModel(aData), "user");
							// End Insert Angelo

							//Controllare il tipo utente	
							if (results[0].ADMIN === "X") {
								navHome = "home"; //Admin
								oRouter.navTo(navHome);
							} else {

								navHome = "home_u"; //User
								role = "USER";
								oRouter.navTo(navHome, {
									username: uid,
									role: role
								});

							}
						} else {

							var result;
							var text;
							var jurl = "/service/ERPIBERIA_ADN/users/lockUser.xsjs";
							jQuery.ajax({
								url: jurl,
								async: false,
								data: {
									user: sQuery1
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
							text = this.UserBlockText(result);
							sap.m.MessageBox.error(
								text, {
									icon: sap.m.MessageBox.Icon.ERROR
								});
						}
					}
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

			UserBlockText: function (result) {
				var text;
				if (result == "NOTEXISTS") {
					text = this.getView().getModel("i18n").getResourceBundle().getText("e_cred_db");
				} else {

					if (result == "ADMIN") {
						text = this.getView().getModel("i18n").getResourceBundle().getText("err_credential");
					} else {
						switch (result) {
						case "BLOCKED":
							text = this.getView().getModel("i18n").getResourceBundle().getText("e_locked_user");
							break;
						case "LOCKED2":
							text = this.getView().getModel("i18n").getResourceBundle().getText("e_cred_block", 2);
							break;
						default:
							text = this.getView().getModel("i18n").getResourceBundle().getText("e_cred_block", 1);
							break;
						}
					}
				}
				return text;
			},

		});
	});