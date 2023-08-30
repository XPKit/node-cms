<template>
  <div
    id="omnibar" v-shortkey="shortcuts"
    @shortkey="interactiveSearch"
  >
    <v-card v-show="showOmnibar" elevation="24">
      <v-card-title>
        <v-text-field
          ref="search" v-model="search" class="search-bar" flat outlined hide-details dense :placeholder="'TL_SEARCH' | translate" type="text" autocomplete="off"
          name="search"
          :prefix="searchMode === 'all' ? '' : `${searchMode}:`"
        />
      </v-card-title>
      <template v-if="results.length > 0">
        <v-divider />
        <v-list dense>
          <v-list-item
            v-for="(result, i) in results"
            :key="i"
            :class="{highlighted: highlightedItem === i}" @click="selectResult(i)"
          >
            <v-list-item-content>
              <v-list-item-title>
                <v-icon color="light-grey" small>{{ getIcon(result) }}</v-icon>
                <span v-html="result.html" />
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </template>
    </v-card>
  </div>
</template>

<script>
import _ from 'lodash'
import fuzzysort from 'fuzzysort'
import FieldSelectorService from '@s/FieldSelectorService'

export default {
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
      resourcesList: [],
      results: [],
      highlightedItem: 0,
      searchModes: ['all', 'resources', 'fields'],
      searchMode: 'all',
      shortcuts: {
        'esc': ['esc'],
        'open': ['ctrl', 'p'],
        'arrow-up': ['arrowup'],
        'arrow-down': ['arrowdown'],
        'enter': ['enter'],
        'all': ['shift', 'a'],
        'resources': ['shift', 'r'],
        'fields': ['shift', 'f']
      }
    }
  },
  watch: {
    search () {
      this.highlightedItem = 0
      let results = []
      this.results = []
      if (this.searchMode === 'all') {
        results = fuzzysort.go(this.search, _.concat(this.resourcesList, this.fieldsList), {key: 'displayname'})
      } else if (this.searchMode === 'resources') {
        results = fuzzysort.go(this.search, this.resourcesList, {key: 'title'})
      } else if (this.searchMode === 'fields') {
        results = fuzzysort.go(this.search, this.fieldsList, {key: 'title'})
      }
      this.results = _.map(results, (result) => {
        result.html = fuzzysort.highlight(result)
        return result
      })
      // console.warn('results are = ', this.results)
    }
  },
  mounted () {
    this.resourcesList = _.map(_.flatten(_.map(this.groupedList, 'list')), (resource) => {
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
    // console.warn('omnibar mounted ', this.groupedList, this.resourcesList, this.fieldsList)
  },
  methods: {
    getIcon (result) {
      if (this.searchMode === 'all') {
        return result.obj.type === 'resource' ? 'mdi-package' : 'mdi-cursor-text'
      }
      if (this.searchMode === 'resource') {
        return 'mdi-package'
      }
      return 'mdi-cursor-text'
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
    },
    selectResult (i = -1) {
      const result = _.get(this.results, `[${i === -1 ? this.highlightedItem : i}].obj`, false)
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
        this.highlightedItem -= 1
      } else if (action === 'arrow-down') {
        this.highlightedItem += 1
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
#omnibar {
  position: fixed;
  top: 20vh;
  left: 50vw;
  transform: translateX(-50%);
  .v-list-item {
    &.highlighted {
      // background-color: lightblue;
    }
  }
  .v-text-field__prefix {
    font-size: 12px;
    font-style: italic;
  }
  span {
    b {
      color: black;
    }
  }
}
</style>
