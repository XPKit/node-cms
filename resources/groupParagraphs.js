exports = (module.exports = {
  schema: [
    {
      label: 'Paragraph',
      field: 'paragraph',
      input: 'paragraph',
      localised: false,
      options: {
        maxItems: 4,
        types: [
          {
            label: 'normal group',
            input: 'group',
            schema: [
              {
                field: 'string',
                input: 'string',
                required: true
              },
              {
                field: 'paragraph',
                input: 'paragraph',
                options: {
                  types: [
                    {
                      field: 'dealership',
                      input: 'select',
                      source: 'dealerships'
                    },
                    'image'
                  ]
                }
              },
              {
                field: 'checkbox',
                input: 'checkbox'
              },
              {
                field: 'image',
                input: 'image'
              },
              {
                field: 'comment',
                input: 'select',
                source: 'comments',
                options: {
                  customLabel: '{{title}} {{category}}'
                }
              }
            ]
          }
        ]
      }
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
})
