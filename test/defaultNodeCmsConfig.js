module.exports = {
  ns: [],
  resources: './test/resources',
  data: './test/data',
  autoload: true,
  disableDarkMode: true,
  mode: 'normal',
  mid: '42424242',
  disableREST: false,
  disableAdmin: false,
  mountPath: '/',
  disableJwtLogin: false,
  disableAuthentication: true,
  wsRecordUpdates: true,
  auth: {
    secret: '$C&F)J@NcRfUjXn2r5u8x/A?D*G-KaPd',
  },
  disableAnonymous: false,
  session: {
    secret: 'MdjIwFRi9ezT',
    resave: true,
    saveUninitialized: true,
  },
  syslog: {
    method: 'file',
    path: './syslog.log',
  },
  smartCrop: false,
  defaultPaging: 12,
  test: true,
  replication: {
    peers: [], // Will be set dynamically in the test
    peersByResource: {
      articles: ['http://localhost:9991'],
      authors: ['http://localhost:9992'],
    },
  },
}
