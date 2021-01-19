This Library is based on

```json
"name": "apng-canvas",
"version": "2.1.3",
"author": "David Mzareulyan",
"description": "Library for displaing animated PNG files in browsers with canvas support",
"keywords": [
"apng",
"animation",
"animated png",
"canvas"
],
"homepage": "https://github.com/davidmz/apng-canvas"
```

Thanks for his work!

## Introduction

Library to display Animated PNG ([Wikipedia](http://en.wikipedia.org/wiki/APNG), [specification](https://wiki.mozilla.org/APNG_Specification)) in a browser using canvas

You can totally control it.

[]()

The library requires support from the following technologies in order to run:

- [Canvas](http://caniuse.com/#feat=canvas)
- [Typed Arrays](http://caniuse.com/#feat=typedarrays)
- [Blob URLs](http://caniuse.com/#feat=bloburls)
- [requestAnimationFrame](http://caniuse.com/#feat=requestanimationframe)

## How To Use

```html
<img class="" src="xxxxxxxx" style='opacity:0' />
```
`style='opacity:0'` this is important

```javascript
import APNG from "apng-canvas-typescript";
let apng = new APNG();
```

## api

### isSupport

is support apng<br>

```javascript
apng
  .isSupport()
  .then(() => {
    console.log("not support");
  })
  .catch(() => {
    console.log("support");
  });
```

### animateImage(img,autoplay)

covert apng to canvas data

| param    | type           | about       |
| -------- | -------------- | ----------- |
| img      | HTMLImgElement | img dom     |
| autoplay | boolean        | auto or not |

@return Promise<anim:AnimationCotroller>

```javascript
var image1 = document.querySelector(".apng-image1");
apng.animateImage(image1, false).then((anim) => {
  anim.play([50, 70]);
  anim.before((ctx, f) => {
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 100 + f * 3, 100 + f * 3);
  });
  anim.after((ctx, f) => {
    ctx.fillStyle = "blue";
    ctx.fillRect(200, 200, 100 + f * 3, 100 + f * 3);
  });
});
```

### anim <AnimationCotroller>

#### anim.play(frameArray)

| param      | type  | about                                                                        |
| ---------- | ----- | ---------------------------------------------------------------------------- |
| frameArray | array | [start,end] the frames range you want to play ,[start] means play to the end |

#### anim.stop()

#### anim.pause(frame)

| param | type   | about                    |
| ----- | ------ | ------------------------ |
| frame | number | stop at the frame number |

#### anim.start()

restart (use with `pause`)

```javascript
anim.pause(5);
anim.start();
```

#### anim.setOptions({playNum,rate})

| param   | type   | about       | default                    |
| ------- | ------ | ----------- | -------------------------- |
| playNum | number | play number | 0: play again and again :) |
| rate    | number | play rate   | 1                          |

#### anim.before(func) & anim.after(func)

ctx:RenderingContext
f: frame number

```javascript
anim.before((ctx, f) => {
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, 100 + f * 3, 100 + f * 3);
});
anim.after((ctx, f) => {
  ctx.fillStyle = "blue";
  ctx.fillRect(200, 200, 100 + f * 3, 100 + f * 3);
});
```
