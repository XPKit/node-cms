/*
 * vue3-shortkey 4.0.0 — Vue 3 keyboard-shortcut directive (v-shortkey / @shortkey).
 *
 * Vendored from https://github.com/Zegfault/vue3-shortkey, commit da8ee7ead0c618de22a227da2274d88c33e29aae
 * (src/index.js), a rebuild of https://github.com/rodrigopv/vue3-shortkey by rodrigopv, in turn a port of
 * vue-shortkey by iFgR. MIT License — see vue3-shortkey.LICENSE next to this file.
 *
 * Why a copy and not the git dependency: the fork's package.json has a "build" script, so npm "prepares"
 * it on install by running a nested npm install of its 2017-era devDependencies (webpack 3, karma,
 * phantomjs-prebuilt). That step fails on node:22-trixie-slim (PhantomJS needs bzip2) and would otherwise
 * download a PhantomJS binary into every image build. The npm-registry release of 4.0.0 has identical
 * source but a stale build with two debug console.log calls.
 *
 * Local changes, all at the edges: the two IE polyfill imports are dropped, the listener guard checks for
 * a DOM instead of process.env, and the UMD tail is an ES module default export.
 *
 * One upstream defect is fixed rather than copied: the dedupe in bindValue compared `!itm === el`, which
 * is a boolean against an element and so never matches, emptying objAvoided on every bind and leaving only
 * the most recently bound element avoided. It now compares `itm !== el`, the behaviour the line intends.
 * Nothing in this admin uses the `avoid` modifier, so the fix changes no behaviour here.
 */
let ShortKey = {}
let mapFunctions = {}
let objAvoided = []
let elementAvoided = []
let keyPressed = false

