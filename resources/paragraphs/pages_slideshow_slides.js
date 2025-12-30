exports = module.exports = {
  displayname: 'Slide',
  schema: [
    {
      label: 'Image',
      field: 'image',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 1516 × 1672',
        accept: '.jpg,.png'
      },
      localised: true,
      required: true
    },
    {
      label: 'Fullscreen',
      field: 'fullscreen',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 2528 × 2160',
        accept: '.jpg,.png',
        maxCount: 1
      },
      localised: true,
      required: true
    },
    {
      label: 'Disclaimer',
      field: 'disclaimer',
      input: 'checkbox',
      required: false
    }
  ]
}
