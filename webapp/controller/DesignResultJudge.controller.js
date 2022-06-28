sap.ui.define(
  [
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    './BaseController',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, JSONModel, Filter, BaseController) {
    'use strict'

    return BaseController.extend(
      'projectmanagement.controller.DesignResultJudge',
      {
        onInit: function () {
          this.oView = this.getView()
          this.oView.setModel(new JSONModel({ filter: { yt: true } }), 'ui')

          this.businessObjectTypeName = 'ZRRE_DMFA'

          this.oRouter = this.getOwnerComponent().getRouter()
          this.oRouter
            .getRoute('projectDetails')
            .attachPatternMatched(this._onObjectMatched, this)

          this.getUploadFileToken()
        },

        _onObjectMatched: function (oEvent) {
          this.designProjectID =
            oEvent.getParameter('arguments').designProjectID
          this.section = oEvent.getParameter('arguments').section
          if (
            this.section === 'E' ||
            this.section === 'E1' ||
            this.section === 'E2'
          ) {
            this.getYTMJ()
            var listBinding = this.getListBinding()
            listBinding.filter(this.getDefaultFilter())
          }
        },
        getListBinding: function () {
          return this.byId('designResultJudgeTable').getBinding('items')
        },
        getDefaultFilter: function () {
          var aFilter = [
            new Filter({
              path: 'parent_key',
              operator: 'EQ',
              value1: this.designProjectID,
            }),
          ]
          if (this.section === 'E1' || this.section === 'E2') {
            aFilter.push(
              new Filter({
                path: 'pstype',
                operator: 'EQ',
                value1: this.section,
              })
            )
          }
          return aFilter
        },
        tableUpdateFinished: function (oEvent) {
          this.oView
            .getModel('ui')
            .setProperty(
              '/designResultJudgeCount',
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
      }
    )
  }
)
