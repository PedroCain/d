sap.ui.define([
	"ManageTechTables/ManageTechTables/controller/ImportFromTest",
	"sap/ui/model/json/JSONModel"
], function (ImportFromTest, JSONModel) {
	"use strict";

	return ImportFromTest.extend("ManageTechTables.ManageTechTables.controller.Labels", {
		// formatter: formatter,

		loadAllLabelsSuggestions: function () {

			var that = this;

			var sURL = "/service/ERPIBERIA_ADN/versions/getLabelSuggestions.xsjs";
			jQuery.ajax({
				url: sURL,
				async: true,
				method: "POST",
				dataType: "text",
				success: function (data) {
					var results = JSON.parse(data);

					var oModelLabels = new JSONModel();
					oModelLabels.setData(results);
					that.getView().setModel(oModelLabels, "labels");
				}
			});
		},

		onSaveToken: function (sLabel, sTablename, sSystem, sVersion) {

			var sURL = "/service/ERPIBERIA_ADN/versions/getLabels.xsodata";
			var oModel = new sap.ui.model.odata.v2.ODataModel(sURL);
			var sEntity = "/labels";

			// Row creation for labels
			var aLabels = {
				TABLENAME: sTablename,
				SYSTEM: sSystem,
				VERSION: sVersion,
				LABEL: sLabel
			};

			// Model creation. label is saved on Hana XS
			oModel.create(sEntity, aLabels, {
				success: function (result) {}
			});
		},

		onLabelChange: function (oEvent) {
			var sCurrentLabel = oEvent.getSource().getValue();
			var sLabelId = oEvent.getSource().getId();

			// Current data of the row is taken in order to save correctly the token
			var sTablename = oEvent.getSource().getParent().getCells()[0].getText();
			var sSystem = oEvent.getSource().getParent().getCells()[1].getText();
			var sVersion = oEvent.getSource().getParent().getCells()[2].getText();

			var oMultiLabel = this.getView().byId(sLabelId);

			oMultiLabel.addToken(
				new sap.m.Token({
					key: sCurrentLabel,
					text: sCurrentLabel
				})
			);

			oMultiLabel.setValue("");

			// The lable inserted is used also as a suggestion
			var oModelLabels = this.getView().getModel("labels");
			var aCurrentLabels = oModelLabels.getData();

			// Flag used to check if the label already exists
			var vCheck = false;

			for (var x in aCurrentLabels) {
				if (x.LABEL === sCurrentLabel) {
					vCheck = true;
					break;
				}
			}

			// The new label can be inserted as a suggestion, it's new
			if (vCheck === false) {
				aCurrentLabels.push({
					LABEL: sCurrentLabel
				});
			}

			oModelLabels.refresh();

			// The label inserted is saved on DB
			this.onSaveToken(sCurrentLabel, sTablename, sSystem, sVersion);
		},

		onTokenChange: function (oEvent) {

			// Get the current token that has been removed
			var sRemovedToken = oEvent.getParameters().removedTokens[0].getKey();

			// Get the version values in order to remove the token from the DB
			var sTablename = oEvent.getSource().getParent().getCells()[0].getText();
			var sSystem = oEvent.getSource().getParent().getCells()[1].getText();
			var sVersion = oEvent.getSource().getParent().getCells()[2].getText();

			var sURL = "/service/ERPIBERIA_ADN/versions/getLabels.xsodata";
			var oModel = new sap.ui.model.odata.v2.ODataModel(sURL);
			var sEntity = "/labels(TABLENAME='" + sTablename + "',SYSTEM='" + sSystem +
				"',VERSION='" + sVersion + "',LABEL='" + encodeURIComponent(sRemovedToken) + "')";

			// Model delete, the current label is removed from Hana XS
			oModel.remove(sEntity, {
				success: function (result) {},
				error: function (result) {}
			});
		}

	});

});