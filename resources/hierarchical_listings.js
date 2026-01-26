module.exports = {
  group: '2. Content',
  displayname: '2.5. Hierarchical Listings',
  schema: [
    {
      label: 'Unique Id',
      field: 'id',
      input: 'string',
      unique: true,
      localised: false,
      required: true,
    },
    {
      label: 'Title',
      field: 'title',
      input: 'string',
      localised: true,
      required: true,
    },
    {
      label: 'Logo',
      field: 'kiosk.logo',
      input: 'select',
      source: ['no-logo', 'upper-house-residences', 'upper-house-residences-bangkok', 'the-wireless-residences'],
      localised: false,
      required: true,
    },
    {
      label: 'Slides',
      field: 'slides',
      input: 'paragraph',
      options: {
        types: ['hierarchical_slide_listing', 'hierarchical_slide_grid'],
      },
      localised: false,
    },
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal',
}
