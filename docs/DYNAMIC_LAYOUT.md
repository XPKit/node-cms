# Dynamic Layout for Paragraph Fields

This document explains how the dynamic layout system works for paragraph fields in the node-cms system.

## Overview

The dynamic layout system allows paragraph fields to influence how their child items are rendered in the UI. This is particularly useful for creating flexible, responsive layouts where items can take up different amounts of horizontal space.

Dynamic layout is automatically enabled when:
1. A paragraph field has `options.dynamicLayout: true` explicitly set, OR
2. Any paragraph items have a `slots` property defined

This makes the system flexible - you can either explicitly enable it or it will automatically activate when items have slots properties.

## How It Works

### 1. Resource Configuration

You have two options for enabling dynamic layout:

**Option A: Explicit Configuration**
```javascript
// resources/gallery.js
exports = module.exports = {
  displayname: 'Gallery',
  schema: [
    {
      label: 'Gallery Items',
      field: 'items',
      input: 'paragraph',
      options: {
        dynamicLayout: true,  // Explicitly enable dynamic layout
        types: ['gallery_item']
      }
    }
  ]
}
```

**Option B: Automatic Detection (Recommended)**
```javascript
// resources/gallery.js
exports = module.exports = {
  displayname: 'Gallery',
  schema: [
    {
      label: 'Gallery Items',
      field: 'items',
      input: 'paragraph',
      options: {
        types: ['gallery_item']  // Dynamic layout auto-activates when items have width
      }
    }
  ]
}
```

### 2. Container Paragraph Type (Optional)

You can create a paragraph type that acts as a layout container with slots:

```javascript
// resources/paragraphs/gallery_section.js
exports = module.exports = {
  displayname: 'Gallery Section',
  schema: [
    {
      label: 'Section Title',
      field: 'title',
      input: 'string',
      required: true
    },
    {
      label: 'Number of Slots',
      field: 'slots',
      input: 'integer',
      required: false,
      options: {
        min: 1,
        max: 12  // Like a CSS grid system
      }
    },
    {
      label: 'Gallery Items',
      field: 'items',
      input: 'paragraph',
      options: {
        types: ['gallery_item']  // Any paragraph type with slots will work
      }
    }
  ]
}
```

### 3. Item Paragraph Type

Create any paragraph type - dynamic layout will work if items have a `width` field:

```javascript
// resources/paragraphs/gallery_item.js
exports = module.exports = {
  displayname: 'Gallery Item',
  schema: [
    {
      label: 'Title',
      field: 'title',
      input: 'string',
      required: true
    },
    {
      label: 'Slots (Column Width)',
      field: 'slots',
      input: 'integer',
      required: false,  // Optional - if not set, item takes natural width
      options: {
        min: 1,
        max: 12  // Should not exceed parent slots
      }
    },
    {
      label: 'Image',
      field: 'image',
      input: 'image',
      required: true
    }
    // ... other fields
  ]
}
```

**Note**: The `slots` field is what triggers the dynamic layout behavior. Any paragraph type can participate in dynamic layout by including this field.

## How the Layout System Works

### Detection

The `ParagraphView.vue` component automatically detects when it should apply dynamic layout by checking:

1. If the paragraph field has `options.dynamicLayout: true` explicitly set, OR
2. If any paragraph items have a `slots` property (`item._value.slots` or `item.slots`)

This provides two ways to enable dynamic layout:
- **Explicit**: Set `dynamicLayout: true` in the paragraph field options
- **Automatic**: Add `slots` properties to paragraph items and it will activate automatically

### Layout Calculation

For each item in the dynamic layout container:

1. **Get the item's slots**: `item._value.slots` or `item.slots`
2. **Get the parent's slots**: `model.slots` (e.g., 12)
3. **Calculate percentage**: `(slots / parentSlots) * 100`
4. **Apply CSS flexbox styles**:
   - `flex-basis: {percentage}%`
   - `max-width: {percentage}%`
   - `min-width: {percentage}%`

### CSS Layout

The container uses flexbox with:
- `display: flex`
- `flex-wrap: wrap`
- `gap: 16px`

### Responsive Behavior

- **Mobile (≤768px)**: All items become full width
- **Tablet (769px-1024px)**: Small items get minimum 33.33% width
- **Desktop (>1024px)**: Items respect their calculated percentages

## Example Usage

### Method 1: Explicit Dynamic Layout Configuration

```javascript
// resources/gallery.js
exports = module.exports = {
  displayname: 'Gallery',
  schema: [
    {
      label: 'Gallery Items',
      field: 'items',
      input: 'paragraph',
      options: {
        dynamicLayout: true,  // Explicitly enable dynamic layout
        types: ['gallery_item']
      }
    }
  ]
}
```

### Method 2: Automatic Detection via Width Properties

Any paragraph type can participate in dynamic layout by simply including a `slots` field:

```javascript
// resources/paragraphs/gallery_item.js
exports = module.exports = {
  displayname: 'Gallery Item',
  schema: [
    {
      label: 'Title',
      field: 'title',
      input: 'string',
      required: true
    },
    {
      label: 'Slots (Column Width)',
      field: 'slots',
      input: 'integer',
      required: false,
      options: {
        min: 1,
        max: 12
      }
    },
    {
      label: 'Image',
      field: 'image',
      input: 'image',
      required: true
    }
  ]
}
```

### Creating a Report with Dynamic Layout (Original Example)

1. **Create a Report Line** with 12 slots
2. **Add Report Items** with different slot values:
   - Item 1: slots = 3 (25% of 12 slots)
   - Item 2: slots = 6 (50% of 12 slots)
   - Item 3: slots = 3 (25% of 12 slots)

Result: Three items displayed horizontally with 25%, 50%, 25% widths respectively.

### Wrapping Behavior

If items exceed the available slots:
- **Line with 8 slots**
- **Items**: 3 + 3 + 3 = 9 slots total
- **Result**: First two items (3 + 3 = 6 slots) on first row, third item wraps to second row

## Development Features

### Visual Debugging

When developing, each dynamic layout item shows a small indicator in the top-right corner displaying its slots ratio (e.g., "3/12").

### Console Logging

The system logs dynamic layout calculations to the browser console:

```
🎨 Dynamic layout calculation: {item: "Gallery Item 1", slots: 3, parentSlots: 12, percentage: "25%", adjustedWidth: "calc(25% - 10.667px)"}
```

## Best Practices

1. **Enable for any paragraph type**: Simply add a `slots` field to any paragraph schema
2. **Keep slot totals reasonable**: Use 12 or fewer slots for better UX
3. **Consider responsive behavior**: Test on different screen sizes
4. **Validate slot constraints**: Ensure item slots don't exceed parent slots
5. **Use meaningful names**: Make item names descriptive for better debugging
6. **Make slots optional**: Allow items to work without slots for flexible layouts

## Technical Implementation

The dynamic layout is implemented in:
- **ParagraphView.vue**: Main component handling layout logic
- **CSS flexbox**: For responsive, flexible layouts
- **Computed properties**: For reactive layout calculations
- **Vue.js reactivity**: Automatic updates when data changes

This system provides a flexible, user-friendly way to create complex, responsive layouts without requiring users to understand CSS or grid systems.
