describe('test', () => {
  it('ddd', async () => {
    const createProjectButton = await browser.asControl({
      forceSelect: true,
      selector: {
        id: 'createProject',
        controlType: 'sap.m.Button',
        viewName: 'projectmanagement.view.ProjectList',
      },
    })

    const $createProjectButton = await createProjectButton.getWebElement()
    await $createProjectButton.click()

    const controlInfo = createProjectButton.getControlInfo()
    console.log(createProjectButton.getText())
    expect(controlInfo.className).toEqual('sap.m.Button')
  })
})
