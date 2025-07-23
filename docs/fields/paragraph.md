# Paragraph Field

The `paragraph` field type allows embedding a nested resource or paragraph block.

## Declaration
```js
{
  field: 'paragraph',
  input: 'paragraph',
  options: {
    types: ['textParagraphs', 'testParagraphs'] // allowed paragraph types
  },
  localised: false // optional
}
```

## Usage
- Used for complex/nested content, such as blocks or sections.

## Options
| Option      | Type    | Description                                 |
|-------------|---------|---------------------------------------------|
| options     | Object  | types: array of allowed paragraph types     |
| localised   | Boolean | Supports multiple locales                   |
| label       | String/Object | Field label (can be localized)         |
