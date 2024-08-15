/*
 * Constructor
 *
 * @param {String} 8-digit machine id
 * @return {String} 24-digit uuid, that consist of timestamp, machine id and random number, all base 36
 */

function UUID (mid) {
  return function () {
    if (typeof mid === 'string' && mid.length === 8) {
      const now = Date.now()
      const uni = 2742745743360 - Math.floor(78364164096 * Math.random())
      return now.toString(36) + mid + uni.toString(36)
    }
    throw new Error('Machine id should be an 8 digit string')
  }
}


exports = module.exports = UUID
