<template>
  <div :style="{width:width}" class="datetime-picker" @click="calendarClicked($event)">
    <div>
      <input
        id="tj-datetime-input" readonly type="text" :value="display()" :name="name" autocomplete="off"
        @click="toggleCal"
      >
      <div class="calender-div" :class="{noDisplay: hideCal}">
        <div :class="{noDisplay: hideDate}">
          <div class="year-month-wrapper">
            <div class="month-setter">
              <span type="button" class="nav-l" @click="leftYear">&#x3C;</span>
              <span class="year">{{ year }}</span>
              <span type="button" class="nav-r" @click="rightYear">&#x3E;</span>
            </div>
            <div class="month-setter">
              <span type="button" class="nav-l" @click="leftMonth">&#x3C;</span>
              <span class="month">{{ 'TL_'+month.toUpperCase()|translate }}</span>
              <span type="button" class="nav-r" @click="rightMonth" @mousedown.stop.prevent="">&#x3E;</span>
            </div>
          </div>
          <div class="headers">
            <template v-for="(d, index) in days">
              <span :key="index" class="days">{{ 'TL_' + d.toUpperCase() | translate }}</span>
            </template>
          </div>
          <div>
            <template v-for="(port, index) in ports">
              <span :key="index" class="port" :class="{activePort: index === activePort}" @click="setDay(index, port)">{{ port }}</span>
            </template>
          </div>
        </div>
        <div class="time-picker" :class="{noDisplay: hideTime}">
          <div class="hour-selector">
            <div id="j-hour" @click="showHourSelector">{{ padZero(hour) }}</div>
            <div ref="hourScrollerWrapper" class="scroll-hider" :class="{showSelector: hourSelectorVisible}">
              <ul ref="hourScroller">
                <template v-for="(h, index) in hours">
                  <li :key="index" :class="{active: index == hourIndex}" @click="setHour(index, true)">{{ h }}</li>
                </template>
              </ul>
            </div>
          </div>
          <div class="time-separator">
            <span>:</span>
          </div>
          <div class="minute-selector">
            <div id="j-minute" @click="showMinuteSelector">{{ padZero(minute) }}</div>
            <div ref="minuteScrollerWrapper" class="scroll-hider" :class="{showSelector: minuteSelectorVisible}">
              <ul ref="minuteScroller">
                <template v-for="(m, index) in minutes">
                  <li :key="index" :class="{active: index == minuteIndex}" @click="setMinute(index, true)">{{ m }}</li>
                </template>
              </ul>
            </div>
          </div>
          <div class="time-separator">
            <span>:</span>
          </div>
          <div class="minute-selector">
            <div @click="changePeriod">{{ 'TL_'+period.toUpperCase() | translate }}</div>
          </div>
        </div>
        <span type="button" class="okButton" @click="setDate(true)">{{ 'TL_OK'|translate }}</span>
        <span type="button" class="okButton" @click="clearDate()">{{ 'TL_CLEAR'|translate }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import _ from 'lodash'

export default {
  props: [
    'format',
    'name',
    'width',
    'value'
  ],
  data () {
    return {
      hideCal: true,
      activePort: null,
      timeStamp: null,
      months: [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ],
      days: [ 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa' ],
      monthIndex: 0,
      hourIndex: 0,
      minuteIndex: 0,
      year: 2017,
      portsHolder: [],
      minute: 0,
      hour: 1,
      day: 1,
      minuteSelectorVisible: false,
      hourSelectorVisible: false,
      period: 'AM'
    }
  },
  computed: {
    ports: {
      get () {
        let p = []
        if (this.portsHolder.length === 0) {
          for (let i = 0; i < 42; i++) {
            p.push('')
          }
        } else {
          p = this.portsHolder
        }
        return p
      },
      set (newValue) {
        this.portsHolder = newValue
      }
    },
    month () {
      return this.months[this.monthIndex]
    },
    dateTime () {
      return `${this.timeStamp.getFullYear()}-${this.timeStamp.getMonth() + 1}-${this.timeStamp.getUTCDay()}`
    },
    minutes () {
      const arr = []
      for (let i = 0; i < 60; i++) {
        i < 10 ? arr.push(`0${i}`) : arr.push(`${i}`)
      }
      return arr
    },
    hours () {
      const arr = []
      for (let i = 1; i <= 12; i++) {
        i < 10 ? arr.push(`0${i}`) : arr.push(`${i}`)
      }
      return arr
    },
    dateFormat () {
      return this.format || 'YYYY-MM-DD hh:mm:ss a'
    },
    hideTime () {
      return this.dateFormat.indexOf('hh:mm:ss') === -1
    },
    hideDate () {
      return this.dateFormat === 'hh:mm:ss a'
    }
  },
  created () {
    let timestamp = new Date()
    if (this.value) {
      timestamp = new Date(this.value)
      this.timeStamp = timestamp
    }
    this.year = timestamp.getFullYear()
    this.monthIndex = timestamp.getMonth()
    this.day = timestamp.getDate()
    this.period = (timestamp.getHours() >= 12) ? 'PM' : 'AM'
    this.hour = timestamp.getHours()

    if (this.hour === 0) {
      this.hour += 12
    } else if (this.hour > 12) {
      this.hour -= 12
    }

    this.minute = timestamp.getMinutes() || 0
    this.updateCalendar()

    document.addEventListener('keydown', this.keyIsDown)
    document.addEventListener('click', this.documentClicked)
    this.setDate()
  },
  destroyed () {
    document.removeEventListener('keydown', this.keyIsDown)
    document.removeEventListener('click', this.documentClicked)
  },
  methods: {
    padZero (number) {
      return _.padStart(number, 2, '0')
    },
    display () {
      return this.timeStamp ? moment(this.timeStamp).format(this.dateFormat) : ''
    },
    leftMonth () {
      const index = this.months.indexOf(this.month)
      if (index === 0) {
        this.monthIndex = 11
      } else {
        this.monthIndex = index - 1
      }
      this.updateCalendar()
    },
    rightMonth () {
      const index = this.months.indexOf(this.month)
      if (index === 11) {
        this.monthIndex = 0
      } else {
        this.monthIndex = index + 1
      }
      this.updateCalendar()
    },
    rightYear () {
      this.year++
      this.updateCalendar()
    },
    leftYear () {
      this.year--
      this.updateCalendar()
    },
    updateCalendar () {
      const me = this
      const date = new Date(me.year, me.monthIndex, 1, 0, 0, 0)
      const day = date.getDay()
      const daysInMonth = new Date(me.year, me.monthIndex + 1, 0).getDate()
      const ports = []
      let portsLenght = 35
      if (day === 6 || (day === 5 && daysInMonth === 31)) {
        portsLenght = 42
      }
      let activeFound = false
      for (let i = 0; i < portsLenght; i++) {
        const j = i - day
        const curr = (j < 0 || j >= daysInMonth) ? '' : j + 1
        ports.push(curr)
        if (this.timeStamp && curr === me.day && this.timeStamp.getMonth() === me.monthIndex && this.timeStamp.getFullYear() === me.year) {
          me.activePort = i
          activeFound = true
        }
      }
      if (!activeFound) {
        me.activePort = -1
      }
      this.ports = ports
    },
    setDay (index, port) {
      if (port !== '') {
        this.activePort = index
        this.day = port
        this.timeStamp = new Date(this.year, this.monthIndex, this.day)
        this.setDate(true)
        // if (this.hideTime)  this.minuteSelectorVisible = false
      }
    },
    setMinute (index, closeAfterSet) {
      this.minuteIndex = index
      this.minute = index
      if (closeAfterSet) {
        this.minuteSelectorVisible = false
      }
    },
    setHour (index, closeAfterSet) {
      this.hourIndex = index
      this.hour = index + 1
      if (closeAfterSet) {
        this.hourSelectorVisible = false
      }
    },
    showHourSelector () {
      this.hourSelectorVisible = true
      this.minuteSelectorVisible = false
    },
    showMinuteSelector () {
      this.minuteSelectorVisible = true
      this.hourSelectorVisible = false
    },
    keyIsDown (event) {
      const key = event.which || event.keycode
      if (key === 38) {
        if (this.minuteSelectorVisible && this.minuteIndex > 0) {
          this.setMinute(this.minuteIndex - 1, false)
          this.scrollTopMinute()
        } else if (this.hourSelectorVisible && this.hourIndex > 0) {
          this.setHour(this.hourIndex - 1, false)
          this.scrollTopHour()
        }
      } else if (key === 40) {
        if (this.minuteSelectorVisible && this.minuteIndex < this.minutes.length - 1) {
          this.setMinute(this.minuteIndex + 1, false)
          this.scrollTopMinute()
        } else if (this.hourSelectorVisible && this.hourIndex < this.hours.length - 1) {
          this.setHour(this.hourIndex + 1, false)
          this.scrollTopHour()
        }
      } else if (key === 13) {
        this.minuteSelectorVisible = false
        this.hourSelectorVisible = false
      }
      if (this.minuteSelectorVisible || this.hourSelectorVisible) {
        event.preventDefault()
        this.minuteSelectorVisible = false
        this.hourSelectorVisible = false
      }
    },
    scrollTopMinute () {
      const mHeight = this.$refs.minuteScroller.scrollHeight
      const wHeight = this.$refs.minuteScrollerWrapper.clientHeight
      const top = mHeight * (this.minuteIndex / (this.minutes.length - 1)) - (wHeight / 2)
      this.$refs.minuteScroller.scrollTop = top
    },
    scrollTopHour () {
      const mHeight = this.$refs.hourScroller.scrollHeight
      const wHeight = this.$refs.hourScrollerWrapper.clientHeight
      const top = mHeight * (this.hourIndex / (this.hours.length - 1)) - (wHeight / 2)
      this.$refs.hourScroller.scrollTop = top
    },
    changePeriod () {
      this.period = this.period === 'AM' ? 'PM' : 'AM'
    },
    calendarClicked (event) {
      if (event.target.id !== 'j-hour' && event.target.id !== 'j-minute') {
        this.minuteSelectorVisible = false
        this.hourSelectorVisible = false
      }
      event.cancelBubble = true
      if (event.stopPropagation) {
        event.stopPropagation()
      }
    },
    documentClicked (event) {
      if (event.target.id !== 'tj-datetime-input') {
        this.hideCal = true
      }
    },
    toggleCal () {
      this.hideCal = !this.hideCal
    },
    clearDate () {
      this.timeStamp = ''
      this.$emit('input', '')
      this.hideCal = true
    },
    setDate (forceUpdate) {
      let h = this.hour
      if (this.hour === 12 && this.period === 'AM') {
        h = h - 12
      }
      if (this.hour !== 12 && this.period === 'PM') {
        h = h + 12
      }
      const d = new Date(this.year || 1970, this.monthIndex || 0, this.day || 1, h, this.minute, 0)
      if (forceUpdate) {
        this.timeStamp = d
        this.$emit('input', d.getTime())
        this.hideCal = true
      }
    }
  }
}
</script>

<style scoped lang="scss">

  .year-month-wrapper{
    background-color: #ed4d00;
  }

  input{
    min-width: 226px;
    width:100%;
    height: 30px;
    padding: 3px;
    border: 1px solid #ddd;
  }
  .datetime-picker{
    position: relative;
  }
  .calender-div{
    width: 232px;
    box-shadow: 1px 2px 5px #ccc;
    position: absolute;
    display: inline-block;
    left: 0;
    top: 40px;
    color: #444;
    font-size: 14px;
    padding-bottom: 10px;
  }
  .port, .days{
    display: inline-block;
    width: 31px;
    height: 20px;
    padding: 3px;
    margin: 1px;
    text-align: center;
    vertical-align: top;
    cursor: pointer;
  }
  .days{
    color: #ed4d00;
    font-weight: bold;
  }
  .port:hover{
    color: #ed4d00;
    font-weight: bold;
  }
  .activePort, .activePort:hover {
    background-color: #ed4d00;
    color: white;
  }
  .month-setter, .year-setter{
    margin: 0 1px;
    width: 48.2%;
    color: white;
    font-weight: 900;
    display: inline-block;
  }
  .nav-l:hover, .nav-r:hover {
    background-color: #dc3c00;
  }
  .nav-l, .nav-r {
    display: inline-block;
    width: 25px;
    background-color: #ed4d00;
    color: white;
    font-size: 16px;
    cursor: pointer;
    border: 0;
    padding: 7px;
    margin:0;
  }
  .nav-l{
    float: left;
  }
  .nav-r{
    float: right;
  }
  .month, .year{
    width: 40px;
    text-align: right;
    display: inline-block;
    color: white;
    padding: 7px 0;
  }
  .hour-selector, .minute-selector{
    width: 30px;
    display: inline-block;
    text-align: center;
    font-weight: bold;
    position: relative;
    cursor: pointer;
  }
  .time-separator{
    display: inline-block;
    font-weight: bold;
  }
  .time-picker{
    margin: 10px
  }
  .nav-t, .nav-d{
    font-weight: bold;
    cursor: pointer;
  }
  .scroll-hider {
    display: none;
    vertical-align:top;
    overflow:hidden;
    border:0;
    position: absolute;
    top: -40px;
    left: 0;
    box-shadow: 0 0 3px #333;
    background-color: white;
  }
  .scroll-hider ul {
    padding:5px;
    margin:-5px -13px -5px -5px;
    list-style-type: none;
    height: 100px;
    overflow: auto;
    width:55px;
    color: #999;
    overflow-x: hidden;
  }
  .showSelector{
    display:inline-block;
  }
  li.active{
    background-color: #ed4d00;
    color: white;
  }
  li{
    padding: 4px;
    font-size: 16px;
    width: 100%;
    cursor: pointer;
  }
  .time-picker{
    display: inline-block;
  }
  .noDisplay{
    display: none;
  }
  .okButton{
    color: #ed4d00;
    font-size: 15px;
    font-weight: bold;
    padding: 0;
    float: right;
    border: 0;
    margin-right: 10px;
    margin-top: 10px;
    cursor: pointer;
    background: transparent;
  }
</style>
