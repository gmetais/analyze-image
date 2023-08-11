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
| viewportWidth | `number` |  | number of "CSS pixels" of the browser's window, can be retrieved in JS with `window.innerWidth` |
| viewportHeight | `number` |  | number of "CSS pixels" of the browser's window, can be retrieved in JS with `window.innerHeight` |
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
| **stats** | `object` | **Contains various data extracted from the original image** |
| stats.format | `string` | Name of the image format detected (`jpg`, `png`, `webp`, `avif`, `gif`, `svg`) |
| stats.mymeType | `string` | Official mime type of the image format (i.e. `image/jpeg`) |
| stats.weight | `number` | Number of bytes of the provided image |
| stats.width | `number` | Provided image's width in pixel |
| stats.height | `number` | Provided image's height in pixel |
| stats.displayRatio | `number` | Number of pixels the image was displayed on divided by the real number of pixels in the image object, >1 if provided image is too large, <1 if provided image is too small.
| **transforms** | `object` | **Contains the various transformations tested on the image** |
| transforms.optimized | `object` | Property only available if the image was successfuly optimized |
| transforms.optimized.weight | `number` | Weight in bytes after optimization |
| transforms.optimized.gain | `number` | Comparison between original weight and optimized weight |
| transforms.optimized.body | `buffer` | Optimized file |
| transforms.resized | `object` | Property only available if resizing the image provides good results (requires `displayWidth` and `displayHeight` inputs) |
| transforms.resized.weight | `number` | Weight in bytes after resizing |
| transforms.resized.gain | `number` | Comparison between optimized weight and resized weight (it doesn't make sens comparing an unoptimized image to a resized + optimized image) |
| transforms.resized.width | `number` | New file size |
| transforms.resized.height | `number` | New file size |
| transforms.resized.body | `buffer` | Optimized file |
| transforms.webpEncoded | `object` | Property only available if converting the image to WebP provides good results |
| transforms.webpEncoded.weight | `number` | Weight in bytes when in WebP |
| transforms.webpEncoded.gain | `number` | Comparison between original weight and optimized weight |
| transforms.webpEncoded.body | `buffer` | Optimized file |
| transforms.avifEncoded | `object` | Property only available if converting the image to AVIF provides good results |
| transforms.avifEncoded.weight | `number` | Weight in bytes when in AVIF |
| transforms.avifEncoded.gain | `number` | Comparison between original weight and optimized weight |
| transforms.avifEncoded.body | `buffer` | Optimized file |
| **offenders** | `object` | **Contains the various transformations tested on the image** |
| offenders.imageNotOptimized | `object` | Appears only if the image could be significantly smaller with a better compression |
| offenders.imageNotOptimized.beforeWeight | `number` | Weight in bytes of the original file |
| offenders.imageNotOptimized.afterWeight | `number` | Weight in bytes after optimization |
| offenders.imageScaledDown | `object` | Appears only if the image could be significantly smaller when resized to fit tis display dimensions |
| offenders.imageScaledDown.beforeWeight | `number` | Weight in bytes of the optimized image, or the original file if if was already sufficiently optimized |
| offenders.imageScaledDown.afterWeight | `number` | Weight in bytes after resizing |
| offenders.imageScaledDown.width | `number` | New file size |
| offenders.imageScaledDown.height | `number` | New file size |
| offenders.imageOldFormat | `object` | Appears only if the image could be significantly smaller if re-encoded in a new format (WebP or AVIF) |
| offenders.imageOldFormat.beforeWeight | `number` | Weight in bytes of the original file |
| offenders.imageOldFormat.afterWeight | `number` | Weight in bytes of the best found format |
| offenders.imageOldFormat.webpWeight | `number` | Weight in bytes in WebP |
| offenders.imageOldFormat.avifWeight | `number` | Weight in bytes in AVIF |
| offenders.imageWithIncorrectSizesParam | `object` | Appears only if the sizes parameter on a responsive image is more than 10% smaller or larger compared to the onscreen dimensions (only for images with a "w" srcset) |
| offenders.imageOldFormat.sizesAttribute | `string` | The sizes attribute extracted from the HTML |
| offenders.imageOldFormat.foundValueInPx | `number` | The number of pixels calculated from the sizes attribute |
| offenders.imageOldFormat.displayWidth | `number` | The number of pixels the image is displayed on (same as browserdata.displayWidth) |
| generator | `string` | Name and version of the current tool (i.e. `analyze-image vX.X.X`) |


## Error codes

252: the provided image is empty
253: the provided image is not a valid image
