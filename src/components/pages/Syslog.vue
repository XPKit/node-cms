<template>
  <div class="syslog">
    <div class="buttons">
      <button class="item autoscroll" :class="{active: autoscroll}" @click="onClickAutoscroll">
        <v-icon v-if="autoscroll">mdi-lock-outline</v-icon>
        <v-icon v-else>mdi-unlock</v-icon>
      </button>
      <button class="item clear" @click="onClickClear"><v-icon>mdi-trash-can-outline</v-icon></button>
      <button class="item refresh" @click="onClickRefresh"><v-icon>mdi-refresh</v-icon></button>
      <input v-model="searchKey" :class="{'is-sift': searchKey && searchKey.search('sift:') === 0}" class="item search" :placeholder="$filters.translate('TL_SEARCH')" @input="onInputSearch">
      <button v-if="searchKey && searchKey.length > 0" class="item clear-search" @click="onClickClearSearch"><v-icon>mdi-close</v-icon></button>
      <div v-if="filterOutLines > 0" class="item filter-out"><v-icon>mdi-target</v-icon>{{ filterOutLines }} lines are filter out</div>
      <div class="item logs-raised-flags">
        <span v-if="warningQty >= 0" class="flag-item flag-warning" @click="filterLevel(1)"><v-icon>mdi-flag-outline</v-icon> {{ warningQty }}</span>
        <span v-if="errorQty >= 0" class="flag-item flag-error" @click="filterLevel(2)"><v-icon>mdi-alert-box-outline</v-icon> {{ errorQty }}</span>
      </div>
    </div>
    <div v-if="error" class="bg-error">
      {{ $filters.translate('TL_ERROR_RETRIEVE_SYSLOG') }}
    </div>
    <div ref="log-viewer" class="log-viewer-wrapper">
      <DynamicScroller
        ref="scroller"
        :items="sysLog"
        :min-item-size="14"
        class="scroller"
      >
        <template #default="{ item, index, active }">
          <DynamicScrollerItem
            :item="item"
            :active="active"
            :size-dependencies="[
              calculateLineNumberSpacing(item.id),
              item.line
            ]"
            :data-index="index"
          >
            <div class="line-wrapper" :data-line-id="item.id" :data-is-active="active">
              <div class="line-number" :class="{stickId: stickyId === item.id, search: searchKey}" @click="jumpTo(item.id)">{{ item.id }}</div>
              <div class="line-content" v-html="item.html" />
            </div>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import sift from 'sift'
import JSON5 from 'json5'

