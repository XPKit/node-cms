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
      localised: true
    },
    {
      field: 'rate',
      input: 'number',
      localised: false
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
      label: 'Body 2',
      field: 'wysiwyg2',
      input: 'wysiwyg',
      localised: true,
      disabled: true,
      options: {
        buttons: ['bold', 'italic'],
        disabled: false
      }
    },
    {
      label: 'Body 3',
      field: 'wysiwyg3',
      input: 'wysiwyg',
      localised: true,
      disabled: true,
      options: {
        buttons: ['none'],
        disabled: false
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
      input: 'image'
    },
    {
      field: 'image2',
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
