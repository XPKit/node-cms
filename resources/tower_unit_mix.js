module.exports = {
  group: '3. Towers',
  displayname: '3.6. Unit Mix',
  schema: [
    {
      label: 'Unique Id',
      field: 'id',
      input: 'select',
      source: [
        'uh-mix-all',
        'uh-mix-2-bedroom',
        'uh-mix-2-bedroom-large',
        'uh-mix-3-bedroom',
        'uh-mix-4-bedroom',
        'uh-mix-4-bedroom-deluxe',
        'uh-mix-penthouse',
        'wr-mix-all',
        'wr-mix-1-bedroom',
        'wr-mix-2-bedroom',
        'wr-mix-2-bedroom-large',
        'wr-mix-3-bedroom',
        'wr-mix-3-bedroom-large',
        'wr-mix-3-bedroom-multigen',
        'wr-mix-4-bedroom',
        'wr-mix-penthouse'
      ],
      unique: true,
      localised: false,
      required: true
    },
    {
      label: 'Tower',
      field: 'tower',
      localised: false,
      required: true,
      input: 'select',
      source: 'tower_buildings'
    },
    {
      label: 'Background Image',
      field: 'backgroundImage',
      input: 'image',
      options: {
        hint: 'Recommended image size: 2572 × 1672',
        accept: '.jpg',
        limit: 2 * 1024 * 1024, // 2 MB
        maxCount: 1
      },
      localised: true,
      required: true
    },
    {
      label: 'Background Fullscreen image',
      field: 'backgroundFullscreenImage',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 3840 × 2160',
        accept: '.jpg',
        limit: 2 * 1024 * 1024, // 2 MB
        maxCount: 1
      },
      localised: true,
      required: true
    }
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal'
}
