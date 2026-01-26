module.exports = {
  displayname: '2 Columns - Bullet List + Images',
  schema: [
    {
      label: 'Items',
      field: 'items',
      input: 'paragraph',
      options: {
        types: ['pages_bullet_list_group_items'],
      },
      localised: false,
      required: false,
    },
    {
      label: 'Slideshow',
      field: 'slideshow',
      input: 'paragraph',
      options: {
        types: ['pages_slideshow_slides'],
      },
      localised: false,
      required: false,
    },
  ],
}
