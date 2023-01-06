<template>
  <div class="syslog">
    <div class="buttons">
      <button class="item autoscroll" :class="{active: autoscroll}" @click="onClickAutoscroll"><i v-if="autoscroll" class="fi-lock" /><i v-else class="fi-unlock" /></button>
      <button class="item clear" @click="onClickClear"><i class="fi-trash" /></button>
      <button class="item refresh" @click="onClickRefresh"><i class="fi-refresh" /></button>
      <input v-model="searchKey" class="item search" :placeholder="'TL_SEARCH' | translate" @input="onInputSearch">
      <button v-if="searchKey && searchKey.length > 0" class="item clear-search" @click="onClickClearSearch"><i class="fi-x" /></button>
      <div v-if="filterOutLines > 0" class="item filter-out"><i class="fi-target-two" />{{ filterOutLines }} lines are filter out</div>
    </div>
    <div v-if="error" class="error">
      {{ 'TL_ERROR_RETRIEVE_SYSLOG'| translate }}
    </div>
    <div ref="log-viewer" class="log-viewer-wrapper">
      <DynamicScroller
        ref="scroller"
        :items="sysLog"
        :min-item-size="14"
        class="scroller"
      >
        <template v-slot="{ item, index, active }">
          <DynamicScrollerItem
            :item="item"
            :active="active"
            :size-dependencies="[
              calculateLineNumberSpacing(item.id),
              item.line
            ]"
            :data-index="index"
          >
            <div class="line-wrapper">
              <div class="line-number">{{ item.id }}</div>
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
import axios from 'axios'

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
      searchKey: null,
      ignoreNextScrollEvent: false,
      fakeData: []
    }
  },
  async mounted () {
    this.$nextTick(() => {
      this.refreshLog()
      if (this.$refs.scroller) {
        const element = this.$refs.scroller.$el
        element.addEventListener('scroll', this.detectScroll)
      }
    })
  },
  async destroyed () {
    this.destroyed = true
    if (this.$refs.scroller) {
      const element = this.$refs.scroller.$el
      element.removeEventListener('scroll', this.detectScroll)
    }
    clearTimeout(this.timer)
  },
  methods: {
    detectScroll (event) {
      const scrollHeight = _.get(event, 'srcElement.scrollHeight', 0)
      const scrollTop = _.get(event, 'srcElement.scrollTop', 0)
      const clientHeight = _.get(event, 'srcElement.clientHeight', 0)
      if (this.ignoreNextScrollEvent) {
        this.ignoreNextScrollEvent = false
        return
      }
      this.$nextTick(() => this.autoscroll = scrollTop + clientHeight >= scrollHeight)
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
    async refreshLog () {
      try {
        const response = await axios.get('../api/_syslog', {params: {id: this.lastId}})

        this.isLoading = false
        this.error = false
        if (!_.isEmpty(response.data)) {
          this.error = false
          this.logLines.push(...response.data)
          this.lastId = _.last(this.logLines).id
          this.updateSysLog()
        }
        if (this.autoscroll) {
          this.ignoreNextScrollEvent = true
          this.$refs.scroller.scrollToBottom()
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
      let lines = _.uniqBy(this.logLines, 'id')
      if (!_.isEmpty(this.searchKey)) {
        lines = _.filter(lines, lineItem => {
          return _.includes(_.toLower(lineItem.line), _.toLower(this.searchKey))
        })
      }
      this.sysLog = lines
      this.filterOutLines = _.get(this.logLines, 'length', 0) - _.get(this.sysLog, 'length', 0)
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
    font-size: 10px;

    .item {
      color: #9AA0A6;
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
        margin-left: -23px;
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
        i:before {
          font-size: 14px;
          color: #F29900;
          margin-left: 0px;
          margin-right: 4px;
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
      padding-right: 10px;
      min-width: 42px;
      text-align: right;
      border-right: 2px solid #666;
      margin-right: 10px;
      position: absolute;
      top: 0;
      left: 0;
      font-weight: bold;
      user-select: none;
    }
    .line-content {
      margin-left: 70px;
      color: white;
      text-align: left;
      white-space: break-spaces;
    }
  }
}
</style>
