sap.ui.define(
  [
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/core/Fragment',
    'sap/ui/core/BusyIndicator',
    'sap/m/Dialog',
    'sap/m/Text',
    'sap/m/Button',
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
    BusyIndicator,
    Dialog,
    Text,
    Button,
    MessageToast,
    MessageBox,
    BaseController
  ) {
    'use strict'

    return BaseController.extend(
      'projectmanagement.controller.DesignEvaluate',
      {
        onInit: function () {
          this.designEvaluateTable = this.byId('designEvaluateTable')

          this.oView = this.getView()
          this.oView.setModel(new JSONModel({}), 'ui')

          this.businessObjectTypeName = 'ZRRE_DMPG'

          this.oRouter = this.getOwnerComponent().getRouter()
          this.oRouter
            .getRoute('projectDetails')
            .attachPatternMatched(this._onObjectMatched, this)

          this.getUploadFileToken()
          this.oDetailsModel = this.getOwnerComponent().getModel('details')
        },

        _onObjectMatched: function (oEvent) {
          this.designProjectID =
            oEvent.getParameter('arguments').designProjectID
          this.section = oEvent.getParameter('arguments').section
          if (this.section === 'K') {
            this.getYTMJ()
            var listBinding = this.designEvaluateTable.getBinding('items')
            var filter = new Filter({
              path: 'parent_key',
              operator: 'EQ',
              value1: this.designProjectID,
            })
            listBinding.filter(filter)
          }
        },
        tableUpdateFinished: function (oEvent) {
          this.oView
            .getModel('ui')
            .setProperty(
              '/designEvaluateTableCount',
              oEvent.getParameter('total')
            )
          var oTable = oEvent.getSource()
          if (!oTable.getSelectedItem() && oTable.getItems().length > 0) {
            oTable.setSelectedItem(oTable.getItems()[0])
            this.itemDbKey = oTable
              .getItems()[0]
              .getBindingContextPath()
              .match(/guid'(.*)'\)/)[1]
            this.getAllFiles()
          }
          if (oTable.getItems().length === 0) {
            this.oView.getModel('ui').setProperty('/fileVisible', false)
          } else {
            this.oView.getModel('ui').setProperty('/fileVisible', true)
          }
        },
        getControlById: function (id) {
          return sap.ui.getCore().byId(id)
        },
        onDelete: function (oEvent) {
          var oObject = oEvent.getSource().data()
          var oDailog = new Dialog({
            title: '删除设计后评估',
            content: new Text({
              text: '确定要删除设计后评估吗？',
            }).addStyleClass('sapUiSmallMargin'),
            beginButton: new Button({
              text: '确定',
              type: 'Emphasized',
              press: function () {
                this.oDetailsModel.remove(
                  "/ZRRE_C_DMPG(guid'" + oObject.dbKey + "')",
                  {
                    success: function () {
                      oDailog.close()
                      MessageToast.show('设计后评估已删除')
                    }.bind(this),
                  }
                )
              }.bind(this),
            }),
            endButton: new Button({
              text: '取消',
              press: function () {
                oDailog.close()
              },
            }),
          })
          oDailog.open()
        },
        onCreate: function () {
          this.onCreateDesignEvaluate()
          this.oView.getModel('ui').setProperty('/mode', 'create')
        },
        onEdit: function (oEvent) {
          this.oView.getModel('ui').setProperty('/mode', 'edit')
          var customData = oEvent.getSource().data()
          var ytmj = this.oView.getModel('ui').getProperty('/ytmj')
          ytmj.forEach(function (item) {
            if (item.YTID === customData.ytid) {
              item.selected = true
            }
          })
          var ytmj = this.oView.getModel('ui').setProperty('/ytmj', ytmj)
          this.onCreateDesignEvaluate(
            "/ZRRE_C_DMPG(guid'" + customData.dbKey + "')"
          )
        },
        onCreateDesignEvaluate: function (sPath) {
          if (!this._designEvaluatePopup) {
            this._designEvaluatePopup = Fragment.load({
              name: 'projectmanagement.view.DesignEvaluatePopup',
              controller: this,
            }).then(
              function (oDialog) {
                this.oView.addDependent(oDialog)
                return oDialog
              }.bind(this)
            )
          }
          this._designEvaluatePopup.then(
            function (oDialog) {
              if (sPath) {
                this.mode = 'edit'
                oDialog.bindElement({
                  path: sPath,
                  model: 'details',
                })
              } else {
                this.mode = 'create'
                oDialog.unbindElement('details')
                var oContext = this.oDetailsModel.createEntry(
                  "/ZRRE_C_DMHD(guid'" + this.designProjectID + "')/to_pg",
                  {
                    properties: {},
                  }
                )
                oDialog.setBindingContext(oContext, 'details')
                this.getControlById('raisedatePicker').setValue()
              }
              oDialog.open()
            }.bind(this)
          )
        },
        onCancel: function () {
          this._designEvaluatePopup.then(
            function (oDialog) {
              oDialog.close()
              this.oDetailsModel.resetChanges([
                oDialog.getBindingContext('details').getPath(),
              ])
            }.bind(this)
          )
        },
        onValidation: function () {
          var errorFlag = false
          if (!this.getControlById('raisedatePicker').getDateValue()) {
            this.getControlById('raisedatePicker').setValueState('Error')
            errorFlag = true
          }
          if (!errorFlag) {
            return true
          } else {
            return false
          }
        },
        onSave: function (oEvent) {
          if (this.onValidation()) {
            BusyIndicator.show(0)
            var ytmj = this.oView.getModel('ui').getProperty('/ytmj')
            var yt = ''
            ytmj.forEach(function (item) {
              if (item.selected) {
                yt = item.YTID
              }
            })
            this._designEvaluatePopup.then(
              function (oDialog) {
                var oContext = oDialog.getBindingContext('details')
                this.oDetailsModel.setProperty(oContext.getPath() + '/ytid', yt)
                var oDate =
                  this.getControlById('raisedatePicker').getDateValue()
                oDate.setHours(oDate.getHours() + 8)
                this.oDetailsModel.setProperty(
                  oContext.getPath() + '/raisedate',
                  oDate
                )
                this.oDetailsModel.submitChanges({
                  success: function (res) {
                    MessageToast.show(
                      this.mode === 'create'
                        ? '设计后评估创建成功'
                        : '设计后评估修改成功'
                    )
                    BusyIndicator.hide()
                    oDialog.close()
                  }.bind(this),
                  error: function (error) {
                    console.log(error)
                  },
                })
              }.bind(this)
            )
          }
        },
      }
    )
  }
)
