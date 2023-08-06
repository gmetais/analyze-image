# analyze-image
Analyzes an image for improvements on a webpage

Deeply inspired by https://github.com/macbre/analyze-css

## Promise example

```js
const analyzeImage = require('analyze-image');
const browserData = {
    html: '<img src="image.jpg">'
    displayWidth: 300,
    displayHeight: 200
};
const options = {
    // ...
};

const file = // An image file as a Buffer or a String (base64 encoded image or textual SVG image)
// Supported formats are jpg, png, webp, avif, gif, svg

analyzeImage(image, browserData, options)

    .then(function(result) {
        console.log("SUCESS:");
        console.log(result);
    })

    .catch(function(error) {
        console.log("ERROR:");
        console.log(error);
    });
```

## Async/await example

```js
const analyzeImage = require('analyze-image');
const browserData = {
    html: '<img src="image.jpg">'
    displayWidth: 300,
    displayHeight: 200
};
const options = {
    // ...
};
const file = // An image file as a Buffer or a String (base64 encoded image or textual SVG image)

try {
    const result = await analyzeImage(image, browserData, options);
    console.log("SUCESS:");
    console.log(result);

} catch(error) {
    console.log("ERROR:");
    console.log(error);
}



```

## Browser data

| Data name | Type | Default | Description |
| --------- | ---- | ------- | ----------- |
| html | `string` |  | html code for the <img> or <picture> element, can be retrived in JS with `imageElement.outerHTML` |
| displayWidth | `number` |  | number of "CSS pixels" the image is displayed on, can be retrieved in JS with `imageElement.width` |
| displayHeight | `number` |  | number of "CSS pixels" the image is displayed on, can be retrieved in jS with `imageElement.width` |
| dpr | `number` | `1` | the browser's device pixel ratio, can be retrieved in JS with `window.devicePixelRatio` |


## Options

| Option name | Type | Default | Description |
| ----------- | ---- | ------- | ----------- |
| jpegQuality | `number` | `85` | quality used for JPEG recompression, integer 1-100 |
| pngQuality | `number` | `90` | quality used for PNG recompression, integer 1-100 |
| webpQuality | `number` | `82` | quality used for WebP recompression, integer 1-100 |
| avifQuality | `number` | `64` | quality used for AVIF recompression, integer 1-100 |
| gifsicleLevel | `number` | `3` | level of GIF compression effort sent to [Gifsicle](https://github.com/imagemin/imagemin-gifsicle) (1 is average but fast, 2 is medium, 3 is efficient but slow) |


## Result object

Result is an object with the following properties:

| Property name | Type | Description |
| ------------- | ---- | ----------- |
| stats | `object` |  |
| stats.format | `string` | Name of the image format detected (`jpg`, `png`, `webp`, `avif`, `gif`, `svg`) |
| stats.mymeType | `string` | Official mime type of the image format (i.e. `image/jpeg`) |
| stats.weight | `number` | Number of bytes of the provided image |
| stats.width | `number` | Provided image's width in pixel |
| stats.height | `number` | Provided image's height in pixel |
| stats.displayRatio | `number` | Number of pixels the image was displayed on divided by the real number of pixels in the image object, >1 if provided image is too large, <1 if provided image is too small.
| generator | `string` | Name and version of the current tool (i.e. `analyze-image vX.X.X`) |


## Error codes

252: the provided image is empty
253: the provided image is not a valid image
