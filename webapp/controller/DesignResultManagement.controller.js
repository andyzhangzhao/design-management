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
          this.designResultManagementTable = this.byId(
            'designResultManagementTable'
          )
          this.ytSelect = this.byId('ytSelect')

          this.oView = this.getView()
          this.oView.setModel(new JSONModel({}), 'ui')

          this.oRouter = this.getOwnerComponent().getRouter()
          this.oRouter
            .getRoute('projectDetails')
            .attachPatternMatched(this._onObjectMatched, this)

          this.oDetailsModel = this.getOwnerComponent().getModel('details')
        },
        formatDate: function (date) {
          console.log(date)
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
            var listBinding =
              this.designResultManagementTable.getBinding('items')
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

            listBinding.filter(aFilter)
          }
        },

        onFilter: function () {
          var ytid = this.ytSelect.getSelectedKey()
          var aFilter = [
            new Filter({
              path: 'to_root/db_key',
              operator: 'EQ',
              value1: this.designProjectID,
            }),
          ]
          if (ytid) {
            aFilter.push(
              new Filter({
                path: 'ytid',
                operator: 'EQ',
                value1: ytid,
              })
            )
          }
          var listBinding = this.designResultManagementTable.getBinding('items')
          listBinding.filter(aFilter)
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
