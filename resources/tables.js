exports = (module.exports = {
  view: 'table',
  options: {
    paging: 6,
    displayId: false,
    displayUpdatedAt: true
  },
  displayname: {
    enUS: 'My Tables', // Optional, by default filename
    zhCN: '我的表'
  },
  group: {
    enUS: 'Table',
    zhCN: '表'
  },
  schema: [
    {
      field: 'gString',
      input: 'string',
      required: true,
      searchable: true,
      localised: false,
      options: {
        index: 4
      }
    },
    {
      field: 'string',
      input: 'string',
      required: false,
      searchable: true,
      localised: true,
      options: {
        breakdown: true,
        size: '150',
        index: 1
      }
    },
    {
      field: 'string2',
      input: 'string',
      required: false,
      searchable: true,
      localised: true,
      options: {
        breakdown: true,
        size: '150',
        index: 2
      }
    },
    {
      field: 'gCheckbox',
      input: 'checkbox',
      localised: false,
      options: {
        index: 3
      }
    },
    {
      field: 'checkbox',
      input: 'checkbox',
      localised: true
    },
    {
      field: 'gSelect',
      input: 'select',
      source: ['Apple', 'Orange', 'Banana'],
      localised: false,
      options: {
        index: 5,
        sortBy: ''
      }
    },
    {
      field: 'select',
      input: 'select',
      source: ['Apple', 'Orange', 'Banana'],
      localised: true,
      options: {
        index: 6
      }
    },
    {
      field: 'gArticle',
      input: 'select',
      source: 'articles',
      localised: false
    },
    {
      field: 'article',
      input: 'select',
      source: 'articles',
      localised: true
    },
    {
      field: 'gImage',
      input: 'image',
      localised: false
    },
    {
      field: 'image',
      label: 'Image',
      input: 'image',
      localised: true,
      options: {
        index: 7,
        size: 60,
        maxCount: 3
      }
    }
  ],
  locales: [
    'enUS',
    'zhCN',
    'vi',
    'th'
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
            model: 'gString', width: 2
          }
        ]
      }
    ]
  },
  type: 'normal'
})
