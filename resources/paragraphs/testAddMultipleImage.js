module.exports = {
  title: 'testAddMultipleImage',
  displayname: 'Test Add Multiple Image',
  schema: [
    {
      field: 'title',
      label: 'Title',
      input: 'string',
      required: true
    },
    {
      field: 'image',
      label: 'Image',
      input: 'image',
      required: true,
      options: {
        accept: '.jpg,.png',
        maxCount: 1
      }
    }
  ],
  layout: {
    slots: 4
  }
}
