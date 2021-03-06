sap.ui.define(
  [
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/m/Dialog',
    'sap/m/Button',
    'sap/m/Text',
    'sap/m/MessageToast',
    './BaseController',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (
    JSONModel,
    Filter,
    Dialog,
    Button,
    Text,
    MessageToast,
    BaseController
  ) {
    'use strict'

    return BaseController.extend(
      'projectmanagement.controller.DesignResultManagement',
      {
        onInit: function () {
          this.oView = this.getView()
          this.oView.setModel(
            new JSONModel({
              filter: {
                yt: true,
              },
            }),
            'ui'
          )

          this.oRouter = this.getOwnerComponent().getRouter()
          this.oRouter
            .getRoute('projectDetails')
            .attachPatternMatched(this._onObjectMatched, this)

          this.oDetailsModel = this.getOwnerComponent().getModel('details')
        },
        _onObjectMatched: function (oEvent) {
          var oArguments = oEvent.getParameter('arguments')
          this.designProjectID = oArguments.designProjectID
          this.devProjectID = oArguments.devProjectID
          this.section = oArguments.section
          if (
            this.section === 'C' ||
            this.section === 'C1' ||
            this.section === 'C2' ||
            this.section === 'C3' ||
            this.section === 'C4'
          ) {
            this.getYTMJ()
            var listBinding = this.getListBinding()
            listBinding.filter(this.getDefaultFilter())
          }
        },
        getListBinding: function () {
          return this.byId('designResultManagementTable').getBinding('items')
        },
        getDefaultFilter: function () {
          var aFilter = [
            new Filter({
              path: 'to_root/db_key',
              operator: 'EQ',
              value1: this.designProjectID,
            }),
          ]
          if (
            this.section === 'C1' ||
            this.section === 'C2' ||
            this.section === 'C3' ||
            this.section === 'C4'
          ) {
            aFilter.push(
              new Filter({
                path: 'cgtyp',
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
            title: '??????????????????',
            content: new Text({
              text: '???????????????????????????' + oObject.cgnm + '??????',
            }).addStyleClass('sapUiSmallMargin'),
            beginButton: new Button({
              text: '??????',
              type: 'Emphasized',
              press: function () {
                this.oDetailsModel.remove(
                  "/ZRRE_C_DMCG(guid'" + oObject.dbKey + "')",
                  {
                    success: function () {
                      oDailog.close()
                      MessageToast.show('????????????' + oObject.cgnm + '?????????')
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
