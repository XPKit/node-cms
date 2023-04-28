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
    },
    {
      label: 'Paragraph',
      field: 'paragraph',
      input: 'paragraph',
      localised: false,
      options: {
        types: [
          'text',
          'file',
          'image',
          {
            input: 'select',
            source: 'authors',
            options: {
              customLabel: '{{name}}'
            }
          }
        ]
      }
    },
    {
      label: 'Localized Paragraph',
      field: 'localizedParagraph',
      input: 'paragraph',
      localised: true
      // options: {
      //   types: ['string']
      // }
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
})
