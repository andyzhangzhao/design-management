sap.ui.define(
  [
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/m/MessageToast',
    'sap/ui/core/BusyIndicator',
    'sap/m/MessageBox',
    '../utils/Utils',
    './BaseController',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (
    JSONModel,
    Filter,
    MessageToast,
    BusyIndicator,
    MessageBox,
    Utils,
    BaseController
  ) {
    'use strict'

    return BaseController.extend(
      'projectmanagement.controller.QuotaManagementDetails',
      {
        onInit: function () {
          this.oView = this.getView()
          this.oView.setModel(new JSONModel({}), 'ui')
          this.oDetailsModel = this.getOwnerComponent().getModel('details')

          this.quotaManagementDetailsTable = this.byId(
            'quotaManagementDetailsTable'
          )
          this.ObjectPageLayout = this.byId('ObjectPageLayout')

          this.oRouter = this.getOwnerComponent().getRouter()
          this.oRouter
            .getRoute('quotaManagementDetails')
            .attachPatternMatched(this._onObjectMatched, this)

          this.addAttachmentComponent('ZRRE_DMXE')
        },

        _onObjectMatched: function (oEvent) {
          this.oDetailsModel.resetChanges()
          this.devProjectID = oEvent.getParameter('arguments').devProjectID
          this.designProjectID =
            oEvent.getParameter('arguments').designProjectID
          this.quotaManagementID = this.itemDbKey =
            oEvent.getParameter('arguments').quotaManagementID

          this.mode = oEvent.getParameter('arguments').mode
          this.oView.getModel('ui').setProperty('/mode', this.mode)
          this.getYTMJ()
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
            path: "/ZRRE_C_DMXE(guid'" + this.quotaManagementID + "')",
            model: 'details',
            parameters: {
              expand: 'to_kzdj,to_xever,to_xest',
            },
            events: {
              dataReceived: function (oEvent) {
                var receivedData = oEvent.getParameter('data')
                this.oView.getModel('ui').setProperty('/editable', {
                  contEdit: receivedData.lrjd === '00',
                  faEdit: receivedData.lrjd === '01',
                  cjlEdit: receivedData.lrjd === '02',
                })
              }.bind(this),
            },
          })
          var listBinding = this.quotaManagementDetailsTable.getBinding('items')
          var filter = new Filter({
            path: 'parent_key',
            operator: 'EQ',
            value1: this.quotaManagementID,
          })
          listBinding.filter(filter)

          this.oView.getModel('ui').setProperty('/selectItemKey', this.itemDbKey)
        },
        onNavBck: function () {
          this.oRouter.navTo('projectDetails', {
            devProjectID: this.devProjectID,
            designProjectID: this.designProjectID,
            section: 'J',
          })
        },
        onChangeKZDJ: function (oEvent) {
          BusyIndicator.show(500)
          this.oDetailsModel.callFunction('/ZRRE_C_DMXEUpdate_kzdj', {
            method: 'POST',
            urlParameters: {
              db_key: this.quotaManagementID,
              Key: this.quotaManagementID,
              kzdj: oEvent.getParameters().selectedItem.getKey(),
            },
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
              MessageToast.show('限额指标更新成功')
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
          this.oDetailsModel.callFunction('/ZRRE_C_DMXEUpdate_xe', {
            method: 'POST',
            urlParameters: { db_key: this.quotaManagementID },
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
            .setProperty(
              '/quotaManagementDetailsCount',
              oEvent.getParameter('total')
            )
        },
      }
    )
  }
)
