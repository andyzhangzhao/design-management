sap.ui.define(
  [
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/core/Fragment',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, JSONModel, Filter, Fragment, MessageToast, MessageBox) {
    'use strict'

    return Controller.extend(
      'projectmanagement.controller.DesignResultManagementDetails',
      {
        onInit: function () {
          this.oView = this.getView()
          this.oView.setModel(new JSONModel({}), 'ui')

          this.ObjectPageLayout = this.byId('ObjectPageLayout')
          this.cgnmInput = this.byId('cgnmInput')
          this.contractInput = this.byId('contractInput')
          this.versionSelect = this.byId('versionSelect')
          this.typeSelect = this.byId('typeSelect')
          this.wcDatePicker = this.byId('wcDatePicker')
          this.historyRecordTable = this.byId('historyRecordTable')

          this.oProjectListModel = this.getOwnerComponent().getModel()
          this.oDetailsModel = this.getOwnerComponent().getModel('details')

          this.oRouter = this.getOwnerComponent().getRouter()
          this.oRouter
            .getRoute('designResultDetails')
            .attachPatternMatched(this._onObjectMatched, this)
        },

        _onObjectMatched: function (oEvent) {
          this.devProjectID = oEvent.getParameter('arguments').devProjectID
          this.designProjectID =
            oEvent.getParameter('arguments').designProjectID
          this.designResultID = oEvent.getParameter('arguments').designResultID
          this.mode = oEvent.getParameter('arguments').mode
          this.oView.getModel('ui').setProperty('/mode', this.mode)
          this.oDetailsModel.read('/zrre_i_proj', {
            filters: [
              new Filter({
                path: 'itmnr',
                operator: 'EQ',
                value1: this.devProjectID,
              }),
            ],
            success: function (response) {
              this.oView
                .getModel('ui')
                .setProperty('/devProject', response.results[0])
            }.bind(this),
          })

          if (this.mode === 'display') {
            this.ObjectPageLayout.bindElement({
              path: "/ZRRE_C_DMCG(guid'" + this.designResultID + "')",
              model: 'details',
              parameters: {
                expand: 'to_cont,to_cgver,to_cgsts',
              },
              events: {
                dataReceived: function (oEvent) {
                  this.getYTMJ(oEvent.getParameter('data'))
                }.bind(this),
              },
            })
          } else {
            this.ObjectPageLayout.unbindElement('details')
            this.getYTMJ()
          }

          if (this.designResultID) {
            var listBinding = this.historyRecordTable.getBinding('items')
            var filter = new Filter({
              path: 'parent_key',
              operator: 'EQ',
              value1: this.designResultID,
            })
            listBinding.filter(filter)
          }

          // jQuery.ajax({
          //   method: 'GET',
          //   url: '/sap/zrre_rest_ytmj?DBKEY=' + this.designProjectID,
          //   success: function (response) {
          //     response.forEach(function (item, index) {
          //       item.selected = index === 0
          //     })
          //     this.oView.getModel('ui').setProperty('/ytmj', response)
          //   }.bind(this),
          //   error: function (err) {
          //     // MessageBox.error(err.responseJSON.MSGTXT)
          //   },
          //   complete: function () {
          //     // BusyIndicator.hide()
          //   },
          // })
        },
        tableUpdateFinished: function (oEvent) {
          this.oView
            .getModel('ui')
            .setProperty('/historyRecordCount', oEvent.getParameter('total'))
        },
        getYTMJ: function (oData) {
          jQuery.ajax({
            method: 'GET',
            url: '/sap/zrre_rest_ytmj?DBKEY=' + this.designProjectID,
            success: function (response) {
              if (oData) {
                response.forEach(function (ytItem) {
                  if (oData.ytid === ytItem.YTID) {
                    ytItem.selected = true
                    var aMajorId = oData.majorid.split(',')
                    ytItem.MJD.forEach(function (majorItem) {
                      aMajorId.forEach(function (marjorId) {
                        if (majorItem.MAJORID === marjorId) {
                          majorItem.selected = true
                        }
                      })
                    })
                  }
                })
                this.oView.getModel('ui').setProperty('/ytmj', response)
              } else {
                response.forEach(function (item, index) {
                  item.selected = index === 0
                })
                this.oView.getModel('ui').setProperty('/ytmj', response)
              }
            }.bind(this),
            error: function (err) {
              // MessageBox.error(err.responseJSON.MSGTXT)
            },
            complete: function () {
              // BusyIndicator.hide()
            },
          })
        },
        onValueHelpRequest: function () {
          if (!this._contractValueHelpDialog) {
            this._contractValueHelpDialog = Fragment.load({
              name: 'projectmanagement.view.ContractHelpDialog',
              controller: this,
            }).then(
              function (oDialog) {
                this.oView.addDependent(oDialog)
                return oDialog
              }.bind(this)
            )
          }
          this._contractValueHelpDialog.then(function (oDialog) {
            oDialog.open()
          })
        },
        onValueHelpSearch: function (oEvent) {
          var sValue = oEvent.getParameter('value')
          var oFilter = new Filter('conno', 'Contains', sValue)
          oEvent.getSource().getBinding('items').filter([oFilter])
        },

        onValueHelpClose: function (oEvent) {
          var oSelectedItem = oEvent.getParameter('selectedItem')
          oEvent.getSource().getBinding('items').filter([])

          if (!oSelectedItem) {
            return
          }

          this.contractInput.setValue(oSelectedItem.getTitle())
        },
        onEdit: function () {
          this.oView.getModel('ui').setProperty('/mode', 'edit')
        },
        onCancel: function () {
          if (this.oView.getModel('ui').getProperty('/mode') !== 'edit') {
            this.oRouter.navTo('projectDetails', {
              devProjectID: this.devProjectID,
              designProjectID: this.designProjectID,
              section: 'C',
            })
          } else {
            this.oView.getModel('ui').setProperty('/mode', 'display')
          }
        },
        onNavBck: function () {
          this.oRouter.navTo('projectDetails', {
            devProjectID: this.devProjectID,
            designProjectID: this.designProjectID,
            section: 'C',
          })
        },
        onSave: function () {
          var ytmj = this.oView.getModel('ui').getProperty('/ytmj')
          var yt = ''
          var mj = ''
          var mjtxt = ''
          ytmj.forEach(function (item) {
            if (item.selected) {
              yt = item.YTID
              item.MJD.forEach(function (mjItem) {
                if (mjItem.selected) {
                  mj = mj + mjItem.MAJORID + ','
                  mjtxt = mjtxt + mjItem.MAJORDESC + ','
                }
              })
            }
          })
          if (mj) {
            mj = mj.substring(0, mj.length - 1)
          }
          if (mjtxt) {
            mjtxt = mjtxt.substring(0, mjtxt.length - 1)
          }
          if (this.oView.getModel('ui').getProperty('/mode') === 'create') {
            this.oDetailsModel.create(
              "/ZRRE_C_DMHD(guid'" + this.designProjectID + "')/to_cg",
              {
                cgnm: this.cgnmInput.getValue(),
                cgtyp: this.typeSelect.getSelectedKey(),
                cg_ver: this.versionSelect.getSelectedKey(),
                contid: this.contractInput.getValue(),
                wcdate: this.wcDatePicker.getDateValue(),
                majorid: mj,
                ytid: yt,
                majtxt: mjtxt,
              },
              {
                success: function (response) {
                  console.log(response)
                  this.onNavBck()
                  MessageToast.show('设计成果创建成功')
                }.bind(this),
              }
            )
          } else {
            this.oDetailsModel.update(
              "/ZRRE_C_DMCG(guid'" + this.designResultID + "')",
              {
                cgnm: this.cgnmInput.getValue(),
                cgtyp: this.typeSelect.getSelectedKey(),
                cg_ver: this.versionSelect.getSelectedKey(),
                contid: this.contractInput.getValue(),
                wcdate: this.wcDatePicker.getDateValue(),
                majorid: mj,
                ytid: yt,
                majtxt: mjtxt,
              },
              {
                success: function (response) {
                  console.log(response)
                  this.onNavBck()
                  MessageToast.show('设计成果更新成功')
                }.bind(this),
              }
            )
          }
        },
      }
    )
  }
)
