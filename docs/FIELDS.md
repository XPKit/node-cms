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


## String
Standard input string field.

### Example
``` JavaScript
{
  field: 'title',
  input: 'string',
  required: true,
  localised: false
}
```
## Wysiwyg
What You See Is What You Get field type; it include standard text-editing visual aspect such as bold, italic, alignment, etc....

### Example
``` JavaScript
{
  field: 'wysiwyg',
  input: 'wysiwyg',
  required: true,
  localised: true
}
```

## Email
Email input field. It checks if the content respect the format of an email.

### Example
``` JavaScript
{
  field: 'email',
  input: 'email',
  required: true,
  localised: true
}
```

## Password
Password input field. It doesn't encrypt its content but just obfuscate its visual.

### Example
``` JavaScript
{
  field: 'password',
  input: 'password',
  required: true,
  localised: false
}
```

## URL
URL input field. It checks if the content respect the format of an URL.

### Example
``` JavaScript
{
  field: 'URL',
  input: 'url',
  required: true,
  localised: false
}
```

## Text
Textarea input field.
### Example
``` JavaScript
{
  field: 'text',
  input: 'text',
  required: false,
  localised: false
}
```


