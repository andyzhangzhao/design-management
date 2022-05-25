sap.ui.define(
  [
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/core/Fragment',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    'sap/m/Dialog',
    'sap/m/Text',
    'sap/m/Button',
    'sap/ui/core/BusyIndicator',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (
    Controller,
    JSONModel,
    Filter,
    Fragment,
    MessageToast,
    MessageBox,
    Dialog,
    Text,
    Button,
    BusyIndicator
  ) {
    'use strict'

    return Controller.extend('projectmanagement.controller.DesignAward', {
      onInit: function () {
        this.designAwardTable = this.byId('designAwardTable')

        this.oView = this.getView()
        this.oView.setModel(new JSONModel({}), 'ui')

        this.oRouter = this.getOwnerComponent().getRouter()
        this.oRouter
          .getRoute('projectDetails')
          .attachPatternMatched(this._onObjectMatched, this)

        this.oDetailsModel = this.getOwnerComponent().getModel('details')
      },

      _onObjectMatched: function (oEvent) {
        this.designProjectID = oEvent.getParameter('arguments').designProjectID
        this.section = oEvent.getParameter('arguments').section
        if (this.section === 'D') {
          var listBinding = this.designAwardTable.getBinding('items')
          var filter = new Filter({
            path: 'parent_key',
            operator: 'EQ',
            value1: this.designProjectID,
          })
          listBinding.filter(filter)

          this.getYTMJ()
        }
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
      getControlById: function (id) {
        return sap.ui.getCore().byId(id)
      },
      onCreate: function () {
        this.onCreateDesignAward()
        this.oView.getModel('ui').setProperty('/mode', 'create')
      },
      onCreateDesignAward: function (sPath) {
        if (!this._designAwardPopup) {
          this._designAwardPopup = Fragment.load({
            name: 'projectmanagement.view.DesignAwardPopup',
            controller: this,
          }).then(
            function (oDialog) {
              this.oView.addDependent(oDialog)
              return oDialog
            }.bind(this)
          )
        }
        this._designAwardPopup.then(function (oDialog) {
          if (sPath) {
            oDialog.bindElement({
              path: sPath,
              model: 'details',
            })
          } else {
            oDialog.unbindElement('details')
          }
          oDialog.open()
        })
      },
      tableUpdateFinished: function (oEvent) {
        this.oView
          .getModel('ui')
          .setProperty('/designAwardCount', oEvent.getParameter('total'))
      },
      onDelete: function (oEvent) {
        var oObject = oEvent.getSource().data()
        var oDailog = new Dialog({
          title: '删除设计获奖',
          content: new Text({
            text: '确定要删除设计获奖' + oObject.jxmc + '吗？',
          }).addStyleClass('sapUiSmallMargin'),
          beginButton: new Button({
            text: '确定',
            type: 'Emphasized',
            press: function () {
              this.oDetailsModel.remove(
                "/ZRRE_C_DMAW(guid'" + oObject.dbKey + "')",
                {
                  success: function () {
                    oDailog.close()
                    MessageToast.show('设计获奖' + oObject.jxmc + '已删除')
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
      onEdit: function (oEvent) {
        this.oView.getModel('ui').setProperty('/mode', 'edit')
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
        this.onCreateDesignAward("/ZRRE_C_DMAW(guid'" + customData.dbKey + "')")
      },
      onSave: function (oEvent) {
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
          jxmc: this.getControlById('jxmcInput').getValue(),
          bjdw: this.getControlById('bjdwInput').getValue(),
          psdate: this.getControlById('psDatePicker').getDateValue(),
          yftd: this.getControlById('yftdInput').getValue(),
          sjdw: this.getControlById('sjdwInput').getValue(),
          majorid: this.getControlById('memoInput').getValue(),
          ytid: yt,
          majorid: mj,
        }
        var mode = this.oView.getModel('ui').getProperty('/mode')
        BusyIndicator.show(0)
        if (mode === 'create') {
          this.oDetailsModel.create(
            "/ZRRE_C_DMHD(guid'" + this.designProjectID + "')/to_aw",
            object,
            {
              success: function (response) {
                MessageToast.show('设获奖创建成功')
                BusyIndicator.hide()
                this._designAwardPopup.then(function (oDialog) {
                  oDialog.close()
                })
              }.bind(this),
            }
          )
        } else {
          this.oDetailsModel.update(
            "/ZRRE_C_DMAW(guid'" + oEvent.getSource().data('dbKey') + "')",
            object,
            {
              success: function (response) {
                MessageToast.show('设计获奖修改成功')
                BusyIndicator.hide()
                this._designAwardPopup.then(function (oDialog) {
                  oDialog.close()
                })
              }.bind(this),
            }
          )
        }
      },
    })
  }
)
