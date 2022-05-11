sap.ui.define(
    ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", 'sap/ui/model/Filter'],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Filter) {
        "use strict";

        return Controller.extend("projectmanagement.controller.BasicProjectInfo", {
            onInit: function () {
                this.basicProjectInfoTable = this.byId('basicProjectInfoTable')

                this.oView = this.getView()
                this.oView.setModel(new JSONModel({ editMode: false }), 'ui')


                this.oRouter = this.getOwnerComponent().getRouter();
                this.oRouter.getRoute("projectDetails").attachPatternMatched(this._onObjectMatched, this);

                this.oDetailsModel = this.getOwnerComponent().getModel('details');
            },

            _onObjectMatched: function (oEvent) {
                this.projectID = oEvent.getParameter("arguments").projectID;
                this.section = oEvent.getParameter("arguments").section;
                if (this.section === 'A') {
                    this.oDetailsModel.read("/ZRRE_C_DMBC", {
                        filters: [
                            new Filter({
                                path: 'parent_key',
                                operator: 'EQ',
                                value1: this.projectID
                            })
                        ],
                        success: function (response) {
                            this.oView.getModel('ui').setProperty('/projectBasicInfo', response.results[0])
                            var listBinding = this.basicProjectInfoTable.getBinding('items')
                            var filter = new Filter({
                                path: "parent_key",
                                operator: "EQ",
                                value1: response.results[0].db_key,
                            })
                            listBinding.filter(filter)
                        }.bind(this)
                    })
                }

            },
            onEdit: function () {
                this.oView.getModel('ui').setProperty('/editMode', true)
            },
            onCancel: function () {
                this.oView.getModel('ui').setProperty('/editMode', false)
            },
            tableUpdateFinished: function (oEvent) {
                this.oView.getModel("ui").setProperty("/basicProjectInfoCount", oEvent.getParameter("total"));
            },

        });
    }
);
