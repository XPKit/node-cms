<template>
  <div class="syslog">
    <div class="buttons">
      <button class="item" @click="onClickMute">{{ (muted? 'TL_UNMUTE': 'TL_MUTE') | translate }}</button>
      <button class="item" @click="onClickClear">{{ 'TL_CLEAR' | translate }}</button>
      <input class="item search" v-model="searchKey" :placeholder="'TL_SEARCH' | translate" @input="onInputSearch">
      <button class="item" @click="onClickClearSearch">{{ 'TL_CLEAR_SEARCH' | translate }}</button>
    </div>
    <div v-if="error" class="error">
        {{ 'TL_ERROR_RETRIEVE_SYSLOG'| translate }}
    </div>
    <div class="log-viewer-wrapper" ref="log-viewer">
      <log-viewer :log="sysLog" :loading="isLoading" :height="getLogViewerHeight()" />
    </div>
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
    getLogViewerHeight () {
      return _.get(this.$refs['log-viewer'], 'offsetHeight', 100)
    },
    onInputSearch () {
      this.updateSysLog()
    },
    onClickClearSearch () {
      this.searchKey = null
      this.updateSysLog()
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
          this.sysLog = response.data

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
        this.timer = setTimeout(this.refreshLog, this.error ? 2000 : 200)
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
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: stretch;
  position: relative;
  height: 100%;
  .buttons {
    background: #292A2D;
    border-bottom: 1px solid #494C50;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    height: 30px;

    .item {
      color: #9AA0A6;
      background: transparent;
      border: 0;
      border-right: 1px solid #494C50;
      height: 100%;
      box-sizing: border-box;

      &.search {
        background-color: #35363A;
        padding-left: 10px;
        outline: none;
        width: 250px;
        &:focus {
          outline: none;
        }
      }
      &:focus, &:hover {
        background-color: #35363A;
      }
    }
  }
  .error {
    padding: 10px;
    background-color: pink;
  }
  .log-viewer-wrapper {
    position: relative;
    background-color: #222;
    display: flex;
    flex-grow: 1;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    padding: 20px 0;
    .log-viewer {
      padding: 0;
      height: 100%;
      width: 100%;
    }
  }
}
</style>
