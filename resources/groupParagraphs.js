exports = (module.exports = {
  schema: [
    {
      label: 'Paragraph',
      field: 'paragraph',
      input: 'paragraph',
      localised: false,
      options: {
        maxCount: 4,
        types: [
          {
            label: 'normal group',
            input: 'group',
            schema: [
              {
                label: 'String label',
                field: 'string',
                input: 'string',
                required: true,
                // TODO: hugo - make translations work in paragraphs
                localised: true
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
                label: 'Checkbox label',
                field: 'checkbox',
                input: 'checkbox'
              },
              {
                label: 'Image label',
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
            ],
            // TODO: hugo - make translations work in paragraphs
            locales: [
              'enUS',
              'zhCN'
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
