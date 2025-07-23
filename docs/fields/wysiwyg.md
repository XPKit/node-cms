# WYSIWYG Field

The `wysiwyg` field type provides a rich text editor for formatted content.

## Declaration
```js
{
  field: 'body',
  input: 'wysiwyg',
  localised: false, // can be set to true for localization
  disabled: false, // optional
  options: {
    // All possible buttons:
    // 'bold', 'italic', 'underline', 'strike', 'blockquote', 'code', 'link', 'ordered_list', 'bullet_list', 'heading', 'subscript', 'superscript', 'undo', 'redo', 'image', 'table', 'hr', 'align_left', 'align_center', 'align_right', 'align_justify', 'color', 'background', 'remove_format', 'fullscreen'
    buttons: ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code', 'link', 'ordered_list', 'bullet_list', 'heading', 'subscript', 'superscript', 'undo', 'redo', 'image', 'table', 'hr', 'align_left', 'align_center', 'align_right', 'align_justify', 'color', 'background', 'remove_format', 'fullscreen'], // optional
    disabled: false // optional
  }
}
```

## Usage
- Used for article bodies, descriptions, or any formatted text.

## Options
| Option     | Type    | Description                                 |
|------------|---------|---------------------------------------------|
| localised  | Boolean | Supports multiple locales                   |
| disabled   | Boolean | Disables the field                          |
| options    | Object  | Additional options (buttons, disabled, etc.) |
| label      | String/Object | Field label (can be localized)          |
