<template>
  <div class="wrapper custom-checklist">
    <div class="field-label">{{ schema.label }}</div>
    <div class="border-wrapper">
      <div v-if="schema.listBox" class="listbox form-control" :disabled="disabled">
        <div class="select-all">
          <label>
            <v-checkbox
              :id="getFieldID(schema)" :ripple="false" dense hide-details :input-value="allSelected" :label="selectAllLabel" @change="onChangeSelectAll"
            />
          </label>
        </div>
        <div v-for="(item, i) in items" :key="i" class="list-row" :class="{'is-checked': isItemChecked(item)}">
          <label>
            <v-checkbox
              :id="getFieldID(schema)" :ripple="false" dense hide-details :input-value="isItemChecked(item)" :disabled="disabled" :label="getInputName(item)" :name="getInputName(item)" @change="onChanged($event, item)"
            /></label>
        </div>
      </div>
      <div v-else class="combobox form-control" :disabled="disabled">
        <div ref="input" class="mainRow" :class="{ expanded: comboExpanded }" @click="onExpandCombo">
          <div class="node-cms-info">{{ selectedCount }} {{ 'TL_SELECTED'|translate }}</div>
          <div class="arrow" />
        </div>
        <div v-if="comboExpanded" class="dropList">
          <div v-for="(item, y) in items" :key="y" class="list-row" :class="{'is-checked': isItemChecked(item)}">
            <label>
              <v-checkbox
                :id="getFieldID(schema) + y" :ripple="false" dense hide-details :label="getInputName(item)"
                :input-value="isItemChecked(item)" :disabled="disabled" :name="getInputName(item)" @change="onChanged($event, item)"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { isObject, isNil, clone, get, map } from 'lodash'
import AbstractField from '@m/AbstractField'
import TranslateService from '@s/TranslateService'

function slugify (name = '') {
  return name
    .toString()
    .trim()
    .replace(/ /g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/([^a-zA-Z0-9-_/./:]+)/g, '')
}

export default {
  mixins: [AbstractField],
  data () {
    return {
      comboExpanded: false
    }
  },
  computed: {
    items () {
      const values = this.schema.values
      if (typeof (values) === 'function') {
        return values.apply(this, [this.model,
          this.schema])
      }
      return values
    },
    selectedCount () {
      return get(this, 'value.length', 0)
    },
    selectAllLabel () {
      return TranslateService.get(this.allSelected ? 'TL_DESELECT_ALL' : 'TL_SELECT_ALL')
    },
    allSelected () {
      return get(this.value, 'length', 0) === get(this.items, 'length', 0)
    }
  },
  methods: {

    onChangeSelectAll (checked) {
      this.value = !checked ? [] : map(this.items, (item) => this.getItem(item, 'value'))
      this.$forceUpdate()
    },
    getInputName (item) {
      let toSlugify = this.getItem(item, 'value')
      if (this.schema && this.schema.inputName && this.schema.inputName.length > 0) {
        toSlugify = `${this.schema.inputName}_${toSlugify}`
      }
      return slugify(toSlugify)
    },
    getItem (item, key) {
      if (!isObject(item)) {
        return item
      }
      if (typeof this.schema.customChecklistOptions !== 'undefined' && typeof this.schema.customChecklistOptions.value !== 'undefined') {
        return item[get(this.schema.customChecklistOptions, key, false)]
      }
      const val = get(item, key, 'undefined')
      if (typeof val !== 'undefined') {
        return val
      }
      this.newError(key)
    },
    isItemChecked (item) {
      return (this.value && this.value.indexOf(this.getItem(item, 'value')) !== -1)
    },
    onChanged (checked, item) {
      if (isNil(this.value) || !Array.isArray(this.value)) {
        this.value = []
      }
      const arr = clone(this.value)
      if (checked) {
        arr.push(this.getItem(item, 'value'))
      } else {
        arr.splice(this.value.indexOf(this.getItem(item, 'value')), 1)
      }
      this.value = arr
    },
    onExpandCombo () {
      this.comboExpanded = !this.comboExpanded
    }
  }
}
</script>

<style lang="scss">
  .custom-checklist {
    .select-all {
      label {
        color: black;
      }
    }
    .listbox, .dropList {
      height: auto;
      max-height: 150px;
      overflow: auto;
      .list-row {
        label {
          font-weight: initial;
        }
        input {
          margin-right: 0.3em;
        }
      }
    }
    .list-row {
      .theme-dark {
        &.v-label, &.v-icon {
          color: black !important;
        }
      }
    }
    .combobox {
      height: initial;
      overflow: hidden;
      .mainRow, .dropList {
        padding-left: 12px;
      }
      .mainRow {
        cursor: pointer;
        position: relative;
        padding-right: 10px;
        .arrow {
          position: absolute;
          right: 0px;
          top: 3px;
          width: 16px;
          height: 16px;
          transform: rotate(0deg);
          transition: transform 0.5s;
          background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAGdJREFUOI3tzjsOwjAURNGDUqSgTxU5K2AVrJtswjUsgHSR0qdxAZZFPrS+3ZvRzBsqf9MUtBtazJk+oMe0VTriiZCFX8nbpENMgfARjsn74vKj5IFruhfc8d6zIF9S/Hyk5HS4spMVeFcOjszaOwMAAAAASUVORK5CYII=');
          background-repeat: no-repeat;
        }
        &.expanded {
          .arrow {
            transform: rotate(-180deg);
          }
          .node-cms-info {
            padding-bottom: 0;
          }
        }
      }
      .dropList {
        transition: height 0.5s;
      }
    }
    .node-cms-info {
      user-select: none;
      padding: 12px 6px;
      font-size: 14px;
      line-height: 14px;
    }
  }
</style>
