exports = (module.exports = {
  displayname: 'Reports',
  schema: [
    {
      label: 'Report Title',
      field: 'title',
      input: 'string',
      required: true,
      localised: true
    },
    {
      label: 'Report Lines',
      field: 'reportLines',
      input: 'paragraph',
      options: {
        types: ['reportLines'],
        maxCount: 10
      },
      localised: false
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  layout: {
    dynamicLayout: true, // Enable dynamic layout
    lines: [
      {
        slots: 12,
        fields: [
          {
            model: 'title',
            width: 12
          }
        ]
      },
      {
        // This line will be dynamically generated based on reportLines paragraph content
        dynamicSource: 'reportLines'
      }
    ]
  },
  type: 'normal'
})
