exports = (module.exports = {
  displayname: 'Strings examples', // Optional, by default filename
  group: 'standards',
  schema: [
    {
      field: 'string',
      input: 'string',
      required: true,
      help: 'blablabla',
      options: {
        regex: {
          value: /^\d{3}$/g,
          description: {
            enUS: 'It needs to be 3 digits',
            zhCN: '它需要3位数'
          }
        }
      }
    },
    {
      field: 'gstring',
      input: 'string',
      localised: false,
      options: {
        regex: {
          value: /^\d+$/g,
          description: 'This field accept only digits'
        }
      }
    },
    {
      field: 'string2',
      input: 'string',
      options: {
        regex: {
          enUS: {
            value: /^\d{3}$/g,
            description: {
              enUS: 'It needs to be 3 digits',
              zhCN: '它需要3位数'
            }
          },
          zhCN: {
            value: /^\d{8}$/g,
            description: 'It needs to be 8 digits'
          }
        }
      }
    },
    {
      field: 'email',
      input: 'email',
      required: true
    },
    {
      field: 'gemail',
      input: 'email',
      required: true,
      localised: false
    },
    {
      field: 'password',
      input: 'password',
      required: true
    },
    {
      field: 'gpassword',
      input: 'password',
      localised: false,
      required: true
    },
    {
      field: 'url',
      input: 'url',
      required: true
    },
    {
      field: 'gurl',
      input: 'url',
      localised: false,
      required: true
    },
    {
      field: 'wysiwyg',
      input: 'wysiwyg'
    },
    {
      field: 'gwysiwyg',
      input: 'wysiwyg',
      localised: false
    },
    {
      field: 'text',
      input: 'text'
    },
    {
      field: 'gtext',
      input: 'text',
      localised: false,
      options: {
        regex: {
          value: /^.+\n.+\n.+$/g,
          description: 'It needs to have 3 lines'
        }
      }
    },
    {
      field: 'code',
      input: 'code',
      options: {
        languages: [['cpp', 'C++']]
      }
    },
    {
      field: 'gcode',
      input: 'code',
      localised: false,
      options: {
        theme: 'github'
      }
    },
    {
      field: 'pillbox',
      input: 'pillbox'
    },
    {
      field: 'gpillbox',
      input: 'pillbox',
      localised: false
    },
    {
      field: 'json',
      input: 'json'
    },
    {
      field: 'gjson',
      input: 'json',
      localised: false
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
})
