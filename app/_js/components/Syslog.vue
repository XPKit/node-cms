<template>
  <div class="syslog">
    <div class="buttons">
      <button @click="onClickMute">{{ (muted? 'TL_UNMUTE': 'TL_MUTE') | translate }}</button>
      <button @click="onClickClear">{{ 'TL_CLEAR' | translate }}</button>
      <input v-model="searchKey" :placeholder="'TL_SEARCH' | translate" @input="onInputSearch">
      <button @click="onClickClearSearch">{{ 'TL_CLEAR_SEARCH' | translate }}</button>
    </div>
    <div v-if="error" class="error">
      {{ 'TL_ERROR_RETRIEVE_SYSLOG'| translate }}
    </div>
    <log-viewer :log="sysLog" :loading="isLoading" />
  </div>
</template>

<script>
import _ from 'lodash'
import axios from 'axios'
import ansiHTML from 'ansi-html'

ansiHTML.setColors({
  reset: ['f8f8f2', '282a36'],
  black: 'd6d6d6',
  red: 'ff5555',
  green: '50fa7b',
  yellow: 'f1fa8c',
  blue: '6272a4',
  magenta: 'ff79c6',
  cyan: '8be9fd',
  lightgrey: 'a0a0a0',
  darkgrey: '808080'
})

export default {
  data () {
    return {
      timer: null,
      isLoading: true,
      sysLog: '',
      error: false,
      scrollBottom: true,
      data: '',
      count: 0,
      destroyed: false,
      muted: false,
      lastIndex: -1,
      logLines: [],
      searchKey: null
    }
  },
  async mounted () {
    this.refreshLog()
  },
  async destroyed () {
    this.destroyed = true
    clearTimeout(this.timer)
  },
  methods: {
    onInputSearch () {
      this.updateSysLog()
    },
    onClickClearSearch () {
      this.searchKey = ''
    },
    onClickMute () {
      this.muted = !this.muted
    },
    onClickClear () {
      this.logLines = []
      this.sysLog = ''
    },
    async refreshLog () {
      try {
        if (!this.muted) {
          const response = await axios.get('../api/_syslog', {params: {index: this.lastIndex}})
          this.isLoading = false
          this.error = false
          // this.sysLog = response.data

          if (!_.isEmpty(response.data)) {
            this.logLines.push(...response.data)
            this.lastIndex = _.last(this.logLines).index

            this.updateSysLog()
          }
        }
      } catch (error) {
        console.error(error)
        this.error = true
      }
      if (!this.destroyed) {
        this.timer = setTimeout(this.refreshLog, this.error ? 5000 : 3000)
      }
    },
    updateSysLog () {
      let lines = this.logLines
      if (!_.isEmpty(this.searchKey)) {
        lines = _.filter(lines, lineItem => {
          return _.includes(_.toLower(lineItem.line), _.toLower(this.searchKey))
        })
      }
      this.sysLog = _.map(lines, 'line').join('\n')
    }
  }
}
</script>

<style lang="scss" scoped>
.syslog {
  .error {
    padding: 10px;
    background-color: pink;
  }
}
</style>
