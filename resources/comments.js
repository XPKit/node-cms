exports = (module.exports = {
  displayname: 'My Comments', // Optional, by default filename
  group: 'abc',
  extraSources: {
    'author': 'authors',
    'author.article': 'articles'
  },
  schema: [
    {
      field: 'author',
      input: 'select',
      source: 'authors',
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
    }
  ],
  type: 'normal'
})
