exports = module.exports = {
  group: '3. Towers',
  displayname: '3.2. Towers - Units',
  schema: [
    {
      label: 'Unique ID',
      field: 'id',
      localised: false,
      required: true,
      unique: true,
      input: 'select',
      source: [
        'uh-2al',
        'uh-2a',
        'uh-3a',
        'uh-2b',
        'uh-2bl',
        'uh-4bd',
        'uh-4c',
        'uh-4ad',
        'uh-2cl',
        'uh-3b',
        'uh-ph1',
        'uh-2dl',
        'uh-3c',
        'uh-ph2',
        'uh-4a',
        'uh-4b',
        'wr-1a',
        'wr-2a',
        'wr-2b',
        'wr-2c',
        'wr-2d',
        'wr-2al',
        'wr-2bl',
        'wr-3a',
        'wr-3b',
        'wr-3al',
        'wr-3bl',
        'wr-3cl',
        'wr-3dl',
        'wr-3c',
        'wr-3d',
        'wr-ph1',
        'wr-4a',
        'wr-4b',
        'wr-ph2',
        'wr-ph3',
        'wr-ph4',
        'wr-ph5',
        'wr-4c'
      ]
    },
    {
      label: 'Unit Type',
      field: 'unitGroup',
      localised: false,
      required: true,
      input: 'select',
      source: 'tower_unit_groups'
    },
    {
      label: 'Icon',
      field: 'icon',
      localised: false,
      required: true,
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 384 × 180',
        accept: '.svg,.png',
        limit: 300 * 1024, // 300 KB
        maxCount: 1
      }
    },
    {
      label: 'Short Name',
      field: 'shortName',
      localised: true,
      required: true,
      input: 'string'
    },
    {
      label: 'Remaning Available Units',
      field: 'remainingAvailableUnits',
      localised: false,
      required: true,
      input: 'integer'
    },
    {
      label: 'Price',
      field: 'price',
      localised: false,
      required: true,
      input: 'integer'
    },
    {
      label: 'Square Meters',
      field: 'squareMeters',
      localised: false,
      required: true,
      input: 'double'
    },
    {
      label: 'Bedrooms Count',
      field: 'bedroomsCount',
      localised: false,
      required: true,
      input: 'integer'
    },
    {
      label: 'Bathrooms Count',
      field: 'bathroomsCount',
      localised: false,
      required: true,
      input: 'integer'
    },
    {
      label: 'Unit View',
      field: 'unitView',
      input: 'paragraph',
      options: {
        types: ['tower_unit_views'],
        maxCount: 1
      },
      localised: false,
      required: false
    },
    {
      label: 'Unit Plan',
      field: 'unitPlan',
      input: 'paragraph',
      options: {
        types: ['tower_unit_plans']
      },
      localised: false,
      required: false
    },
    {
      label: 'Renders',
      field: 'renders',
      input: 'paragraph',
      options: {
        types: ['tower_unit_renders']
      },
      localised: false,
      required: false
    },
    {
      label: 'Order',
      field: 'order',
      localised: false,
      required: true,
      input: 'integer'
    }
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal'
}
