exports = module.exports = {
  displayname: '1 Column - Bullet List + Image',
  schema: [
    {
      label: 'Items',
      field: 'items',
      input: 'paragraph',
      options: {
        types: ['pages_bullet_list_items']
      },
      localised: false,
      required: false
    },
    {
      label: 'Image',
      field: 'image',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 1816 × 1672',
        accept: '.jpg,.png',
        maxCount: 1
      },
      localised: true,
      required: true
    },
    {
      label: 'Fullscreen',
      field: 'fullscreen',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 2835 × 2160',
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
