sap.ui.define(
  [
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/m/MessageToast',
    'sap/ui/core/BusyIndicator',
    '../utils/Utils',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, JSONModel, Filter, MessageToast, BusyIndicator, Utils) {
    'use strict'

    return Controller.extend(
      'projectmanagement.controller.DesignIndexDetails',
      {
        onInit: function () {
          this.oView = this.getView()
          this.oView.setModel(new JSONModel({}), 'ui')
          this.oDetailsModel = this.getOwnerComponent().getModel('details')

          this.designIndexDetailsTable = this.byId('designIndexDetailsTable')
          this.ObjectPageLayout = this.byId('ObjectPageLayout')

          this.oRouter = this.getOwnerComponent().getRouter()
          this.oRouter
            .getRoute('designIndexDetails')
            .attachPatternMatched(this._onObjectMatched, this)

          this.oDetailsModel = this.getOwnerComponent().getModel('details')
        },

        _onObjectMatched: function (oEvent) {
          this.devProjectID = oEvent.getParameter('arguments').devProjectID
          this.designProjectID =
            oEvent.getParameter('arguments').designProjectID
          this.designIndexID = oEvent.getParameter('arguments').designIndexID
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
          this.ObjectPageLayout.bindElement({
            path: "/ZRRE_C_DMZBH(guid'" + this.designIndexID + "')",
            model: 'details',
            parameters: {
              expand: 'to_ixver,to_ixst',
            },
          })
          var listBinding = this.designIndexDetailsTable.getBinding('items')
          var filter = new Filter({
            path: 'parent_key',
            operator: 'EQ',
            value1: this.designIndexID,
          })
          listBinding.filter(filter)
        },
        onNavBck: function () {
          this.oRouter.navTo('projectDetails', {
            devProjectID: this.devProjectID,
            designProjectID: this.designProjectID,
            section: 'B',
          })
        },
        pasteData: function (oEvent) {
          if (this.oView.getModel('ui').getProperty('/mode') === 'edit') {
            var pasteData = oEvent.getParameter('data')
            var tableItems = oEvent.getSource().getItems()
            pasteData.forEach((rowItem, rowIndex) => {
              rowItem.forEach((cellItem, cellIndex) => {
                this.oDetailsModel.setProperty(
                  tableItems[rowIndex].getBindingContextPath() +
                    '/' +
                    (cellIndex === 0 ? '/inxvl' : '/remark'),
                  +cellItem
                )
              })
            })
          }
        },
        onEdit: function () {
          this.oView.getModel('ui').setProperty('/mode', 'edit')
        },
        onCancel: function () {
          this.oView.getModel('ui').setProperty('/mode', 'display')
        },
        onSave: function () {
          BusyIndicator.show(0)
          this.oDetailsModel.submitChanges({
            success: function () {
              BusyIndicator.hide()
              this.oView.getModel('ui').setProperty('/mode', 'display')
              MessageToast.show('面积指标更新成功')
            }.bind(this),
            error: function (error) {
              console.log(error)
              BusyIndicator.hide()
            },
          })
        },
        onPublish: function (oEvent) {
          Utils.removeMessages()
          BusyIndicator.show(0)
          this.oDetailsModel.callFunction('/ZRRE_C_DMZBHUpdate_index', {
            method: 'POST',
            urlParameters: { db_key: this.designIndexID },
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

        tableUpdateFinished: function (oEvent) {
          this.oView
            .getModel('ui')
            .setProperty('/areaIndexCount', oEvent.getParameter('total'))
        },
      }
    )
  }
)
