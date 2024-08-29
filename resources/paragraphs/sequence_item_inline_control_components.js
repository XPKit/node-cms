exports = module.exports = {
  schema: [
    {
      label: 'Controlled Items',
      field: 'items',
      input: 'multiselect',
      source: 'controlledComponents',
      required: true
    },
    {
      label: 'Reset CTA',
      field: 'resetCTA',
      input: 'string',
      localised: true,
      required: true
    },
    {
      field: 'oscMessage',
      input: 'string',
      localised: false,
      required: true
    }
  ]
}
