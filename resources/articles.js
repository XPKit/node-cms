module.exports = {
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
      field: 'image',
      input: 'image',
      localised: false
    },
    {
      field: 'localizedImage',
      input: 'image',
      localised: true
    }
  ],
  type: 'normal',
  locales: [
    'enUS',
    'zhCN'
  ]
}
