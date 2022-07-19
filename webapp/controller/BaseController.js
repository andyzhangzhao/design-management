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
      selectionChange: function (oEvent) {
        var sPath = oEvent.getParameters().listItem.getBindingContextPath()
        this.itemDbKey = sPath.match(/guid'(.*)'\)/)[1]
        this.oView.getModel('ui').setProperty('/selectItemKey', this.itemDbKey)
      },
      addAttachmentComponent: function(objectType){
        var oAttachmentComponentPromise = this.getOwnerComponent().createComponent({ usage:"attachmentReuseComponent",
            settings: {
              mode: "C",
              objectKey: "{ui>/selectItemKey}",
              objectType: objectType,
              semanticObject: "",
              attributeHandling: {
                _VisibleActions: {
                    "RENAME": false,
                    "DELETE": true,
                    "ADD": true,
                    "ADDURL": false,
                    "DOWNLOAD": false
                }
            }
            }
			    }); 
          oAttachmentComponentPromise.then(function(successValue){ 
            this.byId('attachmentComponentContainer').setComponent(successValue); 
          }.bind(this));	
      }
    })
  }
)
