const DEBOUNCE_DURATION         = 1000
const DOT_COUNT                 = 50
const DOT_SIZE_MINIMUM          = 5
const DOT_SIZE_VARIANCE         = 5
const HORIZONTAL_SPEED_MINIMUM  = 1000
const HORIZONTAL_SPEED_VARIANCE = 2000
const VERTICAL_SPEED_MINIMUM    = 1000
const VERTICAL_SPEED_VARIANCE   = 2000
const LOWER_Z_INDEX             = -1
const UPPER_Z_INDEX             = 1
const CONTAINER_NAME            = 'example'

const DOT_COUNT_LIGHT           = Math.floor(DOT_COUNT / 3)

if(document.readyState === 'complete') {
  init()
} else {
  window.addEventListener('load', () => {
    init()
  })
}

let debouncer = null

let canvasUpper, canvasLower

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

function getHostRect () {
  let hostRect = document
    .getElementById(CONTAINER_NAME)
    .getBoundingClientRect()
  
  return {
    x: hostRect.left - (hostRect.width * 0.2),
    y: hostRect.top - (hostRect.height * 0.25),
    width: hostRect.width * 1.4,
    height: hostRect.height * 1.4
  }
}

// Resets elements based on new position and size info, and returns info on new properties
function reset() {
  // Clear existing SVG elements
  let existing = document.getElementById(`atomique-upper-${CONTAINER_NAME}`)
  if (existing !== null) {
    existing.parentNode.removeChild(existing)
  }
  existing = document.getElementById(`atomique-lower-${CONTAINER_NAME}`)
  if (existing !== null) {
    existing.parentNode.removeChild(existing)
  }

  // Determine the dimensions and position of the effect host/target
  let hostRect = getHostRect()
  let x = hostRect.x
  let y = hostRect.y
  let width = hostRect.width
  let height = hostRect.height
  
  // Build up new HTML elements (div) to contain the actual effect
  let containerUpper = document.createElement('div')
  containerUpper.style.left = x
  containerUpper.style.top = y
  containerUpper.style.width = width
  containerUpper.style.height = height
  containerUpper.style.padding = '0'
  containerUpper.style.position = 'fixed'
  containerUpper.style.border = '2px solid red'
  containerUpper.style.zIndex = UPPER_Z_INDEX
  containerUpper.id = `atomique-upper-${CONTAINER_NAME}`

  let containerLower = document.createElement('div')
  containerLower.style.left = x
  containerLower.style.top = y
  containerLower.style.width = width
  containerLower.style.height = height
  containerLower.style.padding = '0'
  containerLower.style.position = 'fixed'
  containerLower.style.border = '2px solid red'
  containerLower.style.zIndex = LOWER_Z_INDEX
  containerLower.id = `atomique-lower-${CONTAINER_NAME}`
  
  // Append the new elements to the DOM
  document.getElementsByTagName('body')[0].appendChild(containerUpper)
  document.getElementsByTagName('body')[0].appendChild(containerLower)
  
  // Create SVG canvases on the new element and finish setting them up
  canvasUpper = SVG()
    .addTo(`#${containerUpper.id}`)
  canvasUpper.size(width, height)
  canvasUpper.clear()

  canvasLower = SVG()
    .addTo(`#${containerLower.id}`)
  canvasLower.size(width, height)
  canvasLower.clear()

  return hostRect
}

function run() {
  if(debouncer) return
  
  console.log('(re)starting graphics!')
  
  let hostRect = reset()
  let width = hostRect.width
  let height = hostRect.height
  
  const dotSpacing = (height / DOT_COUNT) * 2
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
    let lor = Math.floor(Math.random() * 2)

    let startColor = '#000'
    let endColor = '#f54'

    let startX = lor ? 0 : rightMostX(width, r)
    let endX = lor ? rightMostX(width, r) : 0

    let times = Infinity
    let swing = true

    r.fill(startColor)
    r.radius(r.width()/2)
    r.x(startX)
    r.data('z-index', UPPER_Z_INDEX)
    
    // horizontal
    r.animate(Math.random() * HORIZONTAL_SPEED_VARIANCE + HORIZONTAL_SPEED_MINIMUM, 0, 'absolute')
    .loop(1, false)
    .ease('<>')
    .attr({
      fill: endColor,
      x: endX
    })
    .loops(Math.random())
    .after(() => {
      r.remove()
      if (r.data('z-index') === UPPER_Z_INDEX) {
        r.addTo(canvasLower)
        r.data('z-index', LOWER_Z_INDEX)
        subsequentAnimation(r, startColor, startX, {startColor, endColor, startX, endX})
      }
      else {
        r.addTo(canvasUpper)
        r.data('z-index', UPPER_Z_INDEX)
        subsequentAnimation(r, endColor, endX, {startColor, endColor, startX, endX})
      }
    })
    
    // vertical
    r.animate(Math.random() * VERTICAL_SPEED_VARIANCE + VERTICAL_SPEED_MINIMUM, 0, 'absolute')
    .loop(times, swing)
    .ease('<>')
    .attr({
      y: (Math.random() * (height * 0.8)) + (height * 0.1)
    })
    .loops(Math.random() * 2)
  })
}

function subsequentAnimation (r, newColor, newX, generalInfo) {
  r.animate(Math.random() * HORIZONTAL_SPEED_VARIANCE + HORIZONTAL_SPEED_MINIMUM, 0, 'absolute')
  .loop(1, false)
  .ease('<>')
  .attr({
    fill: newColor,
    x: newX
  })
  .after(() => {
    r.remove()
    if (r.data('z-index') === UPPER_Z_INDEX) {
      r.addTo(canvasLower)
      r.data('z-index', LOWER_Z_INDEX)
      subsequentAnimation(r, generalInfo.startColor, generalInfo.startX, generalInfo)
    }
    else {
      r.addTo(canvasUpper)
      r.data('z-index', UPPER_Z_INDEX)
      subsequentAnimation(r, generalInfo.endColor, generalInfo.endX, generalInfo)
    }
  })
}

function clearCanvas() {
  let node = document.getElementById('canvas')
  while(node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

function rightMostX(hostWidth, dot) {
  return hostWidth - dot.width()
}