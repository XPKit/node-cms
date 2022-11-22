exports = (module.exports = {
  displayname: 'Groups', // Optional, by default filename
  group: 'specials',
  groups: {
    address: {
      label: {
        enUS: 'My Address',
        zhCN: '我的地址'
      },
      city: {
        label: 'My City',
        province: {
          label: 'Province',
          area: {
            label: 'My Area'
          }
        }
      }
    }
  },
  schema: [
    {
      field: 'name',
      input: 'string',
      searchable: true,
      localised: false
    },
    {
      label: {
        enUS: 'address line 1',
        zhCN: '地址欄1'
      },
      field: 'address.line1',
      input: 'string',
      searchable: true,
      localised: false
    },
    {
      field: 'address.line2',
      input: 'string',
      localised: false
    },
    {
      field: 'email',
      input: 'string',
      searchable: true,
      localised: false
    },
    {
      field: 'address.line3',
      input: 'string',
      localised: false
    },
    {
      field: 'address.city.name',
      input: 'string',
      localised: false
    },
    {
      field: 'address.city.code',
      input: 'string',
      localised: false
    },
    {
      field: 'address.province.name',
      input: 'string',
      localised: false
    },
    {
      field: 'address.province.area.code',
      input: 'string',
      localised: false
    },
    {
      field: 'address.province.area.gps',
      input: 'string',
      localised: false
    },
    {
      field: 'tel',
      input: 'string',
      localised: false
    },
    {
      field: 'tel',
      input: 'string',
      localised: false
    }

  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
})
