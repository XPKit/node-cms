exports = module.exports = {
  displayname: 'Controlled Components',
  group: 'Show Suite',
  groups: {
    oscMessage: {
      label: 'OSC Messages'
    }
  },
  schema: [
    {
      label: 'Unique Id',
      field: 'id',
      input: 'string',
      unique: true,
      required: true
    },
    {
      label: 'Description',
      field: 'description',
      input: 'string'
    },
    {
      label: 'Category',
      field: 'category',
      input: 'select',
      source: [
        'covers',
        'curtains',
        'doors',
        'kinetic',
        'led',
        'lights',
        'projectionScreens',
        'table'
      ]
    },
    {
      label: 'On',
      field: 'oscMessages.on',
      input: 'pillbox'
    },
    {
      label: 'Off',
      field: 'oscMessages.off',
      input: 'string'
    }
  ],
  type: 'normal'
}
