# Custom Field Types

Some field types are custom or advanced and may require additional configuration or a custom Vue component. Examples include:

- `customCode`
- `customTreeView`
- `colorPicker`
- `customDatetimePicker`
- `customMultiSelect`
- `customInput`
- `customTextarea`
- `customCheckbox`
- `customInputTag`
- `jsonEditor`
- `wysiwygField`
- `paragraphView`
- `imageView`
- `attachmentView`

## Declaration
```js
{
  field: 'customField',
  input: 'customType',
  // Additional options as required by the component
}
```

## Usage
- Used for specialized UI or data handling.
- Requires the corresponding component to be registered in the frontend.

## Options
- Vary by field/component. Refer to the component's documentation or source code for details.

---

For any field type not listed above, check the `src/components/fields/` directory for its implementation and options.
