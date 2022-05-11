sap.ui.define(
    ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", 'sap/ui/model/Filter'],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Filter) {
        "use strict";

        return Controller.extend("projectmanagement.controller.QualityManagement", {
            onInit: function () {
                this.qualityManagementTable = this.byId('qualityManagementTable')

                this.oView = this.getView()
                this.oView.setModel(new JSONModel({}), 'ui')


                this.oRouter = this.getOwnerComponent().getRouter();
                this.oRouter.getRoute("projectDetails").attachPatternMatched(this._onObjectMatched, this);

            },

            _onObjectMatched: function (oEvent) {
                this.projectID = oEvent.getParameter("arguments").projectID;
                this.section = oEvent.getParameter("arguments").section;
                if (this.section === 'F') {
                    var listBinding = this.qualityManagementTable.getBinding('items')
                    var filter = new Filter({
                        path: "parent_key",
                        operator: "EQ",
                        value1: this.projectID,
                    })
                    listBinding.filter(filter)

                }

            },
            tableUpdateFinished: function (oEvent) {
                this.oView.getModel("ui").setProperty("/qualityManagementCount", oEvent.getParameter("total"));
            },
        });
    }
);