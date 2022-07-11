sap.ui.define(
  [
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    './BaseController',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (JSONModel, Filter, MessageToast, MessageBox, BaseController) {
    'use strict'

    return BaseController.extend(
      'projectmanagement.controller.BasicProjectInfo',
      {
        onInit: function () {
          this.basicProjectInfoTable = this.byId('basicProjectInfoTable')
          this.projectDescInput = this.byId('projectDescInput')
          this.projectAddressInput = this.byId('projectAddressInput')
          this.editAction = this.byId('editAction')
          this.projectBasicInfoPage = this.byId('projectBasicInfoPage')

          this.businessObjectTypeName = 'ZRRE_DMBC'

          this.oView = this.getView()
          this.oView.setModel(
            new JSONModel({
              editMode: false,
              imageBusy: false,
              uploadTitle: '图片',
            }),
            'ui'
          )

          this.oRouter = this.getOwnerComponent().getRouter()
          this.oRouter
            .getRoute('projectDetails')
            .attachPatternMatched(this._onObjectMatched, this)

          this.initCarouselSwipe()

          this.oDetailsModel = this.getOwnerComponent().getModel('details')
          var oMessageManager = sap.ui.getCore().getMessageManager()

          oMessageManager.registerMessageProcessor(this.oDetailsModel)
        },

        _onObjectMatched: function (oEvent) {
          this.designProjectID =
            oEvent.getParameter('arguments').designProjectID
          this.section = oEvent.getParameter('arguments').section
          if (this.section === 'A') {
            this.setRestrictionForUploader()
            this.oDetailsModel.read('/ZRRE_C_DMBC', {
              filters: [
                new Filter({
                  path: 'parent_key',
                  operator: 'EQ',
                  value1: this.designProjectID,
                }),
              ],
              success: function (response) {
                this.db_key = response.results[0].db_key
                this.itemDbKey = this.db_key
                this.getAllFiles()
                this.downloadPicture(this.db_key)
                this.sPath = "/ZRRE_C_DMBC(guid'" + this.db_key + "')"
                this.projectBasicInfoPage.bindElement({
                  path: this.sPath,
                  model: 'details',
                  parameters: {
                    expand: 'to_xmtxt',
                  },
                })
              }.bind(this),
            })
            // var listBinding = this.basicProjectInfoTable.getBinding('items')
            // var filter = new Filter({
            //   path: 'parent_key',
            //   operator: 'EQ',
            //   value1: this.designProjectID,
            // })
            // listBinding.filter(filter)

            jQuery.ajax({
              method: 'GET',
              url: '/sap/opu/odata/sap/API_CV_ATTACHMENT_SRV/',
              beforeSend: function (xhr) {
                xhr.setRequestHeader('X-CSRF-Token', 'Fetch')
              },
              success: function (response, undefined, XMLHttpRequest) {
                this.token = XMLHttpRequest.getResponseHeader('X-CSRF-Token')
              }.bind(this),
            })
          }
        },

        initCarouselSwipe: function () {
          // var projectImageCarousel = this.byId('projectImageCarousel')
          // setInterval(function () {
          //   projectImageCarousel.next()
          // }, 3000)
        },

        setRestrictionForUploader: function () {
          var uploadSet = this.byId('upload')
          var uploader = uploadSet.getDefaultFileUploader()
          uploader.setFileType('PNG,JPG,png,jpg')
          uploader.setMimeType('image/png,image/jpeg')
          uploader.setMaximumFileSize(4)
          uploader.attachTypeMissmatch(function (oEvent) {
            MessageBox.error('图片类型不符，类型必须为jpg或者png')
          })
          uploader.attachFileSizeExceed(function (oEvent) {
            MessageBox.error('超过图片上传大小，上线为4MB')
          })
        },

        formatImageRow: function (files) {
          if (files) {
            return Math.floor(files.length * 2.4) + 1
          } else {
            return 0
          }
        },

        getAllFiles: function () {
          jQuery.ajax({
            method: 'GET',
            url: '/sap/opu/odata/sap/API_CV_ATTACHMENT_SRV/GetAllOriginals',
            data: {
              LinkedSAPObjectKey: "'" + this.itemDbKey + "'",
              BusinessObjectTypeName: "'" + this.businessObjectTypeName + "'",
              $format: 'json',
            },
            success: function (response) {
              response.d.results.forEach(
                function (item, index) {
                  item.attributes = [
                    { title: '上传人', text: item.CreatedByUserFullName },
                    {
                      title: '上传时间',
                      text: sap.ui.core.format.DateFormat.getDateInstance({
                        pattern: 'yyyy-MM-dd HH:mm',
                      }).format(
                        new Date(+item.CreationDateTime.match(/(\d{13})/)[0])
                      ),
                    },
                    {
                      title: '文件大小',
                      text: this.getFileSize(item.FileSize),
                    },
                  ]
                  var downloadUrl =
                    "/sap/opu/odata/sap/API_CV_ATTACHMENT_SRV/AttachmentContentSet(DocumentInfoRecordDocType='" +
                    item.DocumentInfoRecordDocType +
                    "',DocumentInfoRecordDocNumber='" +
                    item.DocumentInfoRecordDocNumber +
                    "',DocumentInfoRecordDocPart='" +
                    item.DocumentInfoRecordDocPart +
                    "',DocumentInfoRecordDocVersion='" +
                    item.DocumentInfoRecordDocVersion +
                    "',LogicalDocument='" +
                    item.LogicalDocument +
                    "',ArchiveDocumentID='" +
                    item.ArchiveDocumentID +
                    "',LinkedSAPObjectKey='" +
                    item.LinkedSAPObjectKey +
                    "',BusinessObjectTypeName='" +
                    item.BusinessObjectTypeName +
                    "')/$value"
                  jQuery.ajax({
                    url: downloadUrl,
                    success: function (res) {
                      this.oView
                        .getModel('ui')
                        .setProperty('/files/' + index + '/src', res)
                    }.bind(this),
                  })
                }.bind(this)
              )
              this.oView
                .getModel('ui')
                .setProperty('/files', response.d.results)
            }.bind(this),
          })
        },
        downloadPicture: function (db_key) {
          jQuery.ajax({
            method: 'GET',
            url: '/sap/opu/odata/sap/API_CV_ATTACHMENT_SRV/GetAllOriginals',
            data: {
              LinkedSAPObjectKey: "'" + db_key + "'",
              BusinessObjectTypeName: "'" + 'ZRRE_DMCP' + "'",
              $format: 'json',
            },
            success: function (response) {
              this.images = response.d.results
              var original = response.d.results[0]
              if (original) {
                var downloadUrl =
                  "/sap/opu/odata/sap/API_CV_ATTACHMENT_SRV/AttachmentContentSet(DocumentInfoRecordDocType='" +
                  original.DocumentInfoRecordDocType +
                  "',DocumentInfoRecordDocNumber='" +
                  original.DocumentInfoRecordDocNumber +
                  "',DocumentInfoRecordDocPart='" +
                  original.DocumentInfoRecordDocPart +
                  "',DocumentInfoRecordDocVersion='" +
                  original.DocumentInfoRecordDocVersion +
                  "',LogicalDocument='" +
                  original.LogicalDocument +
                  "',ArchiveDocumentID='" +
                  original.ArchiveDocumentID +
                  "',LinkedSAPObjectKey='" +
                  original.LinkedSAPObjectKey +
                  "',BusinessObjectTypeName='" +
                  original.BusinessObjectTypeName +
                  "')/$value"
                jQuery.ajax({
                  url: downloadUrl,
                  success: function (res) {
                    this.oView.getModel('ui').setProperty('/imageSrc', res)
                  }.bind(this),
                })
              } else {
                this.oView.getModel('ui').setProperty('/imageSrc', '')
              }
            }.bind(this),
          })
        },
        onEdit: function () {
          this.oView.getModel('ui').setProperty('/editMode', true)
        },
        onCancel: function () {
          this.oView.getModel('ui').setProperty('/editMode', false)
          this.oDetailsModel.resetChanges([
            this.projectBasicInfoPage.getBindingContext('details').getPath(),
          ])
        },
        tableUpdateFinished: function (oEvent) {
          this.oView
            .getModel('ui')
            .setProperty('/basicProjectInfoCount', oEvent.getParameter('total'))
        },
        uploadStart: function (oEvent) {
          console.log(oEvent)
        },
        fileAllowed: function (oEvent) {
          var file = oEvent.getSource().getFocusDomRef().files[0]
          var reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = function (oEvent) {
            this.picture = oEvent.target.result
            jQuery.ajax({
              url: '/sap/opu/odata/SAP/API_CV_ATTACHMENT_SRV/AttachmentContentSet',
              method: 'POST',
              data: this.picture,
              headers: {
                BusinessObjectTypeName: 'ZRRE_DMCP',
                LinkedSAPObjectKey: this.db_key,
                'Content-Type': file.type,
                'X-CSRF-Token': this.token,
                Slug: file.name,
              },
              success: function () {
                MessageToast.show('图片上传成功')
                this.oView.getModel('ui').setProperty('/imageSrc', this.picture)
                this.images.forEach(
                  function (original) {
                    var deleteUrl =
                      "/sap/opu/odata/sap/API_CV_ATTACHMENT_SRV/AttachmentContentSet(DocumentInfoRecordDocType='" +
                      original.DocumentInfoRecordDocType +
                      "',DocumentInfoRecordDocNumber='" +
                      original.DocumentInfoRecordDocNumber +
                      "',DocumentInfoRecordDocPart='" +
                      original.DocumentInfoRecordDocPart +
                      "',DocumentInfoRecordDocVersion='" +
                      original.DocumentInfoRecordDocVersion +
                      "',LogicalDocument='" +
                      original.LogicalDocument +
                      "',ArchiveDocumentID='" +
                      original.ArchiveDocumentID +
                      "',LinkedSAPObjectKey='" +
                      original.LinkedSAPObjectKey +
                      "',BusinessObjectTypeName='" +
                      original.BusinessObjectTypeName +
                      "')"
                    jQuery.ajax({
                      url: deleteUrl,
                      method: 'DELETE',
                      headers: {
                        'X-CSRF-Token': this.token,
                      },
                    })
                  }.bind(this)
                )
              }.bind(this),
            })
          }.bind(this)
        },
        fileSizeExceed: function (oEvent) {
          MessageBox.error('超过图片上传大小，上线为4MB')
        },
        typeMissmatch: function (oEvent) {
          MessageBox.error('图片类型不符，类型必须为jpg或者png')
        },
        onSave: function () {
          this.oDetailsModel.submitChanges({
            success: function (res) {
              console.log(res)
              this.oView.getModel('ui').setProperty('/editMode', false)
              MessageToast.show('项目基本信息更新成功')
            }.bind(this),
            error: function (err) {
              console.log(err)
            },
          })
        },
      }
    )
  }
)
