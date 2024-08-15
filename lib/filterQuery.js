const _ = require('lodash')
const through = require('through')
const sift = require('sift')
const Lru = require('lru-cache')

/*
 * Query regex support
 *
 * @example:
 *   > GET http://localhost:3000/api/articles?query={"enUS.title":{"$regex":"ko"}}
 *   < [{
 *       "_id": "hrtzk23mhpf3vze9yr2ye3vp",
 *       "_createdAt": 1392777154210,
 *       "_updatedAt": 1392802904076,
 *       "_publishedAt": 1392777322322,
 *       "_doc": {
 *         "enUS": {
 *           "_id": "hrtzk23mhpf3vze9yr2ye3vp",
 *           "title": "kong"
 *         }
 *       },
 *       "_attachments": []
 *     }]
 */
const regexCache = new Lru(40)
sift.use({
  operators: {
    regex (rx, target) {
      if (!regexCache.has(rx)) {
        regexCache.set(rx, new RegExp(rx, 'i'))
      }
      return regexCache.get(rx).test(target) ? 0 : -1
    }
  }
})

exports.filterQuery = (query, options)=> {
  // logger.warn(`filterQuery`, query, options)
  let page = options.page
  let limit = options.limit
  page = page ? parseInt(page, 10) : 1
  limit = limit ? parseInt(limit, 10) : null
  page = page < 1 ? 1 : page
  limit = (limit && limit < 1) ? 100 : limit
  let offset = limit ? (page - 1) * limit : 0
  let remainder = limit
  if (!query) {
    return through(function (data) {
      // eslint-disable-next-line eqeqeq
      if (remainder != void 0 && remainder < 0) {
        return
      }
      offset--
      if (offset < 0) {
      // eslint-disable-next-line eqeqeq
        if (remainder == void 0 || remainder > 0) {
          this.queue(data)
        }
        // eslint-disable-next-line eqeqeq
        remainder != void 0 && remainder--
      }
    })
  }
  query = sift(query)
  return through(function (data) {
    // eslint-disable-next-line eqeqeq
    if (remainder != void 0 && remainder < 0) {
      return
    }
    if (query(_.extend({}, data, data._doc))) {
      offset--
      if (offset < 0) {
      // eslint-disable-next-line eqeqeq
        if (remainder == void 0 || remainder > 0) {
          this.queue(data)
        }
        // eslint-disable-next-line eqeqeq
        remainder != void 0 && remainder--
      }
    }
  })
}
