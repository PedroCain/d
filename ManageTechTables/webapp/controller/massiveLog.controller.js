sap.ui.define([
	"ManageTechTables/ManageTechTables/controller/BaseController",
	"ManageTechTables/ManageTechTables/model/formatter",
	"sap/ui/model/Filter"
], function (BaseController, formatter, Filter) {
	"use strict";
	var role, uid, tab;
	return BaseController.extend("ManageTechTables.ManageTechTables.controller.massiveLog", {

		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("massiveLog").attachPatternMatched(this._attachPatternMatched, this);
		},
		_attachPatternMatched: function (oEvent) {
			var page = this.getView().byId("massiveLog");
			if (page && page !== null) {
				page.scrollTo(0, 0);
			}

			role = oEvent.getParameter("arguments").role;
			uid = oEvent.getParameter("arguments").username;
			tab = oEvent.getParameter("arguments").table;

			var idView;
			var textLabel;
			// // User old logic, it's useless for the moment
			if (role === "USER" || !role) {
				idView = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.login").getId();
				textLabel = sap.ui.getCore().byId(idView + "--uid").getValue() + " / User";
				this.getView().byId("head_user").setText(textLabel);
			} else {
				// Start Delete Angelo
				// idView = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.login").getId();
				// textLabel = sap.ui.getCore().byId(idView + "--uid").getValue() + " / Administrator";
				// End Delete Angelo
				// Start Insert Angelo
				textLabel = this.getUserName() + " / Administrator";
				// End Insert Angelo 
				this.getView().byId("head_user").setText(textLabel);
			}

			var results;
			var filter = [];
			var serviceURL = "/service/ERPIBERIA_ADN/log/getLog.xsodata/";
			filter.push(new sap.ui.model.Filter("TABLENAME", sap.ui.model.FilterOperator.EQ, tab));
			var oModel = new sap.ui.model.odata.ODataModel(serviceURL, true);
			oModel.read("massiveLog?$orderby=DATE%20desc", {
				filters: filter,
				async: false,
				success: function (oData) {
					results = oData.results;
				},
				error: function (e) {
					results = [];
				}
			});

			var oModelJson_log = new sap.ui.model.json.JSONModel();
			oModelJson_log.setData(results);
			this.getView().setModel(oModelJson_log, "log_m");

			var oTable = this.getView().byId("table_log_m");
			oTable.setModel(oModelJson_log);

			var count,
				length = oTable.getBinding().iLength;
			if (length == 0) {
				sap.m.MessageBox.success(this.getView().getModel("i18n").getResourceBundle().getText("w_nonlog"), {
					icon: sap.m.MessageBox.Icon.WARNING,
					onClose: this.onBack()
				});
			} else {

				if (length < 10) {
					count = length;
				} else {
					count = 10;
				}

				this.getView().byId("table_log_m").setProperty("visibleRowCount", count);
			}
		},

		onBack: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("home_u", {
				username: uid,
				role: role
			});
		}

	});

});