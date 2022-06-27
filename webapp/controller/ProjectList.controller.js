sap.ui.define(
  [
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/Sorter',
    'sap/ui/core/BusyIndicator',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (
    Controller,
    JSONModel,
    Fragment,
    Filter,
    Sorter,
    BusyIndicator,
    MessageToast,
    MessageBox
  ) {
    'use strict'

    return Controller.extend('projectmanagement.controller.ProjectList', {
      onInit: function () {
        this.oView = this.getView()
        this.oRouter = this.getOwnerComponent().getRouter()

        this.projectTable = this.byId('projectTable')
        this.oProjectListModel = this.getOwnerComponent().getModel()
        this.oDetailsModel = this.getOwnerComponent().getModel('details')

        this.getYtMajorMapping()

        this.oView.setModel(new JSONModel({}), 'ui')
      },
      selectYT: function (oEvent) {
        var projectInfo = this.oView
          .getModel('ui')
          .getProperty('/projectPopup/projectInfo')
        projectInfo.forEach((item) => {
          item.major.forEach((majorItem) => {
            majorItem.enabled = !!item.yt.selected
          })
        })
        this.oView
          .getModel('ui')
          .setProperty('/projectPopup/projectInfo', projectInfo)
      },
      getYtMajorMapping: function () {
        this.oDetailsModel.read('/ZRRE_i_DWCC', {
          success: function (response) {
            var ytText = {}
            var ytObject = {}
            var aProjectInfo = []
            response.results.forEach(function (item) {
              ytText[item.Ytid] = item.ytdesc
              if (!ytObject[item.Ytid]) {
                ytObject[item.Ytid] = [
                  { majorId: item.Majorid, majorDesc: item.Majordesc },
                ]
              } else {
                ytObject[item.Ytid].push({
                  majorId: item.Majorid,
                  majorDesc: item.Majordesc,
                })
              }
            })
            for (var property in ytObject) {
              aProjectInfo.push({
                yt: { ytId: property, ytDesc: ytText[property] },
                major: ytObject[property],
              })
            }
            this.aProjectInfo = aProjectInfo
          }.bind(this),
        })
      },
      toDetail: function (oEvent) {
        this.oRouter.navTo('projectDetails', {
          devProjectID: oEvent
            .getSource()
            .getBindingContext()
            .getObject('Itmnr'),
          designProjectID: oEvent
            .getSource()
            .getBindingContext()
            .getObject('DbKey'),
          section: 'A',
        })
      },
      cleanProjectInfo: function () {
        this.aProjectInfo.forEach(function (ytItem) {
          ytItem.major.forEach(function (majorItem) {
            majorItem.selected = false
          })
        })
      },
      onCreateRootProject: function () {
        this.cleanProjectInfo()
        this.oView.getModel('ui').setProperty('/projectPopup', {
          projectInfo: this.aProjectInfo,
          title: '创建项目',
          projectDescEnabled: true,
          relatedProjectSelectEnabled: true,
        })
        this.openProjectPopup()
      },
      onCreateChildProject: function (oEvent) {
        this.cleanProjectInfo()
        var oObject = oEvent.getSource().getBindingContext().getObject()
        this.oView.getModel('ui').setProperty('/projectPopup', {
          projectInfo: this.aProjectInfo,
          title: '创建子项目',
          relatedProjectId: oObject.Itmnr,
          relatedDevProjectId: oObject.prjnr,
          parentDspid: oObject.DbKey,
        })
        this.openProjectPopup()
      },
      onEditProject: function (oEvent) {
        this.cleanProjectInfo()
        var oObject = oEvent.getSource().getBindingContext().getObject()
        this.oProjectListModel.read('/zrre_c_dmcp', {
          filters: [
            new Filter({
              path: 'DbKey',
              operator: 'EQ',
              value1: oObject.DbKey,
            }),
          ],
          success: function (response) {
            var existProjectInfo = {}
            response.results.forEach(function (item) {
              if (existProjectInfo[item.Ytid]) {
                existProjectInfo[item.Ytid].push(item.Majorid)
              } else {
                existProjectInfo[item.Ytid] = [item.Majorid]
              }
            })
            this.aProjectInfo.forEach(function (item) {
              if (existProjectInfo[item.yt.ytId]) {
                item.yt.selected = true
                item.major.forEach(function (majorItem) {
                  majorItem.enabled = true
                  if (
                    existProjectInfo[item.yt.ytId].includes(majorItem.majorId)
                  ) {
                    majorItem.selected = true
                  }
                })
              }
            })
            this.oView.getModel('ui').setProperty('/projectPopup', {
              projectInfo: this.aProjectInfo,
              title: '编辑项目',
              projectDesc: oObject.Dspnm,
              relatedProjectId: oObject.Itmnr,
              relatedDevProjectId: oObject.prjnr,
              dspid: oObject.DbKey,
            })
            this.openProjectPopup()
          }.bind(this),
        })
      },
      openProjectPopup: function () {
        if (!this._projectPopup) {
          this._projectPopup = Fragment.load({
            name: 'projectmanagement.view.ProjectPopup',
            controller: this,
          }).then(
            function (oProjectPopup) {
              this.oView.addDependent(oProjectPopup)
              return oProjectPopup
            }.bind(this)
          )
        }

        this._projectPopup.then(
          function (oProjectPopup) {
            var relatedDevProjectId = this.oView
              .getModel('ui')
              .getProperty('/projectPopup/relatedDevProjectId')

            var relatedProjectSelect = this.getControlById(
              'relatedProjectSelect'
            )
            var listBinding = relatedProjectSelect.getBinding('items')
            var filter = new Filter({
              path: 'prjnr',
              operator: 'EQ',
              value1: relatedDevProjectId,
            })
            if (relatedDevProjectId) {
              listBinding.filter(filter)
            } else {
              listBinding.filter()
            }
            oProjectPopup.open()
          }.bind(this)
        )
      },
      getControlById: function (id) {
        return sap.ui.getCore().byId(id)
      },
      validateProjectDesc: function () {
        var projectDescInput = this.getControlById('projectDescInput')
        if (projectDescInput.getValue()) {
          projectDescInput.setValueState('None')
        } else {
          projectDescInput.setValueState('Error')
        }
      },
      validateRelatedProject: function () {
        var projectDescInput = this.getControlById('relatedProjectSelect')
        if (projectDescInput.getSelectedKey()) {
          projectDescInput.setValueState('None')
        } else {
          projectDescInput.setValueState('Error')
        }
      },
      validation: function () {
        this.validateProjectDesc()
        this.validateRelatedProject()
        var oProjectData = this.oView
          .getModel('ui')
          .getProperty('/projectPopup')
        var majorCheckedFlag = true
        if (!oProjectData.dspid) {
          majorCheckedFlag = false
          oProjectData.projectInfo.forEach(function (ytItem) {
            if (ytItem.yt.selected) {
              ytItem.major.forEach(function (majorItem) {
                if (majorItem.selected) {
                  majorCheckedFlag = true
                }
              })
            }
          })
          if (!majorCheckedFlag) {
            MessageBox.error('创建项目至少需要一个专业')
          }
        }

        if (
          majorCheckedFlag &&
          oProjectData.projectDesc &&
          oProjectData.relatedProjectId
        ) {
          return true
        } else {
          return false
        }
      },
      formatStatus: function (text) {
        if (text === '已完成') {
          return 'Success'
        } else if (text === '进行中') {
          return 'Warning'
        }
      },
      onCancel: function (oEvent) {
        oEvent.getSource().getParent().close()
      },
      onSave: function (oEvent) {
        var oDialog = oEvent.getSource().getParent()
        if (this.validation()) {
          var oProjectData = this.oView
            .getModel('ui')
            .getProperty('/projectPopup')
          var submitData = { YTMJ: [] }
          submitData.DSPNM = oProjectData.projectDesc
          submitData.ITMNR = oProjectData.relatedProjectId
          submitData.DSPID = oProjectData.dspid
          submitData.DSPID_P = oProjectData.parentDspid
          oProjectData.projectInfo.forEach(function (ytItem) {
            if (ytItem.yt.selected) {
              var majorInfo = []
              ytItem.major.forEach(function (majorItem) {
                if (majorItem.selected) {
                  majorInfo.push(majorItem.majorId)
                }
              })
              if (majorInfo.length > 0) {
                submitData.YTMJ.push({ YTID: ytItem.yt.ytId, MJID: majorInfo })
              }
            }
          })
          BusyIndicator.show(0)
          jQuery.ajax({
            method: 'POST',
            url: '/sap/zrre_rest_dmcp',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(submitData),
            success: function (response) {
              oDialog.close()
              MessageToast.show(response.MSGTXT)
              this.oProjectListModel.refresh()
            }.bind(this),
            error: function (err) {
              MessageBox.error(err.responseJSON.MSGTXT)
            },
            complete: function () {
              BusyIndicator.hide()
            },
          })
        }
      },
    })
  }
)
