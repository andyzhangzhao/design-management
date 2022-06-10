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

    return BaseController.extend('projectmanagement.controller.DesignCompany', {
      onInit: function () {
        this.oView = this.getView()
        this.oView.setModel(new JSONModel({}), 'ui')

        this.designCompanyTable = this.byId('designCompanyTable')

        this.oDetailsModel = this.getOwnerComponent().getModel('details')

        this.oRouter = this.getOwnerComponent().getRouter()
        this.oRouter
          .getRoute('projectDetails')
          .attachPatternMatched(this._onObjectMatched, this)
      },

      _onObjectMatched: function (oEvent) {
        this.designProjectID = oEvent.getParameter('arguments').designProjectID
        this.section = oEvent.getParameter('arguments').section
        if (this.section === 'L') {
          this.getYTMJ()
          var listBinding = this.designCompanyTable.getBinding('items')
          var aFilter = [
            new Filter({
              path: 'parent_key',
              operator: 'EQ',
              value1: this.designProjectID,
            }),
          ]
          listBinding.filter(aFilter)
        }
      },

      tableUpdateFinished: function (oEvent) {
        this.oView
          .getModel('ui')
          .setProperty('/designCompanyCount', oEvent.getParameter('total'))
      },
      getControlById: function (id) {
        return sap.ui.getCore().byId(id)
      },
      onDelete: function (oEvent) {
        var oObject = oEvent.getSource().data()
        var oDailog = new Dialog({
          title: '删除设计单位',
          content: new Text({
            text: '确定要删除设计单位吗？',
          }).addStyleClass('sapUiSmallMargin'),
          beginButton: new Button({
            text: '确定',
            type: 'Emphasized',
            press: function () {
              this.oDetailsModel.remove(
                "/ZRRE_C_DMDW(guid'" + oObject.dbKey + "')",
                {
                  success: function () {
                    oDailog.close()
                    MessageToast.show('设计单位已删除')
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
        this.onCreateDesignCompany()
        this.oView.getModel('ui').setProperty('/mode', 'create')
      },
      onCreateDesignCompany: function (sPath) {
        if (!this._designCompanyPopup) {
          this._designCompanyPopup = Fragment.load({
            name: 'projectmanagement.view.DesignCompanyPopup',
            controller: this,
          }).then(
            function (oDialog) {
              this.oView.addDependent(oDialog)
              return oDialog
            }.bind(this)
          )
        }
        this._designCompanyPopup.then(
          function (oDialog) {
            if (sPath) {
              oDialog.bindElement({
                path: sPath,
                model: 'details',
              })
            } else {
              oDialog.unbindElement('details')
              this.getControlById('contractSelect').setSelectedKey()
              this.getControlById('zcfsSelect').setSelectedKey()
              this.getControlById('htmjInput').setValue()
            }
            oDialog.open()
          }.bind(this)
        )
      },
      onEdit: function (oEvent) {
        this.oView.getModel('ui').setProperty('/mode', 'edit')
        var customData = oEvent.getSource().data()
        var ytmj = this.oView.getModel('ui').getProperty('/ytmj')
        ytmj.forEach(function (item) {
          if (item.YTID === customData.ytid) {
            item.selected = true
            item.MJD.forEach(function (mjItem) {
              if (customData.majorid.includes(mjItem.MAJORID)) {
                mjItem.selected = true
              }
            })
          }
        })
        var ytmj = this.oView.getModel('ui').setProperty('/ytmj', ytmj)
        this.onCreateDesignCompany(
          "/ZRRE_C_DMDW(guid'" + customData.dbKey + "')"
        )
      },
      onCancel: function () {
        this._designCompanyPopup.then(function (oDialog) {
          oDialog.close()
        })
      },
      onValidation: function () {
        var errorFlag = false
        if (!this.getControlById('contractSelect').getSelectedKey()) {
          this.getControlById('contractSelect').setValueState('Error')
          errorFlag = true
        }
        // if (!this.getControlById('zcfsSelect').getSelectedKey()) {
        //   this.getControlById('zcfsSelect').setValueState('Error')
        //   errorFlag = true
        // }
        if (!this.getControlById('htmjInput').getValue()) {
          this.getControlById('htmjInput').setValueState('Error')
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
          var object = {
            conno: this.getControlById('contractSelect').getSelectedKey(),
            zcfs: this.getControlById('zcfsSelect').getSelectedKey(),
            htmj: this.getControlById('htmjInput').getValue(),
            majorid: mj,
            ytid: yt,
            majtxt: mjtxt,
          }
          var mode = this.oView.getModel('ui').getProperty('/mode')
          if (mode === 'create') {
            this.oDetailsModel.create(
              "/ZRRE_C_DMHD(guid'" + this.designProjectID + "')/to_dw",
              object,
              {
                success: function (response) {
                  MessageToast.show('设计单位创建成功')
                  BusyIndicator.hide()
                  this._designCompanyPopup.then(function (oDialog) {
                    oDialog.close()
                  })
                }.bind(this),
              }
            )
          } else {
            this.oDetailsModel.update(
              "/ZRRE_C_DMDW(guid'" + oEvent.getSource().data('dbKey') + "')",
              object,
              {
                success: function (response) {
                  MessageToast.show('设计单位修改成功')
                  BusyIndicator.hide()
                  this._designCompanyPopup.then(function (oDialog) {
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
