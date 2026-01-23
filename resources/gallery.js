exports = module.exports = {
  group: '2. Content',
  displayname: '2.4. Gallery',
  schema: [
    {
      unique: true,
      label: 'Unique Id',
      field: 'id',
      input: 'string',
      localised: false,
      required: true
    },
    {
      label: 'Title',
      field: 'title',
      input: 'string',
      localised: true,
      required: false
    },
    {
      label: 'Logo',
      field: 'kiosk.logo',
      input: 'select',
      source: [
        'no-logo',
        'upper-house-residences',
        'upper-house-residences-bangkok',
        'the-wireless-residences'
      ],
      localised: false,
      required: true
    },
    {
      label: 'Columns Quantities',
      field: 'grid.columnsQuantities',
      input: 'integer',
      localised: false,
      required: true
    },
    {
      label: 'Rows Quantities',
      field: 'grid.rowsQuantities',
      input: 'integer',
      localised: false,
      required: true
    },
    {
      label: 'Disclaimer',
      field: 'disclaimer',
      input: 'checkbox',
      required: false
    },
    {
      label: 'Items',
      field: 'galleryItems',
      input: 'paragraph',
      localised: false,
      options: {
        types: [
          'gallery_item_images',
          'gallery_item_videos'
        ]
      }
    }
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal'
}
