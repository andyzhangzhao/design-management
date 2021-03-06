sap.ui.define(
  [
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/core/Fragment',
    'sap/ui/core/BusyIndicator',
    'sap/m/Dialog',
    'sap/m/Text',
    'sap/m/Button',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    './BaseController',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (
    JSONModel,
    Filter,
    Fragment,
    BusyIndicator,
    Dialog,
    Text,
    Button,
    MessageToast,
    MessageBox,
    BaseController
  ) {
    'use strict'

    return BaseController.extend(
      'projectmanagement.controller.QualityManagement',
      {
        onInit: function () {
          this.qualityManagementTable = this.byId('qualityManagementTable')

          this.oView = this.getView()
          this.oView.setModel(new JSONModel({}), 'ui')

          this.oRouter = this.getOwnerComponent().getRouter()
          this.oRouter
            .getRoute('projectDetails')
            .attachPatternMatched(this._onObjectMatched, this)

          this.oDetailsModel = this.getOwnerComponent().getModel('details')
          this.attachmentComponentContainer = this.byId("attachmentComponentContainer");

          this.addAttachmentComponent('ZRRE_DMPK')
        },
        _onObjectMatched: function (oEvent) {
          this.designProjectID =
            oEvent.getParameter('arguments').designProjectID
          this.section = oEvent.getParameter('arguments').section
          if (
            this.section === 'F' ||
            this.section === 'F1' ||
            this.section === 'F2'
          ) {
            this.getYTMJ()
            var listBinding = this.qualityManagementTable.getBinding('items')
            var aFilter = [
              new Filter({
                path: 'parent_key',
                operator: 'EQ',
                value1: this.designProjectID,
              }),
            ]

            if (this.section === 'F1' || this.section === 'F2') {
              aFilter.push(
                new Filter({
                  path: 'pktype',
                  operator: 'EQ',
                  value1: this.section,
                })
              )
            }
            listBinding.filter(aFilter)
          }
        },
        getControlById: function (id) {
          return sap.ui.getCore().byId(id)
        },
        onDelete: function (oEvent) {
          var sPath = oEvent.getSource().getBindingContext('details').getPath()
          var oDailog = new Dialog({
            title: '??????????????????',
            content: new Text({
              text: '?????????????????????????????????',
            }).addStyleClass('sapUiSmallMargin'),
            beginButton: new Button({
              text: '??????',
              type: 'Emphasized',
              press: function () {
                this.oDetailsModel.remove(sPath, {
                  success: function () {
                    oDailog.close()
                    MessageToast.show('?????????????????????')
                  }.bind(this),
                })
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

        onCreate: function () {
          this.onCreateQualityManagement()
          this.oView.getModel('ui').setProperty('/mode', 'create')
        },
        onCreateQualityManagement: function (sPath) {
          if (!this._qualityManagementPopup) {
            this._qualityManagementPopup = Fragment.load({
              name: 'projectmanagement.view.QualityManagementPopup',
              controller: this,
            }).then(
              function (oDialog) {
                this.oView.addDependent(oDialog)
                return oDialog
              }.bind(this)
            )
          }
          this._qualityManagementPopup.then(
            function (oDialog) {
              if (sPath) {
                this.mode = 'edit'
                oDialog.bindElement({
                  path: sPath,
                  model: 'details',
                })
              } else {
                this.mode = 'create'
                oDialog.unbindElement('details')
                var oContext = this.oDetailsModel.createEntry(
                  "/ZRRE_C_DMHD(guid'" + this.designProjectID + "')/to_pk",
                  {
                    properties: {},
                  }
                )
                oDialog.setBindingContext(oContext, 'details')
              }
              var cgidSelectBinding = this.getControlById(
                'qualityManagementCgidSelect'
              ).getBinding('items')
              cgidSelectBinding.filter(
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
        onEdit: function (oEvent) {
          var oContext = oEvent.getSource().getBindingContext('details')
          this.oView.getModel('ui').setProperty('/mode', 'edit')
          var customData = oContext.getObject()
          var ytmj = this.oView.getModel('ui').getProperty('/ytmj')
          ytmj.forEach(function (item) {
            if (item.YTID === customData.ytid) {
              item.selected = true
              item.MJD.forEach(function (mjItem) {
                if (mjItem.MAJORID === customData.majorid) {
                  mjItem.selected = true
                }
              })
            }
          })
          var ytmj = this.oView.getModel('ui').setProperty('/ytmj', ytmj)
          this.onCreateQualityManagement(oContext.getPath())
        },
        onCancel: function () {
          this._qualityManagementPopup.then(
            function (oDialog) {
              oDialog.close()
              this.oDetailsModel.resetChanges([
                oDialog.getBindingContext('details').getPath(),
              ])
              this._qualityManagementPopup=null
              oDialog.destroy()
            }.bind(this)
          )
        },
        onValidation: function () {
          var errorFlag = false
          if (!this.getControlById('pktypeSelect').getSelectedKey()) {
            this.getControlById('pktypeSelect').setValueState('Error')
            errorFlag = true
          }
          if (
            !this.getControlById('qualityManagementCgidSelect').getSelectedKey()
          ) {
            this.getControlById('qualityManagementCgidSelect').setValueState(
              'Error'
            )
            errorFlag = true
          }
          if (
            !this.getControlById('qualityManagementWcdatePicker').getDateValue()
          ) {
            this.getControlById('qualityManagementWcdatePicker').setValueState(
              'Error'
            )
            errorFlag = true
          }

          var majorFlag = false
          var ytmj = this.oView.getModel('ui').getProperty('/ytmj')
          ytmj.forEach(function (ytItem) {
            if (ytItem.selected) {
              ytItem.MJD.forEach(function (majorItem) {
                if (majorItem.selected) {
                  majorFlag = true
                }
              })
            }
          })
          if (!majorFlag) {
            MessageBox.error('????????????????????????')
            errorFlag = true
          }
          if (!errorFlag) {
            return true
          } else {
            return false
          }
        },

        onSave: function (oEvent) {
          if (this.onValidation()) {
            BusyIndicator.show(0)
            var ytmj = this.oView.getModel('ui').getProperty('/ytmj')
            var yt = ''
            var mj = ''
            ytmj.forEach(function (item) {
              if (item.selected) {
                yt = item.YTID
                item.MJD.forEach(function (mjItem) {
                  if (mjItem.selected) {
                    mj = mjItem.MAJORID
                  }
                })
              }
            })

            this._qualityManagementPopup.then(
              function (oDialog) {
                var oContext = oDialog.getBindingContext('details')
                this.oDetailsModel.setProperty(oContext.getPath() + '/ytid', yt)
                this.oDetailsModel.setProperty(
                  oContext.getPath() + '/majorid',
                  mj
                )
                var oDate = this.getControlById(
                  'qualityManagementWcdatePicker'
                ).getDateValue()
                oDate.setHours(oDate.getHours() + 8)
                this.oDetailsModel.setProperty(
                  oContext.getPath() + '/wcdate',
                  oDate
                )
                BusyIndicator.show(0)
                this.oDetailsModel.submitChanges({
                  success: function () {
                    MessageToast.show(
                      this.mode === 'create' ? '??????????????????' : '??????????????????'
                    )
                    BusyIndicator.hide()
                    oDialog.close()
                    oDialog.destroy()
                    this._qualityManagementPopup = null
                  }.bind(this),
                })
              }.bind(this)
            )
          }
        },

        tableUpdateFinished: function (oEvent) {
          this.oView
            .getModel('ui')
            .setProperty(
              '/qualityManagementCount',
              oEvent.getParameter('total')
            )
          var oTable = oEvent.getSource()
          if (!oTable.getSelectedItem() && oTable.getItems().length > 0) {
            oTable.setSelectedItem(oTable.getItems()[0])
            this.itemDbKey = oTable
              .getItems()[0]
              .getBindingContextPath()
              .match(/guid'(.*)'\)/)[1]
            this.oView.getModel('ui').setProperty('/selectItemKey', this.itemDbKey)
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
