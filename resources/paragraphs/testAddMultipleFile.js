module.exports = {
  title: 'testAddMultipleFile',
  displayname: 'Test Add Multiple File',
  schema: [
    {
      field: 'title',
      label: 'Title',
      input: 'string',
      required: true
    },
    {
      field: 'file',
      label: 'File',
      input: 'file',
      required: true,
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
