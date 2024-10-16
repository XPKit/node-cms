exports = module.exports = {
  displayname: 'Image',
  schema: [

    {
      label: 'Image 1',
      field: 'image1',
      input: 'image',
      options: {
        accept: '.jpg,.png',
        maxCount: 1
      },
      localised: false,
      required: true
    },
    {
      label: 'Image 2',
      field: 'image2',
      input: 'image',
      options: {
        accept: '.jpg,.png',
        maxCount: 1
      },
      localised: true,
      required: true
    }
  ]
}
