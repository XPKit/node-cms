module.exports = {
  group: '2. Content',
  displayname: '2.6. Translations',
  schema: [
    {
      label: 'Key',
      field: 'key',
      input: 'string',
      unique: true,
      required: true,
      localised: false,
    },
    {
      label: 'Value',
      field: 'value',
      input: 'text',
      required: true,
      localised: true,
    },
  ],
  locales: ['enUS', 'zhCN'],
}
