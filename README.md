
# Atomique
*ah-toe-MEEK -* A configurable visual effect resembling sub-atomic particles orbiting a nucleus

## Getting Started

Currently, this is a bare-bones JavaScript library that you can include on your HTML page using `<script>` tags.  For the moment, you will also need to include the [SVG.js](https://svgjs.dev/docs/3.0/) `svg.min.js` file included in this repository as an additional dependency.  `svg.min.js` and `atomique.js` are all you need to get started.

Included in this repository is a sample HTML page demonstrating the most basic way to get Atomique working on your page.  Refer to `index.html` as a guide, and see it in action [here](https://stevenkitzes.github.io/atomique).

The following snippet will get you started.  This will include the required files on your page, and start the Atomique effect.  By default, the effect will be applied to the element on your page with the `id` attribute "example".

    <div id='example'>This div gets the effect.</div>
    <script src='svg.min.js'></script>
    <script src='atomique.js'></script>
    <script type='text/javascript'>
      window.addEventListener('load', () => {
        atomique()
      })
    </script>

Atomique is capable of being applied to multiple elements with unique `id` attributes, and each Atomique effect can have its own configuration!  **Be warned**, though: SVG animation is taxing on browsers, so large numbers of particles are likely to impact performance noticeably. 

## Configurability
The `atomique()` command gets the effect started with a bunch of defaults.  But many of the effect's properties are configurable, such as the speed, size, and color of the moving particles.  All properties are configured by passing an object to the `atomique()` command with property names and values.  As a simple example, you can change the number of particles in orbit like this:

    atomique({ dotCount: 5 })

You can, of course, include one or more properties in this way.  Atomique doesn't do a lot of hand-holding, so you can try some pretty gnarly stuff just to see what happens.  In the worst case, you'll get something ugly (or surprisingly pretty), or in some instances Atomique will take over with default values if you get too wild.  (For example, the string `llama` will not work as a duration no matter how hard Atomique tries.)

Let's look at all the things you can do with the Atomique API.

### Host Element ID

    { hostElementId: String }
    
Specify the element you want to host the effect by passing the HTML element's `id` attribute value to the `hostElementId` property, like this:

    atomique({ hostElementId: 'myElement' })

#### NOTES:

- Atomique does *not* expect a selector; it only works on a single element by its `id`, so just pass the `id` as a string without the `#` symbol.
- The HTML element that plays host to the Atomique effect _must_ be a positioned element.  This is due to limitations in browsers' ability to interpret z-index values.  For more information, check out [MDN's docs on z-index here](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index?utm_source=devtools&utm_medium=inspector-inactive-css).


### Colors

    { colorA: String }
    { colorB: String }

Specify the colors of the particles with `colorA` and `colorB`.  By default, `colorA` is white, and `colorB` is black, so you can change either or both of these.  **Note** that due to the limitations of the SVG engine, Atomique can only accept colors as strings in the hexadecimal RGB format, e.g. `#f4fc48` or `#b47`.  For example:

    atomique({
      colorA: '#f4fc48',
      colorB: '#b47'
    })

### Dot Count

    { dotCount: Number }

How many dots would you like?  The `dotCount` property lets you decide.  You can use negative numbers if you want a really boring experience, or really high numbers if you want your browser to crash.  I recommend something in the one- to two-dozen range, but tune to your taste.  Here's a tasteful example that makes a bit of sense:

    atomique({ dotCount: 15 })

And because I can't resist the hilarity, an example that your browser will never, ever forgive you for:

    atomique({ dotCount: Number.MAX_SAFE_INTEGER })

### Dot Size and Variability

    { minDotSize: Number }
    { maxDotSize: Number }

You can choose to make all particles the same size, or have them vary.  This is accomplished using the `minDotSize` and `maxDotSize` options.  You can, of course, use the same value for both, resulting in a single, consistent particle size.  You may prefer a slight variability:

    atomique({
      minDotSize: 5,
      maxDotSize: 10
    })

Atomique doesn't do any validation, so you can do wacky stuff like negative sizes (which work), or gigantic sizes (which can give you some surprisingly fun results on larger host elements).

It's worth noting that larger particles will get some strange clipping and popping effects as they overlap each other and the host element, mainly when transitioning from in front to behind the host element (and vice versa).

### Animation Speed

    // All values are in seconds
    { minHorizontalDuration: Number }
    { horizontalVariance:    Number }
    { minVerticalDuration:   Number }
    { verticalVariance:      Number }

Particle movement is randomized on a per-particle basis.  The extremities of horizontal animation are predetermined, but vertical extremities are randomized per-particle, and both horizontal and vertical speed and randomness/variability are configurable.

Technically, speed is controlled in Atomique by manipulating *duration*.  In other words, Atomique needs to know *how long* you want an animation to take, rather than how fast you want the particle to move.  Take the following as an example:

    atomique({
      minHorizontalDuration: 2,
      horizontalVariance: 2
    })

In the above example, each animation of a particle from *left to right* **or** from *right to left* will take 2 to 4 seconds - for a total orbit of 4 to 8 seconds.  Here is another example,  demonstrating a *lack* of variance:

    atomique({
      minVerticalDuration: 1,
      verticalVariance: 0
    })

In this case, vertical animations up-to-down or down-to-up will always take 1 second, with no randomness in that duration.  You can, of course, combine all of the above:

    atomique({
      minHorizontalDuration: 2,
      horizontalVariance: 1,
      minVerticalDuration: 1,
      verticalVariance, 1
    })

**Note** that horizontal and vertical animations are broken up, and are considered separately in the Atomique effect.  This adds to the randomness and is by design, but as you can see, you can be clever with customization to reach your own result.

Atomique accepts stupid stuff like negative durations.  The result is ... not great, but in case you like it, Atomique allows it.

### Left-Right Color Uniformity

    { colorUniformity: Boolean }

I accidentally created a feature at some point that ensures all particles are the same color when they are on the same side of the element.  In other words, if you pick blue and red, *all* particles will be blue when orbiting on the left side of the element, and *all* will be red when on the right.  I liked the effect in some cases, so kept the `colorUniformity` feature as an option:

    atomique({ colorUniformity: true })

### Performance

    { debounceTime: Number }

SVG animations are not cheap for a browser to run.  Adding a large number of dots to the Atomique effect can cause performance degradation.  (If you go crazy with it, I can guarantee it will cause performance degradation.)  Re-calculating and setting up the effect is also expensive.  Since the effect runs in a canvas, any change to the rendered DOM layout/styles can cause the entire effect to go through initialization from scratch - a very intensive process - because the effect's canvas(es) need to follow the shape/position of their host HTML element.  Oof!

To alleviate the performance ramifications of reinitializing the effect every time the browser encounters a scroll or layout update, a debouncer was implemented.  In short, if you resize the window, Atomique will wait a bit to see if you _continue_ resizing.  If you scroll, it'll wait a bit to see if you _continue_ scrolling.  If you do continue, it will wait some more, until you stop changing the scroll/layout of the page.  Then, once it's convinced you're done, it will reinitialize the Atomique effect.  The `debounceTime` is the amount of time Atomique will wait to see if you continue performing page updates that would cause Atomique to reinitialize.

## Ideas for Improvement

- More configurability (size of orbit relative to host)
- Configurable z-index of particles
- More than two colors...?
- Live configurability demo
- Package for `npm` deployability

Play around and see what you come up with, and shoot me any ideas.  I've come up with some excessively neat effects by goofing around with color uniformity and invariable animation durations, in particular.

Enjoy!!  :)
