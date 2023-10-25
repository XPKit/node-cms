(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) : factory()
})(function () {
  'use strict'
  const Vue = window.Vue
  window.plugins = [
    {
      title: 'OssActivations',
      displayname: 'OSS Activations',
      name: 'Activations',
      component: Vue.defineAsyncComponent(() => Promise.resolve().then(() => TestComponent)),
      group: '- Dashboard -'
    }
    // {
    //   title: 'ClientMonitor',
    //   displayname: 'Client Monitor',
    //   component: 'ClientMonitor',
    //   group: '- Dashboard -'
    // },
    // {
    //   title: 'ClientUpload',
    //   displayname: 'Client Upload',
    //   component: 'ClientUpload',
    //   group: '- Dashboard -'
    // }
  ]
  function makeMap (str, expectsLowerCase) {
    const map = /* @__PURE__ */ Object.create(null)
    const list = str.split(',')
    for (let i = 0; i < list.length; i++) {
      map[list[i]] = true
    }
    return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val]
  }
  const EMPTY_ARR = []
  const onRE = /^on[^a-z]/
  const isOn = (key) => onRE.test(key)
  const extend = Object.assign
  const hasOwnProperty$1 = Object.prototype.hasOwnProperty
  const hasOwn = (val, key) => hasOwnProperty$1.call(val, key)
  const isArray = Array.isArray
  const isMap = (val) => toTypeString(val) === '[object Map]'
  const isFunction = (val) => typeof val === 'function'
  const isString = (val) => typeof val === 'string'
  const isSymbol = (val) => typeof val === 'symbol'
  const isObject = (val) => val !== null && typeof val === 'object'
  const objectToString = Object.prototype.toString
  const toTypeString = (value) => objectToString.call(value)
  const toRawType = (value) => {
    return toTypeString(value).slice(8, -1)
  }
  const isIntegerKey = (key) => isString(key) && key !== 'NaN' && key[0] !== '-' && '' + parseInt(key, 10) === key
  const hasChanged = (value, oldValue) => !Object.is(value, oldValue)
  let _globalThis
  const getGlobalThis = () => {
    return _globalThis || (_globalThis = typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {})
  }
  function normalizeStyle (value) {
    if (isArray(value)) {
      const res = {}
      for (let i = 0; i < value.length; i++) {
        const item = value[i]
        const normalized = isString(item) ? parseStringStyle(item) : normalizeStyle(item)
        if (normalized) {
          for (const key in normalized) {
            res[key] = normalized[key]
          }
        }
      }
      return res
    } else if (isString(value) || isObject(value)) {
      return value
    }
  }
  const listDelimiterRE = /;(?![^(]*\))/g
  const propertyDelimiterRE = /:([^]+)/
  const styleCommentRE = /\/\*[^]*?\*\//g
  function parseStringStyle (cssText) {
    const ret = {}
    cssText.replace(styleCommentRE, '').split(listDelimiterRE).forEach((item) => {
      if (item) {
        const tmp = item.split(propertyDelimiterRE)
        tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim())
      }
    })
    return ret
  }
  function normalizeClass (value) {
    let res = ''
    if (isString(value)) {
      res = value
    } else if (isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const normalized = normalizeClass(value[i])
        if (normalized) {
          res += normalized + ' '
        }
      }
    } else if (isObject(value)) {
      for (const name in value) {
        if (value[name]) {
          res += name + ' '
        }
      }
    }
    return res.trim()
  }
  const createDep = (effects) => {
    const dep = new Set(effects)
    dep.w = 0
    dep.n = 0
    return dep
  }
  const wasTracked = (dep) => (dep.w & trackOpBit) > 0
  const newTracked = (dep) => (dep.n & trackOpBit) > 0
  const targetMap = /* @__PURE__ */ new WeakMap()
  let trackOpBit = 1
  let activeEffect
  const ITERATE_KEY = Symbol('')
  const MAP_KEY_ITERATE_KEY = Symbol('')
  let shouldTrack = true
  const trackStack = []
  function pauseTracking () {
    trackStack.push(shouldTrack)
    shouldTrack = false
  }
  function resetTracking () {
    const last = trackStack.pop()
    shouldTrack = last === void 0 ? true : last
  }
  function track (target, type, key) {
    if (shouldTrack && activeEffect) {
      let depsMap = targetMap.get(target)
      if (!depsMap) {
        targetMap.set(target, depsMap = /* @__PURE__ */ new Map())
      }
      let dep = depsMap.get(key)
      if (!dep) {
        depsMap.set(key, dep = createDep())
      }
      trackEffects(dep)
    }
  }
  function trackEffects (dep, debuggerEventExtraInfo) {
    let shouldTrack2 = false
    {
      if (!newTracked(dep)) {
        dep.n |= trackOpBit
        shouldTrack2 = !wasTracked(dep)
      }
    }
    if (shouldTrack2) {
      dep.add(activeEffect)
      activeEffect.deps.push(dep)
    }
  }
  function trigger (target, type, key, newValue, oldValue, oldTarget) {
    const depsMap = targetMap.get(target)
    if (!depsMap) {
      return
    }
    let deps = []
    if (type === 'clear') {
      deps = [...depsMap.values()]
    } else if (key === 'length' && isArray(target)) {
      const newLength = Number(newValue)
      depsMap.forEach((dep, key2) => {
        if (key2 === 'length' || key2 >= newLength) {
          deps.push(dep)
        }
      })
    } else {
      if (key !== void 0) {
        deps.push(depsMap.get(key))
      }
      switch (type) {
        case 'add':
          if (!isArray(target)) {
            deps.push(depsMap.get(ITERATE_KEY))
            if (isMap(target)) {
              deps.push(depsMap.get(MAP_KEY_ITERATE_KEY))
            }
          } else if (isIntegerKey(key)) {
            deps.push(depsMap.get('length'))
          }
          break
        case 'delete':
          if (!isArray(target)) {
            deps.push(depsMap.get(ITERATE_KEY))
            if (isMap(target)) {
              deps.push(depsMap.get(MAP_KEY_ITERATE_KEY))
            }
          }
          break
        case 'set':
          if (isMap(target)) {
            deps.push(depsMap.get(ITERATE_KEY))
          }
          break
      }
    }
    if (deps.length === 1) {
      if (deps[0]) {
        {
          triggerEffects(deps[0])
        }
      }
    } else {
      const effects = []
      for (const dep of deps) {
        if (dep) {
          effects.push(...dep)
        }
      }
      {
        triggerEffects(createDep(effects))
      }
    }
  }
  function triggerEffects (dep, debuggerEventExtraInfo) {
    const effects = isArray(dep) ? dep : [...dep]
    for (const effect2 of effects) {
      if (effect2.computed) {
        triggerEffect(effect2)
      }
    }
    for (const effect2 of effects) {
      if (!effect2.computed) {
        triggerEffect(effect2)
      }
    }
  }
  function triggerEffect (effect2, debuggerEventExtraInfo) {
    if (effect2 !== activeEffect || effect2.allowRecurse) {
      if (effect2.scheduler) {
        effect2.scheduler()
      } else {
        effect2.run()
      }
    }
  }
  const isNonTrackableKeys = /* @__PURE__ */ makeMap('__proto__,__v_isRef,__isVue')
  const builtInSymbols = new Set(
    /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== 'arguments' && key !== 'caller').map((key) => Symbol[key]).filter(isSymbol)
  )
  const arrayInstrumentations = /* @__PURE__ */ createArrayInstrumentations()
  function createArrayInstrumentations () {
    const instrumentations = {};
    ['includes', 'indexOf', 'lastIndexOf'].forEach((key) => {
      instrumentations[key] = function (...args) {
        const arr = toRaw(this)
        for (let i = 0, l = this.length; i < l; i++) {
          track(arr, 'get', i + '')
        }
        const res = arr[key](...args)
        if (res === -1 || res === false) {
          return arr[key](...args.map(toRaw))
        } else {
          return res
        }
      }
    });
    ['push', 'pop', 'shift', 'unshift', 'splice'].forEach((key) => {
      instrumentations[key] = function (...args) {
        pauseTracking()
        const res = toRaw(this)[key].apply(this, args)
        resetTracking()
        return res
      }
    })
    return instrumentations
  }
  function hasOwnProperty (key) {
    const obj = toRaw(this)
    track(obj, 'has', key)
    return obj.hasOwnProperty(key)
  }
  class BaseReactiveHandler {
    constructor (_isReadonly = false, _shallow = false) {
      this._isReadonly = _isReadonly
      this._shallow = _shallow
    }
    get (target, key, receiver) {
      const isReadonly2 = this._isReadonly; const shallow = this._shallow
      if (key === '__v_isReactive') {
        return !isReadonly2
      } else if (key === '__v_isReadonly') {
        return isReadonly2
      } else if (key === '__v_isShallow') {
        return shallow
      } else if (key === '__v_raw' && receiver === (isReadonly2 ? shallow ? shallowReadonlyMap : readonlyMap : shallow ? shallowReactiveMap : reactiveMap).get(target)) {
        return target
      }
      const targetIsArray = isArray(target)
      if (!isReadonly2) {
        if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
          return Reflect.get(arrayInstrumentations, key, receiver)
        }
        if (key === 'hasOwnProperty') {
          return hasOwnProperty
        }
      }
      const res = Reflect.get(target, key, receiver)
      if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
        return res
      }
      if (!isReadonly2) {
        track(target, 'get', key)
      }
      if (shallow) {
        return res
      }
      if (isRef(res)) {
        return targetIsArray && isIntegerKey(key) ? res : res.value
      }
      if (isObject(res)) {
        return isReadonly2 ? readonly(res) : reactive(res)
      }
      return res
    }
  }
  class MutableReactiveHandler extends BaseReactiveHandler {
    constructor (shallow = false) {
      super(false, shallow)
    }
    set (target, key, value, receiver) {
      let oldValue = target[key]
      if (isReadonly(oldValue) && isRef(oldValue) && !isRef(value)) {
        return false
      }
      if (!this._shallow) {
        if (!isShallow(value) && !isReadonly(value)) {
          oldValue = toRaw(oldValue)
          value = toRaw(value)
        }
        if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
          oldValue.value = value
          return true
        }
      }
      const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key)
      const result = Reflect.set(target, key, value, receiver)
      if (target === toRaw(receiver)) {
        if (!hadKey) {
          trigger(target, 'add', key, value)
        } else if (hasChanged(value, oldValue)) {
          trigger(target, 'set', key, value)
        }
      }
      return result
    }
    deleteProperty (target, key) {
      const hadKey = hasOwn(target, key)
      target[key]
      const result = Reflect.deleteProperty(target, key)
      if (result && hadKey) {
        trigger(target, 'delete', key, void 0)
      }
      return result
    }
    has (target, key) {
      const result = Reflect.has(target, key)
      if (!isSymbol(key) || !builtInSymbols.has(key)) {
        track(target, 'has', key)
      }
      return result
    }
    ownKeys (target) {
      track(
        target,
        'iterate',
        isArray(target) ? 'length' : ITERATE_KEY
      )
      return Reflect.ownKeys(target)
    }
  }
  class ReadonlyReactiveHandler extends BaseReactiveHandler {
    constructor (shallow = false) {
      super(true, shallow)
    }
    set (target, key) {
      return true
    }
    deleteProperty (target, key) {
      return true
    }
  }
  const mutableHandlers = /* @__PURE__ */ new MutableReactiveHandler()
  const readonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler()
  const toShallow = (value) => value
  const getProto = (v) => Reflect.getPrototypeOf(v)
  function get (target, key, isReadonly2 = false, isShallow2 = false) {
    target = target['__v_raw']
    const rawTarget = toRaw(target)
    const rawKey = toRaw(key)
    if (!isReadonly2) {
      if (hasChanged(key, rawKey)) {
        track(rawTarget, 'get', key)
      }
      track(rawTarget, 'get', rawKey)
    }
    const { has: has2 } = getProto(rawTarget)
    const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive
    if (has2.call(rawTarget, key)) {
      return wrap(target.get(key))
    } else if (has2.call(rawTarget, rawKey)) {
      return wrap(target.get(rawKey))
    } else if (target !== rawTarget) {
      target.get(key)
    }
  }
  function has (key, isReadonly2 = false) {
    const target = this['__v_raw']
    const rawTarget = toRaw(target)
    const rawKey = toRaw(key)
    if (!isReadonly2) {
      if (hasChanged(key, rawKey)) {
        track(rawTarget, 'has', key)
      }
      track(rawTarget, 'has', rawKey)
    }
    return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey)
  }
  function size (target, isReadonly2 = false) {
    target = target['__v_raw']
    !isReadonly2 && track(toRaw(target), 'iterate', ITERATE_KEY)
    return Reflect.get(target, 'size', target)
  }
  function add (value) {
    value = toRaw(value)
    const target = toRaw(this)
    const proto = getProto(target)
    const hadKey = proto.has.call(target, value)
    if (!hadKey) {
      target.add(value)
      trigger(target, 'add', value, value)
    }
    return this
  }
  function set (key, value) {
    value = toRaw(value)
    const target = toRaw(this)
    const { has: has2, get: get2 } = getProto(target)
    let hadKey = has2.call(target, key)
    if (!hadKey) {
      key = toRaw(key)
      hadKey = has2.call(target, key)
    }
    const oldValue = get2.call(target, key)
    target.set(key, value)
    if (!hadKey) {
      trigger(target, 'add', key, value)
    } else if (hasChanged(value, oldValue)) {
      trigger(target, 'set', key, value)
    }
    return this
  }
  function deleteEntry (key) {
    const target = toRaw(this)
    const { has: has2, get: get2 } = getProto(target)
    let hadKey = has2.call(target, key)
    if (!hadKey) {
      key = toRaw(key)
      hadKey = has2.call(target, key)
    }
    get2 ? get2.call(target, key) : void 0
    const result = target.delete(key)
    if (hadKey) {
      trigger(target, 'delete', key, void 0)
    }
    return result
  }
  function clear () {
    const target = toRaw(this)
    const hadItems = target.size !== 0
    const result = target.clear()
    if (hadItems) {
      trigger(target, 'clear', void 0, void 0)
    }
    return result
  }
  function createForEach (isReadonly2, isShallow2) {
    return function forEach (callback, thisArg) {
      const observed = this
      const target = observed['__v_raw']
      const rawTarget = toRaw(target)
      const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive
      !isReadonly2 && track(rawTarget, 'iterate', ITERATE_KEY)
      return target.forEach((value, key) => {
        return callback.call(thisArg, wrap(value), wrap(key), observed)
      })
    }
  }
  function createIterableMethod (method, isReadonly2, isShallow2) {
    return function (...args) {
      const target = this['__v_raw']
      const rawTarget = toRaw(target)
      const targetIsMap = isMap(rawTarget)
      const isPair = method === 'entries' || method === Symbol.iterator && targetIsMap
      const isKeyOnly = method === 'keys' && targetIsMap
      const innerIterator = target[method](...args)
      const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive
      !isReadonly2 && track(
        rawTarget,
        'iterate',
        isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY
      )
      return {
        // iterator protocol
        next () {
          const { value, done } = innerIterator.next()
          return done ? { value, done } : {
            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done
          }
        },
        // iterable protocol
        [Symbol.iterator] () {
          return this
        }
      }
    }
  }
  function createReadonlyMethod (type) {
    return function (...args) {
      return type === 'delete' ? false : this
    }
  }
  function createInstrumentations () {
    const mutableInstrumentations2 = {
      get (key) {
        return get(this, key)
      },
      get size () {
        return size(this)
      },
      has,
      add,
      set,
      delete: deleteEntry,
      clear,
      forEach: createForEach(false, false)
    }
    const shallowInstrumentations2 = {
      get (key) {
        return get(this, key, false, true)
      },
      get size () {
        return size(this)
      },
      has,
      add,
      set,
      delete: deleteEntry,
      clear,
      forEach: createForEach(false, true)
    }
    const readonlyInstrumentations2 = {
      get (key) {
        return get(this, key, true)
      },
      get size () {
        return size(this, true)
      },
      has (key) {
        return has.call(this, key, true)
      },
      add: createReadonlyMethod('add'),
      set: createReadonlyMethod('set'),
      delete: createReadonlyMethod('delete'),
      clear: createReadonlyMethod('clear'),
      forEach: createForEach(true, false)
    }
    const shallowReadonlyInstrumentations2 = {
      get (key) {
        return get(this, key, true, true)
      },
      get size () {
        return size(this, true)
      },
      has (key) {
        return has.call(this, key, true)
      },
      add: createReadonlyMethod('add'),
      set: createReadonlyMethod('set'),
      delete: createReadonlyMethod('delete'),
      clear: createReadonlyMethod('clear'),
      forEach: createForEach(true, true)
    }
    const iteratorMethods = ['keys', 'values', 'entries', Symbol.iterator]
    iteratorMethods.forEach((method) => {
      mutableInstrumentations2[method] = createIterableMethod(
        method,
        false,
        false
      )
      readonlyInstrumentations2[method] = createIterableMethod(
        method,
        true,
        false
      )
      shallowInstrumentations2[method] = createIterableMethod(
        method,
        false,
        true
      )
      shallowReadonlyInstrumentations2[method] = createIterableMethod(
        method,
        true,
        true
      )
    })
    return [
      mutableInstrumentations2,
      readonlyInstrumentations2,
      shallowInstrumentations2,
      shallowReadonlyInstrumentations2
    ]
  }
  const [
    mutableInstrumentations,
    readonlyInstrumentations,
    shallowInstrumentations,
    shallowReadonlyInstrumentations
  ] = /* @__PURE__ */ createInstrumentations()
  function createInstrumentationGetter (isReadonly2, shallow) {
    const instrumentations = shallow ? isReadonly2 ? shallowReadonlyInstrumentations : shallowInstrumentations : isReadonly2 ? readonlyInstrumentations : mutableInstrumentations
    return (target, key, receiver) => {
      if (key === '__v_isReactive') {
        return !isReadonly2
      } else if (key === '__v_isReadonly') {
        return isReadonly2
      } else if (key === '__v_raw') {
        return target
      }
      return Reflect.get(
        hasOwn(instrumentations, key) && key in target ? instrumentations : target,
        key,
        receiver
      )
    }
  }
  const mutableCollectionHandlers = {
    get: /* @__PURE__ */ createInstrumentationGetter(false, false)
  }
  const readonlyCollectionHandlers = {
    get: /* @__PURE__ */ createInstrumentationGetter(true, false)
  }
  const reactiveMap = /* @__PURE__ */ new WeakMap()
  const shallowReactiveMap = /* @__PURE__ */ new WeakMap()
  const readonlyMap = /* @__PURE__ */ new WeakMap()
  const shallowReadonlyMap = /* @__PURE__ */ new WeakMap()
  function targetTypeMap (rawType) {
    switch (rawType) {
      case 'Object':
      case 'Array':
        return 1
      case 'Map':
      case 'Set':
      case 'WeakMap':
      case 'WeakSet':
        return 2
      default:
        return 0
    }
  }
  function getTargetType (value) {
    return value['__v_skip'] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value))
  }
  function reactive (target) {
    if (isReadonly(target)) {
      return target
    }
    return createReactiveObject(
      target,
      false,
      mutableHandlers,
      mutableCollectionHandlers,
      reactiveMap
    )
  }
  function readonly (target) {
    return createReactiveObject(
      target,
      true,
      readonlyHandlers,
      readonlyCollectionHandlers,
      readonlyMap
    )
  }
  function createReactiveObject (target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
    if (!isObject(target)) {
      return target
    }
    if (target['__v_raw'] && !(isReadonly2 && target['__v_isReactive'])) {
      return target
    }
    const existingProxy = proxyMap.get(target)
    if (existingProxy) {
      return existingProxy
    }
    const targetType = getTargetType(target)
    if (targetType === 0) {
      return target
    }
    const proxy = new Proxy(
      target,
      targetType === 2 ? collectionHandlers : baseHandlers
    )
    proxyMap.set(target, proxy)
    return proxy
  }
  function isReactive (value) {
    if (isReadonly(value)) {
      return isReactive(value['__v_raw'])
    }
    return !!(value && value['__v_isReactive'])
  }
  function isReadonly (value) {
    return !!(value && value['__v_isReadonly'])
  }
  function isShallow (value) {
    return !!(value && value['__v_isShallow'])
  }
  function isProxy (value) {
    return isReactive(value) || isReadonly(value)
  }
  function toRaw (observed) {
    const raw = observed && observed['__v_raw']
    return raw ? toRaw(raw) : observed
  }
  const toReactive = (value) => isObject(value) ? reactive(value) : value
  const toReadonly = (value) => isObject(value) ? readonly(value) : value
  function trackRefValue (ref2) {
    if (shouldTrack && activeEffect) {
      ref2 = toRaw(ref2)
      {
        trackEffects(ref2.dep || (ref2.dep = createDep()))
      }
    }
  }
  function triggerRefValue (ref2, newVal) {
    ref2 = toRaw(ref2)
    const dep = ref2.dep
    if (dep) {
      {
        triggerEffects(dep)
      }
    }
  }
  function isRef (r) {
    return !!(r && r.__v_isRef === true)
  }
  function ref (value) {
    return createRef(value, false)
  }
  function createRef (rawValue, shallow) {
    if (isRef(rawValue)) {
      return rawValue
    }
    return new RefImpl(rawValue, shallow)
  }
  class RefImpl {
    constructor (value, __v_isShallow) {
      this.__v_isShallow = __v_isShallow
      this.dep = void 0
      this.__v_isRef = true
      this._rawValue = __v_isShallow ? value : toRaw(value)
      this._value = __v_isShallow ? value : toReactive(value)
    }
    get value () {
      trackRefValue(this)
      return this._value
    }
    set value (newVal) {
      const useDirectValue = this.__v_isShallow || isShallow(newVal) || isReadonly(newVal)
      newVal = useDirectValue ? newVal : toRaw(newVal)
      if (hasChanged(newVal, this._rawValue)) {
        this._rawValue = newVal
        this._value = useDirectValue ? newVal : toReactive(newVal)
        triggerRefValue(this)
      }
    }
  }
  let currentRenderingInstance = null
  let currentScopeId = null
  const isSuspense = (type) => type.__isSuspense
  const NULL_DYNAMIC_COMPONENT = Symbol.for('v-ndc')
  const isTeleport = (type) => type.__isTeleport
  const Fragment = Symbol.for('v-fgt')
  const Text = Symbol.for('v-txt')
  const Comment = Symbol.for('v-cmt')
  const blockStack = []
  let currentBlock = null
  function openBlock (disableTracking = false) {
    blockStack.push(currentBlock = disableTracking ? null : [])
  }
  function closeBlock () {
    blockStack.pop()
    currentBlock = blockStack[blockStack.length - 1] || null
  }
  function setupBlock (vnode) {
    vnode.dynamicChildren = currentBlock || EMPTY_ARR
    closeBlock()
    if (currentBlock) {
      currentBlock.push(vnode)
    }
    return vnode
  }
  function createElementBlock (type, props, children, patchFlag, dynamicProps, shapeFlag) {
    return setupBlock(
      createBaseVNode(
        type,
        props,
        children,
        patchFlag,
        dynamicProps,
        shapeFlag,
        true
        /* isBlock */
      )
    )
  }
  function isVNode (value) {
    return value ? value.__v_isVNode === true : false
  }
  const InternalObjectKey = '__vInternal'
  const normalizeKey = ({ key }) => key != null ? key : null
  const normalizeRef = ({
    ref: ref2,
    ref_key,
    ref_for
  }) => {
    if (typeof ref2 === 'number') {
      ref2 = '' + ref2
    }
    return ref2 != null ? isString(ref2) || isRef(ref2) || isFunction(ref2) ? { i: currentRenderingInstance, r: ref2, k: ref_key, f: !!ref_for } : ref2 : null
  }
  function createBaseVNode (type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment ? 0 : 1, isBlockNode = false, needFullChildrenNormalization = false) {
    const vnode = {
      __v_isVNode: true,
      __v_skip: true,
      type,
      props,
      key: props && normalizeKey(props),
      ref: props && normalizeRef(props),
      scopeId: currentScopeId,
      slotScopeIds: null,
      children,
      component: null,
      suspense: null,
      ssContent: null,
      ssFallback: null,
      dirs: null,
      transition: null,
      el: null,
      anchor: null,
      target: null,
      targetAnchor: null,
      staticCount: 0,
      shapeFlag,
      patchFlag,
      dynamicProps,
      dynamicChildren: null,
      appContext: null,
      ctx: currentRenderingInstance
    }
    if (needFullChildrenNormalization) {
      normalizeChildren(vnode, children)
      if (shapeFlag & 128) {
        type.normalize(vnode)
      }
    } else if (children) {
      vnode.shapeFlag |= isString(children) ? 8 : 16
    }
    if (
      // avoid a block node from tracking itself
      !isBlockNode && // has current parent block
      currentBlock && // presence of a patch flag indicates this node needs patching on updates.
      // component nodes also should always be patched, because even if the
      // component doesn't need to update, it needs to persist the instance on to
      // the next vnode so that it can be properly unmounted later.
      (vnode.patchFlag > 0 || shapeFlag & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
      // vnode should not be considered dynamic due to handler caching.
      vnode.patchFlag !== 32
    ) {
      currentBlock.push(vnode)
    }
    return vnode
  }
  const createVNode = _createVNode
  function _createVNode (type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
    if (!type || type === NULL_DYNAMIC_COMPONENT) {
      type = Comment
    }
    if (isVNode(type)) {
      const cloned = cloneVNode(
        type,
        props,
        true
        /* mergeRef: true */
      )
      if (children) {
        normalizeChildren(cloned, children)
      }
      if (!isBlockNode && currentBlock) {
        if (cloned.shapeFlag & 6) {
          currentBlock[currentBlock.indexOf(type)] = cloned
        } else {
          currentBlock.push(cloned)
        }
      }
      cloned.patchFlag |= -2
      return cloned
    }
    if (isClassComponent(type)) {
      type = type.__vccOpts
    }
    if (props) {
      props = guardReactiveProps(props)
      let { class: klass, style } = props
      if (klass && !isString(klass)) {
        props.class = normalizeClass(klass)
      }
      if (isObject(style)) {
        if (isProxy(style) && !isArray(style)) {
          style = extend({}, style)
        }
        props.style = normalizeStyle(style)
      }
    }
    const shapeFlag = isString(type) ? 1 : isSuspense(type) ? 128 : isTeleport(type) ? 64 : isObject(type) ? 4 : isFunction(type) ? 2 : 0
    return createBaseVNode(
      type,
      props,
      children,
      patchFlag,
      dynamicProps,
      shapeFlag,
      isBlockNode,
      true
    )
  }
  function guardReactiveProps (props) {
    if (!props) { return null }
    return isProxy(props) || InternalObjectKey in props ? extend({}, props) : props
  }
  function cloneVNode (vnode, extraProps, mergeRef = false) {
    const { props, ref: ref2, patchFlag, children } = vnode
    const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props
    const cloned = {
      __v_isVNode: true,
      __v_skip: true,
      type: vnode.type,
      props: mergedProps,
      key: mergedProps && normalizeKey(mergedProps),
      ref: extraProps && extraProps.ref ? (
        // #2078 in the case of <component :is="vnode" ref="extra"/>
        // if the vnode itself already has a ref, cloneVNode will need to merge
        // the refs so the single vnode can be set on multiple refs
        mergeRef && ref2 ? isArray(ref2) ? ref2.concat(normalizeRef(extraProps)) : [ref2, normalizeRef(extraProps)] : normalizeRef(extraProps)
      ) : ref2,
      scopeId: vnode.scopeId,
      slotScopeIds: vnode.slotScopeIds,
      children,
      target: vnode.target,
      targetAnchor: vnode.targetAnchor,
      staticCount: vnode.staticCount,
      shapeFlag: vnode.shapeFlag,
      // if the vnode is cloned with extra props, we can no longer assume its
      // existing patch flag to be reliable and need to add the FULL_PROPS flag.
      // note: preserve flag for fragments since they use the flag for children
      // fast paths only.
      patchFlag: extraProps && vnode.type !== Fragment ? patchFlag === -1 ? 16 : patchFlag | 16 : patchFlag,
      dynamicProps: vnode.dynamicProps,
      dynamicChildren: vnode.dynamicChildren,
      appContext: vnode.appContext,
      dirs: vnode.dirs,
      transition: vnode.transition,
      // These should technically only be non-null on mounted VNodes. However,
      // they *should* be copied for kept-alive vnodes. So we just always copy
      // them since them being non-null during a mount doesn't affect the logic as
      // they will simply be overwritten.
      component: vnode.component,
      suspense: vnode.suspense,
      ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
      ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
      el: vnode.el,
      anchor: vnode.anchor,
      ctx: vnode.ctx,
      ce: vnode.ce
    }
    return cloned
  }
  function createTextVNode (text = ' ', flag = 0) {
    return createVNode(Text, null, text, flag)
  }
  function normalizeChildren (vnode, children) {
    let type = 0
    const { shapeFlag } = vnode
    if (children == null) {
      children = null
    } else if (isArray(children)) {
      type = 16
    } else if (typeof children === 'object') {
      if (shapeFlag & (1 | 64)) {
        const slot = children.default
        if (slot) {
          slot._c && (slot._d = false)
          normalizeChildren(vnode, slot())
          slot._c && (slot._d = true)
        }
        return
      } else {
        type = 32
        const slotFlag = children._
        if (!slotFlag && !(InternalObjectKey in children)) {
          children._ctx = currentRenderingInstance
        } else if (slotFlag === 3 && currentRenderingInstance) {
          if (currentRenderingInstance.slots._ === 1) {
            children._ = 1
          } else {
            children._ = 2
            vnode.patchFlag |= 1024
          }
        }
      }
    } else if (isFunction(children)) {
      children = { default: children, _ctx: currentRenderingInstance }
      type = 32
    } else {
      children = String(children)
      if (shapeFlag & 64) {
        type = 16
        children = [createTextVNode(children)]
      } else {
        type = 8
      }
    }
    vnode.children = children
    vnode.shapeFlag |= type
  }
  function mergeProps (...args) {
    const ret = {}
    for (let i = 0; i < args.length; i++) {
      const toMerge = args[i]
      for (const key in toMerge) {
        if (key === 'class') {
          if (ret.class !== toMerge.class) {
            ret.class = normalizeClass([ret.class, toMerge.class])
          }
        } else if (key === 'style') {
          ret.style = normalizeStyle([ret.style, toMerge.style])
        } else if (isOn(key)) {
          const existing = ret[key]
          const incoming = toMerge[key]
          if (incoming && existing !== incoming && !(isArray(existing) && existing.includes(incoming))) {
            ret[key] = existing ? [].concat(existing, incoming) : incoming
          }
        } else if (key !== '') {
          ret[key] = toMerge[key]
        }
      }
    }
    return ret
  }
  let globalCurrentInstanceSetters
  let settersKey = '__VUE_INSTANCE_SETTERS__'
  {
    if (!(globalCurrentInstanceSetters = getGlobalThis()[settersKey])) {
      globalCurrentInstanceSetters = getGlobalThis()[settersKey] = []
    }
    globalCurrentInstanceSetters.push((i) => i)
  }
  function isClassComponent (value) {
    return isFunction(value) && '__vccOpts' in value
  }
  const __default__ = {
    data () {
      return {}
    },
    async mounted () {
      console.warn('refs ====', this.$refs)
    },
    methods: {}
  }
  const _sfc_main = /* @__PURE__ */ Object.assign(__default__, {
    __name: 'TestComponent',
    setup (__props) {
      const test = ref(null)
      return (_ctx, _cache) => {
        return openBlock(), createElementBlock('div', {
          ref_key: 'test',
          ref: test,
          class: 'activations'
        }, ' content ', 512)
      }
    }
  })
  const TestComponent = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: _sfc_main
  }, Symbol.toStringTag, { value: 'Module' }))
})