export default {
  data () {
    return {
      timer: null,
      isLoading: true,
      sysLog: [],
      error: false,
      scrollBottom: true,
      data: '',
      stickyId: -1,
      count: 0,
      destroyed: false,
      autoscroll: true,
      lastId: -1,
      tempId: 0,
      logLines: [],
      filterOutLines: [],
      searchKey: null,
      warningQty: 0,
      errorQty: 0,
      ignoreNextScrollEvent: false,
      fakeData: [],
      eventSource: false,
      processTimout: null
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.connectToLogStream()
      if (this.$refs.scroller) {
        const element = this.$refs.scroller.$el
        element.addEventListener('scroll', this.detectScroll)
      }
    })
  },
  async unmounted () {
    this.destroyed = true
    if (this.$refs.scroller) {
      const element = this.$refs.scroller.$el
      element.removeEventListener('scroll', this.detectScroll)
    }
    this.disconnectFromLogStream()
  },
  methods: {
    disconnectFromLogStream () {
      try {
        console.warn('close SSE')
        clearTimeout(this.timer)
        if (this.eventSource) {
          this.eventSource.close()
        }
      } catch (error) {}
    },
    connectToLogStream () {
      this.$loading.start('_syslog')
      this.disconnectFromLogStream ()
      this.timer = setTimeout(() => {
        this.eventSource = new EventSource(`${window.location.pathname}../api/_syslog`)
        this.eventSource.onmessage = async (event) => {
          this.$loading.stop('_syslog')
          try {
            const json = JSON.parse(event.data)
            this.logLines.push(json)
          } catch (error) {
            console.error('Failed to parse SSE:', error)
          }
          if (this.autoscroll) {
            this.ignoreNextScrollEvent = true
            if (_.get(this.$refs, 'scroller', false)) {
              this.$refs.scroller.scrollToBottom()
            }
          }
          this.updateSysLog()
        }
        this.eventSource.addEventListener('end', () => {
          this.$loading.stop('_syslog')
          this.eventSource.close()
          console.warn('Log stream ended')
        })
        this.eventSource.onerror = (error) => {
          this.$loading.stop('_syslog')
          console.error('Error in SSE connection:', error)
          this.eventSource.close()
          this.connectToLogStream()
        }
      }, 1000)
    },
    filterLevel (level) {
      this.searchKey = `sift:{level: {$gte: ${level}}}`
      this.updateSysLog()
    },
    detectScroll (event) {
      const scrollHeight = _.get(event, 'srcElement.scrollHeight', 0)
      const scrollTop = _.get(event, 'srcElement.scrollTop', 0)
      const clientHeight = _.get(event, 'srcElement.clientHeight', 0)
      if (this.ignoreNextScrollEvent) {
        this.ignoreNextScrollEvent = false
        return
      }
      this.$nextTick(() => {
        if (this.autoscroll === false && scrollTop + clientHeight >= scrollHeight) {
          this.stickyId = -1
        }
        this.autoscroll = scrollTop + clientHeight >= scrollHeight
      })
    },
    getLogViewerHeight () {
      return _.get(this.$refs['log-viewer'], 'offsetHeight', 100)
    },
    onInputSearch () {
      this.updateSysLog()
    },
    onClickRefresh () {
      this.error = false
      this.searchKey = null
      this.logLines = []
      this.sysLog = []
      this.updateSysLog()
      this.lastId = -1
    },
    onClickClearSearch () {
      this.searchKey = null
      this.updateSysLog()
    },
    onClickAutoscroll () {
      this.autoscroll = !this.autoscroll
    },
    onClickClear () {
      this.searchKey = null
      this.logLines = []
      this.sysLog = []
      this.updateSysLog()
    },
    calculateLineNumberSpacing (line) {
      return _.padStart(line, 8, '0') + ' |'
    },
    jumpTo (id) {
      if (!this.searchKey && this.stickyId !== id) {
        return
      }
      if (this.stickyId === id) {
        this.stickyId = -1
        this.autoscroll = true
        return
      }
      this.ignoreNextScrollEvent = true
      this.autoscroll = false
      this.onClickClearSearch()
      this.$nextTick(() => {
        const isActive = document.querySelector(`[data-line-id='${id}'][data-is-active='true']`)
        if (!isActive) {
          this.$refs.scroller.scrollToItem(_.findIndex(this.logLines, item => item.id === id) - 14)
        }
        this.stickyId = id
      })
    },
    async updateSysLog () {
      clearTimeout(this.processTimout)
      this.processTimout = setTimeout(()=> {
        let lines = _.uniqBy(this.logLines, 'id')
        const byLevel = _.groupBy(this.logLines, 'level')
        this.warningQty = _.get(byLevel, '[1].length', 0)
        this.errorQty = _.get(byLevel, '[2].length', 0)
        if (!_.isEmpty(this.searchKey)) {
          if (this.searchKey.search('sift:') === 0) {
            try {
              const query = JSON5.parse(this.searchKey.substr(5))
              lines = lines.filter(sift(query))
            } catch (e) { /* muted */ }
          } else {
            lines = _.filter(lines, lineItem => {
              return _.includes(_.toLower(lineItem.line), _.toLower(this.searchKey))
            })
          }
        }
        this.sysLog = lines
        this.filterOutLines = _.get(this.logLines, 'length', 0) - _.get(this.sysLog, 'length', 0)
        this.$forceUpdate()
      }, 150)
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
          font-size: 12px;
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
        width: 68px;
        i:before {
          font-size: 14px;
          color: #F29900;
          margin-left: 0px;
          margin-right: 4px;
        }
        .flag-item {
          cursor: pointer;
          width: 30px;
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
    &:before {
      position: absolute;
      left:0;
      top: 0;
      bottom: 0;
      height: 100%;
      background: rgba(72,72,72,0.2);
      width: 74px;
      display: block;
      content: '';
    }
}
  .vue-recycle-scroller {
    position: absolute;
    box-sizing: border-box;
    display: block;
    margin: 0;
    padding: 20px;
    padding-left: 0px;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: 100%;
    width: 100%;
  }
  .line-wrapper {
    font-size: 12px;
    font-family: monospace;
    position: relative;
    .line-number {
      display: inline-block;
      color: #666;
      padding-left: 20px;
      padding-right: 10px;
      min-width: 42px;
      text-align: right;
      border-right: 2px solid #666;
      margin-right: 20px;
      position: absolute;
      top: 0;
      left: 0;
      font-weight: bold;
      user-select: none;

      &.stickId {
        color: #F29900;
        border-right: 2px solid #F29900;
        background-color: #666;
        cursor: pointer;
      }
      &.search {
        &:hover {
          cursor: pointer;
          color: #F29900;
          border-right: 2px solid #F29900;
          background-color: #666;
        }
      }
    }
    .line-content {
      margin-left: 100px;
      color: white;
      text-align: left;
      white-space: break-spaces;
    }
  }
}
</style>
