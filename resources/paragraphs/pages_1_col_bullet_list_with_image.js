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
        accept: '.jpg',
        limit: 1 * 1024 * 1024, // 1 MB
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
        hint: 'Recommended canvas size: 2836 × 2160',
        accept: '.jpg',
        limit: 2 * 1024 * 1024, // 2 MB
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
