module.exports = {
  displayname: 'Notes',
  group: {
    enUS: 'abc'
  },
  schema: [
    {
      label: 'Key',
      field: 'key',
      input: 'string',
      localised: false,
      unique: true
    },
    {
      label: 'Body',
      field: 'body',
      input: 'wysiwyg',
      localised: false
    }
  ],
  locales: ['enUS'],
  type: 'downstream'
}
