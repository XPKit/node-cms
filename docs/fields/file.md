# File Field

The `file` field type is used for file attachments.

## Declaration
```js
{
  field: 'file',
  input: 'file',
  localised: false, // can be set to true for localization
  options: {
    maxCount: 1, // optional, maximum number of files
    accept: '*', // optional, accepted file types
    disabled: false // optional, disables the field
  }
}
```

## Usage
- Used for uploading and attaching files to a record.

## Options
| Option      | Type    | Description                                 |
|-------------|---------|---------------------------------------------|
| options     | Object  | maxCount, accept, disabled, etc.            |
| localised   | Boolean | Supports multiple locales                   |
| label       | String/Object | Field label (can be localized)         |
