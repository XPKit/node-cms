exports = module.exports = {
  displayname: 'Report Items',
  schema: [
    {
      label: 'Item Name',
      field: 'name',
      input: 'string',
      localised: true,
      required: true
    },
    {
      label: 'Item Value',
      field: 'value',
      input: 'string',
      localised: false,
      required: true
    },
    {
      label: 'Slots (Column Width)',
      field: 'slots',
      input: 'integer',
      localised: false,
      required: true,
      options: {
        min: 1,
        max: 12
      }
    },
    {
      label: 'Item Type',
      field: 'type',
      input: 'select',
      source: ['text', 'number', 'date', 'image'],
      localised: false,
      required: true
    }
  ]
}
