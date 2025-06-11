exports = module.exports = {
  displayname: 'Image',
  schema: [
    {
      label: 'Image title',
      field: 'title',
      input: 'string',
      required: true
    },
    {
      label: 'Slots (Column Width)',
      field: 'slots',
      input: 'integer',
      localised: false,
      required: false,
      options: {
        min: 1,
        max: 12,
        hint: 'Leave empty for auto width, or set 1-12 for specific column slots in dynamic layouts'
      }
    },
    {
      label: 'Image 1',
      field: 'image1',
      input: 'image',
      options: {
        accept: '.jpg,.png',
        maxCount: 4
      },
      localised: true,
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
      localised: false,
      required: true
    }
  ]
}
