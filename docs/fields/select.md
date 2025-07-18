# Select Field

The `select` field type allows selection from a list of options or another resource.

## Declaration
```js
{
  field: 'author',
  input: 'select',
  source: 'authors', // resource or array
  options: {
    customLabel: '{{name}}' // optional
  },
  localised: false // optional
}
```

## Usage
- Used for referencing another resource or a static list.

## Options
| Option      | Type    | Description                                 |
|-------------|---------|---------------------------------------------|
| source      | String/Array | Resource name or array of options       |
| options     | Object  | Additional options (customLabel, etc.)      |
| localised   | Boolean | Supports multiple locales                   |
| label       | String/Object | Field label (can be localized)         |
