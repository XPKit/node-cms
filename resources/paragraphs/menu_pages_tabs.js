exports = module.exports = {
  displayname: 'Menu - Page Tabs',
  schema: [
    {
      label: 'Key',
      field: 'key',
      input: 'string',
      localised: false,
      required: true
    },
    {
      label: 'Name',
      field: 'name',
      input: 'string',
      localised: true,
      required: false
    },
    {
      label: 'Is Button Squared?',
      field: 'isButtonSquared',
      input: 'checkbox',
      localised: false,
      required: false
    },
    {
      label: 'Pages',
      field: 'pages',
      input: 'paragraph',
      options: {
        types: [
          'menu_pages'
        ]
      },
      localised: false
    }
  ]
}
