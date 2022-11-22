module.exports = {
  displayname: 'Uniques',
  group: 'A Content',
  maxCount: 7,
  schema: [
    {
      label: 'Title',
      field: 'title',
      input: 'string',
      localised: false,
      required: true,
      unique: true
    },
    {
      label: 'Title2',
      field: 'title2',
      input: 'string',
      localised: true,
      required: false,
      unique: true
    }
  ],
  type: 'normal',
  locales: ['enUS',
    'zhCN']
}
