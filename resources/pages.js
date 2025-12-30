exports = module.exports = {
  group: '2. Content',
  displayname: '2.2. Pages',
  schema: [
    {
      label: 'Unique Id',
      field: 'id',
      input: 'string',
      unique: true,
      localised: false,
      required: true
    },
    {
      label: 'Title',
      field: 'title',
      input: 'string',
      localised: true
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
      label: 'Content',
      field: 'content',
      input: 'paragraph',
      options: {
        types: [
          'pages_1_col_bullet_list_with_image',
          'pages_1_col_text_with_image',
          'pages_2_col_bullet_list_with_images',
          'pages_comparison',
          'pages_full_width_text'
        ],
        maxCount: 1
      },
      localised: false
    }
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal'
}
