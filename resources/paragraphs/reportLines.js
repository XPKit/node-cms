exports = module.exports = {
  displayname: 'Report Lines',
  schema: [
    {
      label: 'Line Title',
      field: 'title',
      input: 'string',
      localised: true,
      required: true
    },
    {
      label: 'Number of Slots',
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
      label: 'Report Items',
      field: 'reportItems',
      input: 'paragraph',
      options: {
        types: ['reportItems'],
        maxCount: 12
      },
      localised: false
    }
  ]
}
