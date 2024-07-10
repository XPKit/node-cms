<template>
  <div id="omnibar" v-shortkey="getShortcuts()" @shortkey="interactiveSearch">
    <div id="omnibar-backdrop" :class="{displayed: showOmnibar}" @click="showHideOmnibar(false)" />
    <v-card v-show="showOmnibar" elevation="24">
      <v-card-title class="search">
        <v-text-field
          ref="search" v-model="search" class="search-bar" flat variant="solo-filled" rounded hide-details prepend-inner-icon="mdi-magnify" density="compact" :placeholder="$filters.translate('TL_INSERT_KEYWORDS')"
          type="text" autocomplete="off" name="search" :prefix="searchMode === 'all' ? '' : `${searchMode}:`"
        />
      </v-card-title>
      <template v-if="results && results.length > 0">
        <v-divider />
        <div ref="scrollWrapper" class="scroll-wrapper" :class="{'scrolled-to-bottom': scrolledToBottom || results.length < 20}" @scroll="onScroll">
          <v-list density="compact">
            <v-list-item v-for="(item, i) in results" :id="'result-' + i" :key="i" class="list" :class="{highlighted: highlightedItem === i}" :ripple="false" @click="selectResult(i)">
              <v-list-item-title>
                <v-icon size="small">{{ getIconForResult(item) }}</v-icon>
                <span v-html="item.html" />
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
      </template>
    </v-card>
  </div>
</template>

<script>
import _ from 'lodash'
import fuzzysort from 'fuzzysort'
import FieldSelectorService from '@s/FieldSelectorService'
import Notification from '@m/Notification.vue'

export default {
  mixins: [Notification],
  props: {
    selectResourceCallback: {
      type: Function,
      default: () => {}
    },
    groupedList: {
      type: Array,
      default: () => []
    },
    selectedItem: {
      type: Object,
      default: () => {}
    }
  },
  data () {
    return {
      showOmnibar: false,
      search: null,
      scrolledToBottom: false,
      resourcesList: [],
      results: [],
      highlightedItem: 0,
      searchModes: ['all', 'resource', 'field'],
      searchMode: 'all',
      shortcutsWhenClosed: {
        'open': ['ctrl', 'p']
      },
      shortcuts: {
        'esc': ['esc'],
        'open': ['ctrl', 'p'],
        'arrow-up': ['arrowup'],
        'arrow-down': ['arrowdown'],
        'enter': ['enter'],
        'all': ['shift', 'a'],
        'resource': ['shift', 'r'],
        'field': ['shift', 'f']
      },
      searchOptions: {
        keys: ['displayname'],
        scoreFn: a => {
          if (!a[0]) {
            return -10000000
          }
          return a[0].score + (this.isResultInCurrentResource(a) ? 10000000 : 0)
        }
      }
    }
  },
  watch: {
    search () {
      this.highlightedItem = 0
      this.results = []
      const results = fuzzysort.go(this.search, this.getDataForSearch(), this.searchOptions)
      this.results = _.compact(_.map(results, (result, i) => {
        if (_.isNull(_.get(result, '[0]', null))) {
          return false
        }
        result.obj.html = fuzzysort.highlight(result[0])
        result.obj.score = result.score
        return result.obj
      }))
      // console.warn('RESULTS =', _.map(this.results, (result) => `${result.displayname} - ${result.score}`))
    }
  },
  mounted () {
    this.resourcesList = _.map(_.flatten(_.map(this.groupedList, 'list')), (resource) => {
      if (_.isString(resource)) {
        return resource
      }
      resource.type = 'resource'
      resource.displayname = _.get(resource, 'displayname.enUS', _.get(resource, 'displayname', resource.title))
      return resource
    })
    this.fieldsList = _.flatten(_.map(this.resourcesList, (resource) => {
      return _.map(resource.schema, (field) => {
        field.resource = resource
        field.displayname = `${resource.displayname}.${_.get(field, 'label.enUS', _.get(field, 'label', field.field))}`
        field.type = 'field'
        return field
      })
    }))
  },
  methods: {
    getShortcuts () {
      return this.showOmnibar ? this.shortcuts : this.shortcutsWhenClosed
    },
    onScroll ({ target: { scrollTop, clientHeight, scrollHeight } }) {
      this.scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50
    },
    isResultInCurrentResource (result) {
      return _.startsWith(_.get(result[0], 'target', ''), _.get(this.selectedItem, 'displayname', ''))
    },
    getDataForSearch () {
      if (this.searchMode === 'all') {
        return _.concat(this.resourcesList, this.fieldsList)
      }
      return this.searchMode === 'resource' ? this.resourcesList : this.fieldsList
    },
    getIconForResult (result) {
      return this.getIcon(this.searchMode === 'all' ? result.type : this.searchMode)
    },
    getIcon (type) {
      return `mdi-${type === 'resource' ? 'package' : 'cursor-text'}`
    },
    isCharHighlighted (result, i) {
      return _.includes(_.values(result._indexes), i)
    },
    showHideOmnibar (display) {
      this.showOmnibar = display
      this.setSearchMode('all')
      if (display) {
        this.$nextTick(() => {
          const elem = _.get(this.$refs, '[\'search\']', false)
          elem.focus()
        })
      }
      this.sendOmnibarDisplayStatus(display)
    },
    selectResult (i = -1) {
      const result = _.get(this.results, `[${i === -1 ? this.highlightedItem : i}]`, false)
      if (!result) {
        return
      }
      const resultResource = _.includes(['resource', 'plugin'], result.type) ? result : result.resource
      if (resultResource !== this.selectedItem) {
        console.info(`Switching to resource ${resultResource.title}`)
        this.selectResourceCallback(resultResource)
      } else if (result.type === 'field') {
        FieldSelectorService.events.emit('select', _.omit(result, 'resource'))
      }
      this.showHideOmnibar(false)
    },
    setSearchMode (mode) {
      this.searchMode = mode
      this.search = ''
    },
    scrollToResult (result) {
      const elem = document.getElementById(`result-${this.highlightedItem}`)
      if (elem) {
        elem.scrollIntoView()
      }
    },
    async interactiveSearch (event) {
      const action = _.get(event, 'srcKey', false)
      if (!action) {
        return
      }
      if (!this.showOmnibar) {
        if (action === 'open') {
          this.showHideOmnibar(true)
        }
        return
      }
      if (action === 'esc' || action === 'open') {
        this.showHideOmnibar(false)
      } else if (action === 'arrow-up') {
        if (this.highlightedItem - 1 >= 0) {
          this.highlightedItem -= 1
        } else {
          this.highlightedItem = 0
        }
        this.scrollToResult()
      } else if (action === 'arrow-down') {
        if (this.highlightedItem + 1 <= this.results.length - 1) {
          this.highlightedItem += 1
        } else {
          this.highlightedItem = this.results.length - 1
        }
        this.scrollToResult()
      } else if (action === 'enter') {
        this.selectResult()
      } else if (_.includes(this.searchModes, action)) {
        this.setSearchMode(action)
      }
    }

  }
}
</script>
<style lang="scss">
@import '@a/scss/variables.scss';

