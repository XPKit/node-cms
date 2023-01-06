<template>
  <div class="syslog">
    <div class="buttons">
      <button class="item autoscroll" :class="{active: autoscroll}" @click="onClickAutoscroll">{{ 'TL_AUTO_SCROLL' | translate }}</button>
      <button class="item clear" @click="onClickClear">{{ 'TL_CLEAR' | translate }}</button>
      <input v-model="searchKey" class="item search" :placeholder="'TL_SEARCH' | translate" @input="onInputSearch">
      <button class="item clear-search" @click="onClickClearSearch">{{ 'TL_CLEAR_SEARCH' | translate }}</button>
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
    detectScroll(event) {
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
    onClickClearSearch () {
      this.searchKey = null
      this.updateSysLog()
    },
    onClickAutoscroll () {
      this.autoscroll = !this.autoscroll
    },
    onClickClear () {
      this.logLines = []
      this.sysLog = []
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

      &.autoscroll.active {
        background: black;
      }

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
