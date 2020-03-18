const DEBOUNCE_DURATION         = 1000
const DOT_COUNT                 = 50
const DOT_SIZE_MINIMUM          = 5
const DOT_SIZE_VARIANCE         = 5
const HORIZONTAL_SPEED_MINIMUM  = 4000
const HORIZONTAL_SPEED_VARIANCE = 4000
const VERTICAL_SPEED_MINIMUM    = 4000
const VERTICAL_SPEED_VARIANCE   = 4000
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

let canvas

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
  // Clear existing SVG element
  let existing = document.getElementById(`atomique-${CONTAINER_NAME}`)
  if (existing !== null) {
    existing.parentNode.removeChild(existing)
  }

  // Determine the dimensions and position of the effect host/target
  let hostRect = getHostRect()
  let x = hostRect.x
  let y = hostRect.y
  let width = hostRect.width
  let height = hostRect.height
  
  // Build up a new HTML element (div) to contain the actual effect
  let container = document.createElement('div')
  container.style.left = x
  container.style.top = y
  container.style.width = width
  container.style.height = height
  container.style.padding = '0'
  container.style.position = 'fixed'
  container.style.border = '2px solid red'
  container.id = `atomique-${CONTAINER_NAME}`
  
  // Append the new element to the DOM
  document.getElementsByTagName('body')[0].appendChild(container)
  
  // Create SVG canvas on the new element and finish setting it up
  canvas = SVG()
    .addTo(`#${container.id}`)
  canvas.size(width, height)
  canvas.clear()

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
    let r = canvas.rect(dotSize, dotSize)
    r.addTo(canvas)
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
    
    // horizontal
    r.animate(Math.random() * HORIZONTAL_SPEED_VARIANCE + HORIZONTAL_SPEED_MINIMUM, 0, 'absolute')
    .loop(times, swing)
    .ease('<>')
    .attr({
      fill: endColor,
      x: endX
    })
    .loops(Math.random() * 2)
    
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

function clearCanvas() {
  let node = document.getElementById('canvas')
  while(node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

function rightMostX(hostWidth, dot) {
  return hostWidth - dot.width()
}