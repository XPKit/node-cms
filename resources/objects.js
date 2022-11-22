exports = (module.exports = {
  displayname: 'Object examples', // Optional, by default filename
  group: 'Object',
  schema: [
    {
      field: 'array',
      input: 'object',
      options: {
        jsonEditorOptions: {
          type: 'array',
          format: 'table',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string'
              },
              make: {
                type: 'string',
                enum: [
                  'Toyota',
                  'BMW',
                  'Honda',
                  'Ford',
                  'Chevy',
                  'VW'
                ]
              },
              model: {
                type: 'string'
              },
              year: {
                type: 'integer',
                enum: [
                  1995,
                  1996,
                  1997,
                  1998,
                  1999,
                  2000,
                  2001,
                  2002,
                  2003,
                  2004,
                  2005,
                  2006,
                  2007,
                  2008,
                  2009,
                  2010,
                  2011,
                  2012,
                  2013,
                  2014
                ],
                default: 2008
              }
            }
          }
        }
      }
    },
    {
      field: 'garray',
      input: 'object',
      localised: false,
      options: {
        jsonEditorOptions: {
          type: 'array',
          format: 'table',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string'
              },
              make: {
                type: 'string',
                enum: [
                  'Toyota',
                  'BMW',
                  'Honda',
                  'Ford',
                  'Chevy',
                  'VW'
                ]
              },
              model: {
                type: 'string'
              },
              year: {
                type: 'integer',
                enum: [
                  1995,
                  1996,
                  1997,
                  1998,
                  1999,
                  2000,
                  2001,
                  2002,
                  2003,
                  2004,
                  2005,
                  2006,
                  2007,
                  2008,
                  2009,
                  2010,
                  2011,
                  2012,
                  2013,
                  2014
                ],
                default: 2008
              }
            }
          }
        }
      }
    },
    {
      field: 'object',
      input: 'object',
      options: {
        jsonEditorOptions: {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            },
            make: {
              type: 'string',
              enum: [
                'Toyota',
                'BMW',
                'Honda',
                'Ford',
                'Chevy',
                'VW'
              ]
            },
            model: {
              type: 'string'
            },
            year: {
              type: 'integer',
              enum: [
                1995,
                1996,
                1997,
                1998,
                1999,
                2000,
                2001,
                2002,
                2003,
                2004,
                2005,
                2006,
                2007,
                2008,
                2009,
                2010,
                2011,
                2012,
                2013,
                2014
              ],
              default: 2008
            }
          }
        }
      }
    },
    {
      field: 'gobject',
      input: 'object',
      localised: false,
      options: {
        jsonEditorOptions: {
          type: 'object',
          properties: {
            make: {
              type: 'string',
              enum: [
                'Toyota',
                'BMW',
                'Honda',
                'Ford',
                'Chevy',
                'VW'
              ]
            },
            model: {
              type: 'string'
            },
            year: {
              type: 'integer',
              enum: [
                1995,
                1996,
                1997,
                1998,
                1999,
                2000,
                2001,
                2002,
                2003,
                2004,
                2005,
                2006,
                2007,
                2008,
                2009,
                2010,
                2011,
                2012,
                2013,
                2014
              ],
              default: 2008
            }
          }
        }
      }
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
})
