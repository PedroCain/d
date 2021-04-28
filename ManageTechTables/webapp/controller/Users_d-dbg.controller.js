sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/SimpleType",
	"sap/ui/model/ValidateException",
	"ManageTechTables/ManageTechTables/model/formatter",
	"sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageBox, MessageToast, SimpleType, ValidateException, formatter, Fragment) {
	"use strict";
	return Controller.extend("ManageTechTables.ManageTechTables.controller.Users_d", {
		formatter: formatter,
		onInit: function () {
			var user_mode_array = [];

			var user_mode = {
				MODE: "CHANGE",
				DESCRIPTION: "Change"
			};
			user_mode_array.push(user_mode);
			user_mode = {
				MODE: "READ",
				DESCRIPTION: "Read"
			};
			user_mode_array.push(user_mode);
			var oUser_mode = new JSONModel();
			oUser_mode.setData(user_mode_array);
			this.getView().setModel(oUser_mode, "user_mode");

			sap.ui.getCore().getMessageManager().registerObject(this.getView().byId("email"), true);
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("users_d").attachPatternMatched(this._attachPatternMatched, this);
		},

		_attachPatternMatched: function (oEvent) {
			var username = oEvent.getParameter("arguments").username;
			var idView = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.login").getId();
			var textLabel = sap.ui.getCore().byId(idView + "--uid").getValue() + " / Administrator";
			this.getView().byId("head_user").setText(textLabel);
			var oMod = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.Home").getModel("tablegroupnodup");
			this.getView().setModel(oMod, "tablegroupnodup");
			if (username !== "new") {
				this._toEdit(username);
			} else {
				this._toCreate();
			}
		},

		onCancel: function (evt) {
			this.getView().byId("userid").setValueState(sap.ui.core.ValueState.None);
			this.getView().byId("password").setValueState(sap.ui.core.ValueState.None);
			this.getView().byId("email").setValueState(sap.ui.core.ValueState.None);
			this.getView().byId("checkbADMIN").setSelected(false);
			this.getView().getModel("users_d").destroy();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("home");
		},

		onCreateUser: function () {
			var checkOK = this.checkInput();
			var setAdmin;
			if (checkOK === true) {
				var username = this.getView().byId("userid").getValue();
				var password = this.getView().byId("password").getValue();
				var name = this.getView().byId("name").getValue();
				var surname = this.getView().byId("surname").getValue();
				var email = this.getView().byId("email").getValue();
				var contact = this.getView().byId("contact").getValue();
				var language = this.getView().byId("languaget").getValue();
				var country = this.getView().byId("country").getValue();
				var surname2 = this.getView().byId("surname2").getValue(),
					company = this.getView().byId("company").getValue(),
					department = this.getView().byId("department").getValue();
				if (this.getView().byId("checkbADMIN").getSelected()) {
					setAdmin = "X";
				} else {
					setAdmin = "";
				}
				var jurl = "/service/ERPIBERIA_ADN/users/updateUsers.xsjs";
				var newUser = JSON.stringify({
					USERNAME: username,
					PASSWORD: password,
					NAME: name,
					SURNAME: surname,
					ADMIN: setAdmin,
					EMAIL: email,
					CONTACT: contact,
					LANGUAGE: language,
					COUNTRY: country,
					SURNAME2: surname2,
					COMPANY: company,
					DEPARTMENT: department,
					DELETED: " "
				});
				var result;
				jQuery.ajax({
					url: jurl,
					async: false,
					data: {
						user: newUser,
						operation: "create"
					},
					method: "GET",
					dataType: "text",
					success: function (response) {
						result = response;
					},
					error: function (xhr) {
						result = "ERROR";
					}
				});
				if (result == "\"USEREXISTS\"") {
					sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("exists"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
				} else if (result == "ERROR" || result != 1) {
					sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("serv_err"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
				} else {
					var oModelUsers = this.getView().getModel("users");
					var oUsers = this.getView().getModel("users").getData();
					var newUser1 = {
						USERNAME: username,
						PASSWORD: password,
						NAME: name,
						SURNAME: surname,
						ADMIN: setAdmin,
						EMAIL: email,
						CONTACT: contact,
						LANGUAGE: language,
						COUNTRY: country,
						SURNAME2: surname2,
						COMPANY: company,
						DEPARTMENT: department,
						DELETED: " "
					};
					oUsers.push(newUser1);
					oModelUsers.updateBindings(true);
					var oModelUserGrp = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.Home").getModel("usergroup");
					var oUserGrps = oModelUserGrp.getData();
					var oGroupList = this.getView().getModel("user_group_d").getData();
					for (var i = 0; i < oGroupList.length; i++) {
						var item = {
							USERNAME: username,
							GROUPID: oGroupList[i].GROUPID,
							MODE: oGroupList[i].MODE
						};
						oUserGrps.push(item);
						oModelUserGrp.updateBindings(true);
					}
					var user = "new";
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
						method: "GET",
						dataType: "text",
						success: function (response) {
							result2 = response;
						},
						error: function (xhr) {
							result2 = "ERROR";
						}
					});
					if (result2 == "ERROR") {
						sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("e_crt_usr_fam"), {
							icon: sap.m.MessageBox.Icon.ERROR
						});
					} else {
						// SUCCESSO
						this.clear("userid");
						this.clear("password");
						this.clear("name");
						this.clear("surname");
						this.clear("email");
						this.clear("contact");
						this.clear("country");
						this.clear("languaget");
						this.clear("surname2");
						this.clear("company");
						this.clear("department");
						this.clear("locked1");
						this.clear("locked2");
						this.clear("locked3");
						this.getView().byId("checkbADMIN").setSelected(false);
						sap.m.MessageBox.success(this.getView().getModel("i18n").getResourceBundle().getText("s_create_user", username), {
							icon: sap.m.MessageBox.Icon.SUCCESS,
							onClose: this.goHome()
						});
					}
				}
			}
		},
		onUpdateUser: function () {
			var checkOK = this.checkInput();
			var setAdmin;
			if (checkOK === true) {
				var username = this.getView().byId("userid").getValue();
				var password = this.getView().byId("password").getValue();
				var name = this.getView().byId("name").getValue();
				var surname = this.getView().byId("surname").getValue();
				var email = this.getView().byId("email").getValue();
				var contact = this.getView().byId("contact").getValue();
				var language = this.getView().byId("languaget").getValue();
				var country = this.getView().byId("country").getValue();
				var surname2 = this.getView().byId("surname2").getValue(),
					company = this.getView().byId("company").getValue(),
					department = this.getView().byId("department").getValue();
				if (this.getView().byId("checkbADMIN").getSelected()) {
					setAdmin = "X";
				} else {
					setAdmin = "";
				}
				var locked1 = this.getView().byId("locked1").getValue(),
					locked2 = this.getView().byId("locked2").getValue(),
					locked3 = this.getView().byId("locked3").getValue();
				var jurl = "/service/ERPIBERIA_ADN/users/updateUsers.xsjs";
				var newUser = JSON.stringify({
					USERNAME: username,
					PASSWORD: password,
					NAME: name,
					SURNAME: surname,
					ADMIN: setAdmin,
					EMAIL: email,
					CONTACT: contact,
					LANGUAGE: language,
					COUNTRY: country,
					SURNAME2: surname2,
					COMPANY: company,
					DEPARTMENT: department,
					LOCKED1: locked1,
					LOCKED2: locked2,
					LOCKED3: locked3,
					DELETED: " "
				});
				var result;
				jQuery.ajax({
					url: jurl,
					async: false,
					data: {
						user: newUser,
						operation: "update"
					},
					method: "GET",
					dataType: "text",
					success: function (response) {
						result = response;
					},
					error: function (xhr) {
						result = "ERROR";
					}
				});
				if (result == "ERROR" || result != 1) {
					sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("e_update_user"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
				} else {
					var oModel = this.getView().getModel("users");
					var e = this.getView().getModel("users").getData();
					var index = e.findIndex(function (el) {
						return el.USERNAME == username;
					});
					e[index].USERNAME = username;
					e[index].PASSWORD = password;
					e[index].NAME = name;
					e[index].SURNAME = surname;
					e[index].ADMIN = setAdmin;
					e[index].EMAIL = email;
					e[index].CONTACT = contact;
					e[index].LANGUAGE = language;
					e[index].COUNTRY = country;
					e[index].SURNAME2 = surname2;
					e[index].COMPANY = company;
					e[index].DEPARTMENT = department;
					e[index].LOCKED1 = locked1;
					e[index].LOCKED2 = locked2;
					e[index].LOCKED3 = locked3;
					e[index].DELETED = " ";
					oModel.updateBindings(true);
					var oModelUserGrp = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.Home").getModel("usergroup");
					var oUserGrps = oModelUserGrp.getData();
					var oGroupList = this.getView().getModel("user_group_d").getData();
					this.onUpdateTableUser(oModelUserGrp, username, oGroupList);
					var user = username;
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
						method: "GET",
						dataType: "text",
						success: function (response) {
							result2 = response;
						},
						error: function (xhr) {
							result2 = "ERROR";
						}
					});
					if (result2 == "ERROR") {
						sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("e_upd_usr_fam"), {
							icon: sap.m.MessageBox.Icon.ERROR
						});
					} else {
						// SUCCESSO
						sap.m.MessageBox.success(this.getView().getModel("i18n").getResourceBundle().getText("s_update_user", username), {
							icon: sap.m.MessageBox.Icon.SUCCESS,
							onClose: this.goHome()
						});
					}
				}
			}
		},

		goHome: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("home");
		},

		checkInput: function () {
			var checkMand = true;
			var useridOK = this.checkField("userid");
			var passwordOK = this.checkField("password");
			var emailOK = this.checkField("email");
			if (!(useridOK && passwordOK)) {
				checkMand = false;
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("check_mand"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
			} else {
				if (emailOK == false) {
					checkMand = false;
					sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("check_mand"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
				} else if (emailOK == "Error") {
					checkMand = false;
					sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("e_mail"), {
						icon: sap.m.MessageBox.Icon.ERROR
					});
				}
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
				if (field == "email") {
					var email_state = this.getView().byId(field).getValueStateText();
					if (email_state !== "is not a valid email address") {
						this.getView().byId(field).setValueState(sap.ui.core.ValueState.None);
						return true;
					} else {
						return "Error";
					}
				} else {
					this.getView().byId(field).setValueState(sap.ui.core.ValueState.None);
					return true;
				}
			}
		},

		clear: function (field) {
			this.getView().byId(field).setValueState(sap.ui.core.ValueState.None);
			this.getView().byId(field).setValue("");
		},
		handleUserInput: function (oEvent) {
			var sUserInput = oEvent.getParameter("value");
			var oInputControl = oEvent.getSource();
			if (sUserInput) {
				oInputControl.setValueState(sap.ui.core.ValueState.None);
			}
		},
		logoff: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Home");
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
		onLogin: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var oModelUsers = this.getView().getModel("users");
			oRouter.getView("ManageTechTables.view.login").setModel(oModelUsers, "users");
			oRouter.navTo("login");
		},
		_toEdit: function (username) {
			var user_d = this.recuperaUser(username);
			var user_d_fam = this.recuperaUser_fam(username);
			if (user_d_fam) {
				var oPos = new JSONModel(user_d_fam);
				this.getView().setModel(oPos, "user_group_d");
			}
			var textLabel = this.getView().getModel("i18n").getResourceBundle().getText("h_EditUser");
			this.getView().byId("page_user").setTitle(textLabel);
			this.getView().byId("user_detail").setTitle(textLabel);
			this.getView().byId("userid").setEnabled(false);
			this.getView().byId("btnbaruser").detachPress(this.onUpdateUser, this);
			this.getView().byId("btnbaruser").detachPress(this.onCreateUser, this);
			this.getView().byId("btnbaruser").attachPress(this.onUpdateUser, this);
			this.getView().byId("input_table").setValue("");
			if (user_d) {
				var user_detail = {
					USERNAME: user_d[0].USERNAME,
					PASSWORD: user_d[0].PASSWORD,
					NAME: user_d[0].NAME,
					SURNAME: user_d[0].SURNAME,
					ADMIN: user_d[0].ADMIN,
					EMAIL: user_d[0].EMAIL,
					CONTACT: user_d[0].CONTACT,
					LANGUAGE: user_d[0].LANGUAGE,
					COUNTRY: user_d[0].COUNTRY,
					SURNAME2: user_d[0].SURNAME2,
					COMPANY: user_d[0].COMPANY,
					DEPARTMENT: user_d[0].DEPARTMENT,
					DELETED: " "
				};
				var oUser_d = new JSONModel();
				oUser_d.setData(user_detail);
				this.getView().setModel(oUser_d, "users_d");
			} else {
				this._clearAll();
			}
		},
		recuperaUser: function (username) {
			var userList = this.getView().getModel("users").getData();
			var filterUser = userList.filter(function (el) {
				return el.USERNAME == username;
			});
			return filterUser;
		},
		recuperaUser_fam: function (username) {
			var oGroupList = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.Home").getModel("usergroup").getData();
			var posizioni = [];
			for (var i = 0; i < oGroupList.length; i++) {
				if (oGroupList[i].USERNAME === username) {
					var item = {
						USERNAME: oGroupList[i].USERNAME,
						GROUPID: oGroupList[i].GROUPID,
						MODE: oGroupList[i].MODE
					};
					posizioni.push(item);
				}
			}
			return posizioni;
		},
		_toCreate: function () {
			this._clearAll();
			var textLabel = this.getView().getModel("i18n").getResourceBundle().getText("h_CreateUser");
			this.getView().byId("page_user").setTitle(textLabel);
			this.getView().byId("user_detail").setTitle(textLabel);
			this.getView().byId("userid").setEnabled(true);
			this.getView().byId("btnbaruser").detachPress(this.onUpdateUser, this);
			this.getView().byId("btnbaruser").detachPress(this.onCreateUser, this);
			this.getView().byId("btnbaruser").attachPress(this.onCreateUser, this);
			this.getView().byId("input_table").setValue("");
		},
		_clearAll: function () {
			this.clear("userid");
			this.clear("password");
			this.clear("name");
			this.clear("surname");
			this.clear("email");
			this.clear("contact");
			this.clear("country");
			this.clear("languaget");
			this.clear("surname2");
			this.clear("company");
			this.clear("department");
			this.clear("locked1");
			this.clear("locked2");
			this.clear("locked3");
			this.getView().byId("checkbADMIN").setSelected(false);
			var oView = this.getView();
			var user_d = {
				USERNAME: "",
				PASSWORD: "",
				NAME: "",
				SURNAME: "",
				ADMIN: "",
				EMAIL: "",
				CONTACT: "",
				LANGUAGE: "",
				COUNTRY: "",
				SURNAME2: "",
				COMPANY: "",
				DEPARTMENT: "",
				LOCKED1: "",
				LOCKED2: "",
				LOCKED3: "",
				DELETED: " "
			};
			var oModelJson = new sap.ui.model.json.JSONModel();
			oModelJson.setData(user_d);
			oView.setModel(oModelJson, "users_d");
			var family = [];
			var oModelJson1 = new sap.ui.model.json.JSONModel();
			oModelJson1.setData(family);
			oView.setModel(oModelJson1, "user_group_d");
			this.getView().byId("userid").setValueState(sap.ui.core.ValueState.None);
			this.getView().byId("password").setValueState(sap.ui.core.ValueState.None);
			this.getView().byId("email").setValueState(sap.ui.core.ValueState.None);
		},
		customEMailType: SimpleType.extend("email", {
			formatValue: function (oValue) {
				return oValue;
			},
			parseValue: function (oValue) {
				//parsing step takes place before validating step, value could be altered here
				return oValue;
			},
			validateValue: function (oValue) {
				// The following Regex is NOT a completely correct one and only used for demonstration purposes.
				// RFC 5322 cannot even checked by a Regex and the Regex for RFC 822 is very long and complex.
				var rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
				if (!oValue.match(rexMail) && oValue) {
					//	throw new ValidateException("'" + oValue + "' is not a valid email address");
					throw new ValidateException("is not a valid email address");
				}
			}
		}),
		onAddUserFam: function (oEvent) {
			var oModFam = this.getView().getModel("user_group_d");
			var family = oModFam.getData();
			var username = this.getView().byId("userid").getValue();
			var groupid = this.getView().byId("input_table").getValue();
			var filtergroupid = family.filter(function (el) {
				return el.GROUPID == groupid;
			});
			if (filtergroupid.length == 0) {
				if (username && groupid) {
					var item = {
						USERNAME: username,
						GROUPID: groupid,
						MODE: ""
					};
					family.push(item);
					oModFam.updateBindings(true);
				}
			} else {
				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("e_user_grp_exist"), {
					icon: sap.m.MessageBox.Icon.ERROR
				});
			}
		},
		h_table_user: function (oEvent) {
			this.onOpenDialog();
		},
		_getDialog: function () {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("ManageTechTables.view.fragment.help_table_user", this);
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
			var oFilter = new sap.ui.model.Filter("GROUPID", sap.ui.model.FilterOperator.Contains, sValue);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_handleValueHelpCloseCC: function (oEvent) {},
		_handleValueHelpConfirmCC: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var groupid = aContexts.map(function (oContext) {
					return oContext.getObject().GROUPID;
				}).join(", ");
			}
			this.getView().byId("input_table").setValue(groupid);
		},
		onDelTableUser: function (oEvent) {
			var oList = oEvent.getSource(),
				oItem = oEvent.getParameter("listItem"),
				sPath = oItem.getBindingContext("user_group_d").getPath();
			var idx = sPath.split("/")[1];
			var oModel = this.getView().getModel("user_group_d");
			var e = this.getView().getModel("user_group_d").getData();
			if (idx !== -1) {
				e.splice(idx, 1);
				oModel.setData(e);
			}
		},
		onUpdateTableUser: function (oModel, username, oNewList) {
			var e = oModel.getData();
			for (var i = 0; i < e.length; i++) {
				if (e[i].USERNAME == username) {
					e.splice(i, 1);
					i = i - 1;
				}
			}
			for (var i = 0; i < oNewList.length; i++) {
				e.push(oNewList[i]);
			}
			oModel.updateBindings(true);
		}

	});
});