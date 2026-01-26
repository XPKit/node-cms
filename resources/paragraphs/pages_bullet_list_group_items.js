module.exports = {
  displayname: 'Group Bullet Item',
  schema: [
    {
      label: 'Group Title',
      field: 'groupTitle',
      input: 'string',
      localised: true,
      required: true,
    },
    {
      label: 'Items',
      field: 'items',
      input: 'paragraph',
      options: {
        types: ['pages_bullet_list_items'],
      },
      localised: false,
      required: false,
    },
  ],
}
