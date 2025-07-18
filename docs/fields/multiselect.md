# MultiSelect Field

The `multiselect` field type allows selecting multiple options from a list or resource.

## Declaration
```js
{
  field: 'relatedArticles',
  input: 'multiselect',
  source: 'articles', // resource or array
  options: {
    customLabel: '{{title}}' // optional
  },
  localised: false // optional
}
```

## Usage
- Used for referencing multiple resources or options.

## Options
| Option      | Type    | Description                                 |
|-------------|---------|---------------------------------------------|
| source      | String/Array | Resource name or array of options       |
| options     | Object  | Additional options (customLabel, etc.)      |
| localised   | Boolean | Supports multiple locales                   |
| label       | String/Object | Field label (can be localized)         |
