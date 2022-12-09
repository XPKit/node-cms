require('./unit/timestamp')
require('./unit/uuid')
require('./unit/driver')
require('./unit/driver-promise')
describe('Replication', () => require('./replication'))

describe('Replication MongoDB', () => require('./replicationMongoDb'))

describe('FileStore', () => require('./file_store'))

describe('API', () => require('./api'))

describe('API V2', () => require('./apiV2'))

describe('API MongoDB', () => require('./apiMongoDb'))

describe('API XPKIT', () => require('./apiXPKIT'))

describe('Synchonization', () => require('./sync'))

describe('xlsx', () => require('./xlsx'))
