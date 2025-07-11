exports = module.exports = {
  displayname: 'Image',
  schema: [
    {
      label: 'Caption',
      field: 'caption',
      input: 'string',
      required: false,
      localised: false
    },
     {
      label: 'Image',
      field: 'image',
      input: 'image',
      options: {
        hint: 'Recommended image size: 16:9',
        accept: '.jpg,.png',
        maxCount: 1
      },
      required: true
    },
  ],
  layout: {
    slots: 4
  }
}
