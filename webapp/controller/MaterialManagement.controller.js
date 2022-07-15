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
      'projectmanagement.controller.MaterialManagement',
      {
        onInit: function () {
          this.materialManagementTable = this.byId('materialManagementTable')

          this.oView = this.getView()
          this.oView.setModel(new JSONModel({}), 'ui')

          this.oRouter = this.getOwnerComponent().getRouter()
          this.oRouter
            .getRoute('projectDetails')
            .attachPatternMatched(this._onObjectMatched, this)

          this.oDetailsModel = this.getOwnerComponent().getModel('details')

          this.addAttachmentComponent('ZRRE_DMFY')
        },

        _onObjectMatched: function (oEvent) {
          this.designProjectID =
            oEvent.getParameter('arguments').designProjectID
          this.section = oEvent.getParameter('arguments').section
          if (
            this.section === 'H' ||
            this.section === 'H1' ||
            this.section === 'H2' ||
            this.section === 'H3'
          ) {
            this.getYTMJ()
            var listBinding = this.materialManagementTable.getBinding('items')
            var aFilter = [
              new Filter({
                path: 'parent_key',
                operator: 'EQ',
                value1: this.designProjectID,
              }),
            ]

            if (
              this.section === 'H1' ||
              this.section === 'H2' ||
              this.section === 'H3'
            ) {
              aFilter.push(
                new Filter({
                  path: 'fytype',
                  operator: 'EQ',
                  value1: this.section,
                })
              )
            }

            listBinding.filter(aFilter)
          }
        },
        tableUpdateFinished: function (oEvent) {
          this.oView
            .getModel('ui')
            .setProperty(
              '/materialManagementCount',
              oEvent.getParameter('total')
            )
          var oTable = oEvent.getSource()
          if (!oTable.getSelectedItem() && oTable.getItems().length > 0) {
            oTable.setSelectedItem(oTable.getItems()[0])
            this.itemDbKey = oTable
              .getItems()[0]
              .getBindingContextPath()
              .match(/guid'(.*)'\)/)[1]
            this.oView.getModel('ui').setProperty('/selectItemKey', this.itemDbKey)
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
            title: '删除封样管理',
            content: new Text({
              text: '确定要删除封样管理吗？',
            }).addStyleClass('sapUiSmallMargin'),
            beginButton: new Button({
              text: '确定',
              type: 'Emphasized',
              press: function () {
                this.oDetailsModel.remove(
                  "/ZRRE_C_DMFY(guid'" + oObject.dbKey + "')",
                  {
                    success: function () {
                      oDailog.close()
                      MessageToast.show('封样管理已删除')
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
          this.onCreateMaterialManagement()
        },
        onEdit: function (oEvent) {
          var customData = oEvent.getSource().data()
          var ytmj = this.oView.getModel('ui').getProperty('/ytmj')
          ytmj.forEach(function (item) {
            if (item.YTID === customData.ytid) {
              item.selected = true
              item.MJD.forEach(function (mjItem) {
                if (mjItem.MAJORID === customData.majorid) {
                  mjItem.selected = true
                }
              })
            }
          })
          var ytmj = this.oView.getModel('ui').setProperty('/ytmj', ytmj)
          this.onCreateMaterialManagement(
            "/ZRRE_C_DMFY(guid'" + customData.dbKey + "')"
          )
        },
        onCreateMaterialManagement: function (sPath) {
          if (!this._materialManagementPopup) {
            this._materialManagementPopup = Fragment.load({
              name: 'projectmanagement.view.MaterialManagementPopup',
              controller: this,
            }).then(
              function (oDialog) {
                this.oView.addDependent(oDialog)
                return oDialog
              }.bind(this)
            )
          }
          this._materialManagementPopup.then(
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
                  "/ZRRE_C_DMHD(guid'" + this.designProjectID + "')/to_fy",
                  {
                    properties: {},
                  }
                )
                oDialog.setBindingContext(oContext, 'details')
              }
              oDialog.open()
            }.bind(this)
          )
        },
        onCancel: function () {
          this._materialManagementPopup.then(
            function (oDialog) {
              oDialog.close()
              this.oDetailsModel.resetChanges([
                oDialog.getBindingContext('details').getPath(),
              ])
              this._materialManagementPopup=null
              oDialog.destroy()
            }.bind(this)
          )
        },
        onValidation: function () {
          var errorFlag = false
          if (!this.getControlById('fyInput').getValue()) {
            this.getControlById('fyInput').setValueState('Error')
            errorFlag = true
          }
          if (!this.getControlById('fytypeSelect').getSelectedKey()) {
            this.getControlById('fytypeSelect').setValueState('Error')
            errorFlag = true
          }
          if (!this.getControlById('fycateSelect').getSelectedKey()) {
            this.getControlById('fycateSelect').setValueState('Error')
            errorFlag = true
          }
          if (!this.getControlById('hqdatePicker').getDateValue()) {
            this.getControlById('hqdatePicker').setValueState('Error')
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
        onSave: function (oEvent) {
          if (this.onValidation()) {
            BusyIndicator.show(0)
            var ytmj = this.oView.getModel('ui').getProperty('/ytmj')
            var yt = ''
            var mj = ''
            ytmj.forEach(function (item) {
              if (item.selected) {
                yt = item.YTID
                item.MJD.forEach(function (mjItem) {
                  if (mjItem.selected) {
                    mj = mjItem.MAJORID
                  }
                })
              }
            })
            this._materialManagementPopup.then(
              function (oDialog) {
                var oContext = oDialog.getBindingContext('details')
                this.oDetailsModel.setProperty(oContext.getPath() + '/ytid', yt)
                this.oDetailsModel.setProperty(
                  oContext.getPath() + '/majorid',
                  mj
                )
                var oDate = this.getControlById('hqdatePicker').getDateValue()
                oDate.setHours(oDate.getHours() + 8)
                this.oDetailsModel.setProperty(
                  oContext.getPath() + '/hqdate',
                  oDate
                )
                BusyIndicator.show(0)
                this.oDetailsModel.submitChanges({
                  success: function () {
                    MessageToast.show(
                      this.mode === 'create'
                        ? '封样管理创建成功'
                        : '封样管理修改成功'
                    )
                    BusyIndicator.hide()
                    oDialog.close()
                  }.bind(this),
                })
              }.bind(this)
            )
          }
        },
      }
    )
  }
)
