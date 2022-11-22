<template>
  <div class="syslog">
    <template v-if="isLoading">Loading...</template>
    <template v-if="!isLoading">
      <div v-if="syslog === undefined">
        sorry, syslog is not support
      </div>
      <div v-if="syslog" class="actions">
        <button @click="toggleScroll()"><i :class="{'fi-link': scrollBottom, 'fi-unlink': !scrollBottom}" /></button>
      </div>
      <pre v-if="syslog" id="log" v-html="syslog" />
    </template>
  </div>
</template>

<script>
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
      muted: false,
      syslog: undefined,
      error: false,
      scrollBottom: true,
      data: '',
      count: 0,
      destroyed: false
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
    toggleScroll () {
      this.muted = !this.muted
      this.scrollBottom = !this.scrollBottom
    },
    async refreshLog () {
      try {
        if (this.muted === false) {
          const response = await axios.get('../api/_syslog')
          this.isLoading = false
          this.error = false
          const container = this.$el.querySelector('#log')
          this.syslog = ansiHTML(response.data)
          if (container && this.scrollBottom) {
            container.scrollTop = container.scrollHeight
          }
        }
      } catch (error) {
        console.error(error)
        this.error = true
      }
      if (!this.destroyed) {
        this.timer = setTimeout(this.refreshLog, this.error ? 2000 : 200)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.syslog {
  flex: 1 1 0;
  display: flex;
  align-items: stretch;
  flex-direction: column;
  position: relative;
  .actions {
    flex-grow: 0;
    text-align: right;
    margin-right: 20px;
  }
  background: #282a36;
  color: #f8f8f2;

  pre {
    flex: 1 1 0;
    white-space: break-spaces;
    word-break: break-all;
    padding: 10px;
    margin: 0px;
    overflow-y: auto;
  }
}
</style>
