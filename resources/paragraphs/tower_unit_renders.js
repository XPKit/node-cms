exports = module.exports = {
  displayname: 'Render',
  schema: [
    {
      label: 'Image',
      field: 'image',
      localised: false,
      required: true,
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 1900 × 1702',
        accept: '.jpg',
        limit: 1 * 1024 * 1024, // 1 MB
        maxCount: 1
      }
    },
    {
      label: 'Fullscreen',
      field: 'fullscreen',
      localised: false,
      required: true,
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 3840 × 2160',
        accept: '.jpg',
        limit: 2 * 1024 * 1024, // 2 MB
        maxCount: 1
      }
    },
    {
      label: 'Show Disclaimer',
      field: 'showDisclaimer',
      localised: false,
      required: false,
      input: 'checkbox'
    }
  ]
}