const parseValue = (value) => {
  value = typeof value === 'string' ? JSON.parse(value.replace(/\'/gi, '"')) : value
  if (value instanceof Array) {
    return {'': value};
  }
  return value
}

const bindValue = (value, el, binding, vnode) => {
  const push = binding.modifiers.push === true
  const avoid = binding.modifiers.avoid === true
  const focus = !binding.modifiers.focus === true
  const once = binding.modifiers.once === true
  const propagte = binding.modifiers.propagte === true
  if (avoid) {
    objAvoided = objAvoided.filter((itm) => {
      return itm !== el
    })
    objAvoided.push(el)
  } else {
    mappingFunctions({b: value, push, once, focus, propagte, el: vnode.el})
  }
}

const unbindValue = (value, el) => {
  for (let key in value) {
    const k = ShortKey.encodeKey(value[key])
    const idxElm = mapFunctions[k].el.indexOf(el)
    if (mapFunctions[k].el.length > 1 && idxElm > -1) {
      mapFunctions[k].el.splice(idxElm, 1)
    } else {
      delete mapFunctions[k]
    }
  }
}

ShortKey.install = (Vue, options) => {
  elementAvoided = [...(options && options.prevent ? options.prevent : [])]
  Vue.directive('shortkey', {
    beforeMount: (el, binding, vnode) => {
      // Mapping the commands
      const value = parseValue(binding.value)
      bindValue(value, el, binding, vnode)
    },
    updated: (el, binding, vnode) => {
      const oldValue = parseValue(binding.oldValue)
      unbindValue(oldValue, el)

      const newValue = parseValue(binding.value)
      bindValue(newValue, el, binding, vnode)
    },
    unmounted: (el, binding) => {
      const value = parseValue(binding.value)
      unbindValue(value, el)
    }
  })
}

ShortKey.decodeKey = (pKey) => createShortcutIndex(pKey)
ShortKey.encodeKey = (pKey) => {
  const shortKey = {}
  shortKey.shiftKey = pKey.includes('shift')
  shortKey.ctrlKey = pKey.includes('ctrl')
  shortKey.metaKey = pKey.includes('meta')
  shortKey.altKey = pKey.includes('alt')
  let indexedKeys = createShortcutIndex(shortKey)
  const vKey = pKey.filter((item) => !['shift', 'ctrl', 'meta', 'alt'].includes(item))
  indexedKeys += vKey.join('')
  return indexedKeys
}

const createShortcutIndex = (pKey) => {
  let k = ''
  if (pKey.key === 'Shift' || pKey.shiftKey) { k += 'shift' }
  if (pKey.key === 'Control' || pKey.ctrlKey) { k += 'ctrl' }
  if (pKey.key === 'Meta'|| pKey.metaKey) { k += 'meta' }
  if (pKey.key === 'Alt' || pKey.altKey) { k += 'alt' }
  if (pKey.key === 'ArrowUp') { k += 'arrowup' }
  if (pKey.key === 'ArrowLeft') { k += 'arrowleft' }
  if (pKey.key === 'ArrowRight') { k += 'arrowright' }
  if (pKey.key === 'ArrowDown') { k += 'arrowdown' }
  if (pKey.key === 'AltGraph') { k += 'altgraph' }
  if (pKey.key === 'Escape') { k += 'esc' }
  if (pKey.key === 'Enter') { k += 'enter' }
  if (pKey.key === 'Tab') { k += 'tab' }
  if (pKey.key === ' ') { k += 'space' }
  if (pKey.key === 'PageUp') { k += 'pageup' }
  if (pKey.key === 'PageDown') { k += 'pagedown' }
  if (pKey.key === 'Home') { k += 'home' }
  if (pKey.key === 'End') { k += 'end' }
  if (pKey.key === 'Delete') { k += 'del' }
  if (pKey.key === 'Backspace') { k += 'backspace' }
  if (pKey.key === 'Insert') { k += 'insert' }
  if (pKey.key === 'NumLock') { k += 'numlock' }
  if (pKey.key === 'CapsLock') { k += 'capslock' }
  if (pKey.key === 'Pause') { k += 'pause' }
  if (pKey.key === 'ContextMenu') { k += 'contextmenu' }
  if (pKey.key === 'ScrollLock') { k += 'scrolllock' }
  if (pKey.key === 'BrowserHome') { k += 'browserhome' }
  if (pKey.key === 'MediaSelect') { k += 'mediaselect' }
  if ((pKey.key && pKey.key !== ' ' && pKey.key.length === 1) || /F\d{1,2}|\//g.test(pKey.key)) k += pKey.key.toLowerCase()
  return k
}

const dispatchShortkeyEvent = (pKey) => {
  const e = new CustomEvent('shortkey', { bubbles: false })
  if (mapFunctions[pKey].key) e.srcKey = mapFunctions[pKey].key
  const elm = mapFunctions[pKey].el
  if (!mapFunctions[pKey].propagte) {
    elm[elm.length - 1].dispatchEvent(e)
  } else {
    elm.forEach(elmItem => elmItem.dispatchEvent(e))
  }
}

ShortKey.keyDown = (pKey) => {
  if ((!mapFunctions[pKey].once && !mapFunctions[pKey].push) || (mapFunctions[pKey].push && !keyPressed)) {
    dispatchShortkeyEvent(pKey)
  }
}

if (typeof document !== 'undefined') {
  ;(function () {
    document.addEventListener('keydown', (pKey) => {
      const decodedKey = ShortKey.decodeKey(pKey)
      // Check avoidable elements
      if (availableElement(decodedKey)) {
        if (!mapFunctions[decodedKey].propagte) {
          pKey.preventDefault()
          pKey.stopPropagation()
        }
        if (mapFunctions[decodedKey].focus) {
          ShortKey.keyDown(decodedKey)
          keyPressed = true
        } else if (!keyPressed) {
          const elm = mapFunctions[decodedKey].el
          elm[elm.length - 1].focus()
          keyPressed = true
        }
      }
    }, true)

    document.addEventListener('keyup', (pKey) => {
      const decodedKey = ShortKey.decodeKey(pKey)
      if (availableElement(decodedKey)) {
        if (!mapFunctions[decodedKey].propagte) {
          pKey.preventDefault()
          pKey.stopPropagation()
        }
        if (mapFunctions[decodedKey].once || mapFunctions[decodedKey].push) {
          dispatchShortkeyEvent(decodedKey);
        }
      }
      keyPressed = false
    }, true)
  })()
}

const mappingFunctions = ({b, push, once, focus, propagte, el}) => {
  for (let key in b) {
    const k = ShortKey.encodeKey(b[key])
    const elm = mapFunctions[k] && mapFunctions[k].el ? mapFunctions[k].el : []
    const propagated = mapFunctions[k] && mapFunctions[k].propagte
    elm.push(el)
    mapFunctions[k] = {
      push,
      once,
      focus,
      key,
      propagte: propagated || propagte,
      el: elm
    }
  }
}

const availableElement = (decodedKey) => {
  const objectIsAvoided = !!objAvoided.find(r => r === document.activeElement)
  const filterAvoided = !!(elementAvoided.find(selector => document.activeElement && document.activeElement.matches(selector)))
  return !!mapFunctions[decodedKey] && !(objectIsAvoided || filterAvoided)
}

export default ShortKey
