sap.ui.define(
  [
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/core/BusyIndicator',
    'sap/m/MessageBox',
    '../utils/Utils',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, JSONModel, Filter, BusyIndicator, MessageBox, Utils) {
    'use strict'

    return Controller.extend('projectmanagement.controller.DesignIndex', {
      onInit: function () {
        this.designIndexTable = this.byId('designIndexTable')

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
        this.devProjectID = oEvent.getParameter('arguments').devProjectID
        this.section = oEvent.getParameter('arguments').section
        if (this.section === 'B') {
          var listBinding = this.designIndexTable.getBinding('items')
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
          .setProperty('/designIndexCount', oEvent.getParameter('total'))
      },
      getControlById: function (id) {
        return sap.ui.getCore().byId(id)
      },
      onDisplay: function (oEvent) {
        this.oRouter.navTo('designIndexDetails', {
          devProjectID: this.devProjectID,
          designProjectID: this.designProjectID,
          designIndexID: oEvent.getSource().data('dbKey'),
          mode: 'display',
        })
      },
      onCreate: function () {
        Utils.removeMessages()
        BusyIndicator.show(0)
        this.oDetailsModel.callFunction('/ZRRE_C_DMHDCreate_index', {
          method: 'POST',
          urlParameters: { db_key: this.designProjectID },
          success: function (res) {
            var messages = sap.ui
              .getCore()
              .getMessageManager()
              .getMessageModel()
              .getData()
            if (messages.length > 0) {
              if (messages[0].getType() === 'Success') {
                this.oRouter.navTo('designIndexDetails', {
                  devProjectID: this.devProjectID,
                  designProjectID: this.designProjectID,
                  designIndexID: messages[0].getMessage(),
                  mode: 'edit',
                })
              } else {
                MessageBox.error(messages[0].getMessage())
              }
            }
            BusyIndicator.hide()
          }.bind(this),
          error: function (error) {
            BusyIndicator.hide()
            console.log(error)
          },
        })
      },

      onPublish: function (oEvent) {
        Utils.removeMessages()
        BusyIndicator.show(0)
        this.oDetailsModel.callFunction('/ZRRE_C_DMZBHUpdate_index', {
          method: 'POST',
          urlParameters: { db_key: oEvent.getSource().data().dbKey },
          success: function (res) {
            Utils.popMessage()
            BusyIndicator.hide()
            this.oDetailsModel.refresh()
          }.bind(this),
          error: function (error) {
            BusyIndicator.hide()
            console.log(error)
          },
        })
      },
    })
  }
)
