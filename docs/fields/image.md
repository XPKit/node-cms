# Image Field

The `image` field type is used for image attachments.

## Declaration
```js
{
  field: 'image',
  input: 'image',
  localised: false, // can be set to true for localization
  options: {
    maxCount: 1, // optional, maximum number of images
    accept: '.jpg,.png', // optional, accepted file types
    disabled: false, // optional, disables the field
    width: 300, // optional, resize/crop width
    height: 200, // optional, resize/crop height
    crop: true // optional, enable cropping UI
  }
}
```

## Usage
- Used for uploading images, with optional localization and restrictions.

## Options
| Option      | Type    | Description                                 |
|-------------|---------|---------------------------------------------|
| options     | Object  | maxCount, accept, disabled, width, height, crop, etc. |
| localised   | Boolean | Supports multiple locales                   |
| label       | String/Object | Field label (can be localized)         |
