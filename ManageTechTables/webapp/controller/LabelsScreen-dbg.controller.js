sap.ui.define([
	"ManageTechTables/ManageTechTables/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	//insert andrea
	"sap/m/MessageBox"
	// end insert andrea
], function (BaseController, JSONModel, Filter, FilterOperator, MessageToast, MessageBox) {
	"use strict";

	return BaseController.extend("ManageTechTables.ManageTechTables.controller.LabelsScreen", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf ManageTechTables.view.Labels
		 */
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("Labels").attachPatternMatched(this._attachPatternMatched,
				this);
		},

		_attachPatternMatched: function (oEvent) {

			var that = this;

			// Username logic
			var sUsername = this.getUserName();
			sUsername = sUsername + " / Administrator";
			this.getView().byId("username").setText(sUsername);

			// Main table logic
			// Service Address
			var sURL = "/service/ERPIBERIA_ADN/versions/getLabels.xsodata";

			// Model creation
			var oModel = new sap.ui.model.odata.v2.ODataModel(sURL);

			// Model read from SAP (table name, row)
			oModel.read("/labels", {
				method: "POST",
				success: function (vData) {

					var oModelLabels = new JSONModel();
					oModelLabels.setData(vData.results);

					// Download value is cleaned up
					for (var i = 0; i < vData.results.length; i++) {
						vData.results.DOWNLOAD = "";
					}

					// Search bar is restored and download button is disabled
					that.getView().byId("labelsSearch").setValue("");
					that.getView().byId("buttonDownload").setEnabled(false);
					//start insert Andrea
					that.getView().byId("buttonMove").setEnabled(false);
					//end Insret Andrea

					that.getView().setModel(oModelLabels, "labelsScreen");

					// This code is executed to determine if there are records written on localStorage
					// that may will not be valid anymore
					var vIsInProgress = that.checkLocalStorage();

					if (vIsInProgress === true) {
						that.timedSync();
					}
				}
			});
		},

		onPressBack: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			oRouter.navTo("home_u", {
				username: this.getUserName(),
				role: "ADMIN"
			});
		},

		onLabelSearch: function (oEvent) {
			var sQuery = oEvent.getSource().getValue();

			var aLabel = sQuery.split(" ");

			// A check is executed to determine if there is a download in progress
			var vInProgress = this.checkLocalStorage();

			if (aLabel.length > 0 && aLabel[0] !== "" && vInProgress === false) {
				this.getView().byId("buttonDownload").setEnabled(true);
				this.getView().byId("buttonMove").setEnabled(true);
			} else {
				this.getView().byId("buttonDownload").setEnabled(false);
				this.getView().byId("buttonMove").setEnabled(false);
			}

			var aFilter = [];
			var aFinalFilter = [];

			//Start change Andrea
			// for (var i = 0; i < aLabel.length; i++) {
			// 	aFilter.push(new Filter("LABEL", FilterOperator.Contains, aLabel[i]));
			// }
			//aFinalFilter = new Filter(aFilter, false);

			if (sQuery) {
				aFilter.push(new Filter("LABEL", FilterOperator.EQ, sQuery));
				aFinalFilter = new Filter(aFilter, false);
			}
			//End change Andrea

			// Binding of the list is taken from oEvent parameter
			var oBinding = this.getView().byId("labelsTable").getBinding("items");
			oBinding.filter(aFinalFilter);
		},

		checkLocalStorage: function () {
			var aLabels = this.getView().getModel("labelsScreen").getData();

			for (var i = 0; i < aLabels.length; i++) {
				var sCurrentItem = aLabels[i].TABLENAME + aLabels[i].SYSTEM + aLabels[i].VERSION;

				var aStatusInterval = JSON.parse(window.localStorage.getItem(sCurrentItem));

				if (aStatusInterval !== null) {
					// There is something on localStorage, a chekc is executed on the date contained

					var oDate = new Date();

					// If the thread is going for less than one hour, 
					// the new download will not be permitted
					if (oDate - new Date(aStatusInterval.date) < 3600000) {
						return true;
					} else {
						// The thread is going on for too much time, localStorage is cleared
						window.localStorage.removeItem(sCurrentItem);
					}
				}
			}
			return false;
		},

		downloadAllLabels: function () {

			var that = this;

			// Button is disabled when the download starts
			that.getView().byId("buttonDownload").setEnabled(false);

			// Data is taken from model
			// The current model used for the labels is updated with the informations sent from the various threads
			var oModelLabels = this.getView().getModel("labelsScreen");
			var aLabels = oModelLabels.getData();
			var aColumns;

			var aLabelsSearched = this.getView().byId("labelsSearch").getValue().split(" ");
			var aFilteredLabels = [];

			for (var k = 0; k < aLabels.length; k++) {
				for (var n = 0; n < aLabelsSearched.length; n++) {
					if (aLabels[k].LABEL.toLowerCase().indexOf(aLabelsSearched[n].toLowerCase()) !== -1) {
						aFilteredLabels.push(aLabels[k]);
						break;
					}
				}
			}

			// A timed function is started in order to check the current status of the downloads
			this.timedSync();

			var aCurrentVersion = {
				table: aFilteredLabels[0].TABLENAME,
				system: aFilteredLabels[0].SYSTEM,
				version: aFilteredLabels[0].VERSION
			};

			for (var i = 0; i < aFilteredLabels.length; i++) {

				// At the first cycle, the check about duplicate version must not be executed
				if (i !== 0) {
					// If the current version processed is equal to the previous, then it will be ignored
					if (aFilteredLabels[i].TABLENAME === aCurrentVersion.table &&
						aFilteredLabels[i].SYSTEM === aCurrentVersion.system &&
						aFilteredLabels[i].VERSION === aCurrentVersion.version) {
						continue;
					} else {
						aCurrentVersion.table = aFilteredLabels[i].TABLENAME;
						aCurrentVersion.system = aFilteredLabels[i].SYSTEM;
						aCurrentVersion.version = aFilteredLabels[i].VERSION;
					}
				}

				// A new record is appended on the array send to localStorage, 
				// to have infos about the status of the download 
				this.setLocalStorage(aFilteredLabels[i].TABLENAME, aFilteredLabels[i].SYSTEM, aFilteredLabels[i].VERSION);

				// Versions for the current table are extracted
				var sURL = "/service/ERPIBERIA_ADN/versions/getVersionsModel.xsjs";
				jQuery.ajax({
					url: sURL,
					async: false,
					data: {
						table: aFilteredLabels[i].TABLENAME,
						system: aFilteredLabels[i].SYSTEM
					},
					method: "POST",
					dataType: "text",
					success: function (data) {

						var results = JSON.parse(data);

						for (var f = 0; f < results.length; f++) {
							results[f].DATE = new Date(results[f].DATE);
							results[f].SAPDATE = new Date(results[f].SAPDATE);
						}

						// Model is set for the versions
						var oModelVersion = new JSONModel();
						oModelVersion.setData(results);
						that.getView().setModel(oModelVersion, "ver_d");
					}
				});

				// A check is executed in order to determine if the table have an older structure
				var oldTable = this.determineOldTable(aFilteredLabels[i].TABLENAME, aFilteredLabels[i].VERSION);

				if (oldTable === undefined) {
					oldTable = "";
				}

				// The list of columns is taken based on the name of the table
				if (oldTable === "") {
					aColumns = JSON.parse(this.getColumnsForDetail(aFilteredLabels[i].TABLENAME));
				} else {
					aColumns = JSON.parse(this.getColumnsForDetail(oldTable));
				}

				aColumns = this.createExcelColumns(aColumns);

				// URL creation for the new page 
				var sRootPath = jQuery.sap.getModulePath("ManageTechTables");
				var sURL = sRootPath + "/excel.html";

				// Data is passed to the new p   
				var sURLParams = "?table=" + encodeURIComponent(aFilteredLabels[i].TABLENAME) +
					"&system=" + encodeURIComponent(aFilteredLabels[i].SYSTEM) +
					"&version=" + encodeURIComponent(aFilteredLabels[i].VERSION) +
					"&oldTable=" + encodeURIComponent(oldTable) +
					"&reqLocal=true" + //localStorage is required for sync
					"&columns=" + encodeURIComponent(JSON.stringify(aColumns));

				window.open(sURL + sURLParams, "ExcelWindow", "noopener,width");
			}
		},

		// This function synchronize the current threads executed for download with the main thread of UI
		timedSync: function () {

			var that = this;

			var vInterval = window.setInterval(function () {

				var vStopInterval = true; //Flag used to stop the current timed function
				var oModelLabels = that.getView().getModel("labelsScreen");
				var aLabels = oModelLabels.getData();

				for (var i = 0; i < aLabels.length; i++) {

					var sCurrentItem = aLabels[i].TABLENAME + aLabels[i].SYSTEM + aLabels[i].VERSION;

					var aStatusInterval = JSON.parse(window.localStorage.getItem(sCurrentItem));

					// Not every label had is respective localStorage data
					if (aStatusInterval !== null) {
						aLabels[i].DOWNLOAD = aStatusInterval.status;
						if (aStatusInterval.status !== "Completed") {
							vStopInterval = false;
						} else {
							// Completed status is set for every combination of table, system and version
							// before the data is deleted from localStorage
							var z = i;
							if (z !== aLabels.length - 1) {
								while (aLabels[z].TABLENAME === aLabels[z + 1].TABLENAME &&
									aLabels[z].SYSTEM === aLabels[z + 1].SYSTEM &&
									aLabels[z].VERSION === aLabels[z + 1].VERSION) {
									z++;
									aLabels[z].DOWNLOAD = aStatusInterval.status;
								}
							}
							// If the status is completed, it can be removed from localStorage
							window.localStorage.removeItem(sCurrentItem);
						}
					}
				}

				oModelLabels.setData(aLabels);
				oModelLabels.refresh();

				// Every process has been completed, the timed funcion can be interrupted
				if (vStopInterval === true) {
					// Timed function is interrupted
					window.clearInterval(vInterval);

					// Button is enabled again only if there is a label inserted on the search bar
					if (that.getView().byId("labelsSearch").getValue() !== "") {
						that.getView().byId("buttonDownload").setEnabled(true);
					}
				}
			}, 250);
		},

		createExcelColumns: function (aArray) {

			var aColumns = [];

			// var columns = this.getView().getModel("table_ver_d").getData().columns;

			for (var i = 0; i < aArray.length; i++) {
				aColumns.push({
					property: aArray[i].COLUMN_NAME,
					type: "string"
				});
			}

			return aColumns;
		},

		setLocalStorage: function (sTable, sSystem, sVersion) {

			// Local storage is initialized with an empty array
			var aCurrentStatus = {
				status: "",
				date: ""
			};

			var sCurrentItem = sTable + sSystem + sVersion;
			window.localStorage.setItem(sCurrentItem, JSON.stringify(aCurrentStatus));
		},
		moveAllTables: function () {
			var that = this;

			// A message is shown to the user
			sap.m.MessageBox.confirm(that.getView().getModel("i18n").getResourceBundle().getText("massiveExportConfirm"), {
				icon: sap.m.MessageBox.Icon.CONFIRM,
				actions: [
					sap.m.MessageBox.Action.YES,
					sap.m.MessageBox.Action.NO
				],
				onClose: function (action) {
					if (action === sap.m.MessageBox.Action.YES) {
						that._moveAllTables();

					} else {
						// Progress indicator is removed
						sap.ui.core.BusyIndicator.hide();
					}
				}
			});

		},
		_moveAllTables: function () {

			var that = this;

			var callCounter = { counter: 0 };

			// Path used to call XSJS services
			// var sURLColumns = "/service/ERPIBERIA_ADN/table_content/getcolumns.xsjs";
			// var sURLContent = "/service/ERPIBERIA_ADN/table_content/getcontent.xsjs";
			// var sURLProd = "/serviceProd/ERPIBERIA_ADN/table_content/execJob.xsjs";
			// var sURLProd = "/service/ERPIBERIA_ADN/table_content/moveTableTest.xsjs";

			// Current user that is moving tables
			var sUser = this.getUserName();

			var sOldTable = "";

			// This string contains every single label searched by the user
			//start change andrea
			//var aLabelsSearched = this.getView().byId("labelsSearch").getValue().split(" ");
			var aLabelsSearched = this.getView().byId("labelsSearch").getValue();
			//end change andrea

			var aFilteredLabels = [];

			var oModelLabels = this.getView().getModel("labelsScreen");
			var aLabels = oModelLabels.getData();

			for (var k = 0; k < aLabels.length; k++) {
				// for (var n = 0; n < aLabelsSearched.length; n++) {
				// 	if (aLabels[k].LABEL.toLowerCase().indexOf(aLabelsSearched[n].toLowerCase()) !== -1) {
				// 		aFilteredLabels.push(aLabels[k]);
				// 		break;
				// 	}
				// }
				if (aLabels[k].LABEL.toLowerCase() === aLabelsSearched.toLowerCase()) {
					aFilteredLabels.push(aLabels[k]);
				}
			}

			aFilteredLabels = aFilteredLabels.sort(function (a, b) {
				return b.VERSION - a.VERSION;
			});

			var aFinalTables = [];
			var aCurrentTable;

			var sTestColumns;

			for (var i = 0; i < aFilteredLabels.length; i++) {
				aCurrentTable = aFinalTables.filter(function (value) {
					return aFilteredLabels[i].TABLENAME === value.TABLENAME;
				});

				if (aCurrentTable.length === 0) {

					aFinalTables.push(aFilteredLabels[i]);
					//begin Change Andrea
					// // Test columns are read
					// jQuery.ajax({
					// 	url: sURLColumns,
					// 	async: false,
					// 	data: {
					// 		table: aFilteredLabels[i].TABLENAME
					// 	},
					// 	method: "GET",
					// 	dataType: "text",
					// 	success: function (sResponseColumns) {
					// 		sTestColumns = sResponseColumns;

					// 		// Content of the table
					// 		jQuery.ajax({
					// 			url: sURLContent,
					// 			async: false,
					// 			data: {
					// 				table: aFilteredLabels[i].TABLENAME,
					// 				system: aFilteredLabels[i].SYSTEM,
					// 				version: aFilteredLabels[i].VERSION,
					// 				oldTable: sOldTable
					// 			},
					// 			method: "GET",
					// 			dataType: "text",
					// 			success: function (sResponseContent) {
					// 				//Begin Insert Andrea
					// 				//Remove Lock from test Environment
					// 				that.removeLock(aFilteredLabels[i].TABLENAME);
					// 				//End Insert Andrea
					// 				// Job call
					// 				jQuery.ajax({
					// 					url: sURLProd,
					// 					async: false,
					// 					data: {
					// 						table: aFilteredLabels[i].TABLENAME,
					// 						content: sResponseContent,
					// 						columns: sTestColumns,
					// 						version: aFilteredLabels[i].VERSION,
					// 						system: aFilteredLabels[i].SYSTEM,
					// 						user: sUser
					// 					},
					// 					method: "GET",
					// 					dataType: "text",
					// 					success: function (sResponseJob) {}
					// 				});
					// 			}
					// 		});
					// 	}
					// });
					//end Change Andrea
				} else {
					aFinalTables = [];
					sap.m.MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("duplicate_tab"));
					break;
				}
			}

			// start insert Andrea
			for (i = 0; i < aFinalTables.length; i++) {
				//Check existence of the lock for the current table
				// if no lock exist, program insert record in table
				// LOCK and start with the data extraction, otherwise
				// elaboration skip to the next table
				sap.ui.core.BusyIndicator.show(0);
				this.checkLockedTable(aFinalTables[i].TABLENAME, sUser, aFinalTables[i], callCounter,aFinalTables.length);
			}
			// end insert Andrea

		},
		// begin Insert Andrea
		execJob: function (aFilteredLabels, sUser, counter, recordNum) {

			var that = this;

			// Path used to call XSJS services
			var sURLColumns = "/service/ERPIBERIA_ADN/table_content/getcolumns.xsjs";
			var sURLContent = "/service/ERPIBERIA_ADN/table_content/getcontent.xsjs";
			var sURLProd = "/serviceProd/ERPIBERIA_ADN/table_content/execJob.xsjs";

			var sTestColumns;
			var sOldTable = "";

			// Test columns are read
			jQuery.ajax({
				url: sURLColumns,
				async: true,
				data: {
					table: aFilteredLabels.TABLENAME
				},
				method: "GET",
				dataType: "text",
				success: function (sResponseColumns) {
					sTestColumns = sResponseColumns;

					// Content of the table
					jQuery.ajax({
						url: sURLContent,
						async: true,
						data: {
							table: aFilteredLabels.TABLENAME,
							system: aFilteredLabels.SYSTEM,
							version: aFilteredLabels.VERSION,
							oldTable: sOldTable
						},
						method: "GET",
						dataType: "text",
						success: function (sResponseContent) {
							//Begin Insert Andrea
							//Remove Lock from test Environment
							that.removeLock(aFilteredLabels.TABLENAME);
							//End Insert Andrea
							// Job call
							jQuery.ajax({
								url: sURLProd,
								async: true,
								data: {
									table: aFilteredLabels.TABLENAME,
									content: sResponseContent,
									columns: sTestColumns,
									version: aFilteredLabels.VERSION,
									system: aFilteredLabels.SYSTEM,
									user: sUser,
									label: aFilteredLabels.LABEL
								},
								method: "POST",
								dataType: "text",
								success: function (sResponseJob) {
									//Begin Insert Andrea
									var textMessage = that.getView().getModel("i18n").getResourceBundle().getText("elaboretionOK");
									that.insertLog(aFilteredLabels.TABLENAME, sUser, aFilteredLabels.VERSION, aFilteredLabels.LABEL, textMessage);
									that.hideIndicator(counter, recordNum);
									//End Insert Andrea
								},
								error: function(){
									that.hideIndicator(counter, recordNum);
								}
							});
						},
						error: function(){
							that.hideIndicator(counter, recordNum);
						}
					});
				},
				error: function(){
					that.hideIndicator(counter, recordNum);
				}
				
			});

		},
		checkLockedTable: function (sTableName, sUser, aFilteredLabels, counter, recordNum) {

			var that = this;

			var sURL = "/service/ERPIBERIA_ADN/tables/getLock.xsodata";

			// Model creation
			var oModel = new sap.ui.model.odata.v2.ODataModel(sURL);

			// Filters creation
			var aFilters = [];
			aFilters.push(new Filter({
				path: 'TABLENAME',
				operator: FilterOperator.EQ,
				value1: sTableName
			}));

			var sEntity = "/lock";

			// Model read from SAP
			oModel.read(sEntity, {
				filters: aFilters,
				success: function (result) {

					sEntity = "";
					var aLock = {
						TABLENAME: sTableName,
						LOCKED: "X",
						USER: sUser,
						DATE: new Date()
					};

					if (result.results.length === 0) {

						sEntity = "/lock";

						// // Model read from SAP
						oModel.create(sEntity, aLock, {
							success: function () {
								// Lock has been inserted and elaboration can proceed
								that.execJob(aFilteredLabels, sUser, counter,recordNum);
							},
							error: function () {
								that.hideIndicator(counter, recordNum);
							}
						});

					} else {
						var vCurrentDate = new Date();
						if (((vCurrentDate - result.results[0].DATE) / 1000 / 60) > 30) {
							// Lock is not valid anymore, so it's updated
							sEntity = "/lock('" + sTableName + "')";
							oModel.update(sEntity, aLock, {
								success: function () {
									// Lock has been inserted and elaboration can proceed
									that.execJob(aFilteredLabels, sUser, counter,recordNum);
								},
								error: function () {
									that.hideIndicator(counter, recordNum);
								}
							});
						} else {
							var textMessage = that.getView().getModel("i18n").getResourceBundle().getText("tableLock");
							that.insertLog(sTableName, sUser, aFilteredLabels.VERSION, aFilteredLabels.LABEL, textMessage);
							that.hideIndicator(counter, recordNum);
						}
					}
				},
				error: function () {
					that.hideIndicator(counter, recordNum);
				}
			});
		},

		insertLog: function (sTableName, sUser, sVersion, sLabel, sMessage) {

			// Service Address
			var sURL = "/service/ERPIBERIA_ADN/log/getLog.xsodata";
			var sEntity = "/massiveLog";

			// Model creation
			var oModel = new sap.ui.model.odata.v2.ODataModel(sURL);

			//record that will be insert
			var oRecord = {
				USERNAME: sUser,
				DATE: new Date(),
				TABLENAME: sTableName,
				LABEL: sLabel,
				START_SYSTEM: "ADN TEST",
				END_SYSTEM: "ADN PROD",
				VERSION: sVersion,
				MESSAGE: sMessage
			};

			oModel.create(sEntity, oRecord, {
				success: function (a) {
					var aa = a;
				},
				error: function (a) {
					var aaa = a;
				},
			});

		},
		hideIndicator: function (counter, recordNum) {
			counter.counter++;
			//because of there are several ajax call, i count each call before remove the indicator
			//function is inserte in all error function and in the last success function(of ajax call)
			if (counter.counter === recordNum) {
				sap.ui.core.BusyIndicator.hide();
				sap.m.MessageBox.success(this.getView().getModel("i18n").getResourceBundle().getText("massiveExportSuccess"));
			}
		}

		//End Insert Andrea
	});
});