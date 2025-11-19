module.exports = {
  title: 'testAddMultipleFile',
  displayname: 'Test Add Multiple File',
  schema: [
    {
      field: 'file',
      label: 'File',
      input: 'file',
      required: true,
      localised: true,
      options: {
        accept: '.pdf,.docx',
        maxCount: 1
      }
    }
  ],
  layout: {
    slots: 4
  }
}
