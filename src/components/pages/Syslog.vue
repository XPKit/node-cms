<template>
  <div class="syslog">
    <div class="buttons">
      <button class="item autoscroll" :class="{active: autoscroll}" @click="onClickAutoscroll">
        <v-icon v-if="autoscroll" icon="$lockOutline" />
        <v-icon v-else icon="$lockOpenOutline" />
      </button>
      <button class="item clear" @click="onClickClear"><v-icon icon="$trashCanOutline" /></button>
      <button class="item refresh" @click="onClickRefresh"><v-icon icon="$refresh" /></button>
      <input v-model="searchKey" :class="{'is-sift': searchKey && searchKey.search('sift:') === 0}" class="item search" :placeholder="$filters.translate('TL_SEARCH')" @input="onInputSearch">
      <button v-if="searchKey && searchKey.length > 0" class="item clear-search" @click="onClickClearSearch"><v-icon icon="$close" /></button>
      <div v-if="filterOutLines > 0" class="item filter-out"><v-icon icon="$target" />{{ filterOutLines }} lines are filter out</div>
      <div class="item logs-raised-flags">
        <span v-if="warningQty >= 0" class="flag-item flag-warning" @click="filterLevel(1)"><v-icon icon="$flagOutline" /> {{ warningQty }}</span>
        <span v-if="errorQty >= 0" class="flag-item flag-error" @click="filterLevel(2)"><v-icon icon="$alertBoxOutline" /> {{ errorQty }}</span>
      </div>
    </div>
    <div class="log-viewer-wrapper">
      <div v-if="error" class="error-syslog">
        {{ $filters.translate('TL_ERROR_RETRIEVE_SYSLOG') }}
      </div>
      <RecycleScroller
        ref="virtualScroller"
        v-slot="{ item }"
        class="scroller"
        :items="currentDisplayableLines"
        :item-size="20"
        key-field="id"
        @scroll="detectScroll"
      >
        <div class="log-line" :class="{ 'selected': selectedLineId === item.id }">
          <span class="line-number" @click="onLineNumberClick(item.id, $event)">{{ item.id }}</span>
          <div class="line-content" v-html="highlightLogLine(item)" />
        </div>
      </RecycleScroller>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import sift from 'sift'
  import JSON5 from 'json5'
  import stripAnsi from 'strip-ansi'

  export default {
    data () {
      return {
        timer: null,
        isLoading: true,
        sysLog: [],
        error: false,
        scrollBottom: true,
        data: '',
        count: 0,
        destroyed: false,
        autoscroll: true,
        lastId: -1,
        tempId: 0,
        logLines: [],
        filterOutLines: 0,
        searchKey: '',
        warningQty: 0,
        errorQty: 0,
        ignoreNextScrollEvent: false,
        fakeData: [],
        eventSource: false,
        processTimeout: null,
        currentDisplayableLines: [],
        targetLogIdAfterClear: null,
        isHandlingGutterClick: false,
        selectedLineId: null,
        shouldScrollToSelectedLine: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 10,
        colors: {
          1: '#A00', // error
          3: '#d1a600', // warn
          5: '#A0A', // debug
          6: '#0AA', // info
          8: '#555', // trace/verbose
        }
      }
    },
    async mounted () {
      await this.$nextTick()
      this.connectToLogStream()
      await this.$nextTick()
    },
    async unmounted () {
      this.destroyed = true
      this.disconnectFromLogStream()
    },
    methods: {
      onLineNumberClick(id) {
        this.selectedLineId = id
        this.autoscroll = false
        this.searchKey = ''
        this.shouldScrollToSelectedLine = true
        this.updateSysLog()
      },
      highlightLogLine(lineOrItem) {
        return lineOrItem ? _.get(lineOrItem, 'html', _.get(lineOrItem, 'line', lineOrItem)) : ''
      },
      disconnectFromLogStream () {
        try {
          clearTimeout(this.timer)
          if (this.eventSource) {
            this.eventSource.close()
          }
        } catch (error) {
          console.error(`Error disconnecting from log stream: ${error.message}`)
        }
      },
      scrollToBottomIfEnabled () {
        if (this.isHandlingGutterClick) {
          return
        }
        if (this.shouldScrollToLastLog()) {
          this.ignoreNextScrollEvent = true
          this.$nextTick(() => {
            const lastIndex = this.currentDisplayableLines.length - 1
            try {
              this.$refs.virtualScroller.scrollToItem(lastIndex)
            } catch (error) {
              console.error('Failed to scroll to bottom:', error)
            }
          })
        }
      },
      connectToLogStream () {
        this.$loading.start('_syslog')
        this.disconnectFromLogStream()
        this.timer = setTimeout(() => {
          this.eventSource = new EventSource(`${window.location.pathname}../api/_syslog`)
          this.eventSource.onmessage = async (event) => {
            this.$loading.stop('_syslog')
            this.reconnectAttempts = 0
            try {
              const json = JSON.parse(event.data)
              if (_.get(json, 'id', false) && _.get(json, 'line', false)) {
                json.size = _.get(`${this.calculateLineNumberSpacing(json.id)} ${json.line}`, 'length', 0)
                if (json.size > 0) {
                  this.logLines.push(json)
                  this.error = false
                }
              }
            } catch (error) {
              console.error('Failed to parse SSE:', error)
            }
            if (!this.isHandlingGutterClick) {
              if (this.autoscroll) {
                this.ignoreNextScrollEvent = true
                this.scrollToBottomIfEnabled()
              }
              this.updateSysLog()
            }
          }
          this.eventSource.addEventListener('end', () => {
            this.$loading.stop('_syslog')
            this.eventSource.close()
            console.warn('Log stream ended')
          })
          this.eventSource.onerror = (error) => {
            this.$loading.stop('_syslog')
            this.error = "Error in SSE connection"
            console.error(`${this.error}:`, error)
            this.eventSource.close()
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              this.reconnectAttempts++
              const reconnectDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
              console.warn(`Attempting to reconnect in ${reconnectDelay}ms (attempt ${this.reconnectAttempts})`)
              setTimeout(() => this.connectToLogStream(), reconnectDelay)
            } else {
              this.error = 'Failed to connect to syslog stream after multiple attempts.'
              console.error(this.error)
            }
          }
        }, 1000)
      },
      filterLevel (level) {
        this.searchKey = `sift:{level: {$gte: ${level}}}`
        this.updateSysLog()
      },
      async detectScroll () {
        if (this.ignoreNextScrollEvent) {
          this.ignoreNextScrollEvent = false
          return
        }
        if (this.isHandlingGutterClick) {
          return
        }
        const scrollerEl = this.$refs.virtualScroller?.$el
        if (!scrollerEl) {
          return
        }
        const scrollHeight = scrollerEl.scrollHeight
        const scrollTop = scrollerEl.scrollTop
        const clientHeight = scrollerEl.clientHeight
        await this.$nextTick()
        if (scrollTop + clientHeight >= scrollHeight - 1) {
          if (_.isEmpty(this.searchKey) && !this.isHandlingGutterClick) {
            this.autoscroll = true
          }
        } else {
          if (!this.isHandlingGutterClick) {
            this.autoscroll = false
          }
        }
      },
      onInputSearch () {
        this.selectedLineId = null
        this.updateSysLog()
      },
      clearFiltering() {
        this.searchKey = ''
        this.isHandlingGutterClick = false
      },
      onClickRefresh () {
        this.error = false
        this.logLines = []
        this.sysLog = []
        this.clearFiltering()
        this.updateSysLog()
        this.lastId = -1
      },
      onClickClearSearch () {
        this.clearFiltering()
        this.updateSysLog()
      },
      shouldScrollToLastLog() {
        return this.autoscroll && this.$refs.virtualScroller && _.isArray(this.currentDisplayableLines) && this.currentDisplayableLines.length > 0
      },
      onClickAutoscroll () {
        this.autoscroll = !this.autoscroll
        if (this.shouldScrollToLastLog()) {
          this.$nextTick(() => {
            const lastIndex = this.currentDisplayableLines.length - 1
            try {
              this.$refs.virtualScroller.scrollToItem(lastIndex)
            } catch (error) {
              console.error('Failed to scroll to bottom on autoscroll:', error)
            }
          })
        }
      },
      onClickClear () {
        this.logLines = []
        this.sysLog = []
        this.clearFiltering()
        this.updateSysLog()
      },
      calculateLineNumberSpacing (line) {
        return _.padStart(line, 8, '0') + ' |'
      },
      filterLinesBySearch(lines) {
        const lowerSearchKey = _.toLower(this.searchKey)
        if (this.searchKey && this.searchKey.search('sift:') === 0) {
          try {
            const query = JSON5.parse(this.searchKey.substr(5))
            return lines.filter(sift(query))
          } catch (error) {
            console.error('Error parsing sift query:', error)
          }
        } else if (!_.isEmpty(this.searchKey)) {
          return _.filter(lines, lineItem => {
            const lineContent = _.isString(lineItem.line) ? lineItem.line : ''
            const strippedLine = stripAnsi(lineContent)
            return _.includes(_.toLower(strippedLine), lowerSearchKey)
          })
        }
      },
      async updateSysLog () {
        clearTimeout(this.processTimeout)
        this.processTimeout = setTimeout(async () => {
          let lines = _.uniqBy(this.logLines, 'id')
          const byLevel = _.groupBy(this.logLines, 'level')
          this.warningQty = _.get(byLevel, '[1].length', 0)
          this.errorQty = _.get(byLevel, '[2].length', 0)
          let shouldPositionToTarget = this.targetLogIdAfterClear !== null
          let targetLogId = this.targetLogIdAfterClear
          let selectedLogId = null
          if (shouldPositionToTarget && targetLogId !== null) {
            selectedLogId = targetLogId
            this.targetLogIdAfterClear = null
          } else if (this.selectedLineId) {
            selectedLogId = this.selectedLineId
          }
          if (!_.isEmpty(this.searchKey)) {
            lines = this.filterLinesBySearch(lines)
          }
          this.currentDisplayableLines = lines
          this.filterOutLines = _.get(this.logLines, 'length', 0) - _.get(this.currentDisplayableLines, 'length', 0)
          if (!this.$refs.virtualScroller) {
            return this.$forceUpdate()
          }
          if (this.isHandlingGutterClick && !shouldPositionToTarget) {
            return
          }
          if (selectedLogId) {
            await this.$nextTick()
            let targetIdx = _.findIndex(this.currentDisplayableLines, {id: selectedLogId})
            if (targetIdx === -1) {
              this.currentDisplayableLines = _.uniqBy(this.logLines, 'id')
              await this.$nextTick()
              targetIdx = _.findIndex(this.currentDisplayableLines, {id: selectedLogId})
            }
            if (targetIdx !== -1) {
              try {
                this.selectedLineId = selectedLogId
                if (this.shouldScrollToSelectedLine) {
                  this.$refs.virtualScroller.scrollToItem(targetIdx - 15)
                  this.shouldScrollToSelectedLine = false
                }
                setTimeout(() => {
                  if (shouldPositionToTarget) {
                    this.isHandlingGutterClick = false
                  }
                }, 50)
              } catch (error) {
                console.error('Error scrolling to selected line after update:', error)
              }
            }
          }
          if (!selectedLogId || !this.isHandlingGutterClick) {
            this.scrollToBottomIfEnabled()
          }
          this.$forceUpdate()
        }, 300)
      }
    },
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
  .search {
    background: transparent;
  }
  .buttons {
    background: #292A2D;
    border-bottom: 1px solid #494C50;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    height: 30px;
    font-size: 10px;
    .item {
      color: #9AA0A6;
      width: 30px;
      background: transparent;
      border: 0;
      border-right: 1px solid #494C50;
      height: 100%;
      box-sizing: border-box;
      i {
        &:before {
          font-size: 16px;
          color: white;
          margin-left: 6px;
          margin-right: 4px;
        }
      }
      &.clear-search {
        margin-left: -30px;
        i:before {
          margin: 0;
          font-size: 12px;
          color: white;
        }
      }
      &.filter-out {
        font-size: 11px;
        border: 1px solid #494C50;
        padding: 5px;
        margin: 5px;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-content: center;
        justify-content: center;
        align-items: center;
        height: 80%;
        width: 180px;
        i:before {
          font-size: 14px;
          color: #F29900;
          margin-left: 0px;
          margin-right: 4px;
        }
      }
      &.logs-raised-flags {
        font-size: 11px;
        border: 1px solid #494C50;
        padding: 5px;
        margin: 5px;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-content: center;
        justify-content: center;
        align-items: center;
        height: 80%;
        width: auto;
        i:before {
          font-size: 14px;
          color: #F29900;
          margin-left: 0px;
          margin-right: 4px;
        }
        .flag-item {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-size: 10px;
          line-height: 10px;
          &.flag-error {
            i:before {
              color: #fa5050;
            }
          }
          &.flag-warning {
            margin-right: 8px;
            i:before {
              color: #fab650;
            }
          }
        }
      }
      &.autoscroll.active {
        background: black;
      }
      &.search {
        background-color: #35363A;
        padding-left: 10px;
        outline: none;
        width: 250px;
        color: white;
        padding-right: 20px;
        &.is-sift {
          color: #50fa7b;
        }
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
    flex-grow: 1;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    flex-grow: 1;
    .scroller {
      height: 100%;
      width: 100%;
      background-color: #222;
    }
    .log-line {
      display: flex;
      font-family: monospace;
      font-size: 12px;
      line-height: 20px;
      color: #ccc;
      cursor: pointer;
      border-left: 3px solid transparent;

      &:hover {
        background-color: #333;
      }
      &.selected {
        font-weight: 900 !important;
        box-shadow: 0 0 8px 2px #ffe082;
      }
      .line-number {
        display: inline-block;
        width: 74px;
        text-align: right;
        background-color: rgba(72,72,72,0.2);
        color: #999;
        padding-right: 8px;
        cursor: pointer;
        user-select: none;
        flex-shrink: 0;

        &:hover {
          background-color: #35363A;
          color: #ffb300;
        }
      }
      .line-content {
        flex: 1;
        padding-left: 8px;
        white-space: pre;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
    }
  }
  :deep(.v-input.is-sift .v-field__input) {
    color: #50fa7b;
  }
  .compact-chip {
    height: 20px !important;
    font-size: 10px !important;
    padding: 0 6px !important;
  }
  .compact-chip .v-icon {
    font-size: 14px !important;
    margin-right: 4px !important;
  }
  .filter-chip {
    background-color: rgba(255, 152, 0, 0.1) !important;
    border-color: #ff9800 !important;
    color: #ffcc80 !important;
  }
  .filter-chip .v-icon {
    color: #ff9800 !important;
  }
  .paused-chip {
    background-color: rgba(255, 235, 59, 0.1) !important;
    border-color: #ffeb3b !important;
    color: #fff9c4 !important;
  }
  .paused-chip .v-icon {
    color: #ffeb3b !important;
  }
  .warning-chip {
    background-color: rgba(255, 193, 7, 0.1) !important;
    border-color: #ffc107 !important;
    color: #fff8e1 !important;
  }
  .warning-chip .v-icon {
    color: #ffc107 !important;
  }
  .error-chip {
    background-color: rgba(244, 67, 54, 0.1) !important;
    border-color: #f44336 !important;
    color: #ffcdd2 !important;
  }
  .error-chip .v-icon {
    color: #f44336 !important;
  }
  .compact-alert {
    padding: 4px 12px !important;
    font-size: 12px !important;
  }
}
.error-syslog {
  text-align: center;
  color: white;
  background-color: #89000085;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1;
}

</style>
