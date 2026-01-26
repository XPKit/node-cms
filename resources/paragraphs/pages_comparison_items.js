module.exports = {
  displayname: 'Comparison Item',
  schema: [
    {
      label: 'Item A',
      field: 'itemA',
      input: 'text',
      localised: true,
      required: true,
      options: {
        hint: 'Maximum 2 lines',
      },
    },
    {
      label: 'Item B',
      field: 'itemB',
      input: 'text',
      localised: true,
      required: true,
      options: {
        hint: 'Maximum 2 lines',
      },
    },
  ],
}
