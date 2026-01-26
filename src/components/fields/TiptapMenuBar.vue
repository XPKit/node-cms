<template>
  <div v-if="menuBarButtons && menuBarButtons.length > 0" class="toolbar" tabindex="-1">
    <tiptap-menu-item v-for="(button, index) in menuBarButtons" :key="index" v-bind="button" />
  </div>
</template>

<script>
import _ from 'lodash'
import TiptapMenuItem from './TiptapMenuItem.vue'

export default {
  components: {
    TiptapMenuItem,
  },
  props: {
    editor: {
      type: Object,
      required: true,
    },
    buttons: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      menuBarButtons: false,
      defaultButtons: [
        {
          icon: '$formatBold',
          title: 'Bold',
          action: () => this.editor.chain().focus().toggleBold().run(),
          isActive: () => this.editor.isActive('bold'),
        },
        {
          icon: '$formatItalic',
          title: 'Italic',
          action: () => this.editor.chain().focus().toggleItalic().run(),
          isActive: () => this.editor.isActive('italic'),
        },
        {
          icon: '$formatStrikethrough',
          title: 'Strike through',
          action: () => this.editor.chain().focus().toggleStrike().run(),
          isActive: () => this.editor.isActive('strike'),
        },
        {
          icon: '$formatParagraph',
          title: 'Paragraph',
          action: () => this.editor.chain().focus().setParagraph().run(),
          isActive: () => this.editor.isActive('paragraph'),
        },
        {
          icon: '$formatListBulleted',
          title: 'Bullet List',
          action: () => this.editor.chain().focus().toggleBulletList().run(),
          isActive: () => this.editor.isActive('bulletList'),
        },
        {
          icon: '$formatListNumbered',
          title: 'Ordered List',
          action: () => this.editor.chain().focus().toggleOrderedList().run(),
          isActive: () => this.editor.isActive('orderedList'),
        },
        {
          icon: '$formatSuperscript',
          title: 'Superscript',
          action: () => this.editor.chain().focus().toggleSuperscript().run(),
        },
        {
          icon: '$formatHeader1',
          title: 'Heading 1',
          action: () => this.editor.chain().focus().toggleHeading({ level: 1 }).run(),
          isActive: () => this.editor.isActive('heading', { level: 1 }),
        },
        {
          icon: '$formatHeader2',
          title: 'Heading 2',
          action: () => this.editor.chain().focus().toggleHeading({ level: 2 }).run(),
          isActive: () => this.editor.isActive('heading', { level: 2 }),
        },
        {
          icon: '$formatHeader3',
          title: 'Heading 3',
          action: () => this.editor.chain().focus().toggleHeading({ level: 3 }).run(),
          isActive: () => this.editor.isActive('heading', { level: 3 }),
        },
        {
          icon: '$formatUnderline',
          title: 'Underline',
          action: () => this.editor.chain().focus().toggleUnderline().run(),
          isActive: () => this.editor.isActive('underline'),
        },
        {
          icon: '$link',
          title: 'Link',
          action: () => this.setLink(),
          isActive: () => this.editor.isActive('link'),
        },
        {
          icon: '$formatQuoteOpen',
          title: 'Quote',
          action: () => this.editor.chain().focus().toggleBlockquote().run(),
          isActive: () => this.editor.isActive('blockquote'),
        },
        {
          icon: '$xml',
          title: 'Code',
          action: () => this.editor.chain().focus().toggleCodeBlock({ language: 'javascript' }).run(),
          isActive: () => this.editor.isActive('codeBlock'),
        },
        {
          icon: '$formatClear',
          title: 'Clear Format',
          action: () => this.editor.chain().focus().clearNodes().unsetAllMarks().run(),
        },
        {
          icon: '$minus',
          title: 'Horizontal Rule',
          action: () => this.editor.chain().focus().setHorizontalRule().run(),
        },
        {
          icon: '$arrowULeftTop',
          title: 'Undo',
          action: () => this.editor.chain().focus().undo().run(),
        },
        {
          icon: '$arrowURightTop',
          title: 'Redo',
          action: () => this.editor.chain().focus().redo().run(),
        },
      ],
      options: ['italic', 'bold'],
    }
  },
  mounted() {
    if (this.buttons.length > 0) {
      this.menuBarButtons = _.filter(this.defaultButtons, (button) =>
        _.includes(this.buttons, _.kebabCase(button.title)),
      )
    } else {
      this.menuBarButtons = this.defaultButtons
    }
  },
  methods: {
    setLink() {
      const previousUrl = this.editor.getAttributes('link').href
      const url = window.prompt('URL', previousUrl)
      // cancelled
      if (url === null) {
        return
      } else if (url === '') {
        // empty
        this.editor.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }
      // update link
      this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    },
  },
}
</script>

<style lang="scss" scoped>
.toolbar {
  padding: 4px 8px;
  display: flex;
  gap: 2px;
}
</style>
