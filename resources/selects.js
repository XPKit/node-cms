exports = (module.exports = {
  displayname: 'Selects Examples', // Optional, by default filename
  group: 'standards',
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
      label: {
        enUS: 'Type',
        zhCN: '类型'
      },
      field: 'type',
      input: 'select',
      source: [
        'idle',
        'close',
        'far'
      ],
      options: {
        labels: {
          idle: {
            enUS: 'idle enUS',
            zhCN: 'idle zhCN'
          },
          close: {
            enUS: 'close enUS',
            zhCN: 'close zhCN'
          },
          far: {
            enUS: 'far enUS',
            zhCN: 'far zhCN'
          }
        }
      },
      localised: true,
      required: true
    },
    {
      field: 'select',
      input: 'select',
      source: [
        'one',
        'two',
        'three'
      ],
      required: true
    },
    {
      field: 'select_text_value',
      input: 'select',
      options: {
        labels: {
          1: 'One',
          2: 'Two',
          3: {
            enUS: 'Three',
            zhCN: '三'
          }
        }
      },
      source: [
        1,
        2,
        3
      ]
    },
    {
      field: 'gselect',
      input: 'select',
      source: [
        'one',
        'two',
        'three'
      ],
      localised: false
    },
    {
      field: 'relation',
      input: 'select',
      source: 'articles'
    },
    {
      field: 'grelation',
      input: 'select',
      source: 'articles',
      localised: false
    },
    {
      field: 'multiselect',
      input: 'multiselect',
      source: [
        'one',
        'two',
        'three'
      ]
    },
    {
      field: 'listbox',
      input: 'multiselect',
      options: {
        listBox: true,
        labels: {
          one: 'My first one',
          two: 'My second one',
          three: 'My third one'
        }
      },
      source: [
        'one',
        'two',
        'three'
      ]
    },
    {
      field: 'gmultiselect',
      input: 'multiselect',
      source: 'articles',
      localised: false
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
})
