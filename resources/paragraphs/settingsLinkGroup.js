exports = (module.exports = {
  displayname: 'Link group',
  maxCount: 1,
  schema: [
    {
      label: 'Group title',
      field: 'title',
      localised: false,
      input: 'string',
      required: true
    },
    {
      field: 'links',
      input: 'paragraph',
      localised: false,
      options: {
        types: ['settingsLink']
      }
    }
  ]
})
