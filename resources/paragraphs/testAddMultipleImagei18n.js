module.exports = {
  title: 'testAddMultipleImagei18n',
  displayname: 'Test Add Multiple Image',
  schema: [
    {
      field: 'image',
      label: 'Image',
      input: 'image',
      localised: true,
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
