sap.ui.define(
  ['sap/m/MessageBox', 'sap/m/MessageToast'],
  function (MessageBox, MessageToast) {
    'use strict'
    var Utils = {
      removeMessages: function () {
        sap.ui.getCore().getMessageManager().removeAllMessages()
      },
      popMessage: function () {
        var messages = sap.ui
          .getCore()
          .getMessageManager()
          .getMessageModel()
          .getData()
        if (messages.length > 0) {
          if (messages[0].getType() === 'Success') {
            MessageToast.show(messages[0].getMessage())
          } else {
            MessageBox.error(messages[0].getMessage())
          }
        }
      },
    }

    return Utils
  }
)
