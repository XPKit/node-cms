# String Field

The `string` field type is used for single-line text input.

## Declaration
```js
{
  field: 'title',
  input: 'string',
  required: true, // optional
  unique: true,   // optional
  localised: true // optional
}
```

## Usage
- Used for titles, names, or any short text.
- Can be localized and/or required.

## Options
| Option     | Type    | Description                        |
|------------|---------|------------------------------------|
| required   | Boolean | Field must be filled in            |
| unique     | Boolean | Value must be unique               |
| localised  | Boolean | Supports multiple locales          |
| label      | String/Object | Field label (can be localized) |
