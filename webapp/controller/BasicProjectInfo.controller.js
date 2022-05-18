sap.ui.define(
  [
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, JSONModel, Filter, MessageToast, MessageBox) {
    'use strict'

    return Controller.extend('projectmanagement.controller.BasicProjectInfo', {
      onInit: function () {
        this.basicProjectInfoTable = this.byId('basicProjectInfoTable')
        this.projectDescInput = this.byId('projectDescInput')
        this.projectAddressInput = this.byId('projectAddressInput')
        this.projectImage = this.byId('projectImage')
        this.editAction = this.byId('editAction')

        this.oView = this.getView()
        this.oView.setModel(
          new JSONModel({
            editMode: false,
            imageBusy: false,
            imageSrc: '',
          }),
          'ui'
        )

        this.oRouter = this.getOwnerComponent().getRouter()
        this.oRouter
          .getRoute('projectDetails')
          .attachPatternMatched(this._onObjectMatched, this)

        this.oDetailsModel = this.getOwnerComponent().getModel('details')
        var oMessageManager = sap.ui.getCore().getMessageManager()

        oMessageManager.registerMessageProcessor(this.oDetailsModel)
      },

      _onObjectMatched: function (oEvent) {
        this.designProjectID = oEvent.getParameter('arguments').designProjectID
        this.section = oEvent.getParameter('arguments').section
        if (this.section === 'A') {
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
              this.downloadPicture(this.db_key)
              this.sPath = "/ZRRE_C_DMBC(guid'" + this.db_key + "')"
              this.byId('projectBasicInfoPage').bindElement({
                path: this.sPath,
                model: 'details',
                parameters: {
                  expand: 'to_xmtxt',
                  groupId: 'myId',
                },
              })
            }.bind(this),
          })
          var listBinding = this.basicProjectInfoTable.getBinding('items')
          var filter = new Filter({
            path: 'parent_key',
            operator: 'EQ',
            value1: this.designProjectID,
          })
          listBinding.filter(filter)

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
          }.bind(this),
        })
      },
      onEdit: function () {
        this.oView.getModel('ui').setProperty('/editMode', true)
      },
      onCancel: function () {
        this.oView.getModel('ui').setProperty('/editMode', false)
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
        this.oDetailsModel.update(
          this.sPath,
          {
            address: this.projectAddressInput.getValue(),
            prjdesc: this.projectDescInput.getValue(),
          },
          {
            error: function (err) {
              console.log(err)
            },
            success: function (err) {
              console.log(err)
            },
          }
        )
        this.basicProjectInfoTable.getItems().forEach(
          function (tableItem) {
            var sPath = tableItem.getBindingContextPath()
            var items = tableItem.getCells()
            this.oDetailsModel.update(
              sPath,
              {
                mainyt: items[2].getItems()[1].getValue(),
                bld_num: parseInt(items[3].getItems()[1].getValue()),
                cnsetl_area: items[4].getItems()[1].getValue(),
              },
              {
                error: function (err) {
                  console.log(err)
                },
                success: function (err) {
                  console.log(err)
                },
              }
            )
          }.bind(this)
        )
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
    })
  }
)
