module.exports = {
  displayname: 'Section',
  schema: [
    {
      label: 'Title',
      field: 'title',
      input: 'string',
      localised: true,
      required: true,
    },
    {
      label: 'Items',
      field: 'items',
      input: 'paragraph',
      options: {
        types: ['hierarchical_items'],
      },
      localised: false,
      required: true,
    },
  ],
}
