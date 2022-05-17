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

    return Controller.extend(
      'projectmanagement.controller.DesignResultManagement',
      {
        onInit: function () {
          this.designResultManagementTable = this.byId(
            'designResultManagementTable'
          )

          this.oView = this.getView()
          this.oView.setModel(new JSONModel({}), 'ui')

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
          if (this.section === 'C') {
            var listBinding =
              this.designResultManagementTable.getBinding('items')
            var filter = new Filter({
              path: 'to_root/db_key',
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
              '/designResultManagementCount',
              oEvent.getParameter('total')
            )
        },
        toDetail: function (oEvent) {
          this.oRouter.navTo('designResultDetails', {
            devProjectID: this.devProjectID,
            designProjectID: this.designProjectID,
            designResultID: oEvent.getSource().data('dbKey'),
            mode: 'display',
          })
        },
        onCreateDesignResult: function () {
          this.oRouter.navTo('designResultDetails', {
            devProjectID: this.devProjectID,
            designProjectID: this.designProjectID,
            mode: 'create',
          })
        },
      }
    )
  }
)
