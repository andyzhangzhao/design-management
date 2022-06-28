sap.ui.define(
  [
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/Filter',
    'sap/m/MessageToast',
    'sap/m/Dialog',
    'sap/m/Button',
    'sap/m/Text',
  ],
  function (Controller, Filter, MessageToast, Dialog, Button, Text) {
    'use strict'

    return Controller.extend('projectmanagement.controller.BaseController', {
      validateSelect: function (oEvent) {
        oEvent.getSource().setValueState('None')
      },
      validateInput: function (oEvent) {
        if (oEvent.getParameter('newValue')) {
          oEvent.getSource().setValueState('None')
        } else {
          oEvent.getSource().setValueState('Error')
        }
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
      getUploadFileToken: function () {
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
              function (item) {
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
              }.bind(this)
            )
            this.oView.getModel('ui').setProperty('/files', response.d.results)
          }.bind(this),
        })
      },
      getFileSize: function (size) {
        if (Math.floor(size / 1024) < 1) {
          return size + ' B'
        } else if (Math.floor(size / 1024 / 1024) < 1) {
          return Math.floor(size / 1024) + ' KB'
        } else {
          return Math.floor(size / 1024 / 1024) + ' MB'
        }
      },
      beforeItemAdded: function (oEvent) {
        var uploadSet = oEvent.getSource()
        uploadSet.setBusy(true)
        var file = oEvent.getParameter('item').getFileObject()
        var reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = function (fileEvent) {
          jQuery.ajax({
            url: '/sap/opu/odata/SAP/API_CV_ATTACHMENT_SRV/AttachmentContentSet',
            method: 'POST',
            data: fileEvent.target.result,
            headers: {
              BusinessObjectTypeName: this.businessObjectTypeName,
              LinkedSAPObjectKey: this.itemDbKey,
              'Content-Type': file.type,
              'X-CSRF-Token': this.token,
              Slug: encodeURIComponent(file.name),
            },
            success: function () {
              MessageToast.show(file.name + '文件上传成功')
              this.getAllFiles()
              uploadSet.setBusy(false)
            }.bind(this),
            error: function (oEvent) {
              console.log(oEvent)
            },
          })
        }.bind(this)
        oEvent.preventDefault()
      },
      getUrl: function (original, mode) {
        var url =
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
        if (mode === 'download') {
          url += '/$value'
        }
        return url
      },
      openPressed: function (oEvent) {
        var original = oEvent.getParameter('item').data()
        var downloadUrl = this.getUrl(original, 'download')

        jQuery.ajax({
          url: downloadUrl,
          success: function (res) {
            const linkSource = res
            const downloadLink = document.createElement('a')
            downloadLink.href = linkSource
            downloadLink.download = original.FileName
            downloadLink.click()
          }.bind(this),
        })
        oEvent.preventDefault()
      },
      removePressed: function (oEvent) {
        oEvent.preventDefault()
        var original = oEvent.getParameter('item').data()

        var oDailog = new Dialog({
          title: '删除文件',
          content: new Text({
            text: '确定要删除文件' + original.FileName + '吗？',
          }).addStyleClass('sapUiSmallMargin'),
          beginButton: new Button({
            text: '确定',
            type: 'Emphasized',
            press: function () {
              var deleteUrl = this.getUrl(original)
              jQuery.ajax({
                url: deleteUrl,
                method: 'DELETE',
                headers: {
                  'X-CSRF-Token': this.token,
                },
                success: function () {
                  oDailog.close()
                  MessageToast.show(original.FileName + '文件删除成功')
                  this.getAllFiles()
                }.bind(this),
              })
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
      selectionChange: function (oEvent) {
        var sPath = oEvent.getParameters().listItem.getBindingContextPath()
        this.itemDbKey = sPath.match(/guid'(.*)'\)/)[1]
        this.getAllFiles()
      },
    })
  }
)
