sap.ui.define([
	"ManageTechTables/ManageTechTables/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter"
], function (BaseController, JSONModel, Filter) {
	"use strict";
	var group, group_descr;
	return BaseController.extend("ManageTechTables.ManageTechTables.controller.group_d", {
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("group_d").attachPatternMatched(this._attachPatternMatched, this);
		},
		_attachPatternMatched: function (oEvent) {
			// Start Delete Angelo
			// var idView = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.login").getId();
			// var textLabel = sap.ui.getCore().byId(idView + "--uid").getValue() + " / Administrator";
			// End Delete Angelo

			// Start Insert Angelo
			var textLabel = this.getUserName() + " / Administrator";
			// End Insert Angelo

			this.getView().byId("head_user").setText(textLabel);

			var oMod = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.Home").getModel("tables");
			this.getView().setModel(oMod, "tables");

			group = oEvent.getParameter("arguments").group;
			group_descr = oEvent.getParameter("arguments").group_descr;
			if (group !== "new") {
				this._toSee();
			} else {
				this._toCreate();
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
		_toEdit: function (oEvent) {
			var textLabel = this.getView().getModel("i18n").getResourceBundle().getText("h_editgrp");
			this.getView().byId("page_groupd").setTitle(textLabel);
			this.getView().byId("idgroup").setEnabled(false);
			this.getView().byId("group_descr").setEnabled(false);
			this.getView().byId("Bar_group").setVisible(true);
			this.getView().byId("b_see").setVisible(true);
			this.getView().byId("b_edit").setVisible(false);
			this.getView().byId("add_table_to_group").setEnabled(true);
			var oTable = this.getView().byId("idtablegroup");
			oTable.setMode(sap.m.ListMode.Delete);

			this.getView().byId("btnbargroup").detachPress(this.onCreateGroup, this);
			this.getView().byId("btnbargroup").detachPress(this.onUpdateGroup, this);
			this.getView().byId("btnbargroup").attachPress(this.onUpdateGroup, this);
			this.getView().byId("idgroup").setValueState(sap.ui.core.ValueState.None);
			this.getView().byId("group_descr").setValueState(sap.ui.core.ValueState.None);
			this.getView().byId("input_table").setValue("");
		},
		_toCreate: function () {
			this._clearAll();
			var textLabel = this.getView().getModel("i18n").getResourceBundle().getText("h_creagrp");
			this.getView().byId("page_groupd").setTitle(textLabel);
			this.getView().byId("idgroup").setEnabled(true);
			this.getView().byId("idgroup").setValue("");
			this.getView().byId("group_descr").setEnabled(true);
			this.getView().byId("group_descr").setValue("");
			this.getView().byId("Bar_group").setVisible(true);
			this.getView().byId("b_see").setVisible(false);
			this.getView().byId("b_edit").setVisible(false);
			this.getView().byId("idgroup").setValueState(sap.ui.core.ValueState.None);
			this.getView().byId("group_descr").setValueState(sap.ui.core.ValueState.None);
			this.getView().byId("btnbargroup").detachPress(this.onCreateGroup, this);
			this.getView().byId("btnbargroup").detachPress(this.onUpdateGroup, this);
			this.getView().byId("btnbargroup").attachPress(this.onCreateGroup, this);
			this.getView().byId("add_table_to_group").setEnabled(true);
			var oTable = this.getView().byId("idtablegroup");
			oTable.setMode(sap.m.ListMode.Delete); // delete mode  

			this.getView().byId("input_table").setValue("");

		},
		_toSee: function () {
			var groupid = group;
			var group_d = group_descr;
			var tblgrp_d = this.recuperaGrp(groupid);
			this.getView().byId("idgroup").setValue(groupid);
			this.getView().byId("group_descr").setValue(group_d);
			if (tblgrp_d) {
				var oPos = new JSONModel(tblgrp_d);
				this.getView().setModel(oPos, "tablegroup_d");
			}
			var textLabel = this.getView().getModel("i18n").getResourceBundle().getText("h_seegrp");
			this.getView().byId("page_groupd").setTitle(textLabel);
			this.getView().byId("idgroup").setEnabled(false);
			this.getView().byId("group_descr").setEnabled(false);
			this.getView().byId("Bar_group").setVisible(false);
			this.getView().byId("b_see").setVisible(false);
			this.getView().byId("b_edit").setVisible(true);
			this.getView().byId("btnbargroup").detachPress(this.onCreateGroup, this);
			this.getView().byId("btnbargroup").detachPress(this.onUpdateGroup, this);
			this.getView().byId("add_table_to_group").setEnabled(false);
			var oTable = this.getView().byId("idtablegroup");
			oTable.setMode(sap.m.ListMode.None);
			// None mode  
			this.getView().byId("idgroup").setValueState(sap.ui.core.ValueState.None);
			this.getView().byId("group_descr").setValueState(sap.ui.core.ValueState.None);
			this.getView().byId("input_table").setValue("");
		},
		goHome: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("home");
		},
		onCreateGroup: function () {
			var checkOK = this.checkInput();
			var checkExist = this.onCheckExist();

			if (checkOK === true && checkExist === true) {
				var groupid = this.getView().byId("idgroup").getValue();
				var oGroupList = this.onUpdateTableGroup();

				var group_new = "new";
				var jurl = "/service/ERPIBERIA_ADN/tableGroup/updateTableGroup.xsjs";
				var newTblGrp = JSON.stringify(oGroupList);
				var result2;
				jQuery.ajax({
					url: jurl,
					async: false,
					data: {
						rows: newTblGrp,
						group: group_new
					},
					method: "GET",
					dataType: "text",
					success: function (response) {
						result2 = response;
					},
					error: function (xhr) {
						result2 = "ERROR";
					}
				});
				if (result2 === "ERROR") {
					sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("e_crt_grp"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
				} else {
					// SUCCESSO
					sap.m.MessageBox.success(this.getView().getModel("i18n").getResourceBundle().getText("s_group_create", groupid), {
						icon: sap.m.MessageBox.Icon.SUCCESS,
						onClose: this.goHome()
					});
				}
			}
		},
		onUpdateGroup: function () {

			var groupid = this.getView().byId("idgroup").getValue();
			var oGroupList = this.getView().getModel("tablegroup_d").getData();
			this.onUpdateTableGroup();
			var group_upd = groupid;
			var jurl = "/service/ERPIBERIA_ADN/tableGroup/updateTableGroup.xsjs";
			var newTblGrp = JSON.stringify(oGroupList);
			var result2;
			jQuery.ajax({
				url: jurl,
				async: false,
				data: {
					rows: newTblGrp,
					group: group_upd
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
			if (result2 === "ERROR") {
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("e_crt_grp"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
			} else {
				sap.m.MessageBox.success(this.getView().getModel("i18n").getResourceBundle().getText("s_group_upd", groupid), {
					icon: sap.m.MessageBox.Icon.SUCCESS,
					onClose: this.goHome()
				});
			}
		},
		onLogin: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("login");
		},

		onSearchTableGroup: function (oEvt) {
			// add filter for search
			var aFilters = [];
			var sQuery = oEvt.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter_table = new Filter("TABLENAME", sap.ui.model.FilterOperator.Contains, sQuery);
				var filter_system = new Filter("SYSTEMNAME", sap.ui.model.FilterOperator.Contains, sQuery);
				var allfilter = new sap.ui.model.Filter([
					filter_table,
					filter_system
				], false);
				aFilters.push(allfilter);
			}
			// update list binding
			var list = this.byId("idtablegroup");
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");
		},
		recuperaGrp: function (groupid) {
			var oTblGroupList = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.Home").getModel("tablegroup").getData();
			var posizioni = [];
			for (var i = 0; i < oTblGroupList.length; i++) {
				if (oTblGroupList[i].GROUPID === groupid) {
					var item = {
						GROUPID: oTblGroupList[i].GROUPID,
						TABLENAME: oTblGroupList[i].TABLENAME,
						SYSTEMNAME: oTblGroupList[i].SYSTEMNAME,
						DESCRIPTION: oTblGroupList[i].DESCRIPTION
					};
					posizioni.push(item);
				}
			}
			return posizioni;
		},
		_clearAll: function () {
			var oView = this.getView();
			this.getView().byId("idgroup").setValue("");
			this.getView().byId("idgroup").setValueState(sap.ui.core.ValueState.None);
			this.getView().byId("group_descr").setValue("");
			this.getView().byId("group_descr").setValueState(sap.ui.core.ValueState.None);
			var tablegroup_d = [];
			var oModelJson1 = new sap.ui.model.json.JSONModel();
			oModelJson1.setData(tablegroup_d);
			oView.setModel(oModelJson1, "tablegroup_d");
		},
		h_table_group: function (oEvent) {
			this.onOpenDialog();
		},
		_getDialog: function () {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("ManageTechTables.view.fragment.help_table_group", this);
				this.getView().addDependent(this._oDialog);
			}
			return this._oDialog;
		},
		onOpenDialog: function () {
			this._getDialog().open();
		},
		onCloseDialog: function () {
			this._getDialog().close();
		},
		_handleValueHelpSearchCC: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter("TABLENAME", sap.ui.model.FilterOperator.Contains, sValue);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_handleValueHelpCloseCC: function (oEvent) {},
		_handleValueHelpConfirmCC: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var tablename = aContexts.map(function (oContext) {
					return oContext.getObject().TABLENAME;
				}).join(", ");
				var syst = aContexts.map(function (oContext) {
					return oContext.getObject().SYSTEM;
				}).join(", ");
			}
			var concat = tablename + "/" + syst;
			this.getView().byId("input_table").setValue(concat);
		},
		onAddTableGroup: function (oEvent) {
			var oModFam = this.getView().getModel("tablegroup_d");
			var tbl_grp = oModFam.getData();
			var group_id = this.getView().byId("idgroup").getValue();
			var group_id_state = this.getView().byId("idgroup").getValueState();
			var group_descr_new = this.getView().byId("idgroup").getValue();
			var value = this.getView().byId("input_table").getValue();
			var tablename = value.split("/")[0];
			var syst = value.split("/")[1];
			var filtertbl_grp = tbl_grp.filter(function (el) {
				return el.TABLENAME == tablename;
			});

			if (filtertbl_grp.length == 0) {
				if (group_id && group_id != "" && group_id_state != "Error" && tablename && syst) {
					var item = {
						GROUPID: group_id,
						TABLENAME: tablename,
						SYSTEMNAME: syst,
						DESCRIPTION: group_descr_new
					};
					tbl_grp.push(item);
					oModFam.updateBindings(true);
				}
			} else {
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("e_tbl_grp_exist"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
			}
		},
		onUpdateTableGroup: function () {
			var groupid = this.getView().byId("idgroup").getValue();
			var group_descr_upd = this.getView().byId("group_descr").getValue();
			var oModelTblGrp = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.Home").getModel("tablegroup");
			var oNewList = this.getView().getModel("tablegroup_d").getData();
			var oModelTblGrpNodup = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.Home").getModel("tablegroupnodup");
			var e = oModelTblGrp.getData();
			var retList = [];
			for (var i = 0; i < e.length; i++) {
				if (e[i].GROUPID == groupid) {
					e.splice(i, 1);
					i = i - 1;
				}
			}

			for (var i = 0; i < oNewList.length; i++) {
				var NewList = {
					GROUPID: groupid,
					TABLENAME: oNewList[i].TABLENAME,
					SYSTEMNAME: oNewList[i].SYSTEMNAME,
					DESCRIPTION: group_descr_upd
				};
				e.push(NewList);
				retList.push(NewList);
			}
			oModelTblGrp.updateBindings(true);
			var newGroup = {
				GROUPID: groupid,
				TABLENAME: "",
				SYSTEMNAME: "",
				DESCRIPTION: group_descr_upd
			};
			var listnodup = oModelTblGrpNodup.getData();
			for (var j = 0; j < listnodup.length; j++) {
				if (listnodup[j].GROUPID == groupid) {
					listnodup.splice(j, 1);
					j = j - 1;
				}
			}
			listnodup.push(newGroup);
			oModelTblGrpNodup.updateBindings(true);

			return retList;
		},
		h_table_user: function (oEvent) {
			this.onOpenDialog();
		},
		onDelTableGrp: function (oEvent) {
			var oItem = oEvent.getParameter("listItem"),
				sPath = oItem.getBindingContext("tablegroup_d").getPath();
			var idx = sPath.split("/")[1];
			var oModel = this.getView().getModel("tablegroup_d");
			var e = this.getView().getModel("tablegroup_d").getData();
			if (idx !== -1) {
				e.splice(idx, 1);
				oModel.setData(e);
			}
		},
		checkInput: function () {
			var checkMand = true;
			var idgroupOK = this.checkField("idgroup");
			var group_descrOK = this.checkField("group_descr");
			if (!(idgroupOK && group_descrOK)) {
				checkMand = false;
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("check_mand"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
			}
			if (checkMand === true) {
				return true;
			} else {
				return false;
			}
		},
		checkField: function (field) {
			if (this.getView().byId(field).getValue() === "") {
				this.getView().byId(field).setValueState(sap.ui.core.ValueState.Error);
				this.getView().byId(field).setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("mand_field"));
				return false;
			} else {
				this.getView().byId(field).setValueState(sap.ui.core.ValueState.None);
				return true;
			}
		},
		handleUserInput: function (oEvent) {
			var sInput = oEvent.getParameter("value");
			var oInputControl = oEvent.getSource();
			if (sInput) {
				oInputControl.setValueState(sap.ui.core.ValueState.None);
			}
		},

		onCheckExist: function (oEvent) {
			var groupid = this.getView().byId("idgroup").getValue();
			var oModelTblGrpNodup = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.Home").getModel("tablegroupnodup");
			var listgrp = oModelTblGrpNodup.getData();

			var filtergrp = listgrp.filter(function (el) {
				return el.GROUPID == groupid;
			});

			if (filtergrp.length > 0) {
				this.getView().byId("idgroup").setValueState(sap.ui.core.ValueState.Error);
				this.getView().byId("idgroup").setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("e_fam_exist"));
				return false;
			} else {
				this.getView().byId("idgroup").setValueState(sap.ui.core.ValueState.none);
				return true;
			}

		}
	});
});