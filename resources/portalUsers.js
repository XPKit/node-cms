exports = module.exports = {
  group: '1. BKK109',
  displayname: '1.3. Portal Users',
  schema: [
    {
      label: 'Username',
      field: 'username',
      input: 'string',
      required: true,
      localised: false,
      index: 1
    },
    {
      label: 'Password',
      field: 'password',
      localised: false,
      input: 'password'
    },
    // {
    //   label: 'Email',
    //   field: 'email',
    //   localised: false,
    //   required: false,
    //   input: 'string'
    // },
    {
      label: 'Default Locale',
      field: 'defaultLocale',
      input: 'select',
      localised: false,
      source: ['enUS', 'zhCN']
    },
    {
      field: 'isAdmin',
      input: 'checkbox',
      localised: false
    }
  ],
  type: 'normal'
}
