exports = (module.exports = {
  displayname: {
    enUS: 'My articles', // Optional, by default filename
    zhCN: '我的文章'
  },
  group: {
    enUS: 'abc',
    zhCN: '甲乙丙'
  },
  maxCount: 10,
  schema: [
    {
      label: {
        enUS: 'Title',
        zhCN: '标题'
      },
      field: 'string',
      input: 'string',
      required: true,
      unique: true,
      localised: false
    },
    {
      field: 'rate',
      input: 'number',
      localised: false
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
            source: 'comments',
            options: {
              customLabel: '{{title}} {{category}}'
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
    },
    {
      label: 'Body',
      field: 'wysiwyg',
      input: 'wysiwyg',
      localised: true
    },
    {
      field: 'Related articles',
      input: 'multiselect',
      source: 'articles',
      localised: false
    },
    {
      field: 'comment',
      input: 'select',
      source: 'comments',
      localised: false
    },
    {
      field: 'comments',
      input: 'multiselect',
      source: 'comments',
      localised: false
    },
    {
      field: 'localizedComment',
      input: 'select',
      source: 'comments',
      options: {
        customLabel: '{{title}} {{category}}'
      }
    },
    {
      field: 'localizedComments',
      input: 'multiselect',
      source: 'comments'
    },
    {
      field: 'file',
      input: 'file'
    },
    {
      field: 'localisedFile',
      input: 'file'
    },
    {
      field: 'image',
      input: 'image'
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
})
