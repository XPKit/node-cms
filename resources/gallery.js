exports = module.exports = {
  displayname: '2.10. Gallery [7A; 7B; 7C]',
  group: {
    enUS: 'TEST IMPORT'
  },
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
      label: 'Subtitle',
      field: 'subtitle',
      input: 'string',
      localised: true,
      required: false
    },
    {
      label: 'Items',
      field: 'galleryItems',
      input: 'paragraph',
      localised: false,
      options: {
        types: [
          'gallery_item'
        ]
      }
    }
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal'
}
