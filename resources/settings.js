exports = (module.exports = {
  displayname: '09. Settings', // Optional, by default filename
  group: 'standards',
  maxCount: 1, // Optional, be default is unlimited
  schema: [
    {
      field: 'string',
      input: 'string',
      required: true,
      options: {
        regex: {
          value: /^\d{3}$/g,
          description: 'It needs to be 3 digits'
        }
      }
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
})
