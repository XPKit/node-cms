import RequestService from '@s/RequestService'

class ConfigService {
  constructor () {
    this.config = {}
  }

  async init () {
    try {
      this.config = await RequestService.get(`${window.location.pathname}config`)
      // console.warn('Config:', data)
    } catch (error) {
      console.error('Error during init of ConfigService:', error)
    }
  }
}

export default new ConfigService()
