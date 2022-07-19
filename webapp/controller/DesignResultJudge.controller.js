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
          this.oRouter = this.getOwnerComponent().getRouter()
          this.oRouter
            .getRoute('projectDetails')
            .attachPatternMatched(this._onObjectMatched, this)
        },

        _onObjectMatched: function (oEvent) {
          this.designProjectID =
            oEvent.getParameter('arguments').designProjectID
          this.devProjectID = oEvent.getParameter('arguments').devProjectID
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
        toDetail: function (oEvent) {
          this.oRouter.navTo('designResultJudgeDetails', {
            devProjectID: this.devProjectID,
            designProjectID: this.designProjectID,
            designResultJudgeID: oEvent.getSource().data('dbKey'),
            mode: 'display',
          })
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
            //this.getAllFiles()
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
