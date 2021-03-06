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
    './BaseController',
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
    BusyIndicator,
    BaseController
  ) {
    'use strict'

    return BaseController.extend('projectmanagement.controller.DesignAward', {
      onInit: function () {
        this.oView = this.getView()
        this.oView.setModel(
          new JSONModel({
            fileVisible: false,
            showDetail: true,
            filter: { yt: true },
          }),
          'ui'
        )

        this.oRouter = this.getOwnerComponent().getRouter()
        this.oRouter
          .getRoute('projectDetails')
          .attachPatternMatched(this._onObjectMatched, this)

        this.oDetailsModel = this.getOwnerComponent().getModel('details')

        this.addAttachmentComponent('ZRRE_DMAW')
      },
      onDetailMore: function (oEvent) {
        this.oView.getModel('ui').setProperty('/showDetail', true)
      },
      onDetailLess: function () {
        this.oView.getModel('ui').setProperty('/showDetail', false)
      },

      _onObjectMatched: function (oEvent) {
        this.designProjectID = oEvent.getParameter('arguments').designProjectID
        this.section = oEvent.getParameter('arguments').section
        if (this.section === 'D') {
          var listBinding = this.getListBinding()
          listBinding.filter(this.getDefaultFilter())
          this.getYTMJ()
        }
      },
      jxmcSelect: function(oEvent){
        var selectedData = oEvent.getParameter('selectedItem').data()
        this.getControlById('jxmcInput').setValue(selectedData.Jxmc)
        this.getControlById('bjdwInput').setValue(selectedData.Bjdw)
        this.getControlById('jxjbSelect').setSelectedKey(selectedData.Jxjb)
        this.getControlById('jxflSelect').setSelectedKey(selectedData.Jxfl)
      },
      getListBinding: function () {
        return this.byId('designAwardTable').getBinding('items')
      },
      getDefaultFilter: function () {
        var aFilter = [
          new Filter({
            path: 'parent_key',
            operator: 'EQ',
            value1: this.designProjectID,
          }),
        ]
        return aFilter
      },
      getControlById: function (id) {
        return sap.ui.getCore().byId(id)
      },
      onCreate: function () {
        this.onCreateDesignAward()
      },
      onCreateDesignAward: function (sPath) {
        if (!this._designAwardPopup) {
          this._designAwardPopup = Fragment.load({
            name: 'projectmanagement.view.DesignAwardPopup',
            controller: this,
          }).then(
            function (oDialog) {
              this.psDatePicker = this.getControlById('psDatePicker')
              this.oView.addDependent(oDialog)
              return oDialog
            }.bind(this)
          )
        }
        this._designAwardPopup.then(
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
                "/ZRRE_C_DMHD(guid'" + this.designProjectID + "')/to_aw",
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
      tableUpdateFinished: function (oEvent) {
        this.oView
          .getModel('ui')
          .setProperty('/designAwardCount', oEvent.getParameter('total'))
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

      onDelete: function (oEvent) {
        var oObject = oEvent.getSource().data()
        var oDailog = new Dialog({
          title: '??????????????????',
          content: new Text({
            text: '???????????????????????????' + oObject.jxmc + '??????',
          }).addStyleClass('sapUiSmallMargin'),
          beginButton: new Button({
            text: '??????',
            type: 'Emphasized',
            press: function () {
              this.oDetailsModel.remove(
                "/ZRRE_C_DMAW(guid'" + oObject.dbKey + "')",
                {
                  success: function () {
                    oDailog.close()
                    MessageToast.show('????????????' + oObject.jxmc + '?????????')
                  }.bind(this),
                }
              )
            }.bind(this),
          }),
          endButton: new Button({
            text: '??????',
            press: function () {
              oDailog.close()
            },
          }),
        })
        oDailog.open()
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
        this.onCreateDesignAward("/ZRRE_C_DMAW(guid'" + customData.dbKey + "')")
      },
      onCancel: function () {
        this._designAwardPopup.then(
          function (oDialog) {
            oDialog.close()
            this.oDetailsModel.resetChanges([
              oDialog.getBindingContext('details').getPath(),
            ])
            this._designAwardPopup = null
            oDialog.destroy()
          }.bind(this)
        )
      },
      onValidation: function () {
        var errorFlag = false
        if (!this.getControlById('jxmcInput').getValue()) {
          this.getControlById('jxmcInput').setValueState('Error')
          errorFlag = true
        }
        if (!this.getControlById('bjdwInput').getValue()) {
          this.getControlById('bjdwInput').setValueState('Error')
          errorFlag = true
        }
        if (!this.getControlById('jxjbSelect').getSelectedKey()) {
          this.getControlById('jxjbSelect').setValueState('Error')
          errorFlag = true
        }
        if (!this.getControlById('jxflSelect').getSelectedKey()) {
          this.getControlById('jxflSelect').setValueState('Error')
          errorFlag = true
        }
        if (!this.psDatePicker.getDateValue()) {
          this.psDatePicker.setValueState('Error')
          errorFlag = true
        }
        if (!this.getControlById('yftdInput').getValue()) {
          this.getControlById('yftdInput').setValueState('Error')
          errorFlag = true
        }
        if (!this.getControlById('sjdwInput').getValue()) {
          this.getControlById('sjdwInput').setValueState('Error')
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
          MessageBox.error('????????????????????????')
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
          this._designAwardPopup.then(
            function (oDialog) {
              var oContext = oDialog.getBindingContext('details')
              this.oDetailsModel.setProperty(oContext.getPath() + '/ytid', yt)
              this.oDetailsModel.setProperty(
                oContext.getPath() + '/majorid',
                mj
              )
              var oDate = this.psDatePicker.getDateValue()
              oDate.setHours(oDate.getHours() + 8)
              this.oDetailsModel.setProperty(
                oContext.getPath() + '/psdate',
                oDate
              )
              BusyIndicator.show(0)
              this.oDetailsModel.submitChanges({
                success: function () {
                  MessageToast.show(
                    this.mode === 'create'
                      ? '????????????????????????'
                      : '????????????????????????'
                  )
                  BusyIndicator.hide()
                  oDialog.close()
                  this._designAwardPopup = null
                  oDialog.destroy()
                }.bind(this),
              })
            }.bind(this)
          )
        }
      },
    })
  }
)
