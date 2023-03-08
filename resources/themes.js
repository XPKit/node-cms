module.exports = {
  displayname: {
    enUS: 'Themes',
    zhCN: '主题'
  },
  group: {
    enUS: 'DB features',
    zhCN: 'DB features'
  },
  public: true,
  activeField: 'enable',
  schema: [
    {
      label: 'Name',
      field: 'name',
      input: 'string',
      localised: true,
      unique: true,
      required: true
    },
    {
      label: 'Not localized',
      field: 'notLocalized',
      input: 'string',
      localised: false,
      required: true
    },
    {
      field: 'file',
      input: 'file',
      localised: true,
      options: {
        maxCount: 1
      }
    },
    {
      label: 'Enable',
      field: 'enable',
      input: 'checkbox',
      options: {
        textOn: 'Enable',
        textOff: 'Disable'
      },
      localised: false,
      required: true
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
}
