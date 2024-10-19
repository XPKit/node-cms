exports = module.exports = {
  group: '1. Show Suite',
  displayname: '1.1. Global Configuration',
  schema: [
    {
      field: 'rebootServer',
      input: 'checkbox',
      localised: false,
      label: 'Reboot Server'
    },
    {
      label: 'Controlled Menu Items',
      field: 'controlledMenuItems',
      input: 'paragraph',
      required: true,
      localised: false,
      options: {
        maxCount: 5,
        types: [
          'category_control_components'
        ]
      }
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal',
  maxCount: 1
}
