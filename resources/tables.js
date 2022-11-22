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
      localised: false,
      options: {
        index: 3
      }
    },
    {
      field: 'string',
      input: 'string',
      required: true,
      localised: true,
      options: {
        breakdown: true,
        size: '150',
        index: 1
      }
    },
    {
      field: 'gCheckbox',
      input: 'checkbox',
      required: true,
      localised: false,
      options: {
        index: 2
      }
    },
    {
      field: 'checkbox',
      input: 'checkbox',
      required: true,
      localised: true
    },
    {
      field: 'gSelect',
      input: 'select',
      source: ['Apple', 'Orange', 'Banana'],
      localised: false,
      options: {
        index: 4
      }
    },
    {
      field: 'select',
      input: 'select',
      source: ['Apple', 'Orange', 'Banana'],
      localised: true,
      options: {
        index: 5
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
      lcalised: true,
      options: {
        index: 6,
        size: 60
      }
    }
  ],
  locales: [
    'english',
    'chinese',
    'vietnamese',
    'thailandese'
  ],
  type: 'normal'
})
