sap.ui.define([
	// Start Delete Angelo
	// "sap/ui/core/mvc/Controller",
	// End Delete Angelo

	// Start Insert Angelo
	"ManageTechTables/ManageTechTables/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	// End Insert Angelo

	"ManageTechTables/ManageTechTables/model/formatter",
	"sap/m/MessageToast",
	"sap/ui/model/Filter"
], function (BaseController, JSONModel, formatter, MessageToast, Filter) {
	"use strict";
	var role, uid, tab, syst, //newVers,
		fname, ncsv, source,
		// Start Insert Angelo
		mode, vers;
	// End Insert Angelo

	return BaseController.extend("ManageTechTables.ManageTechTables.controller.upload", {
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("upload").attachPatternMatched(this._attachPatternMatched, this);
		},

		onCheckDep: function (oEvent) {

			var oView = this.getView();
			var model = oView.getModel("tables_d_new");
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
				MessageToast.show(eMess);
			}
		},
		_attachPatternMatched: function (oEvent) {

			// Start Delete Angelo
			// Start Insert Angelo
			// This model is created to update dynamically the label for the upload dialog
			// var aDataUploadDialog = {
			// 	dialogText: "Placeholder"
			// };

			// var oModelUploadDialog = new JSONModel(aDataUploadDialog);
			// this.getView().setModel(oModelUploadDialog, "dialogUpload");
			// End Insert Angelo
			// End Delete Angelo

			tab = oEvent.getParameter("arguments").table;
			syst = oEvent.getParameter("arguments").system;

			// Start Delete Angelo
			// var vers = oEvent.getParameter("arguments").vers;
			// End Delete Angelo

			// Start Insert Angelo
			vers = oEvent.getParameter("arguments").vers;
			// End Insert Angelo

			role = oEvent.getParameter("arguments").role;
			uid = oEvent.getParameter("arguments").uid;
			fname = oEvent.getParameter("arguments").fname;
			ncsv = oEvent.getParameter("arguments").ncsv;
			source = oEvent.getParameter("arguments").source;

			// Start Insert Angelo
			mode = oEvent.getParameter("arguments").mode;
			// End Insert Angelo

			// Start Insert Angelo
			// This controller is used also to show a comparison between two version of the same table,
			// so the bar on the bottom of the page, the all Tables tab and the Dependencies tab can be removed (only for this case)
			if (ncsv === "K") {
				this.getView().byId("Bar_d").setVisible(false);
				// Start Insert Angelo
				this.getView().byId("filter2").setVisible(false);
				// End Insert Angelo
				this.getView().byId("filter3").setVisible(false);
			} else {
				this.getView().byId("Bar_d").setVisible(true);
				// Start Insert Angelo
				this.getView().byId("filter2").setVisible(true);
				// End Insert Angelo
				this.getView().byId("filter3").setVisible(true);
			}
			// End Insert Angelo

			var textLabel;

			// Start Insert Angelo 3.9
			if (role === "USER") {
				if (mode === "CHANGE") {
					this.getView().byId("bupl_ecc").setVisible(true);
				} else {
					this.getView().byId("bupl_ecc").setVisible(false);
				}
			} else {
				this.getView().byId("bupl_ecc").setVisible(true);
			}
			// End Insert Angelo 3.9

			// Start Insert Angelo
			// If the CSV functionality is used, the button "Download from Ecc must be hide"
			if (source === "csv") {
				this.getView().byId("bupl_ecc").setVisible(false);
			} else {
				this.getView().byId("bupl_ecc").setVisible(true);
			}
			// End Insert Angelo

			// Start Insert Angelo
			var oButton = this.getView().byId("bupl_ver");
			if (source === "ECC") {
				oButton.setText(this.getView().getModel("i18n").getResourceBundle().getText("uploadOnECC"));
			} else {
				oButton.setText(this.getView().getModel("i18n").getResourceBundle().getText("uploadOnHana"));
			}
			// End Insert Angelo

			var oView = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.Home_u");
			var oMod = oView.getModel("dep_d");
			this.getView().setModel(oMod, "dep_d");

			if (role === "USER") {
				textLabel = uid + " / User";
			} else {
				textLabel = uid + " / Administrator";
			}

			this.getView().byId("head_user").setText(textLabel);

			// Start Delete Angelo
			// newVers = this.newVers(vers);
			// End Delete Angelo

			oView = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.Home_u");
			oMod = oView.getModel("tables_d_new");
			this.getView().setModel(oMod, "tables_d_new");
			var oTable = this.getView().byId("table_new");
			//			var h_new = this.getView().getModel("i18n").getResourceBundle().getText("h_new");

			/*			oView.byId("table_ver_d_title").setText(table_d + " v" + vers_d); SAP UI TABLE */
			oTable.setTitle(tab + " v" + vers);
			oTable.setModel(oMod);

			oTable.bindColumns("/columns", function (sId, oContext) {
				var columnName = oContext.getObject().COLUMN_NAME;
				return new sap.ui.table.Column({
					label: columnName,
					filterProperty: columnName,
					template: new sap.ui.commons.TextView().bindProperty("text", {
						parts: [{
							path: columnName
						}, {
							path: columnName + "1"
						}, {
							path: "STAT"
						}, {
							path: columnName + "X"
						}],
						formatter: function (field, field1, stat, fieldx) {
							this.removeStyleClass("myclass_new");
							this.removeStyleClass("myclass_del");
							this.removeStyleClass("myclass_mod");
							this.removeStyleClass("myclass_errdep");
							if (stat === "N") {
								this.addStyleClass("myclass_new");
							} else if (stat === "D") {
								this.addStyleClass("myclass_del");
							} else if (field1) {
								if (field !== field1)
									this.addStyleClass("myclass_mod");
							}
							return field;
						}
					})
				});
			});

			oTable.bindRows("/rows");

			var filters = [];
			var filter = new sap.ui.model.Filter("STAT", sap.ui.model.FilterOperator.Contains, "N");
			filters.push(filter);
			filter = new sap.ui.model.Filter("STAT", sap.ui.model.FilterOperator.Contains, "D");
			filters.push(filter);
			filter = new sap.ui.model.Filter("STAT", sap.ui.model.FilterOperator.Contains, "M");
			filters.push(filter);
			// update list binding
			var binding = oTable.getBinding("rows");
			var changes = binding.filter(filters);
			var count;
			if (changes.iLength === 0) {
				sap.m.MessageBox.success(this.getView().getModel("i18n").getResourceBundle().getText("w_nonewvers"), {
					icon: sap.m.MessageBox.Icon.SUCCESS,
					onClose: this.onCancel()
				});
			} else {

				if (changes.iLength < 7) {
					count = changes.iLength;
				} else {
					count = 7;
				}

				this.getView().byId("table_new").setProperty("visibleRowCount", count);
				this.getView().byId("table_new").setProperty("visibleRowCountMode", sap.ui.table.VisibleRowCountMode.Fixed);
			}

			var bar = this.getView().byId("bar0");
			bar.setSelectedKey("k_resume");

			sap.ui.core.BusyIndicator.hide();

			// Start Insert Angelo
			if (ncsv !== "K" && changes.iLength > 0) {
				this.checkSAPTime();
			}
			// End Insert Angelo
		},

		// Start Delete Angelo
		// newVers: function (vers) {
		// 	var newVersione;
		// 	if (vers != "0") {
		// 		var add = parseFloat("0.1");
		// 		var ver_old = parseFloat(vers);
		// 		newVersione = (ver_old + add).toFixed(1);
		// 	} else {
		// 		newVersione = "1.0";
		// 	}
		// 	return newVersione;
		// },
		// End Delete Angelo

		// Begin Insert Angelo
		// Function to upload data from ECC to SCP
		onOpenDialogUplEcc: function () {

			// Start Delete Angelo
			// var that = this;
			// End Delete Angelo

			if (!this._oDialogUplECC) {
				this._oDialogUplECC = sap.ui.xmlfragment("UploadECC", "ManageTechTables.view.fragment.UploadECC", this);
				this.getView().addDependent(this._oDialogUplECC);
			}

			// Start Insert Angelo
			this._oDialogUplECC.open();
			// End Insert Angelo

			// Start Delete Angelo
			// Start Insert Angelo
			// var urlZTables = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
			// var entityEcc = "/timesTableSet('" + tab + "')";
			// var oModelEcc = new sap.ui.model.odata.v2.ODataModel(urlZTables);

			// var oModelDialog = this.getView().getModel("dialogUpload");
			// var oTextDialog = oModelDialog.getData();

			// oModelEcc.read(entityEcc, {
			// 	success: function (oData) {

			// 		var oVersData = sap.ui.getCore().getModel("versions").getData();

			// 		var onSapRow = oVersData.filter(function (value) {
			// 			return value.SAP === "X";
			// 		});

			// 		// Start Insert Angelo
			// 		if (onSapRow.length > 0) {
			// 			// End Insert Angelo

			// 			var fullDate = onSapRow[0].DATE.toJSON();

			// 			var date = fullDate.substring(0, 10);
			// 			var time = fullDate.substring(11, 19);

			// 			// SAP date format is YYYY.MM.DD, we have to convert it in format YYYY-MM-DD in order to execute the
			// 			// comparison
			// 			oData.Date = oData.Date.replace(/\./g, "-");

			// 			// SAP date > ADN date
			// 			if (oData.Date > date) {
			// 				// New Warning
			// 				oTextDialog.dialogText = that.getView().getModel("i18n").getResourceBundle().getText("uplEccWarning");
			// 			} else {
			// 				if (oData.Date === date) {
			// 					// Comparison between time is needed
			// 					// SAP time > ADN time
			// 					if (oData.Time < time) {
			// 						// New Warning
			// 						oTextDialog.dialogText = that.getView().getModel("i18n").getResourceBundle().getText("uplEccWarning");
			// 					} else {
			// 						// Standard message
			// 						oTextDialog.dialogText = that.getView().getModel("i18n").getResourceBundle().getText("tupl_ecc");
			// 					}
			// 				} else {

			// 					if (oData.Date < date) {
			// 						// New Warning
			// 						oTextDialog.dialogText = that.getView().getModel("i18n").getResourceBundle().getText("uplEccWarning");
			// 					} else {
			// 						// This case is impossible
			// 						// Standard message
			// 						oTextDialog.dialogText = that.getView().getModel("i18n").getResourceBundle().getText("tupl_ecc");
			// 					}
			// 				}
			// 			}
			// 			// Start Insert Angelo
			// 		} else {
			// 			// No SAP flag exists, the Standard message is used
			// 			oTextDialog.dialogText = that.getView().getModel("i18n").getResourceBundle().getText("tupl_ecc");
			// 		}
			// 		// End Insert Angelo
			// 		oModelDialog.refresh();
			// 		that._oDialogUplECC.open();
			// 	},
			// 	error: function (oData) {
			// 		oTextDialog = that.getView().getModel("i18n").getResourceBundle().getText("tupl_ecc");
			// 		oModelDialog.refresh();
			// 		that._oDialogUplECC.open();
			// 	}
			// });
			// End Delete Angelo
		},

		onCloseDialogUplECC: function () {
			var fragment = "UploadECC";
			var oDialog = sap.ui.core.Fragment.byId(fragment, "uploadECC");
			oDialog.close();
		},

		onUploadECC: function () {
			// The dialog is closed
			this.onCloseDialogUplECC();

			// var modelDetail = this.getView().getModel("detail_tbl").getData();

			// Dialog that allow the user to select the current version progress
			// this._selectVersionDialog("ECC", modelDetail.VERSION);
			this._selectVersionDialog("ECC", vers);
		},

		// This is actually download from ECC
		onUploadECCAfter: function (newVers) {

			// Code used to inform tha user that an async operation is currently being executed
			sap.ui.core.BusyIndicator.show(0);

			// var modelDetail = this.getView().getModel("detail_tbl").getData();

			// Content of the current table is readed from ECC
			// var entityEcc = "/tableSet('" + modelDetail.TABLENAME + "')/rowContentSet";
			var entityEcc = "/tableSet('" + tab + "')/rowContentSet";

			var that = this;
			var urlEcc = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
			var oModelEcc = new sap.ui.model.odata.v2.ODataModel(urlEcc);

			oModelEcc.read(entityEcc, {
				success: function (oData) {

					// Number of rows is written on "VERSIONS" table
					var rowsNumber = oData.results.length;
					var arrayECC = [];

					for (var i = 0; i < rowsNumber; i++) {
						arrayECC.push(oData.results[i].Row);
					}
					// The data retrieved from ECC is converted to a String, in order to be passed at the HANA XS procedure
					arrayECC = JSON.stringify(arrayECC);

					// The new procedure is called
					var urlUpload = "/service/ERPIBERIA_ADN/table_content/uploadFromEcc.xsjs";

					// Current date is taken from object Date   
					var newDay = new Date();
					var today = newDay.toJSON(); //Used for "uploadFromECC" service
					var today2 = JSON.stringify(newDay); //Used for newUpdateContent service

					// Column names
					// var col = that.getColumn(modelDetail.TABLENAME);
					var col = that.getColumn(tab);

					var allField = "(";
					for (i = 0; i < col.length; i++) {
						var column = col[i].COLUMN_NAME;
						allField = allField + column + ",";
					}
					allField = allField + "VALID_TO,VALID_FROM)";

					jQuery.ajax({
						url: urlUpload,
						async: true,
						data: {
							// table: modelDetail.TABLENAME,
							table: tab,
							rows: arrayECC,
							today: today,
							allField: allField
						},
						method: "POST",
						dataType: "text",
						success: function (response) {
							if (response === "OK") {

								// In case of success, the real table is updated on HANA
								var updateURL = "/service/ERPIBERIA_ADN/table_content/newUpdateContent.xsjs";
								var rowData;
								jQuery.ajax({
									url: updateURL,
									async: false,
									data: {
										// table: modelDetail.TABLENAME,
										table: tab,
										from: today2
									},
									method: "POST",
									dataType: "text",
									success: function (result) {
										rowData = result;
									},
									error: function (result) {
										rowData = "ERROR";
									}
								});
								if (rowData !== "OK") {
									// Error Case
									sap.ui.core.BusyIndicator.hide();
									sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("e_update_rec"), {
										icon: sap.m.MessageBox.Icon.ERROR,
										onClose: that.onCancel()
									});
								} else {

									// Number of records
									rowsNumber = that.getNumRecords(tab);

									// New row creation for "VERSIONS" table
									var newRow = that.createNewRowVers(tab, syst, newVers, newDay, uid, syst, rowsNumber, "X");
									that.createDBEcc("versions", "true", "versions/getVersions.xsodata", newRow);

									// var newRowLog = that.createNewRowLog(newDay, newVers);
									// that.createDBEcc("log", "true", "log/getLog.xsodata", newRowLog);

									// Loading wait is removed
									sap.ui.core.BusyIndicator.hide();

									sap.m.MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText("s_update_rec", newVers), {
										icon: sap.m.MessageBox.Icon.SUCCESS,
										// onClose: that._onRefreshPage() //To refresh data
										onClose: that.onCancel()
									});
								}
							}
						},
						error: function (error) {
							sap.ui.core.BusyIndicator.hide();
						}
					});
				},
				error: function (error) {
					sap.m.MessageBox.alert(that.getView().getModel("i18n").getResourceBundle().getText("s_no_ecc"), {});
				}
			});
		},
		// End Insert Angelo

		onCancel: function (oEvent) {

			// Start Insert Angelo
			// The default table is showed every time the compare button is pressed
			this.getView().byId("table_new").setVisible(true);

			// The container of dynamic tables, if exists, is destroyed
			var oVBox = sap.ui.getCore().byId("idVBox");
			if (oVBox !== undefined) {
				oVBox.destroy();
			}
			// End Insert Angelo

			// Start Insert Angelo
			this.removeLock(tab);
			// End Insert Angelo

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("home_u", {
				username: uid,
				role: role
			});
		},
		onLogin: function (oEvent) {
			// Start Insert Angelo
			this.removeLock(tab);
			// End Insert Angelo

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("login");
		},

		// Start Insert Angelo
		checkSAPTime: function () {

			// This variable contains the message that will be shown to the user
			var message;
			var okButton = this.getView().getModel("i18n").getResourceBundle().getText("okButton");

			var that = this;

			// Start Insert Angelo
			var urlZTables = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
			var entityEcc = "/timesTableSet('" + tab + "')";
			var oModelEcc = new sap.ui.model.odata.v2.ODataModel(urlZTables);

			oModelEcc.read(entityEcc, {
				success: function (oData) {

					var oVersData = sap.ui.getCore().getModel("versions").getData();

					var onSapRow = oVersData.filter(function (value) {
						return value.SAP === "X";
					});

					if (onSapRow.length > 0) {

						// Start Insert Angelo
						// Offset contains the minutes of time zone difference converted in milliseconds
						var vOffset = new Date().getTimezoneOffset() * -1 * 60000;
						var vTime = onSapRow[0].DATE.getTime() + vOffset;

						var fullDate = new Date(vTime).toJSON();
						// End Insert Angelo

						var date = fullDate.substring(0, 10);
						var time = fullDate.substring(11, 19);

						// SAP date format is YYYY.MM.DD, we have to convert it in format YYYY-MM-DD in order to execute the
						// comparison
						oData.Date = oData.Date.replace(/\./g, "-");

						// SAP date > ADN date
						if (oData.Date > date) {

							// New Warning
							message = that.getView().getModel("i18n").getResourceBundle().getText("uplEccWarning");

							sap.m.MessageBox.warning(message, {
								icon: sap.m.MessageBox.Icon.WARNING,
								actions: [
									okButton
								],
								onClose: function (oAction) {}
							});

						} else {
							if (oData.Date === date) {
								// Comparison between time is needed
								// SAP time > ADN time
								if (oData.Time > time) {
									// New Warning
									message = that.getView().getModel("i18n").getResourceBundle().getText("uplEccWarning");

									sap.m.MessageBox.warning(message, {
										icon: sap.m.MessageBox.Icon.WARNING,
										actions: [
											okButton
										],
										onClose: function (oAction) {}
									});
								}
								// Start Delete Angelo
								// else {
								// 	// Standard message
								// 	message = that.getView().getModel("i18n").getResourceBundle().getText("w_compare", syst);
								// }
								// End Delete Angelo
							}
							// Start Delete Angelo
							// else {

							// 	if (oData.Date < date) {
							// 		// Old message
							// 		message = that.getView().getModel("i18n").getResourceBundle().getText("w_compare", syst);
							// 	} else {
							// 		// This case is impossible
							// 		// Standard message
							// 		message = that.getView().getModel("i18n").getResourceBundle().getText("w_compare", syst);
							// 	}
							// }
							// End Delete Angelo
						}
					}
					// Start Delete Angelo
					// else {
					// 	// No SAP flag exists, the Standard message is used
					// 	message = that.getView().getModel("i18n").getResourceBundle().getText("w_compare", syst);
					// }

					// that.onUploadToEcc(message);
					// End Delete Angelo
				},
				error: function (oData) {
					// Start Delete Angelo
					// that.errorTextDownload("timestampCheck");

					// message = that.getView().getModel("i18n").getResourceBundle().getText("w_compare", syst);
					// that.onUploadToEcc(message);
					// End Delete Angelo
				}
			});
		},

		errorTextDownload: function (text) {
			var oContent = this.getView().getModel("i18n").getResourceBundle().getText(text);

			var oName = "UPLOAD_LOG_ERROR_";
			var oExtFile = ".txt";

			this.onDownloadErrorLog(oName, oContent, oExtFile);
		},

		onUploadToEcc: function (mess) {

			var that = this;
			var rowData;

			var upd = this.getView().getModel("i18n").getResourceBundle().getText("b_upd");
			var canc = this.getView().getModel("i18n").getResourceBundle().getText("b_cancel");

			sap.m.MessageBox.warning(mess, {
				icon: sap.m.MessageBox.Icon.WARNING,
				actions: [
					upd,
					canc
				],
				onClose: function (oAction) {
					if (oAction === upd) {
						sap.ui.core.BusyIndicator.show(0);
						var jurlLastVersion = "/service/ERPIBERIA_ADN/table_content/lastVersionCsv.xsjs";
						jQuery.ajax({
							url: jurlLastVersion,
							async: true,
							data: {
								table: tab
							},
							method: "GET",
							dataType: "text",
							success: function (response) {
								var tableContent = [];
								rowData = JSON.parse(response);
								for (var x = 0; x < rowData.length; x++) {
									var el = {
										Row: rowData[x]
									};
									tableContent.push(el);
								}
								var urlEcc = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
								var oModelEcc = new sap.ui.model.odata.v2.ODataModel(urlEcc);

								var entityPostECC = {
									"d": {
										Tablename: tab,
										rowContentSet: tableContent
									}
								};

								oModelEcc.create("/tableSet", entityPostECC, {
									success: function (result) {

										// Start Insert Angelo
										// Flag X for SAP is set to the current version
										var oModelVers = sap.ui.getCore().getModel("versions");
										var versionData = oModelVers.getData();

										// Start Insert Angelo
										// This logic is used to write a new row for the log table
										var oDate = new Date();
										var newRowLog = that.createNewRowLogCSV(oDate, versionData[0].VERSION, "X");
										that.createDB("log", "true", "log/getLog.xsodata", newRowLog);
										// End Insert Angelo

										// Model creation with address
										var oModelSAPUpdate = new sap.ui.model.odata.v2.ODataModel("/service/ERPIBERIA_ADN/versions/getVersions.xsodata/");

										// Path creation
										var path = "/versions(TABLENAME='" + versionData[0].TABLENAME + "',SYSTEMNAME='" + encodeURIComponent(versionData[0]
												.SYSTEMNAME) +
											"',VERSION='" +
											versionData[0].VERSION + "')";

										// Start Delete Angelo
										// versionData[0].SAP = "X";
										// versionData[0].SAPDATE = versionData[0].DATE;
										// End Delete Angelo

										// Start Insert Angelo
										var aVersion = {
											TABLENAME: versionData[0].TABLENAME,
											SYSTEMNAME: versionData[0].SYSTEMNAME,
											VERSION: versionData[0].VERSION,
											DATE: versionData[0].DATE,
											CREATE_USER: versionData[0].CREATE_USER,
											SOURCE: versionData[0].SOURCE,
											RECORDS: versionData[0].RECORDS,
											SAP: "X",
											SAPDATE: versionData[0].DATE,
											STRUCTVERSION: versionData[0].STRUCTVERSION
										};

										oModelSAPUpdate.update(path, aVersion, {
											// End Insert Angelo

											// Start Delete Angelo
											// oModelSAPUpdate.update(path, versionData[0], {
											// End Delete Angelo
											async: true,
											success: function () {
												sap.ui.core.BusyIndicator.hide();
												sap.m.MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText("messSuccECCPost"), {
													icon: sap.m.MessageBox.Icon.SUCCESS,
													onClose: function () {
														that.onCancel();
													}
												});
											},
											error: function (e) {
												// Progress indicator is removed
												sap.ui.core.BusyIndicator.hide();

												that.removeLock(versionData[0].TABLENAME);
											}
										});
										// End Insert Angelo

										// Start Delete Angelo
										// sap.ui.core.BusyIndicator.hide();
										// sap.m.MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText("messSuccECCPost"), {
										// 	icon: sap.m.MessageBox.Icon.SUCCESS,
										// 	onClose: function () {
										// 		that.onCancel();
										// 	}
										// });
										// End Delete Angelo
									},
									error: function (e) {
										that.errorTextDownload("noSapConnection");

										sap.ui.core.BusyIndicator.hide();
										//Pop up error
										sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messErrECCPost"), {
											icon: sap.m.MessageBox.Icon.ERROR,
											onClose: function (action) {
												that.onCancel();
											}
										});
									}
								});

							},
							error: function (response) {
								that.errorTextDownload("noLastVersion");

								sap.m.MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("messErrECCUpl"), {
									icon: sap.m.MessageBox.Icon.ERROR
								});
								sap.ui.core.BusyIndicator.hide();
							}
						});
					}
				}
			});
		},
		// End Insert Angelo

		onUploadRecords: function (oEvent) {
			// Start Delete Angelo
			// var rowData;
			// End Delete Angelo

			if (source === "ECC") {
				// Start Delete Angelo
				// var t = this;
				// var mess = this.getView().getModel("i18n").getResourceBundle().getText("w_compare", syst);
				// End Delete Angelo

				// Start Insert Angelo
				// Standard message is retrieved
				var message = this.getView().getModel("i18n").getResourceBundle().getText("w_compare", syst);
				this.onUploadToEcc(message);
				// End Insert Angelo

				// Start Delete Angelo
				// this.checkSAPTime();
				// End Delete Angelo

				// Start Delete Angelo
				// var upd = this.getView().getModel("i18n").getResourceBundle().getText("b_upd");
				// var canc = this.getView().getModel("i18n").getResourceBundle().getText("b_cancel");
				// sap.m.MessageBox.warning(mess, {
				// 	icon: sap.m.MessageBox.Icon.WARNING,
				// 	actions: [
				// 		upd,
				// 		canc
				// 	],
				// 	onClose: function (oAction) {
				// 		if (oAction === upd) {
				// 			sap.ui.core.BusyIndicator.show(0);
				// 			var jurlLastVersion = "/service/ERPIBERIA_ADN/table_content/lastVersionCsv.xsjs";
				// 			jQuery.ajax({
				// 				url: jurlLastVersion,
				// 				async: true,
				// 				data: {
				// 					table: tab
				// 				},
				// 				method: "GET",
				// 				dataType: "text",
				// 				success: function (response) {
				// 					var tableContent = [];
				// 					rowData = JSON.parse(response);
				// 					for (var x = 0; x < rowData.length; x++) {
				// 						var el = {
				// 							Row: rowData[x]
				// 						};
				// 						tableContent.push(el);
				// 					}
				// 					var urlEcc = "/serviceOData/sap/opu/odata/SAP/ZADN_SRV/";
				// 					var oModelEcc = new sap.ui.model.odata.v2.ODataModel(urlEcc);
				// 					var entityPostECC = {
				// 						"d": {
				// 							Tablename: tab,
				// 							rowContentSet: tableContent
				// 						}
				// 					};

				// 					oModelEcc.create("/tableSet", entityPostECC, {
				// 						success: function () {
				// 							sap.ui.core.BusyIndicator.hide();
				// 							sap.m.MessageBox.success(t.getView().getModel("i18n").getResourceBundle().getText("messSuccECCPost"), {
				// 								icon: sap.m.MessageBox.Icon.SUCCESS,
				// 								onClose: function () {
				// 									t.onCancel();
				// 								}

				// 							});
				// 						},
				// 						error: function (e) {
				// 							sap.ui.core.BusyIndicator.hide();
				// 							//pop up errore
				// 							sap.m.MessageBox.error(t.getView().getModel("i18n").getResourceBundle().getText("messErrECCPost"), {
				// 								icon: sap.m.MessageBox.Icon.ERROR,
				// 								onClose: function (action) {
				// 									t.onCancel();
				// 								}
				// 							});
				// 						}
				// 					});

				// 				},
				// 				error: function (response) {
				// 					sap.m.MessageBox.error(t.getView().getModel("i18n").getResourceBundle().getText("messErrECCUpl"), {
				// 						icon: sap.m.MessageBox.Icon.ERROR
				// 					});
				// 					sap.ui.core.BusyIndicator.hide();
				// 				}
				// 			});

				// 		}
				// 	}
				// });
				// End Delete Angelo

				// Upload on HANA XS
			} else {

				// Start Insert Angelo
				this._selectVersionDialog("CSV", vers);
				// End Insert Angelo
			}
		},

		onUploadCSVAfter: function (newVers) {

			var that = this;

			// Loading indicator is shown
			sap.ui.core.BusyIndicator.show(0);

			var event = new Date();
			var eventFrom = JSON.stringify(event);
			var rowData;

			var jurl = "/service/ERPIBERIA_ADN/table_content/newUpdateContent.xsjs";
			jQuery.ajax({
				url: jurl,
				async: false,
				data: {
					table: tab,
					from: eventFrom
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
			if (rowData !== "OK") {
				// Progress indicator is removed
				sap.ui.core.BusyIndicator.hide();

				sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("e_update_rec"), {
					icon: sap.m.MessageBox.Icon.ERROR,
					onClose: this.onCancel()
				});
			} else {

				// Local file label
				var currentDest = this.getView().getModel("i18n").getResourceBundle().getText("s_local_file");

				// Number of records is taken from a different function
				var rowsNumber = this.getNumRecords(tab);

				var newRow = this.createNewRowVers(tab, syst, newVers, event, uid, currentDest, rowsNumber);
				this.createDB("versions", "true", "versions/getVersions.xsodata", newRow);
				//Start insert Andrea
				ncsv = rowsNumber;
				//End Insert Andrea
				var newRowLog = this.createNewRowLogCSV(event, newVers, "");
				this.createDB("log", "true", "log/getLog.xsodata", newRowLog);

				// Loading indicator is removed
				sap.ui.core.BusyIndicator.hide();

				sap.m.MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText("s_update_rec", newVers), {
					icon: sap.m.MessageBox.Icon.SUCCESS,
					onClose: that.onCancel()
				});

				// The previous logic to get the records number is useless
				// The current number of records is taken directly from the getContent.xsjs service
				// var urlRows = "/service/ERPIBERIA_ADN/table_content/getcontent.xsjs";

				// jQuery.ajax({
				// 	url: urlRows,
				// 	async: true,
				// 	data: {
				// 		table: newRow.TABLENAME,
				// 		system: newRow.SYSTEMNAME,
				// 		version: newVers
				// 	},
				// 	method: "GET",
				// 	dataType: "text",
				// 	success: function (response) {

				// 		newRow.RECORDS = JSON.stringify((JSON.parse(response)).length);

				// Current row elaborated is updated
				// that._versionUpdateRow(newRow, newVers);
				// },
				// 	error: function (response) {

				// 	}
				// });

			}
		},

		// Unused/Useless
		_versionUpdateRow: function (newRow, newVers) {

			var that = this;
			var oModelEcc = new sap.ui.model.odata.v2.ODataModel("/service/ERPIBERIA_ADN/versions/getVersions.xsodata/");

			var oEntry = {
				RECORDS: newRow.RECORDS
			};

			var path = "/versions(TABLENAME='" + newRow.TABLENAME + "',SYSTEMNAME='" + encodeURIComponent(newRow.SYSTEMNAME) +
				"',VERSION='" + newRow.VERSION +
				"')";

			// var entityEcc = "/tableSet('" + modelDetail.TABLENAME + "')/rowContentSet";
			oModelEcc.update(path, oEntry, {
				success: function (oData) {
					// Loading indicator is removed
					sap.ui.core.BusyIndicator.hide();

					sap.m.MessageBox.success(that.getView().getModel("i18n").getResourceBundle().getText("s_update_rec", newVers), {
						icon: sap.m.MessageBox.Icon.SUCCESS,
						onClose: that.onCancel()
					});
				},
				error: function (oData) {
					// Loading indicator is removed
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		createNewRowLogCSV: function (date, newVers, vImportSap) {
			// Start Insert Angelo
			if (vImportSap === "X") {
				fname = "";
				ncsv = "";
			}
			// End Insert Angelo

			var item = {
				TABLENAME: tab,
				SYSTEMNAME: syst,
				VERSION: newVers,
				USERNAME: uid,
				CSV_FILENAME: fname,
				N_CSV: ncsv,
				DATE: date,
				IMPORT_SAP: vImportSap
			};
			return item;
		},
		updateLogModel: function (newitem) {
			var oModelLog = sap.ui.core.UIComponent.getRouterFor(this).getView("ManageTechTables.view.Home_u").getModel("log");
			var oListLog = oModelLog.getData();
			oListLog.push(newitem);
			oModelLog.updateBindings(true);
		},
		createDB: function (entitySet, asyncr, method, newRow) {
			var results;
			// indirizzo del servizio
			var serviceURL = "/service/ERPIBERIA_ADN/" + method;
			// creo il modello
			var oModel = new sap.ui.model.odata.ODataModel(serviceURL, true);
			// Leggo il modello da SAP
			oModel.create(entitySet, newRow, null, function (oData) {
				results = "SUCCESS";
			}, function (e) {
				// errore lettura oData
				results = "ERROR";
			});
			return results;
		},

		onSelect: function (oEvent) {
			var oTable = this.getView().byId("table_new");
			var bar = this.getView().byId("bar0");
			var expanded = bar.getExpanded();
			var key = bar.getSelectedKey();
			var filters;
			var binding;
			var changes;
			var filter,
				count = 7;

			if (expanded === true) {
				this.getView().byId("table_new").setVisible(true);
			} else {
				this.getView().byId("table_new").setVisible(false);
			}

			// Start Insert Angelo
			// Dependencies table is removed every time the 'Compare' is called
			var oVBox = sap.ui.getCore().byId("idVBox");
			if (oVBox !== undefined) {
				oVBox.destroy();
			}
			// End Insert Angelo

			if (key === "k_resume") {
				filters = [];
				filter = new sap.ui.model.Filter("STAT", sap.ui.model.FilterOperator.Contains, "N");
				filters.push(filter);
				filter = new sap.ui.model.Filter("STAT", sap.ui.model.FilterOperator.Contains, "D");
				filters.push(filter);
				filter = new sap.ui.model.Filter("STAT", sap.ui.model.FilterOperator.Contains, "M");
				filters.push(filter);
				binding = oTable.getBinding("rows");
				changes = binding.filter(filters);

				if (changes.iLength < 7) {
					count = changes.iLength;
				} else {
					count = 7;
				}

				this.getView().byId("table_new").setProperty("visibleRowCount", count);
				this.getView().byId("table_new").setProperty("visibleRowCountMode", sap.ui.table.VisibleRowCountMode.Fixed);
			}
			if (key === "k_all") {
				filters = [];
				binding = oTable.getBinding("rows");
				changes = binding.filter(filters);

				if (changes.iLength < 7) {
					count = changes.iLength;
				} else {
					count = 7;
				}

				this.getView().byId("table_new").setProperty("visibleRowCount", count);
				this.getView().byId("table_new").setProperty("visibleRowCountMode", sap.ui.table.VisibleRowCountMode.Fixed);
			}
			if (key === "k_dep") {

				// Start Insert Angelo
				// The old table is hidden in order to shows the new dynamic container
				this.getView().byId("table_new").setVisible(false);

				// If of the Page section of the view is taken, here will be inserted the new container
				var oPage = this.getView().byId("uploadPage");

				// The container is inserted into the Page section of the view
				oPage.addContent(this.getContainerDynTables(tab));
				// End Insert Angelo

				// Start Delete Angelo
				// filters = [];
				// filter = new sap.ui.model.Filter("STAT", sap.ui.model.FilterOperator.Contains, "M");
				// filters.push(filter);
				// filter = new sap.ui.model.Filter("STAT", sap.ui.model.FilterOperator.Contains, "N");
				// filters.push(filter);
				// filter = new sap.ui.model.Filter("CHECKDEP", sap.ui.model.FilterOperator.Contains, "KO");
				// filters.push(filter);
				// binding = oTable.getBinding("rows");
				// changes = binding.filter(filters);

				// if (changes.iLength < 20) {
				// 	count = changes.iLength;
				// } else {
				// 	count = 20;
				// }

				// this.getView().byId("table_new").setProperty("visibleRowCount", count);
				// End Delete Angelo
			}
		}
	});
});