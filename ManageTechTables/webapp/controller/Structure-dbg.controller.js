sap.ui.define([
	"ManageTechTables/ManageTechTables/controller/BaseController",
	"sap/ui/model/json/JSONModel"
	// "sap/ui/core/mvc/Controller"
], function (BaseController, JSONModel) {
	"use strict";

	var uid, role;

	return BaseController.extend("ManageTechTables.ManageTechTables.controller.Structure", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf ManageTechTables.view.structure
		 */
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("Structure").attachPatternMatched(this._attachPatternMatched, this);
		},

		_attachPatternMatched: function (oEvent) {

			var that = this;

			var tableName = oEvent.getParameter("arguments").table;
			uid = oEvent.getParameter("arguments").uid;
			role = oEvent.getParameter("arguments").role;

			// Table structure section
			var urlEcc = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
			var oModelEcc = new sap.ui.model.odata.v2.ODataModel(urlEcc);

			var entityEcc = "/tableSet('" + tableName + "')/tableStructureSet";

			// Title for the table 
			var oTitle = this.getView().getModel("i18n").getResourceBundle().getText("structTitle", tableName);
			var oText = this.getView().byId("structTitle");
			oText.setText(oTitle);

			// Table structure read
			oModelEcc.read(entityEcc, {
				success: function (OData) {

					var structure = JSON.parse(OData.results[0].Structure);

					var oModel = new JSONModel(structure);
					that.getView().setModel(oModel, "struct");
				}
			});

		},

		onPressBack: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			oRouter.navTo("home_u", {
				username: uid,
				role: role
			});
		}
	});
});