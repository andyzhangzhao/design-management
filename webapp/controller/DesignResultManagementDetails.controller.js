sap.ui.define(
  [
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/core/Fragment',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    'sap/m/Dialog',
    'sap/m/Button',
    'sap/m/Text',
    'sap/m/MessageItem',
    'sap/m/MessageView',
    'sap/m/Popover',
    './BaseUploadSet',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (
    JSONModel,
    Filter,
    Fragment,
    MessageToast,
    MessageBox,
    Dialog,
    Button,
    Text,
    MessageItem,
    MessageView,
    Popover,
    BaseUploadSet
  ) {
    'use strict'

    return BaseUploadSet.extend(
      'projectmanagement.controller.DesignResultManagementDetails',
      {
        onInit: function () {
          this.oView = this.getView()
          this.oView.setModel(
            new JSONModel({
              validateMessages: [],
            }),
            'ui'
          )

          this.ObjectPageLayout = this.byId('ObjectPageLayout')
          this.cgnmInput = this.byId('cgnmInput')
          this.contractInput = this.byId('contractInput')
          this.versionSelect = this.byId('versionSelect')
          this.typeSelect = this.byId('typeSelect')
          this.wcDatePicker = this.byId('wcDatePicker')
          this.historyRecordTable = this.byId('historyRecordTable')
          this.designCompanyText = this.byId('designCompanyText')
          this.contractStatusText = this.byId('contractStatusText')

          this.businessObjectTypeName = 'ZRRE_DMCG'

          this.oProjectListModel = this.getOwnerComponent().getModel()
          this.oDetailsModel = this.getOwnerComponent().getModel('details')

          this.oRouter = this.getOwnerComponent().getRouter()
          this.oRouter
            .getRoute('designResultDetails')
            .attachPatternMatched(this._onObjectMatched, this)
        },

        _onObjectMatched: function (oEvent) {
          this.devProjectID = oEvent.getParameter('arguments').devProjectID
          this.designProjectID =
            oEvent.getParameter('arguments').designProjectID
          this.itemDbKey = oEvent.getParameter('arguments').designResultID
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

          if (this.mode === 'display') {
            this.ObjectPageLayout.bindElement({
              path: "/ZRRE_C_DMCG(guid'" + this.itemDbKey + "')",
              model: 'details',
              parameters: {
                expand: 'to_cont,to_cgver,to_cgsts',
              },
              events: {
                dataReceived: function (oEvent) {
                  this.getYTMJ(oEvent.getParameter('data'))
                }.bind(this),
              },
            })
          } else {
            this.ObjectPageLayout.unbindElement('details')
            this.getYTMJ()
          }

          if (this.itemDbKey) {
            var listBinding = this.historyRecordTable.getBinding('items')
            var filter = new Filter({
              path: 'parent_key',
              operator: 'EQ',
              value1: this.itemDbKey,
            })
            listBinding.filter(filter)
            this.getUploadFileToken()
            this.getAllFiles()
          }
        },
        // getUploadFileToken: function () {
        //   jQuery.ajax({
        //     method: 'GET',
        //     url: '/sap/opu/odata/sap/API_CV_ATTACHMENT_SRV/',
        //     beforeSend: function (xhr) {
        //       xhr.setRequestHeader('X-CSRF-Token', 'Fetch')
        //     },
        //     success: function (response, undefined, XMLHttpRequest) {
        //       this.token = XMLHttpRequest.getResponseHeader('X-CSRF-Token')
        //     }.bind(this),
        //   })
        // },
        // getAllFiles: function () {
        //   jQuery.ajax({
        //     method: 'GET',
        //     url: '/sap/opu/odata/sap/API_CV_ATTACHMENT_SRV/GetAllOriginals',
        //     data: {
        //       LinkedSAPObjectKey: "'" + this.designResultID + "'",
        //       BusinessObjectTypeName: "'" + 'ZRRE_DMCG' + "'",
        //       $format: 'json',
        //     },
        //     success: function (response) {
        //       response.d.results.forEach(
        //         function (item) {
        //           item.attributes = [
        //             { title: '上传人', text: item.CreatedByUserFullName },
        //             {
        //               title: '上传时间',
        //               text: sap.ui.core.format.DateFormat.getDateInstance({
        //                 pattern: 'yyyy-MM-dd HH:mm',
        //               }).format(
        //                 new Date(+item.CreationDateTime.match(/(\d{13})/)[0])
        //               ),
        //             },
        //             {
        //               title: '文件大小',
        //               text: this.getFileSize(item.FileSize),
        //             },
        //           ]
        //         }.bind(this)
        //       )
        //       this.oView
        //         .getModel('ui')
        //         .setProperty('/files', response.d.results)
        //     }.bind(this),
        //   })
        // },
        // getFileSize: function (size) {
        //   if (Math.floor(size / 1024) < 1) {
        //     return size + ' B'
        //   } else if (Math.floor(size / 1024 / 1024) < 1) {
        //     return Math.floor(size / 1024) + ' KB'
        //   } else {
        //     return Math.floor(size / 1024 / 1024) + ' MB'
        //   }
        // },
        tableUpdateFinished: function (oEvent) {
          this.oView
            .getModel('ui')
            .setProperty('/historyRecordCount', oEvent.getParameter('total'))
        },
        getYTMJ: function (oData) {
          jQuery.ajax({
            method: 'GET',
            url: '/sap/zrre_rest_ytmj?DBKEY=' + this.designProjectID,
            success: function (response) {
              if (oData) {
                response.forEach(function (ytItem) {
                  if (oData.ytid === ytItem.YTID) {
                    ytItem.selected = true
                    var aMajorId = oData.majorid.split(',')
                    ytItem.MJD.forEach(function (majorItem) {
                      aMajorId.forEach(function (marjorId) {
                        if (majorItem.MAJORID === marjorId) {
                          majorItem.selected = true
                        }
                      })
                    })
                  }
                })
                this.oView.getModel('ui').setProperty('/ytmj', response)
              } else {
                response.forEach(function (item, index) {
                  item.selected = index === 0
                })
                this.oView.getModel('ui').setProperty('/ytmj', response)
              }
            }.bind(this),
          })
        },
        onValueHelpRequest: function () {
          if (!this._contractValueHelpDialog) {
            this._contractValueHelpDialog = Fragment.load({
              name: 'projectmanagement.view.ContractHelpDialog',
              controller: this,
            }).then(
              function (oDialog) {
                this.oView.addDependent(oDialog)
                return oDialog
              }.bind(this)
            )
          }
          this._contractValueHelpDialog.then(function (oDialog) {
            oDialog.open()
          })
        },
        onValueHelpSearch: function (oEvent) {
          var sValue = oEvent.getParameter('value')
          var oFilter = new Filter('conno', 'Contains', sValue)
          oEvent.getSource().getBinding('items').filter([oFilter])
        },

        onValueHelpClose: function (oEvent) {
          var oSelectedItem = oEvent.getParameter('selectedItem')
          oEvent.getSource().getBinding('items').filter([])
          if (!oSelectedItem) {
            return
          }
          this.contractStatusText.setText(oSelectedItem.data('status'))
          this.designCompanyText.setText(oSelectedItem.data('vendname'))

          this.contractInput.setValue(oSelectedItem.getTitle())
        },
        // beforeItemAdded: function (oEvent) {
        //   var uploadSet = oEvent.getSource()
        //   uploadSet.setBusy(true)
        //   var file = oEvent.getParameter('item').getFileObject()
        //   var reader = new FileReader()
        //   reader.readAsDataURL(file)
        //   reader.onload = function (fileEvent) {
        //     jQuery.ajax({
        //       url: '/sap/opu/odata/SAP/API_CV_ATTACHMENT_SRV/AttachmentContentSet',
        //       method: 'POST',
        //       data: fileEvent.target.result,
        //       headers: {
        //         BusinessObjectTypeName: 'ZRRE_DMCG',
        //         LinkedSAPObjectKey: this.designResultID,
        //         'Content-Type': file.type,
        //         'X-CSRF-Token': this.token,
        //         Slug: file.name,
        //       },
        //       success: function () {
        //         MessageToast.show(file.name + '文件上传成功')
        //         this.getAllFiles()
        //         uploadSet.setBusy(false)
        //       }.bind(this),
        //     })
        //   }.bind(this)
        //   oEvent.preventDefault()
        // },
        // getUrl: function (original, mode) {
        //   var url =
        //     "/sap/opu/odata/sap/API_CV_ATTACHMENT_SRV/AttachmentContentSet(DocumentInfoRecordDocType='" +
        //     original.DocumentInfoRecordDocType +
        //     "',DocumentInfoRecordDocNumber='" +
        //     original.DocumentInfoRecordDocNumber +
        //     "',DocumentInfoRecordDocPart='" +
        //     original.DocumentInfoRecordDocPart +
        //     "',DocumentInfoRecordDocVersion='" +
        //     original.DocumentInfoRecordDocVersion +
        //     "',LogicalDocument='" +
        //     original.LogicalDocument +
        //     "',ArchiveDocumentID='" +
        //     original.ArchiveDocumentID +
        //     "',LinkedSAPObjectKey='" +
        //     original.LinkedSAPObjectKey +
        //     "',BusinessObjectTypeName='" +
        //     original.BusinessObjectTypeName +
        //     "')"
        //   if (mode === 'download') {
        //     url += '/$value'
        //   }
        //   return url
        // },
        // openPressed: function (oEvent) {
        //   var original = oEvent.getParameter('item').data()
        //   var downloadUrl = this.getUrl(original, 'download')

        //   jQuery.ajax({
        //     url: downloadUrl,
        //     success: function (res) {
        //       const linkSource = res
        //       const downloadLink = document.createElement('a')
        //       downloadLink.href = linkSource
        //       downloadLink.download = original.FileName
        //       downloadLink.click()
        //     }.bind(this),
        //   })
        //   oEvent.preventDefault()
        // },
        // removePressed: function (oEvent) {
        //   oEvent.preventDefault()
        //   var original = oEvent.getParameter('item').data()

        //   var oDailog = new Dialog({
        //     title: '删除文件',
        //     content: new Text({
        //       text: '确定要删除文件' + original.FileName + '吗？',
        //     }).addStyleClass('sapUiSmallMargin'),
        //     beginButton: new Button({
        //       text: '确定',
        //       type: 'Emphasized',
        //       press: function () {
        //         var deleteUrl = this.getUrl(original)
        //         jQuery.ajax({
        //           url: deleteUrl,
        //           method: 'DELETE',
        //           headers: {
        //             'X-CSRF-Token': this.token,
        //           },
        //           success: function () {
        //             oDailog.close()
        //             MessageToast.show(original.FileName + '文件删除成功')
        //             this.getAllFiles()
        //           }.bind(this),
        //         })
        //       }.bind(this),
        //     }),
        //     endButton: new Button({
        //       text: '取消',
        //       press: function () {
        //         oDailog.close()
        //       },
        //     }),
        //   })
        //   oDailog.open()
        // },
        onEdit: function () {
          this.oView.getModel('ui').setProperty('/mode', 'edit')
        },
        onCancel: function () {
          if (this.oView.getModel('ui').getProperty('/mode') !== 'edit') {
            this.onNavBck()
          } else {
            this.oView.getModel('ui').setProperty('/mode', 'display')
          }
        },
        onNavBck: function () {
          this.oRouter.navTo('projectDetails', {
            devProjectID: this.devProjectID,
            designProjectID: this.designProjectID,
            section: 'C',
          })
        },
        onValidation: function () {
          var errorFlag = false
          if (!this.cgnmInput.getValue()) {
            this.cgnmInput.setValueState('Error')
            errorFlag = true
          }
          if (!this.typeSelect.getSelectedKey()) {
            this.typeSelect.setValueState('Error')
            errorFlag = true
          }
          if (!this.versionSelect.getSelectedKey()) {
            this.versionSelect.setValueState('Error')
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
            MessageBox.error('至少选择一个专业')
            errorFlag = true
          }
          if (!errorFlag) {
            return true
          } else {
            return false
          }
        },
        onSave: function () {
          if (this.onValidation()) {
            var ytmj = this.oView.getModel('ui').getProperty('/ytmj')
            var yt = ''
            var mj = ''
            var mjtxt = ''
            ytmj.forEach(function (item) {
              if (item.selected) {
                yt = item.YTID
                item.MJD.forEach(function (mjItem) {
                  if (mjItem.selected) {
                    mj = mj + mjItem.MAJORID + ','
                    mjtxt = mjtxt + mjItem.MAJORDESC + ','
                  }
                })
              }
            })
            if (mj) {
              mj = mj.substring(0, mj.length - 1)
            }
            if (mjtxt) {
              mjtxt = mjtxt.substring(0, mjtxt.length - 1)
            }
            if (this.oView.getModel('ui').getProperty('/mode') === 'create') {
              this.oDetailsModel.create(
                "/ZRRE_C_DMHD(guid'" + this.designProjectID + "')/to_cg",
                {
                  cgnm: this.cgnmInput.getValue(),
                  cgtyp: this.typeSelect.getSelectedKey(),
                  cg_ver: this.versionSelect.getSelectedKey(),
                  contid: this.contractInput.getValue(),
                  wcdate: this.wcDatePicker.getDateValue(),
                  majorid: mj,
                  ytid: yt,
                  majtxt: mjtxt,
                },
                {
                  success: function (response) {
                    this.oView.getModel('ui').setProperty('/mode', 'display')
                    MessageToast.show('设计成果创建成功')
                    this.oRouter.navTo('designResultDetails', {
                      devProjectID: this.devProjectID,
                      designProjectID: this.designProjectID,
                      designResultID: response.db_key,
                      mode: 'display',
                    })
                  }.bind(this),
                }
              )
            } else {
              this.oDetailsModel.update(
                "/ZRRE_C_DMCG(guid'" + this.itemDbKey + "')",
                {
                  cgnm: this.cgnmInput.getValue(),
                  cgtyp: this.typeSelect.getSelectedKey(),
                  cg_ver: this.versionSelect.getSelectedKey(),
                  contid: this.contractInput.getValue(),
                  wcdate: this.wcDatePicker.getDateValue(),
                  majorid: mj,
                  ytid: yt,
                  majtxt: mjtxt,
                },
                {
                  success: function (response) {
                    this.oView.getModel('ui').setProperty('/mode', 'display')
                    MessageToast.show('设计成果更新成功')
                  }.bind(this),
                }
              )
            }
          }
        },
      }
    )
  }
)
