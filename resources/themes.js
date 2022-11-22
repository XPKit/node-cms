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
      localised: false,
      unique: true,
      required: true
    },
    {
      field: 'file',
      input: 'file'
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
  type: 'normal'
}
