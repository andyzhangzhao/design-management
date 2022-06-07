sap.ui.define(
  [
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, JSONModel, Filter) {
    'use strict'

    return Controller.extend('projectmanagement.controller.DesignEvaluate', {
      onInit: function () {
        this.designEvaluateTable = this.byId('designEvaluateTable')

        this.oView = this.getView()
        this.oView.setModel(new JSONModel({}), 'ui')

        this.oRouter = this.getOwnerComponent().getRouter()
        this.oRouter
          .getRoute('projectDetails')
          .attachPatternMatched(this._onObjectMatched, this)
      },

      _onObjectMatched: function (oEvent) {
        this.designProjectID = oEvent.getParameter('arguments').designProjectID
        this.section = oEvent.getParameter('arguments').section
        if (this.section === 'K') {
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
        this.onCreateMaterialManagement(
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
              oDialog.bindElement({
                path: sPath,
                model: 'details',
              })
            } else {
              oDialog.unbindElement('details')
              this.getControlById('fytypeSelect').setSelectedKey()
              this.getControlById('hqdatePicker').setValue()
            }
            oDialog.open()
          }.bind(this)
        )
      },
      onCancel: function () {
        this._designEvaluatePopup.then(function (oDialog) {
          oDialog.close()
        })
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
          var object = {
            fydesc: this.getControlById('fyInput').getValue(),
            fytype: this.getControlById('fytypeSelect').getSelectedKey(),
            hqdate: this.getControlById('hqdatePicker').getDateValue(),
            ytid: yt,
            majorid: mj,
          }
          var mode = this.oView.getModel('ui').getProperty('/mode')
          if (mode === 'create') {
            this.oDetailsModel.create(
              "/ZRRE_C_DMHD(guid'" + this.designProjectID + "')/to_fy",
              object,
              {
                success: function (response) {
                  MessageToast.show('封样管理创建成功')
                  BusyIndicator.hide()
                  this._materialManagementPopup.then(function (oDialog) {
                    oDialog.close()
                  })
                }.bind(this),
              }
            )
          } else {
            this.oDetailsModel.update(
              "/ZRRE_C_DMFY(guid'" + oEvent.getSource().data('dbKey') + "')",
              object,
              {
                success: function (response) {
                  MessageToast.show('封样管理修改成功')
                  BusyIndicator.hide()
                  this._materialManagementPopup.then(function (oDialog) {
                    oDialog.close()
                  })
                }.bind(this),
              }
            )
          }
        }
      },
    })
  }
)
