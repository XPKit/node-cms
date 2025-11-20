<template>
  <div ref="wysiwygWrapper" class="wysiwyg-wrapper">
    <field-label :schema="schema" />
    <div class="border-wrapper">
      <v-card v-if="editor" class="editor" rounded elevation="0">
        <tiptap-menu-bar class="editor__header" :editor="editor" :buttons="getButtons()" />
        <editor-content class="editor-content" :editor="editor" />
      </v-card>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import { Editor, EditorContent } from '@tiptap/vue-3'
  import StarterKit from '@tiptap/starter-kit'
  import Superscript from '@tiptap/extension-superscript'
  import Link from '@tiptap/extension-link'
  import Underline from '@tiptap/extension-underline'
  import TiptapMenuBar from './TiptapMenuBar.vue'
  import AbstractField from '@m/AbstractField'

  export default {
    components: { EditorContent, TiptapMenuBar },
    mixins: [AbstractField],
    data () {
      return {
        loaded: false,
        key: null,
        editor: null
      }
    },
    watch: {
      model () {
        this.updateObj()
      }
    },
    mounted () {
      this.editor = new Editor({
        content: this._value,
        extensions: [
          StarterKit.configure({history: true, code: true, blockquote: true}),
          Superscript,
          Underline,
          Link
        ],
        onUpdate: () => {
          const val = this.editor.getHTML()
          this.$emit('change', val)
          this._value = val
        },
        onFocus: ()=> {
          this.onFieldFocus(true)
        },
        onBlur: ()=> {
          this.onFieldFocus(false)
        }
      })
      this.loaded = true
      this.updateObj()
    },
    created () {
    },
    methods: {
      validateField () {
        const val = this.editor ? this.editor.getHTML() : ''
        if (this.schema.required && (_.isNull(val) || _.isUndefined(val) || val === '')) {
          return false
        }
        if (this.schema.validator && _.isFunction(this.schema.validator)) {
          return !!this.schema.validator(val, this.schema.model, this.model)
        }
        return true
      },
      getButtons() {
        return _.get(this.schema, 'options.buttons', [])
      },
      getColorForToolbar () {
        return this.$vuetify.theme.dark ? 'black' : 'white'
      },
      onInit () {
        setTimeout(() => {
          const elems = _.get(this.$refs.wysiwygWrapper, 'children[1].children[0].children[0].children[0].children[0].children[0].children', [])
          _.each(elems, (elem) => {
            elem.tabIndex = -1
            _.each(elem.children, (children) => {
              children.tabIndex = -1
              _.each(children.children, (c) => {
                c.tabIndex = -1
              })
            })
          })
        }, 10)
      },
      updateObj () {
        if (!_.get(this.schema, 'model', false)) {
          return false
        }
        this.loaded = true
      }
    }
  }
</script>
<style lang="scss">
@use '@a/scss/variables.scss' as *;

.wysiwyg-wrapper {
  position: relative;
  .border-wrapper {
    padding: 0;
    border: none;
  }
  .editor {
    background-color: $wysiwyg-editor-background;
    border-radius: 0 !important;
  }
  .editor__header {
    flex-wrap: wrap;
    background-color: $wysiwyg-toolbar-background;
    border: 2px solid $wysiwyg-toolbar-border;
  }
  .editor-content {
    margin: 16px;
    font-size: 14px;
    font-style: normal;
    font-weight: 300;
    line-height: normal;
    cursor: text;
    * {
      font-synthesis: initial !important;
      -webkit-synthesis: initial !important;
      font-smooth: antialiased !important;
      -webkit-font-smooth: antialiased !important;
    }
    strong {
      font-weight: 700;
    }
    a {
      color: $imag-blue;
    }
    ul li {
      list-style: disc;
    }
    ol li {
      list-style: decimal;
    }
    blockquote {
      padding-left: 1rem;
      border-left: 3px solid rgba(#0D0D0D, 0.1);
    }
  }
  .ProseMirror:focus {
    outline: none;
  }
  .editor-content {
    .tiptap {
      p {
        margin-bottom: 8px;
        &:last-child {
          margin-bottom: 0;
        }
      }
      ul, ol {
        padding-left: 16px;
        position: relative;
        list-style-position: inside;
      }
    }
  }
}
.v-theme--dark {
  .wysiwyg-wrapper {
    .editor-content {
      blockquote {
        border-color: rgba(white, 0.1);
      }
    }
  }
}

</style>
