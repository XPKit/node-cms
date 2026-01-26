module.exports = {
  displayname: 'Image',
  schema: [
    {
      label: 'Overlay Titles',
      field: 'overlayTitles',
      input: 'paragraph',
      options: {
        types: [
          'overlay_titles'
        ]
      },
      localised: false,
      required: false
    },
    {
      label: 'Image',
      field: 'image',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 2572 × 1672',
        accept: '.jpg',
        limit: 1 * 1024 * 1024, // 1 MB
        maxCount: 1
      },
      localised: true,
      required: true
    },
    {
      label: 'Zoomable',
      field: 'zoomable',
      input: 'checkbox',
      localised: false,
      required: false
    },
    {
      label: 'Disclaimer',
      field: 'disclaimer',
      input: 'checkbox',
      required: false
    },
    {
      label: 'Fullscreen',
      field: 'fullscreen',
      input: 'file',
      options: {
        hint: 'Recommended canvas size: 3840 × 2160',
        accept: '.jpg',
        limit: 2 * 1024 * 1024, // 2 MB
        maxCount: 1
      },
      localised: true,
      required: true
    }
  ]
}
