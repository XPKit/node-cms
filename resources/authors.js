exports = (module.exports = {
  displayname: 'Authors', // Optional, by default filename
  group: {
    enUS: 'abc',
    zhCN: '甲乙丙'
  },
  // TODO: hugo - when having extraSources, parse the "displayItem" field to ask backend only for the needed fields
  extraSources: {
    'article': 'articles'
  },
  locales: [
    'enUS',
    'zhCN'
  ],
  displayItem: '{{name}} - {{#article}}{{article.string}}{{/article}}',
  schema: [
    {
      label: 'Articles',
      field: 'article',
      input: 'select',
      source: 'articles',
      unique: true
    },
    {
      field: 'name',
      input: 'string',
      required: true,
      localised: true
    },
    {
      field: 'otherName',
      input: 'string',
      localised: true
    }
  ],
  type: 'normal'
})
