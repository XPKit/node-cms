import axios from 'axios/dist/axios.min'

class ConfigService {
  constructor () {
    this.config = {}
  }

  async init () {
    try {
      const { data } = await axios.get('./i18n/config.json')
      this.config = data
    } catch (error) {
      console.error('Error during init of ConfigService:', error)
    }
  }
}

export default new ConfigService()
