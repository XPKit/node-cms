# Transliterate Field

The `transliterate` field type is used for generating a slug or transliterated value from another field.

## Declaration
```js
{
  field: 'key',
  input: 'transliterate',
  options: {
    valueFrom: 'name', // source field
    readonly: false    // allow editing
  },
  unique: true // optional
}
```

## Usage
- Used for slugs, keys, or URL-friendly values.

## Options
| Option      | Type    | Description                                 |
|-------------|---------|---------------------------------------------|
| options     | Object  | valueFrom (source field), readonly          |
| unique      | Boolean | Value must be unique                        |
| label       | String/Object | Field label (can be localized)         |
