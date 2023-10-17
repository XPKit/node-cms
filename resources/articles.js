exports = (module.exports = {
  displayname: {
    enUS: 'My articles', // Optional, by default filename
    zhCN: '我的文章'
  },
  group: {
    enUS: 'abc',
    zhCN: '甲乙丙'
  },
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
          'wysiwyg',
          'text',
          'string',
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
      localised: true,
      options: {
        types: [
          'wysiwyg',
          'text',
          'string',
          'image'
        ]
      }
    },
    {
      label: 'Body',
      field: 'wysiwyg',
      input: 'wysiwyg',
      localised: true,
      disabled: true,
      options: {
        disabled: true
      }
    },
    {
      field: 'relatedArticles',
      input: 'multiselect',
      source: 'articles',
      localised: false,
      options: {
        disabled: true
      }
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
      input: 'image',
      options: {
        disabled: true
      }
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  layout: {
    lines: [
      {
        slots: 3,
        fields: [
          {
            model: 'string', width: 1
          },
          {
            model: 'rate', width: 2
          }
        ]
      },
      {
        slots: 2,
        fields: [
          {
            model: 'paragraph'
          },
          {
            model: 'localizedParagraph'
          }
        ]
      },
      {
        slots: 3,
        fields: [
          {
            model: 'wysiwyg'
          }
        ]
      },
      {
        fields: [
          {
            model: 'relatedArticles'
          },
          {
            model: 'comment'
          },
          {
            model: 'comments'
          },
          {
            model: 'localizedComments'
          }
        ]
      }
    ]
  },
  type: 'normal'
})
