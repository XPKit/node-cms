<template>
  <div class="code-wrapper">
    <div class="label">{{ schema.label }}</div>
    <codemirror v-model="value" :style="getStyle()" :options="cmOption" @input="onChangeData" />
  </div>
</template>

<script>
import _ from 'lodash'
import 'codemirror/keymap/sublime'
import { codemirror } from 'vue-codemirror'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/dracula.css'
import AbstractField from '@m/AbstractField'

export default {
  components: {codemirror},
  mixins: [AbstractField],
  data () {
    return {
      cmOption: {
        height: 'auto',
        viewportMargin: Infinity,
        tabSize: this.getOpt('tabSize', 2),
        styleActiveLine: this.getOpt('styleActiveLine', true),
        lineNumbers: this.getOpt('lineNumbers', true),
        line: this.getOpt('line', true),
        foldGutter: this.getOpt('foldGutter', true),
        styleSelectedText: this.getOpt('styleSelectedText', true),
        mode: this.getOpt('mode', 'text/javascript'),
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
  methods: {
    getOpt (opt, defaultVal) {
      return _.get(this.schema, `options.${opt}`, defaultVal)
    },
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
