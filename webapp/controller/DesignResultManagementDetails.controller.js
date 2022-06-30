sap.ui.define(
  [
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/core/Fragment',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    './BaseController',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (
    JSONModel,
    Filter,
    Fragment,
    MessageToast,
    MessageBox,
    BaseController
  ) {
    'use strict'

    return BaseController.extend(
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
          this.designCompanyText = this.byId('designCompanyText')
          this.contractStatusText = this.byId('contractStatusText')

          this.businessObjectTypeName = 'ZRRE_DMCG'

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
          this.itemDbKey = oEvent.getParameter('arguments').designResultID
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

          this.oDetailsModel.resetChanges()
          if (this.mode === 'display') {
            this.ObjectPageLayout.bindElement({
              path: "/ZRRE_C_DMCG(guid'" + this.itemDbKey + "')",
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
            var oContext = this.oDetailsModel.createEntry(
              "/ZRRE_C_DMHD(guid'" + this.designProjectID + "')/to_cg",
              {
                properties: {},
              }
            )
            this.ObjectPageLayout.setBindingContext(oContext, 'details')
            this.getYTMJ()
          }

          if (this.itemDbKey) {
            var listBinding = this.historyRecordTable.getBinding('items')
            var filter = new Filter({
              path: 'parent_key',
              operator: 'EQ',
              value1: this.itemDbKey,
            })
            listBinding.filter(filter)
            this.getUploadFileToken()
            this.getAllFiles()
          }
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
          this.contractStatusText.setText(oSelectedItem.data('status'))
          this.designCompanyText.setText(oSelectedItem.data('vendname'))

          this.contractInput.setValue(oSelectedItem.getTitle())
        },

        onEdit: function () {
          this.oView.getModel('ui').setProperty('/mode', 'edit')
        },
        onCancel: function () {
          if (this.oView.getModel('ui').getProperty('/mode') !== 'edit') {
            this.onNavBck()
          } else {
            this.oView.getModel('ui').setProperty('/mode', 'display')
          }
          this.oDetailsModel.resetChanges([
            this.ObjectPageLayout.getBindingContext('details').getPath(),
          ])
        },
        onNavBck: function () {
          this.oRouter.navTo('projectDetails', {
            devProjectID: this.devProjectID,
            designProjectID: this.designProjectID,
            section: 'C',
          })
        },
        onValidation: function () {
          var errorFlag = false
          if (!this.cgnmInput.getValue()) {
            this.cgnmInput.setValueState('Error')
            errorFlag = true
          }
          if (!this.typeSelect.getSelectedKey()) {
            this.typeSelect.setValueState('Error')
            errorFlag = true
          }
          if (!this.versionSelect.getSelectedKey()) {
            this.versionSelect.setValueState('Error')
            errorFlag = true
          }
          var majorFlag = false
          var ytmj = this.oView.getModel('ui').getProperty('/ytmj')
          ytmj.forEach(function (ytItem) {
            if (ytItem.selected) {
              ytItem.MJD.forEach(function (majorItem) {
                if (majorItem.selected) {
                  majorFlag = true
                }
              })
            }
          })
          if (!majorFlag) {
            MessageBox.error('至少选择一个专业')
            errorFlag = true
          }
          if (!errorFlag) {
            return true
          } else {
            return false
          }
        },
        onExit: function () {
          console.log(123)
        },
        onSave: function () {
          if (this.onValidation()) {
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
            var oContext = this.ObjectPageLayout.getBindingContext('details')
            this.oDetailsModel.setProperty(oContext.getPath() + '/ytid', yt)
            this.oDetailsModel.setProperty(oContext.getPath() + '/majorid', mj)
            this.oDetailsModel.setProperty(
              oContext.getPath() + '/majtxt',
              mjtxt
            )
            var oDate = this.wcDatePicker.getDateValue()
            if (oDate) {
              oDate.setHours(oDate.getHours() + 8)
              this.oDetailsModel.setProperty(
                oContext.getPath() + '/wcdate',
                oDate
              )
            }
            this.oDetailsModel.submitChanges({
              success: function (response) {
                var mode = this.oView.getModel('ui').getProperty('/mode')
                if (mode === 'create') {
                  this.oView.getModel('ui').setProperty('/mode', 'display')
                  MessageToast.show('设计成果创建成功')
                  this.oRouter.navTo('designResultDetails', {
                    devProjectID: this.devProjectID,
                    designProjectID: this.designProjectID,
                    designResultID:
                      response.__batchResponses[0].__changeResponses[0].data
                        .db_key,
                    mode: 'display',
                  })
                } else {
                  this.oView.getModel('ui').setProperty('/mode', 'display')
                  MessageToast.show('设计成果更新成功')
                }
              }.bind(this),
            })
          }
        },
      }
    )
  }
)
