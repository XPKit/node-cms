<template>
  <div class="code-wrapper">
    <div class="label">{{ schema.label }}</div>
    <codemirror v-if="isReady" ref="input" v-model:value="_value" :style="getStyle()" :options="cmOption" tabindex="-1" @input="onChangeData" @focus="onFieldFocus(true)" @blur="onFieldFocus(false)" />
    <div v-if="showHint()" class="help-block">
      <v-icon size="small" icon="$information" />
      <span>{{ schema.options.hint }}</span>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import Codemirror from 'codemirror-editor-vue3'
  // TODO: hugo - to fix
  // import 'codemirror/keymap/sublime'
  // import 'codemirror/mode/javascript/javascript.js'
  // import 'codemirror/addon/display/placeholder.js'
  // import 'codemirror/mode/htmlmixed/htmlmixed.js'
  // import 'codemirror/mode/css/css.js'
  // import 'codemirror/lib/codemirror.css'
  // import 'codemirror/theme/dracula.css'
  import AbstractField from '@m/AbstractField'

  export default {
    components: {Codemirror},
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
    mounted () {
      if (_.isObject(this._value)) {
        this._value = ''
      }
      if (_.get(this.cmOption, 'mode', false) === 'json') {
        this.cmOption.mode = 'javascript'
      }
      this.isReady = true
    },
    methods: {
      getStyle () {
        return _.merge({
          height: _.get(this.schema, 'options.height', '100%'),
          width: _.get(this.schema, 'options.width', '100%')
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
  .codemirror-container  {
    border-radius: 4px;
  }
}
</style>
