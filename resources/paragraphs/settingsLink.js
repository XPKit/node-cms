exports = (module.exports = {
  displayname: 'Settings link',
  maxCount: 1,
  schema: [
    {
      field: 'name',
      localised: false,
      input: 'string',
      required: true
    },
    {
      field: 'url',
      localised: false,
      input: 'url',
      required: true
    }
  ]
})
