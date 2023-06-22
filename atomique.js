function atomique (opts = {}) {
  const DEBUG                        = opts.debug || false

  const DEBOUNCE_DURATION            = opts.debounceTime || 250
  const LOWER_Z_INDEX                = 'LOWER_Z_INDEX'
  const UPPER_Z_INDEX                = 'UPPER_Z_INDEX'
  const LATEST_RESET                 = 'LATEST_RESET'

  const HOST_ELEMENT_ID              = opts.hostElementId || 'example'

  const COLOR_A                      = opts.colorA || '#fff'
  const COLOR_B                      = opts.colorB || '#000'

  const DOT_COUNT                    = opts.dotCount || 10

  const DOT_SIZE_MINIMUM             = opts.minDotSize || 5
  const DOT_SIZE_MAXIMUM             = opts.maxDotSize || 10
  const DOT_SIZE_VARIANCE            = DOT_SIZE_MAXIMUM - DOT_SIZE_MINIMUM

  const H_DURATION                   = opts.minHorizontalDuration * 1000
  const HORIZONTAL_DURATION_MINIMUM  = Number.isNaN(H_DURATION) ? 1000 : H_DURATION
  const H_VARIANCE                   = opts.horizontalVariance * 1000
  const HORIZONTAL_VARIANCE          = Number.isNaN(H_VARIANCE) ? 2000 : H_VARIANCE

  const V_DURATION                   = opts.minVerticalDuration * 1000
  const VERTICAL_DURATION_MINIMUM    = Number.isNaN(V_DURATION) ? 1000 : V_DURATION
  const V_VARIANCE                   = opts.verticalVariance * 1000
  const VERTICAL_VARIANCE            = Number.isNaN(V_VARIANCE) ? 2000 : V_VARIANCE

  const COLOR_UNIFORMITY             = opts.colorUniformity || false

  let debouncer = null
  let canvasUpper, canvasLower
  let rightMostX
  let latestReset

  function atomique_log(msg) {
    if (DEBUG) {
      console.log(`[Atomique debug] ${msg}`)
    }
  }

  // Report calculated startup
  atomique_log(`Got DEBUG                        ${DEBUG}`)
  atomique_log(`Got HOST_ELEMENT_ID              ${HOST_ELEMENT_ID}`)
  atomique_log(`Got DEBOUNCE_DURATION            ${DEBOUNCE_DURATION}`)
  atomique_log(`Got LOWER_Z_INDEX                ${LOWER_Z_INDEX}`)
  atomique_log(`Got UPPER_Z_INDEX                ${UPPER_Z_INDEX}`)
  atomique_log(`Got LATEST_RESET                 ${LATEST_RESET}`)
  atomique_log(`Got COLOR_A                      ${COLOR_A}`)
  atomique_log(`Got COLOR_B                      ${COLOR_B}`)
  atomique_log(`Got DOT_COUNT                    ${DOT_COUNT}`)
  atomique_log(`Got DOT_SIZE_MINIMUM             ${DOT_SIZE_MINIMUM}`)
  atomique_log(`Got DOT_SIZE_MAXIMUM             ${DOT_SIZE_MAXIMUM}`)
  atomique_log(`Got DOT_SIZE_VARIANCE            ${DOT_SIZE_VARIANCE}`)
  atomique_log(`Got H_DURATION                   ${H_DURATION}`)
  atomique_log(`Got HORIZONTAL_DURATION_MINIMUM  ${HORIZONTAL_DURATION_MINIMUM}`)
  atomique_log(`Got H_VARIANCE                   ${H_VARIANCE}`)
  atomique_log(`Got HORIZONTAL_VARIANCE          ${HORIZONTAL_VARIANCE}`)
  atomique_log(`Got V_DURATION                   ${V_DURATION}`)
  atomique_log(`Got VERTICAL_DURATION_MINIMUM    ${VERTICAL_DURATION_MINIMUM}`)
  atomique_log(`Got V_VARIANCE                   ${V_VARIANCE}`)
  atomique_log(`Got VERTICAL_VARIANCE            ${VERTICAL_VARIANCE}`)
  atomique_log(`Got COLOR_UNIFORMITY             ${COLOR_UNIFORMITY}`)

  if(document.readyState === 'complete') {
    init()
  } else {
    window.addEventListener('load', () => {
      init()
    })  
  }

  function debounceHandler() {
    if(debouncer) return
    debouncer = setTimeout(() => {
      debouncer = null
      run()
    }, DEBOUNCE_DURATION)
  }

  function init() {
    atomique_log('initializing')
    window.addEventListener('resize', debounceHandler)
    window.addEventListener('scroll', debounceHandler)

    run()
  }

  // Get the host element and break out some data pertaining to it
  function getHostData () {
    let hostElement = document.getElementById(HOST_ELEMENT_ID)
    if (hostElement === null) {
      console.error(`Error: Atomique could not find a suitable host element with the name: '${HOST_ELEMENT_ID}'.`)
      return null
    }
    let hostRect = hostElement.getBoundingClientRect()

    let hostZIndex
    if (window.getComputedStyle) {
      hostZIndex = parseInt(document.defaultView.getComputedStyle(hostElement, null).getPropertyValue('z-index'));
      if (isNaN(hostZIndex)) {
        hostZIndex = parseInt(document.defaultView.getComputedStyle(hostElement, null).getPropertyValue('zIndex'));
      }
    } else if (hostElement.currentStyle) {
      hostZIndex = parseInt(hostElement.currentStyle['z-index']);
      if (isNaN(hostZIndex)) {
        hostZIndex = parseInt(hostElement.currentStyle['zIndex']);
      }
    }
    if (isNaN(hostZIndex)) hostZIndex = 0
    
    return {
      hostRect,
      width: hostRect.width * 1.2,
      height: hostRect.height * 1.4,
      hostZIndex
    }
  }

  // Resets elements based on new position and size info, and returns info on new properties
  function reset() {
    atomique_log('reset')
    // Clear existing SVG elements
    let existing = document.getElementById(`atomique-upper-${HOST_ELEMENT_ID}`)
    if (existing !== null) {
      existing.parentNode.removeChild(existing)
    }
    existing = document.getElementById(`atomique-lower-${HOST_ELEMENT_ID}`)
    if (existing !== null) {
      existing.parentNode.removeChild(existing)
    }

    // Determine the dimensions and position of the effect host/target
    let hostData = getHostData()
    if (hostData === null) return null

    let hostRect = hostData.hostRect
    let x = hostRect.left - (hostRect.width * 0.1)
    let y = hostRect.top - (hostRect.height * 0.25)
    let width = hostRect.width
    let height = hostRect.height
    let hostZIndex = hostData.hostZIndex

    atomique_log(`x ${x}`)
    atomique_log(`y ${y}`)

    latestReset = new Date().getTime() / 1000
    
    // Build up new HTML elements (div) to contain the actual effect
    let containerUpper = document.createElement('div')
    containerUpper.style.left = `${x}px`
    containerUpper.style.top = `${y}px`
    containerUpper.style.width = `${width}px`
    containerUpper.style.height = `${height}px`
    containerUpper.style.overflow = 'visible'
    containerUpper.style.padding = '0'
    containerUpper.style.pointerEvents = 'none'
    containerUpper.style.position = 'fixed'
    containerUpper.style.zIndex = hostZIndex + 1
    containerUpper.id = `atomique-upper-${HOST_ELEMENT_ID}`

    atomique_log(`containerUpper z ${containerUpper.style.zIndex}`)

    let containerLower = document.createElement('div')
    containerLower.style.left = `${x}px`
    containerLower.style.top = `${y}px`
    containerLower.style.width = `${width}px`
    containerLower.style.height = `${height}px`
    containerLower.style.overflow = 'visible'
    containerLower.style.padding = '0'
    containerLower.style.pointerEvents = 'none'
    containerLower.style.position = 'fixed'
    containerLower.style.zIndex = hostZIndex - 1
    containerLower.id = `atomique-lower-${HOST_ELEMENT_ID}`
    
    atomique_log(`containerLower z ${containerLower.style.zIndex}`)

    // Append the new elements to the DOM
    document.getElementsByTagName('body')[0].appendChild(containerUpper)
    document.getElementsByTagName('body')[0].appendChild(containerLower)
    
    // Create SVG canvases on the new element and finish setting them up
    canvasUpper = SVG()
      .addTo(`#${containerUpper.id}`)
    canvasUpper.size(width, height)
    canvasUpper.css('overflow', 'visible')
    canvasUpper.clear()

    canvasLower = SVG()
      .addTo(`#${containerLower.id}`)
    canvasLower.size(width, height)
    canvasLower.css('overflow', 'visible')
    canvasLower.clear()

    return hostData
  }

  function run() {
    atomique_log('running')
    if(debouncer) return

    // get host element data
    let hostRect = reset()
    if (hostRect === null) {
      atomique_log('unable to define host rect')
      return null
    }
    let height = hostRect.height

    // set up all the dots
    const dotSpacing = (height / DOT_COUNT)
    let rects = []
    let y = height * 0.1

    // add the dots (rects) to canvas
    while(y <= height * 0.9) {
      const dotSize = Math.floor(Math.random() * DOT_SIZE_VARIANCE + DOT_SIZE_MINIMUM)
      let r = canvasUpper.rect(dotSize, dotSize)
      r.addTo(canvasUpper)
      r.y(y)
      rects.push(r)
      y += dotSpacing
    }

    rects.forEach(r => {
      // lor: left or right
      let lor = coinToss()

      const host = document.getElementById(HOST_ELEMENT_ID)
      rightMostX = (host.getBoundingClientRect().width * 1.2) - (DOT_SIZE_MINIMUM + DOT_SIZE_VARIANCE)
      let startX = lor ? 0 : rightMostX
      let endX = lor ? rightMostX : 0

      let startColor

      let times = Infinity
      let swing = true

      if (COLOR_UNIFORMITY) startColor = lor ? COLOR_A : COLOR_B
      else startColor = coinToss() ? COLOR_A : COLOR_B
      r.fill(startColor)
      r.radius(r.width()/2)
      r.x(startX)
      r.data('z-index', UPPER_Z_INDEX)
      r.data(LATEST_RESET, latestReset)
      
      // horizontal
      recurseHorizontalAnimation(r, startColor === COLOR_A ? COLOR_B : COLOR_A, endX, {colorA: COLOR_A, colorB: COLOR_B, startX, endX}, true)
      
      // vertical
      r.animate(Math.random() * VERTICAL_VARIANCE + VERTICAL_DURATION_MINIMUM, 0, 'absolute')
      .loop(times, swing)
      .ease('<>')
      .attr({
        y: (Math.random() * (height * 0.8) - r.height()) + (height * 0.1)
      })
      .loops(Math.random() * 2)
    })
  }

  function recurseHorizontalAnimation (r, newColor, newX, generalInfo, headStart) {
    r.animate(Math.random() * HORIZONTAL_VARIANCE + HORIZONTAL_DURATION_MINIMUM, 0, 'absolute')
    .loop(1, false)
    .ease('<>')
    .attr({
      fill: newColor,
      x: newX
    })
    .loops(headStart ? Math.random() : 0)
    .after(() => {
      if (r.data(LATEST_RESET) !== latestReset) {
        r.remove()
        return
      }
      r.remove()
      if (r.data('z-index') === UPPER_Z_INDEX) {
        r.addTo(canvasLower)
        r.data('z-index', LOWER_Z_INDEX)
        recurseHorizontalAnimation(r, newColor === generalInfo.colorA ? generalInfo.colorB : generalInfo.colorA, generalInfo.startX, generalInfo)
      }
      else {
        r.addTo(canvasUpper)
        r.data('z-index', UPPER_Z_INDEX)
        recurseHorizontalAnimation(r, newColor === generalInfo.colorA ? generalInfo.colorB : generalInfo.colorA, generalInfo.endX, generalInfo)
      }
    })
  }

  function coinToss () {
    return Math.floor(Math.random() * 2)
  }
}
