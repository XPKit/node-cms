module.exports = {
  group: '1. BKK109',
  displayname: '1.8. Tokens',
  schema: [
    {
      label: 'User',
      field: 'user',
      localised: false,
      input: 'string',
    },
    {
      label: 'From',
      field: 'from',
      localised: false,
      input: 'string',
    },
    {
      label: 'JWT',
      field: 'jwt',
      localised: false,
      input: 'string',
    },
    {
      label: 'Expire At',
      field: 'expiredAt',
      localised: false,
      input: 'datetime',
      options: {
        readonly: true,
        disabled: true,
      },
    },
    {
      label: 'Content',
      field: 'content',
      localised: false,
      input: 'json',
    },
  ],
  type: 'normal',
}
