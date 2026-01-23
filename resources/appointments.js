exports = module.exports = {
  group: '1. BKK109',
  displayname: '1.2. Appointments',
  schema: [
    {
      label: 'Guest Name',
      field: 'guestName',
      input: 'string',
      localised: false,
      required: true
    },
    {
      label: 'Visit Date',
      field: 'visitDate',
      input: 'date',
      localised: false,
      required: true
    },
    {
      label: 'Start Time',
      field: 'startTime',
      input: 'time',
      localised: false,
      required: true
    },
    {
      label: 'End Time',
      field: 'endTime',
      input: 'time',
      localised: false,
      required: true
    },
    {
      label: 'Content Language',
      field: 'contentLanguage',
      input: 'select',
      source: ['enUS', 'zhCN'],
      localised: false,
      required: true
    },
    {
      label: 'Author',
      field: 'author',
      input: 'select',
      source: 'portalUsers',
      localised: false,
      required: false
    },
    {
      label: 'Updator',
      field: 'updator',
      input: 'select',
      source: 'portalUsers',
      localised: false,
      required: false
    },
    {
      label: 'Number Of Guests',
      field: 'numberOfGuests',
      input: 'select',
      source: [1, 2, 3, 4, 5, 6],
      localised: false,
      required: true
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
}
