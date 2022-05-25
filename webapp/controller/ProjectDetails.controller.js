sap.ui.define(
  [
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, JSONModel, Filter) {
    'use strict'

    return Controller.extend('projectmanagement.controller.ProjectDetails', {
      onInit: function () {
        this.sideNavigation = this.byId('sideNavigation')
        this.pageContainer = this.byId('pageContainer')

        this.oView = this.getView()
        this.oRouter = this.getOwnerComponent().getRouter()
        this.oRouter
          .getRoute('projectDetails')
          .attachPatternMatched(this._onObjectMatched, this)

        this.oProjectListModel = this.getOwnerComponent().getModel()
        this.oDetailsItemsModel =
          this.getOwnerComponent().getModel('detailsItems')
        this.oDetailsItemsModel.read('/zrre_c_dcmss', {
          success: function (response) {
            var aItems = []
            response.results.forEach(function (item) {
              if (item.Sid.length === 1) {
                aItems.push({ title: item.Sname, key: item.Sid })
              } else {
                if (aItems[aItems.length - 1].items) {
                  aItems[aItems.length - 1].items.push({
                    title: item.Sname,
                    key: item.Sid,
                  })
                } else {
                  aItems[aItems.length - 1].items = [
                    { title: item.Sname, key: item.Sid },
                  ]
                }
              }
            })
            this.oView.setModel(new JSONModel({ items: aItems }), 'ui')
            if (this.section) {
              this.sideNavigation.setSelectedKey(this.section)
              this.pageContainer.to(this.oView.createId(this.section))
            }
          }.bind(this),
        })
      },
      _onObjectMatched: function (oEvent) {
        this.designProjectID = oEvent.getParameter('arguments').designProjectID
        this.devProjectID = oEvent.getParameter('arguments').devProjectID
        this.section = oEvent.getParameter('arguments').section
        this.oProjectListModel.read('/zrre_c_dmcp', {
          filters: [
            new Filter({
              path: 'DbKey',
              operator: 'EQ',
              value1: this.designProjectID,
            }),
          ],
          success: function (response) {
            this.oView
              .getModel('ui')
              .setProperty('/projectTitle', response.results[0].Dspnm)
          }.bind(this),
        })
        if (this.sideNavigation.getItem().getItems().length > 0) {
          this.sideNavigation.setSelectedKey(this.section)
          this.pageContainer.to(this.oView.createId(this.section))
        }
      },

      onItemSelect: function (oEvent) {
        var oItem = oEvent.getParameter('item')
        var pageKey = oItem.getKey()
        this.byId('pageContainer').to(this.getView().createId(pageKey))
        var navObject = {
          devProjectID: this.devProjectID,
          designProjectID: this.designProjectID,
          section: pageKey,
        }
        switch (pageKey) {
          case 'C1':
            navObject.filter = '10'
            break
          case 'C2':
            navObject.filter = '20'
            break
          case 'C3':
            navObject.filter = '30'
            break
          case 'C4':
            navObject.filter = '40'
            break
          default:
            break
        }
        this.oRouter.navTo('projectDetails', navObject)
      },
      onNavBack: function () {
        this.oRouter.navTo('projectList')
      },
    })
  }
)
