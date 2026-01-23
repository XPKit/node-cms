exports = module.exports = {
  group: '3. Towers',
  displayname: '3.7. Compare Units',
  schema: [
    {
      label: 'Unique Id',
      field: 'id',
      input: 'select',
      source: [
        'all-compare',
        'uh-compare',
        'wr-compare'
      ],
      unique: true,
      localised: false,
      required: true
    },
    {
      label: 'Tower',
      field: 'tower',
      localised: false,
      required: false,
      input: 'select',
      source: 'tower_buildings'
    },
    {
      label: 'Image',
      field: 'image',
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
      label: 'Fullscreen image',
      field: 'fullscreen',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 3840 × 2160',
        accept: '.jpg',
        limit: 2 * 1024 * 1024, // 2 MB
        maxCount: 1
      },
      localised: true
    }
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal'
}
