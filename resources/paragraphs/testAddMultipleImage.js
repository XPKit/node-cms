module.exports = {
  title: 'testAddMultipleImage',
  displayname: 'Test Add Multiple Image',
  schema: [
    {
      field: 'image',
      label: 'Image',
      input: 'image',
      localised: false,
      required: true,
      options: {
        accept: '.jpg,.png',
        maxCount: 1,
      },
    },
  ],
  layout: {
    slots: 4,
  },
}
