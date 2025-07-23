# Fields

## Options
Non specific options that can be use on all filed types:

- `required`
  - Type: `Boolean`
  - Default: `false`
  - Purpose: Enforce field requirement on creation/update
- `localised`
  - Type: `Boolean`
  - Default: `true`
  - Purpose: Enforce field localization base on given languages/locales inside the resource
- `unique`
  - Type: `Boolean`
  - Default: `false`
  - Purpose: Enforce field content to be unique into all its given resource
### Example
``` JavaScript
{
  field: 'title',
  input: 'string',
  unique: true,
  required: true,
  localised: false
}
```

## String
Standard input string field.

### Example
``` JavaScript
{
  field: 'title',
  input: 'string'
}
```
## Wysiwyg
What You See Is What You Get field type; it include standard text-editing visual aspect such as bold, italic, alignment, etc....

### Example
``` JavaScript
{
  field: 'wysiwyg',
  input: 'wysiwyg'
}
```

## Email
Email input field. It checks if the content respect the format of an email.

### Example
``` JavaScript
{
  field: 'email',
  input: 'email'
}
```

## Password
Password input field. It doesn't encrypt its content but just obfuscate its visual.

### Example
``` JavaScript
{
  field: 'password',
  input: 'password'
}
```

## URL
URL input field. It checks if the content respect the format of an URL.

### Example
``` JavaScript
{
  field: 'URL',
  input: 'url'
}
```

## Text
Textarea input field.
### Example
``` JavaScript
{
  field: 'text',
  input: 'text'
}
```

## Numbers
Number input fields.
### Examples
``` JavaScript
{
  field: 'number',
  input: 'number'
},
{
  field: 'gnumber',
  input: 'number'
},
{
  field: 'integer',
  input: 'integer'
},
{
  field: 'ginteger',
  input: 'integer'
},
{
  field: 'double',
  input: 'double'
},
{
  field: 'gdouble',
  input: 'double'
}
```

## Date
Date input fields
### Examples
``` JavaScript
{
  field: 'gdate',
  input: 'date'
},
{
  field: 'time',
  input: 'time'
},
{
  field: 'gtime',
  input: 'time'
},
{
  field: 'datetime',
  input: 'datetime'
},
{
  field: 'gdatetime',
  input: 'datetime'
}
```

## Select
Select input fields
### Examples
``` JavaScript
{
  label: {
    enUS: 'Type',
    zhCN: '类型'
  },
  field: 'type',
  input: 'select',
  source: ['idle',
    'close',
    'far'],
  options: {
    labels: {
      idle: {
        enUS: 'Meet Vivo',
        zhCN: 'Meet Vivo'
      },
      close: {
        enUS: 'Meet Vivo',
        zhCN: 'Meet Vivo'
      },
      far: {
        enUS: 'Meet Vivo',
        zhCN: 'Meet Vivo'
      }
    }
  },
  localised: false,
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
```

## Nested fields
Nested input fields
### Examples
``` JavaScript
{
  label: 'address country name',
  field: 'address.country.name',
  input: 'string',
},
{
  label: 'address country code',
  field: 'address.country.code',
  input: 'string',
}
```

## Image fields
Image input fields
### Examples
``` JavaScript
{
  field: 'gimage',
  input: 'image',
  localised: false,
  options: {
    maxCount: 1
  }
},
{
  field: 'cropimage',
  input: 'image',
  options: {
    width: '800',
    height: '300',
    background: 'transparent',
    accept: 'image/jpeg',
    quality: 0.5,
    limit: 300 * 1024 // 100KB
  }
},
{
  field: 'gcropimage',
  input: 'image',
  localised: false,
  options: {
    width: '400',
    height: '200',
    background: 'transparent'
  }
}
```

## File fields
File input fields
### Examples
``` JavaScript
{
  field: 'file',
  input: 'file',
  required: true,
  options: {
    accept: 'image/*',
    maxCount: 1
  }
}
```

## Checkbox fields
Checkbox input fields
### Examples
``` Javascript
{
  field: 'checkboxopt',
  input: 'checkbox',
  options: {
    textOn: 'Enable',
    textOff: 'Disable'
  }
},
{
  field: 'checkbox',
  input: 'checkbox'
},
{
  field: 'disabledCheckbox',
  input: 'checkbox',
  options: {
    disabled: true
  }
}
```

## Color fields
Color input fields
### Examples
``` Javascript
{
  field: 'defaultColor',
  input: 'color',
  options: {
  }
},
{
  field: 'color',
  input: 'color',
  options: {
    picker: 'wheel',
    outputModel: 'hex',
    menuPosition: 'right',
    draggable: true,
    enableAlpha: true,
    rgbSliders: true
  }
},
{
  field: 'gColor',
  input: 'color',
  localised: false,
  options: {
    picker: 'square',
    outputModel: 'rgb',
    menuPosition: 'bottom',
    draggable: false,
    enableAlpha: false,
    rgbSliders: false
  }
},
```

## Object fields
Object input fields
### Example
``` Javascript
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
          brand: {
            type: 'string',
            enum: ['Toyota','BMW','Honda','Ford','Chevy','VW']
          },
          model: {
            type: 'string'
          },
          year: {
            type: 'integer',
            enum: [1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014],
            default: 2008
          }
        }
      }
    }
  }
}
```

## Paragraph
Paragraph input fields behave like any other resources allowing for nested groups within a record
### Example
``` Javascript
resource schema
{
  displayname: 'My resource',
  schema: [
    {
      label: 'Paragraph',
      field: 'paragraph',
      input: 'paragraph',
      localised: false,
      options: {
        types: ['myParagraph']
      }
    }
  ]
}

paragraph schema
{
  displayname: 'My paragraph',
  schema: [
    {
      label: 'Text field',
      field: 'text',
      input: 'text'
    },
    {
      label: 'Checkbox',
      field: 'checkbox',
      input: 'checkbox'
    }
  ]
}
```
