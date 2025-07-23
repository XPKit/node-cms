# Number Field

The `number` field type is used for numeric input.

## Declaration
```js
{
  field: 'rate',
  input: 'number',
  localised: false // optional
}
```

## Usage
- Used for ratings, counts, or any numeric value.

## Options
| Option     | Type    | Description                        |
|------------|---------|------------------------------------|
| required   | Boolean | Field must be filled in            |
| unique     | Boolean | Value must be unique               |
| localised  | Boolean | Supports multiple locales          |
| label      | String/Object | Field label (can be localized) |
