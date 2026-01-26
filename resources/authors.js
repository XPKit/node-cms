module.exports = {
  displayname: 'Authors', // Optional, by default filename
  group: {
    enUS: 'abc',
    zhCN: '甲乙丙',
  },
  extraSources: {
    article: 'articles',
  },
  displayItem: '{{name}} - {{#article}}{{article.string.enUS}}{{/article}}',
  schema: [
    {
      label: 'Articles',
      field: 'article',
      input: 'select',
      source: 'articles',
      unique: true,
      required: true,
    },
    {
      field: 'name',
      input: 'string',
      required: true,
      localised: false,
    },
    {
      field: 'otherName',
      input: 'string',
      localised: true,
    },
    {
      field: 'paragraph',
      input: 'paragraph',
      options: {
        types: ['textParagraphs', 'testParagraphs'],
      },
      localised: false,
    },
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal',
}
