# InputTag Field

The `inputtag` field type is used for entering multiple values as tags, similar to pillbox but with more flexibility.

## Declaration
```js
{
  field: 'inputtag',
  input: 'inputtag',
  localised: false // optional
}
```

## Usage
- Used for flexible tag input or comma-separated values.

## Options
| Option      | Type    | Description                                 |
|-------------|---------|---------------------------------------------|
| localised   | Boolean | Supports multiple locales                   |
| label       | String/Object | Field label (can be localized)         |
