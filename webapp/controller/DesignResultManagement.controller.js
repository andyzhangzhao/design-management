sap.ui.define(
  [
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/m/Dialog',
    'sap/m/Button',
    'sap/m/Text',
    'sap/m/MessageToast',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, JSONModel, Filter, Dialog, Button, Text, MessageToast) {
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

          this.oDetailsModel = this.getOwnerComponent().getModel('details')
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
        onDelete: function (oEvent) {
          var oObject = oEvent.getSource().data()
          var oDailog = new Dialog({
            title: '删除设计成果',
            content: new Text({
              text: '确定要删除设计成果' + oObject.cgnm + '吗？',
            }).addStyleClass('sapUiSmallMargin'),
            beginButton: new Button({
              text: '确定',
              type: 'Emphasized',
              press: function () {
                this.oDetailsModel.remove(
                  "/ZRRE_C_DMCG(guid'" + oObject.dbKey + "')",
                  {
                    success: function () {
                      oDailog.close()
                      MessageToast.show('设计成果' + oObject.cgnm + '已删除')
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
