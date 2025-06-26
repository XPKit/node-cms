/**
 * @fileoverview Example showing JSDoc-only approach limitations and workarounds
 */

const Cms = require('node-cms')

/**
 * @typedef {import('./lib/jsdoc-types.js').ResourceAPI} ResourceAPI
 */

class ApplicationManagerJSDocOnly {
  constructor() {
    /** @type {Cms} */
    this.cms = null
    
    /** @type {function(string): ResourceAPI} */
    this.api = null
  }

  async init(server, config) {
    try {
      this.cms = new Cms(config)
      
      // Explicit typing for better JSDoc support
      /** @type {function(string): ResourceAPI} */
      const api = this.cms.api()
      this.api = api
      
      // These will have some IntelliSense, but not as good as TypeScript
      /** @type {ResourceAPI} */
      const groupsAPI = api('_groups')
      
      // This should have basic method completion
      const adminGroup = await groupsAPI.find()
      console.warn('JSDoc result:', adminGroup)
      
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * Example method showing explicit typing
   * @param {string} groupId 
   * @returns {Promise<import('./lib/jsdoc-types.js').CMSRecord>}
   */
  async getGroup(groupId) {
    /** @type {ResourceAPI} */
    const groupsAPI = this.api('_groups')
    return await groupsAPI.find(groupId)
  }
}

module.exports = ApplicationManagerJSDocOnly
