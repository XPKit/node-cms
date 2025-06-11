exports = module.exports = {
  displayname: 'Dynamic Layout Demo',
  schema: [
    {
      label: 'Page Title',
      field: 'title',
      input: 'string',
      localised: true,
      required: true
    },
    {
      label: 'Cards (Dynamic Layout Example)',
      field: 'cards',
      input: 'paragraph',
      options: {
        types: ['card_item'],  // Any paragraph type with width field will work
        maxCount: 12
      },
      localised: false,
      required: false
    },
    {
      label: 'Gallery Items (Explicit Dynamic Layout)',
      field: 'gallery',
      input: 'paragraph',
      options: {
        dynamicLayout: true,  // Explicitly enable dynamic layout
        types: ['images'],    // Even existing paragraph types without width work
        maxCount: 6
      },
      localised: false,
      required: false
    }
  ],
  locales: [
    'enUS'
  ],
  type: 'normal'
}
