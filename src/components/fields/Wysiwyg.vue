<template>
  <div ref="wysiwygWrapper" class="wysiwyg-wrapper">
    <field-label :schema="schema" />
    <div class="border-wrapper">
      <v-card v-if="editor" class="editor" rounded elevation="0">
        <tiptap-menu-bar class="editor__header" :editor="editor" :buttons="getButtons()" />
        <editor-content class="editor-content" :editor="editor" />
      </v-card>
    </div>
    <div v-if="showHint()" class="help-block">
      <v-icon size="small" icon="$information" />
      <span>{{ schema.options.hint }}</span>
    </div>
  </div>
</template>

<script>
  import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
  import Superscript from '@tiptap/extension-superscript'
  import StarterKit from '@tiptap/starter-kit'
  import { Editor, EditorContent } from '@tiptap/vue-3'
  import _ from 'lodash'
  import { createLowlight } from 'lowlight'
  import AbstractField from '@m/AbstractField'
  import CustomHighlight from '@m/CustomHighlight'
  import TiptapMenuBar from './TiptapMenuBar.vue'

  const lowlight = createLowlight()
  lowlight.register('javascript', CustomHighlight)

  export default {
    components: { EditorContent, TiptapMenuBar},
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
          CodeBlockLowlight.configure({
            lowlight
          })
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
        if (_.isFunction(this.schema.validator)) {
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
.wysiwyg-wrapper .editor-content pre{
  background-color: #282a36 !important;
  border-radius:4px !important;
}

/* Syntax highlighting */
.tiptap .hljs-comment,
.tiptap .hljs-quote {
  color: #616161;
}

.tiptap .hljs-variable,
.tiptap .hljs-template-variable,
.tiptap .hljs-attribute,
.tiptap .hljs-tag,
.tiptap .hljs-name,
.tiptap .hljs-regexp,
.tiptap .hljs-link,
.tiptap .hljs-name,
.tiptap .hljs-selector-id,
.tiptap .hljs-selector-class {
  color: #f98181;
}

.tiptap .hljs-number,
.tiptap .hljs-meta,
.tiptap .hljs-built_in,
.tiptap .hljs-builtin-name,
.tiptap .hljs-literal,
.tiptap .hljs-type,
.tiptap .hljs-params {
  color: #fbbc88;
}

.tiptap .hljs-string,
.tiptap .hljs-symbol,
.tiptap .hljs-bullet {
  color: #b9f18d;
}

.tiptap .hljs-title,
.tiptap .hljs-section {
  color: #faf594;
}

.tiptap .hljs-keyword,
.tiptap .hljs-selector-tag {
  color: #70cff8;
}

.tiptap .hljs-emphasis {
  font-style: italic;
}

.tiptap .hljs-strong {
  font-weight: 700;
}

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

    pre {
      background: #2e2b29;
      border-radius: .5rem;
      color: white;
      font-family: JetBrainsMono, monospace;
      margin: 1.5rem 0;
      padding: .75rem 1rem;
    }
  code {
      background: none;
      color: inherit;
      font-size: 0.8rem;
      padding: 0;
    }

    /* Code styling */
    .hljs-comment,
    .hljs-quote {
      color: #616161;
    }

    .hljs-template-variable,
    .hljs-attribute,
    .hljs-tag,
    .hljs-name,
    .hljs-regexp,
    .hljs-link,
    .hljs-name,
    .hljs-selector-id,
    .hljs-selector-class,
    .hljs-variable {
      color: #50fa7b;
    }

    .hljs-number,
    .hljs-meta,
    .hljs-built_in,
    .hljs-builtin-name,
    .hljs-type,
    .hljs-params{
      color: #fbbc88;
    }
    .hljs-literal{
      color:#bd93f9;
    }

    .hljs-symbol,
    .hljs-bullet
    {
      color: #b9f18d;
    }

    .hljs-title,
    .hljs-string,
    .hljs-section {
      color: #faf594;
      &.function_{
        color:#50fa7b;
      }
    }
    .hljs-title{
      &.class_{
        color:#50fa7b;
      }
    }
    .hljs-property,
    .hljs-attr{
      color:#66d9ef;
    }
    .hljs-keyword,
    .hljs-operator,
    .hljs-selector-tag {
      color: #ff79c6;
    }

    .hljs-emphasis {
      font-style: italic;
    }

    .hljs-strong {
      font-weight: 700;
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
