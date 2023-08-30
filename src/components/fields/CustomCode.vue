<template>
  <div class="code-wrapper">
    <div class="label">{{ schema.label }}</div>
    <codemirror v-if="isReady" ref="input" v-model="value" :style="getStyle()" :options="cmOption" @input="onChangeData" />
  </div>
</template>

<script>
import _ from 'lodash'
import 'codemirror/keymap/sublime'
import { codemirror } from 'vue-codemirror'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/mode/htmlmixed/htmlmixed.js'
import 'codemirror/mode/css/css.js'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/dracula.css'
import AbstractField from '@m/AbstractField'

export default {
  components: {codemirror},
  mixins: [AbstractField],
  data () {
    return {
      isReady: false,
      cmOption: {
        height: 'auto',
        viewportMargin: Infinity,
        tabSize: this.getOpt('tabSize', 2),
        styleActiveLine: this.getOpt('styleActiveLine', true),
        lineNumbers: this.getOpt('lineNumbers', true),
        line: this.getOpt('line', true),
        foldGutter: this.getOpt('foldGutter', true),
        styleSelectedText: this.getOpt('styleSelectedText', true),
        mode: this.getOpt('mode', 'javascript'),
        keyMap: 'sublime',
        matchBrackets: this.getOpt('matchBrackets', true),
        showCursorWhenSelecting: this.getOpt('showCursorWhenSelecting', true),
        theme: 'dracula',
        extraKeys: { 'Ctrl': 'autocomplete' },
        hintOptions: {
          completeSingle: false
        }
      }
    }
  },
  watch: {
  },
  mounted () {
    if (_.isObject(this.value)) {
      this.value = ''
    }
    if (_.get(this.cmOption, 'mode', false) === 'json') {
      this.cmOption.mode = 'javascript'
    }
    this.isReady = true
  },
  methods: {
    getStyle () {
      return _.merge({
        height: _.get(this.schema, 'options.height', 'auto'),
        width: _.get(this.schema, 'options.width', 'auto')
      }, _.get(this.schema, 'options.css', {}))
    },
    onChangeData (data) {
      _.set(this.model, _.get(this.schema, 'model', false), data)
    }
  }

}
</script>

<style lang="scss">
.code-wrapper {
  .CodeMirror {
    height: auto;
  }
}
</style>
