<template>
  <div :id="id" class="json-editor" :disabled="disabled" />
</template>

<script>
import _ from 'lodash'
import { abstractField } from 'vue-form-generator'
import {v4 as uuid} from 'uuid'

// By importing it, it inject JSONEditor to window
// eslint-disable-next-line no-unused-vars
import JSONEditor from 'json-editor'

export default {
  mixins: [abstractField],
  data () {
    // console.log(uuid)
    return {
      id: `json-editor-${uuid()}`,
      editor: null,
      originalValue: null
    }
  },
  watch: {
    'schema.model': function () {
      const value = _.extend(this.originalValue, _.get(this.model, this.schema.model))
      this.editor.setValue(value)
      _.set(this.model, this.schema.model, value)
    }
  },
  mounted () {
    const element = document.getElementById(this.id)
    this.schema.jsonEditorOptions.title = ' '
    const options = {
      schema: this.schema.jsonEditorOptions,
      theme: 'cms',
      iconlib: 'foundation3'
    }
    if (this.disabled) {
      options.disable_array_delete = true
    }
    window.JSONEditor.defaults.themes.cms = window.JSONEditor.AbstractTheme.extend({
      getRangeInput (min, max, step) {
        // TODO: use bootstrap slider
        return this._super(min, max, step)
      },
      getGridContainer () {
        const el = document.createElement('div')
        el.className = 'json-editor-grid-container'
        return el
      },
      getGridRow () {
        const el = document.createElement('div')
        el.className = 'json-editor-grid-row'
        return el
      },
      getFormInputLabel (text) {
        const el = this._super(text)
        el.style.display = 'inline-block'
        el.style.fontWeight = 'bold'
        el.className = 'json-editor-input-label'
        return el
      },
      setGridColumnSize (el, size) {
        el.className = `span${size}`
      },
      getSelectInput (options) {
        const input = this._super(options)
        return input
      },
      getFormInputField (type) {
        const el = this._super(type)
        return el
      },
      afterInputReady (input) {
        if (input.controlgroup) {
          return
        }
        input.controlgroup = this.closest(input, '.control-group')
        input.controls = this.closest(input, '.controls')
        if (this.closest(input, '.compact')) {
          input.controlgroup.className = input.controlgroup.className.replace(/control-group/g, '').replace(/[ ]{2,}/g, ' ')
          input.controls.className = input.controlgroup.className.replace(/controls/g, '').replace(/[ ]{2,}/g, ' ')
          input.style.marginBottom = 0
        }
        if (this.queuedInputErrorText) {
          const text = this.queuedInputErrorText
          delete this.queuedInputErrorText
          this.addInputError(input, text)
        }

        // TODO: use bootstrap slider
      },
      getIndentedPanel () {
        const el = document.createElement('div')
        return el
      },
      getModal () {
        const el = document.createElement('div')
        el.style.backgroundColor = 'white'
        el.style.border = '1px solid black'
        el.style.boxShadow = '3px 3px black'
        el.style.position = 'absolute'
        el.style.zIndex = '10'
        el.style.display = 'none'
        el.style.width = 'auto'
        return el
      },
      getInfoButton (text) {
        const icon = document.createElement('span')
        icon.className = 'icon-info-sign pull-right'
        icon.style.padding = '.25rem'
        icon.style.position = 'relative'
        icon.style.display = 'inline-block'

        const tooltip = document.createElement('span')
        tooltip.style['font-family'] = 'sans-serif'
        tooltip.style.visibility = 'hidden'
        tooltip.style['background-color'] = 'rgba(50, 50, 50, .75)'
        tooltip.style.margin = '0 .25rem'
        tooltip.style.color = '#FAFAFA'
        tooltip.style.padding = '.5rem 1rem'
        tooltip.style['border-radius'] = '.25rem'
        tooltip.style.width = '25rem'
        tooltip.style.transform = 'translateX(-27rem) translateY(-.5rem)'
        tooltip.style.position = 'absolute'
        tooltip.innerText = text
        icon.onmouseover = function () {
          tooltip.style.visibility = 'visible'
        }
        icon.onmouseleave = function () {
          tooltip.style.visibility = 'hidden'
        }

        icon.appendChild(tooltip)

        return icon
      },
      getFormInputDescription (text) {
        const el = document.createElement('p')
        el.className = 'help-inline'
        el.textContent = text
        return el
      },
      getFormControl (label, input, description, infoText) {
        const ret = document.createElement('div')
        ret.className = 'control-group'

        const controls = document.createElement('div')
        controls.className = 'controls'

        if (label && input.getAttribute('type') === 'checkbox') {
          ret.appendChild(controls)
          label.className += ' checkbox'
          label.appendChild(input)
          controls.appendChild(label)
          if (infoText) {
            controls.appendChild(infoText)
          }
          controls.style.height = '30px'
        } else {
          if (label) {
            label.className += ' control-label'
            ret.appendChild(label)
          }
          if (infoText) {
            controls.appendChild(infoText)
          }
          controls.appendChild(input)
          ret.appendChild(controls)
        }

        if (description) {
          controls.appendChild(description)
        }

        return ret
      },
      getHeaderButtonHolder () {
        const el = this.getButtonHolder()
        el.className += ' btn-groups'
        return el
      },
      getButtonHolder () {
        const el = document.createElement('div')
        el.className = 'btn-group'
        return el
      },
      getButton (text, icon, title) {
        const el = this._super(text, icon, title)
        el.className += ' btn btn-default'
        return el
      },
      getTable () {
        const el = document.createElement('table')
        el.className = 'table table-bordered'
        return el
      },
      getTableCell () {
        const el = document.createElement('td')
        return el
      },
      addInputError (input, text) {
        if (!input.controlgroup) {
          this.queuedInputErrorText = text
          return
        }
        if (!input.controlgroup || !input.controls) {
          return
        }
        input.controlgroup.className += ' error'
        if (!input.errmsg) {
          input.errmsg = document.createElement('p')
          input.errmsg.className = 'help-block errormsg'
          input.controls.appendChild(input.errmsg)
        } else {
          input.errmsg.style.display = ''
        }

        input.errmsg.textContent = text
      },
      removeInputError (input) {
        if (!input.controlgroup) {
          delete this.queuedInputErrorText
        }
        if (!input.errmsg) {
          return
        }
        input.errmsg.style.display = 'none'
        input.controlgroup.className = input.controlgroup.className.replace(/\s?error/g, '')
      },
      getTabHolder (propertyName) {
        const pName = (typeof propertyName === 'undefined') ? '' : propertyName
        const el = document.createElement('div')
        el.className = 'tabbable tabs-left'
        el.innerHTML = `<ul class='nav nav-tabs'  id='${pName}'></ul><div class='tab-content well well-small' id='${pName}'></div>`
        return el
      },
      getTopTabHolder (propertyName) {
        const pName = (typeof propertyName === 'undefined') ? '' : propertyName
        const el = document.createElement('div')
        el.className = 'tabbable tabs-over'
        el.innerHTML = `<ul class='nav nav-tabs' id='${pName}'></ul><div class='tab-content well well-small'  id='${pName}'></div>`
        return el
      },
      getTab (text, tabId) {
        const el = document.createElement('li')
        el.className = 'nav-item'
        const a = document.createElement('a')
        a.setAttribute('href', `#${tabId}`)
        a.appendChild(text)
        el.appendChild(a)
        return el
      },
      getTopTab (text, tabId) {
        const el = document.createElement('li')
        el.className = 'nav-item'
        const a = document.createElement('a')
        a.setAttribute('href', `#${tabId}`)
        a.appendChild(text)
        el.appendChild(a)
        return el
      },
      getTabContentHolder (tabHolder) {
        return tabHolder.children[1]
      },
      getTopTabContentHolder (tabHolder) {
        return tabHolder.children[1]
      },
      getTabContent () {
        const el = document.createElement('div')
        el.className = 'tab-pane'
        return el
      },
      getTopTabContent () {
        const el = document.createElement('div')
        el.className = 'tab-pane'
        return el
      },
      markTabActive (row) {
        row.tab.className = row.tab.className.replace(/\s?active/g, '')
        row.tab.className += ' active'
        row.container.className = row.container.className.replace(/\s?active/g, '')
        row.container.className += ' active'
      },
      markTabInactive (row) {
        row.tab.className = row.tab.className.replace(/\s?active/g, '')
        row.container.className = row.container.className.replace(/\s?active/g, '')
      },
      addTab (holder, tab) {
        holder.children[0].appendChild(tab)
      },
      addTopTab (holder, tab) {
        holder.children[0].appendChild(tab)
      },
      getProgressBar () {
        const container = document.createElement('div')
        container.className = 'progress'

        const bar = document.createElement('div')
        bar.className = 'bar'
        bar.style.width = '0%'
        container.appendChild(bar)

        return container
      },
      updateProgressBar (progressBar, progress) {
        if (!progressBar) {
          return
        }

        progressBar.firstChild.style.width = `${progress}%`
      },
      updateProgressBarUnknown (progressBar) {
        if (!progressBar) {
          return
        }

        progressBar.className = 'progress progress-striped active'
        progressBar.firstChild.style.width = '100%'
      }
    })

    this.editor = new window.JSONEditor(element, options)
    this.originalValue = this.editor.getValue()
    if (this.disabled) {
      this.editor.disable()
    }
    this.editor.on('ready', () => {
      const value = _.extend(this.originalValue, _.get(this.model, this.schema.model))
      this.editor.setValue(value)
      _.set(this.model, this.schema.model, value)
    })
    this.editor.on('change', () => {
      const value = this.editor.getValue()
      _.set(this.model, this.schema.model, value)
    })
  },
  methods: {
  }
}
</script>
