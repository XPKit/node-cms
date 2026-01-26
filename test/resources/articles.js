module.exports = {
  displayname: {
    enUS: 'My articles',
    zhCN: '我的文章',
  },
  group: {
    enUS: 'abc',
    zhCN: '甲乙丙',
  },
  schema: [
    {
      label: {
        enUS: 'Title',
        zhCN: '标题',
      },
      field: 'string',
      input: 'string',
      required: true,
      unique: true,
      localised: true,
    },
    {
      field: 'rate',
      input: 'number',
      localised: false,
    },
    // ... (other fields omitted for brevity, same as normal)
  ],
  type: 'downstream',
  locales: ['enUS', 'zhCN'],
}
