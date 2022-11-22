exports = (module.exports = {
  schema: [
    {
      field: 'name',
      input: 'string'
    },
    {
      field: 'fordSiteCode',
      input: 'string',
      xlsxKey: true
    },
    {
      field: 'market',
      input: 'select',
      source: 'markets',
      xlsxKey: true
    },
    {
      field: 'tradeName',
      input: 'string'
    },
    {
      field: 'dealershipName',
      input: 'string'
    },
    {
      label: 'Email',
      field: 'email',
      input: 'string'
    },
    {
      label: 'Reply To Email',
      field: 'replyToEmail',
      input: 'string'
    },
    {
      label: 'Phone',
      field: 'phone',
      input: 'string'
    },
    {
      label: 'wechat',
      field: 'social.wechat',
      input: 'string'
    },
    {
      label: 'weibo',
      field: 'social.weibo',
      input: 'string'
    },
    {
      label: 'facebook',
      field: 'social.facebook',
      input: 'string'
    },
    {
      label: 'twitter',
      field: 'social.twitter',
      input: 'string'
    },
    {
      label: 'ig',
      field: 'social.ig',
      input: 'string'
    }
  ],
  type: 'normal'
})
