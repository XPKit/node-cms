module.exports = {
  displayname: 'My Comments', // Optional, by default filename
  group: 'abc',
  extraSources: {
    'author': 'authors',
    'author.article': 'articles'
  },
  schema: [
    {
      label: 'Select author',
      field: 'author',
      input: 'select',
      source: 'authors',
      options: {
        customLabel: '{{name}}'
      },
      localised: false
    },
    {
      field: 'title',
      input: 'string',
      localised: true,
      unique: true
    },
    {
      field: 'category',
      input: 'string',
      localised: true
    },
    {
      label: 'Body',
      field: 'wysiwyg',
      input: 'wysiwyg',
      localised: true
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
}
