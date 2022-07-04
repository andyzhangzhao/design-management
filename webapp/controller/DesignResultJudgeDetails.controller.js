sap.ui.define(
  [
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/core/Fragment',
    'sap/m/MessageToast',
    'sap/m/Dialog',
    'sap/ui/core/BusyIndicator',
    'sap/m/MessageBox',
    './BaseController',
    '../utils/Utils',
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
    Dialog,
    BusyIndicator,
    MessageBox,
    BaseController,
    Utils
  ) {
    'use strict'

    return BaseController.extend(
      'projectmanagement.controller.DesignResultJudgeDetails',
      {
        onInit: function () {
          this.oView = this.getView()
          this.oView.setModel(new JSONModel({}), 'ui')
          this.oDetailsModel = this.getOwnerComponent().getModel('details')
          this.businessObjectTypeName = 'ZRRE_DMFA'
          this.ObjectPageLayout = this.byId('ObjectPageLayout')
          this.cgTable = this.byId('cgTable')
          this.oRouter = this.getOwnerComponent().getRouter()
          this.oRouter
            .getRoute('designResultJudgeDetails')
            .attachPatternMatched(this._onObjectMatched, this)
        },

        _onObjectMatched: function (oEvent) {
          this.devProjectID = oEvent.getParameter('arguments').devProjectID
          this.designProjectID =
            oEvent.getParameter('arguments').designProjectID
          this.designResultJudgeID = this.itemDbKey =
            oEvent.getParameter('arguments').designResultJudgeID
          this.mode = oEvent.getParameter('arguments').mode
          this.oView.getModel('ui').setProperty('/mode', this.mode)
          this.oDetailsModel.resetChanges()
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
            path: "/ZRRE_C_DMFA(guid'" + this.designResultJudgeID + "')",
            model: 'details',
            parameters: {
              expand: 'to_pstyp,to_fayt,to_famj,to_fatyp,to_fast,to_fg',
            },
            events: {
              dataReceived: function (oEvent) {
                console.log(oEvent.getParameter('data'))
              }.bind(this),
            },
          })

          this.getUploadFileToken()
          this.getAllFiles()
          this.oDetailsModel.setDeferredGroups(
            this.oDetailsModel.getDeferredGroups().concat(['judgeCG'])
          )
        },
        onCreateCG() {
          if (!this._cgPopup) {
            this._cgPopup = Fragment.load({
              name: 'projectmanagement.view.DesignResultJudgeDetailsPopup',
              controller: this,
            }).then(
              function (oDialog) {
                this.oView.addDependent(oDialog)
                return oDialog
              }.bind(this)
            )
          }
          this._cgPopup.then(
            function (oDialog) {
              this.oCGContext = this.oDetailsModel.createEntry(
                "/ZRRE_C_DMFA(guid'" + this.designResultJudgeID + "')/to_fg",
                {
                  properties: {},
                  groupId: 'judgeCG',
                }
              )
              oDialog.setBindingContext(this.oCGContext, 'details')

              var designResultJudgeCGSelect = this.getControlById(
                'designResultJudgeCGSelect'
              ).getBinding('items')
              designResultJudgeCGSelect.filter(
                new Filter({
                  path: 'parent_key',
                  operator: 'EQ',
                  value1: this.designProjectID,
                })
              )

              oDialog.open()
            }.bind(this)
          )
        },
        onSaveCG: function () {
          this.oDetailsModel.submitChanges({
            groupId: 'judgeCG',
            success: function () {
              MessageToast.show('相关设计成果添加成果')
              this._cgPopup.then(function (oDialog) {
                oDialog.close()
              })
            }.bind(this),
            error: function (error) {
              console.log(error)
            },
          })
        },
        onCancelCG: function () {
          this.oDetailsModel.resetChanges([this.oCGContext.getPath()])
          this._cgPopup.then(function (oDialog) {
            oDialog.close()
          })
        },
        onDeleteCG: function (oEvent) {
          this.oDetailsModel.remove(
            oEvent.getSource().getBindingContext('details').getPath(),
            {
              success: function () {
                MessageToast.show('相关设计成果已移除')
              }.bind(this),
            }
          )
        },
        getControlById: function (id) {
          return sap.ui.getCore().byId(id)
        },
        onNavBck: function () {
          this.oRouter.navTo('projectDetails', {
            devProjectID: this.devProjectID,
            designProjectID: this.designProjectID,
            section: 'E',
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
              MessageToast.show('评审更新成果')
            }.bind(this),
            error: function (error) {
              console.log(error)
              BusyIndicator.hide()
            },
          })
        },
        onPublish: function (oEvent) {},

        tableUpdateFinished: function (oEvent) {
          this.oView
            .getModel('ui')
            .setProperty('/cgCount', oEvent.getParameter('total'))
        },
      }
    )
  }
)
