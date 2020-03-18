function atomique (opts = {}) {
  const DEBOUNCE_DURATION         = 1000
  const LOWER_Z_INDEX             = 'LOWER_Z_INDEX'
  const UPPER_Z_INDEX             = 'UPPER_Z_INDEX'

  const LEFT_RIGHT_COLOR_MODE     = opts.leftRightColorMode || false
  const DOT_COUNT                 = opts.dotCount || 10
  const DOT_SIZE_MINIMUM          = opts.minDotSize || 5
  const DOT_SIZE_VARIANCE         = opts.dotSizeVariance || 5
  const HORIZONTAL_SPEED_MINIMUM  = opts.minHorizontalSpeed * 1000 || 1000
  const HORIZONTAL_SPEED_VARIANCE = opts.speedVariance * 1000 || 2000
  const VERTICAL_SPEED_MINIMUM    = opts.minVerticalSpeed * 1000 || 1000
  const VERTICAL_SPEED_VARIANCE   = opts.speedVariance * 1000 || 2000
  const COLOR_A                   = opts.colorA || '#fff'
  const COLOR_B                   = opts.colorB || '#000'
  const HOST_ELEMENT_NAME         = opts.hostElementName || 'example'

  console.log(`Got LEFT_RIGHT_COLOR_MODE     ${LEFT_RIGHT_COLOR_MODE}`)
  console.log(`Got DOT_COUNT                 ${DOT_COUNT}`)
  console.log(`Got DOT_SIZE_MINIMUM          ${DOT_SIZE_MINIMUM}`)
  console.log(`Got DOT_SIZE_VARIANCE         ${DOT_SIZE_VARIANCE}`)
  console.log(`Got HORIZONTAL_SPEED_MINIMUM  ${HORIZONTAL_SPEED_MINIMUM}`)
  console.log(`Got HORIZONTAL_SPEED_VARIANCE ${HORIZONTAL_SPEED_VARIANCE}`)
  console.log(`Got VERTICAL_SPEED_MINIMUM    ${VERTICAL_SPEED_MINIMUM}`)
  console.log(`Got VERTICAL_SPEED_VARIANCE   ${VERTICAL_SPEED_VARIANCE}`)
  console.log(`Got COLOR_A                   ${COLOR_A}`)
  console.log(`Got COLOR_B                   ${COLOR_B}`)
  console.log(`Got HOST_ELEMENT_NAME         ${HOST_ELEMENT_NAME}`)

  let debouncer = null
  let canvasUpper, canvasLower
  let rightMostX

  if(document.readyState === 'complete') {
    init()
  } else {
    window.addEventListener('load', () => {
      init()
    })  
  }  

  function init() {
    window.addEventListener('resize', () => {
      if(debouncer) return
      debouncer = setTimeout(() => {
        debouncer = null
        run()
      }, DEBOUNCE_DURATION)
    })

    run()
  }

  // Get the host element and break out some data pertaining to it
  function getHostData () {
    let hostElement = document.getElementById(HOST_ELEMENT_NAME)
    let hostRect = hostElement.getBoundingClientRect()

    let hostZIndex = hostElement.style.zIndex
    
    return {
      x: hostRect.left - (hostRect.width * 0.2),
      y: hostRect.top - (hostRect.height * 0.25),
      width: hostRect.width * 1.4,
      height: hostRect.height * 1.4,
      hostZIndex
    }
  }

  // Resets elements based on new position and size info, and returns info on new properties
  function reset() {
    // Clear existing SVG elements
    let existing = document.getElementById(`atomique-upper-${HOST_ELEMENT_NAME}`)
    if (existing !== null) {
      existing.parentNode.removeChild(existing)
    }
    existing = document.getElementById(`atomique-lower-${HOST_ELEMENT_NAME}`)
    if (existing !== null) {
      existing.parentNode.removeChild(existing)
    }

    // Determine the dimensions and position of the effect host/target
    let hostData = getHostData()
    let x = hostData.x
    let y = hostData.y
    let width = hostData.width
    let height = hostData.height
    let hostZIndex = hostData.hostZIndex

    rightMostX = width - (DOT_SIZE_MINIMUM + DOT_SIZE_VARIANCE)
    
    // Build up new HTML elements (div) to contain the actual effect
    let containerUpper = document.createElement('div')
    containerUpper.style.left = x
    containerUpper.style.top = y
    containerUpper.style.width = width
    containerUpper.style.height = height
    containerUpper.style.overflow = 'visible'
    containerUpper.style.padding = '0'
    containerUpper.style.pointerEvents = 'none'
    containerUpper.style.position = 'fixed'
    containerUpper.style.zIndex = hostZIndex + 1
    containerUpper.id = `atomique-upper-${HOST_ELEMENT_NAME}`

    let containerLower = document.createElement('div')
    containerLower.style.left = x
    containerLower.style.top = y
    containerLower.style.width = width
    containerLower.style.height = height
    containerLower.style.overflow = 'visible'
    containerLower.style.padding = '0'
    containerLower.style.pointerEvents = 'none'
    containerLower.style.position = 'fixed'
    containerLower.style.zIndex = hostZIndex - 1
    containerLower.id = `atomique-lower-${HOST_ELEMENT_NAME}`
    
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
    if(debouncer) return
    
    let hostRect = reset()
    let width = hostRect.width
    let height = hostRect.height
    
    const dotSpacing = (height / DOT_COUNT)
    let rects = []
    let y = height * 0.1

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

      let startX = lor ? 0 : rightMostX
      let endX = lor ? rightMostX : 0

      let startColor

      let times = Infinity
      let swing = true

      if (LEFT_RIGHT_COLOR_MODE) startColor = lor ? COLOR_A : COLOR_B
      else startColor = coinToss() ? COLOR_A : COLOR_B
      r.fill(startColor)
      r.radius(r.width()/2)
      r.x(startX)
      r.data('z-index', UPPER_Z_INDEX)
      r.data('currentRightMost', rightMostX)
      
      // horizontal
      recurseHorizontalAnimation(r, startColor === COLOR_A ? COLOR_B : COLOR_A, endX, {colorA: COLOR_A, colorB: COLOR_B, startX, endX}, true)
      
      // vertical
      r.animate(Math.random() * VERTICAL_SPEED_VARIANCE + VERTICAL_SPEED_MINIMUM, 0, 'absolute')
      .loop(times, swing)
      .ease('<>')
      .attr({
        y: (Math.random() * (height * 0.8) - r.height()) + (height * 0.1)
      })
      .loops(Math.random() * 2)
    })
  }

  function recurseHorizontalAnimation (r, newColor, newX, generalInfo, headStart) {
    r.animate(Math.random() * HORIZONTAL_SPEED_VARIANCE + HORIZONTAL_SPEED_MINIMUM, 0, 'absolute')
    .loop(1, false)
    .ease('<>')
    .attr({
      fill: newColor,
      x: newX
    })
    .loops(headStart ? Math.random() : 0)
    .after(() => {
      if (r.data('currentRightMost') !== rightMostX) {
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
