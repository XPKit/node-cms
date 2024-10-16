exports = (module.exports = {
  displayname: 'Authors', // Optional, by default filename
  group: {
    enUS: 'abc',
    zhCN: '甲乙丙'
  },
  extraSources: {
    'article': 'articles'
  },
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
    },
    {
      field: 'paragraph',
      input: 'paragraph',
      options: {
        types: ['textParagraph', 'testParagraph']
      }
    }

  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
})
