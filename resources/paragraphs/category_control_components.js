exports = module.exports = {
  displayname: 'Category - Control Components',
  schema: [
    {
      label: 'Name',
      field: 'name',
      input: 'string',
      localised: true,
      required: true
    },
    {
      label: 'Label: On',
      field: 'on',
      input: 'string',
      localised: true,
      required: false
    },
    {
      label: 'Label: Off',
      field: 'off',
      input: 'string',
      localised: true,
      required: false
    },
    {
      label: 'Controlled Items',
      field: 'items',
      input: 'multiselect',
      source: 'controlledComponents',
      options: {
        customLabel: '{{id}}'
      },
      localised: false,
      required: true
    }
  ]
}