#omnibar, #omnibar-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  touch-action: none;
}
#omnibar {
  .v-list {
    padding: 0;
    max-height: 65vh;
    padding-top: 16px;
  }
  .v-list-item {
    min-height: 26px;
    // padding-top: 8px;
    // padding-bottom: 8px;
    .v-list-item-title {
      @include cta-text;
      font-weight: normal;
      font-style: normal;
    }
    .v-list-item__content {
      border-radius: 100px;
      padding: 4px 8px;
      .v-icon {
        margin-right: 8px;
        width: 18px;
        height: 18px;
      }
    }
    &.highlighted {
      .v-list-item__content {
        color: $imag-white;
        background-color: $imag-purple;
        .v-icon {
          color: $imag-black;
        }
      }
    }
    &:hover:not(.highlighted) {
      .v-list-item__content {
        color: $imag-white;
        background-color: $imag-blue;
        .v-icon {
          color: $imag-black;
        }
      }
      &:before {
      background-color: transparent;

      }
    }
  }
  .v-text-field__prefix {
    font-size: 12px;
    font-style: italic;
  }
  .v-icon {
    color: $imag-grey;
  }
  span {
    b {
      color: black;
    }
  }
  .v-card {
    top: 25vh;
    left: 50vw;
    max-width: 30vw;
    transform: translateX(-50%);
    pointer-events: auto;
    touch-action: auto;
  }
  #omnibar-backdrop {
    background-color: rgba(0,0,0, 0.5);
    opacity: 0;
    transition: opacity 0.3s;
    &.displayed {
      opacity: 1;
      pointer-events: auto;
      touch-action: auto;
    }
  }
  .scroll-wrapper {
    padding-bottom: 16px;
  }
}
</style>
