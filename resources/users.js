// Users resource for adminTool select field
module.exports = {
  displayname: { enUS: 'Users' },
  schema: [
    {
      field: 'username',
      input: 'string',
      localised: false,
      required: true,
      unique: true
    },
    {
      field: 'email',
      input: 'email',
      localised: false,
      required: true,
      unique: true
    },
    {
      field: 'role',
      input: 'select',
      localised: false,
      options: {
        values: ['admin', 'editor', 'viewer']
      }
    }
  ],
  type: 'normal',
  locales: ['enUS', 'zhCN']
}
