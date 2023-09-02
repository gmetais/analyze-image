# analyze-image
Analyzes an image for improvements on a webpage

Deeply inspired by https://github.com/macbre/analyze-css

## Promise example

```js
import analyzeImage from 'analyze-image';
const browserData = {
    html: '<img srcset="image1.jpg 400w, image2.jpg 800w" sizes="50vw">',
    displayWidth: 300,
    displayHeight: 200,
    viewportWidth: 1200,
    viewportHeight: 800
};
const options = {
    // ...
};

const file = // An image file as a Buffer or a String (base64 encoded image or textual SVG image)
// Supported formats are jpg, png, webp, avif, gif, svg

analyzeImage(file, browserData, options)

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
import analyzeImage from 'analyze-image';
const browserData = {
    html: '<img src="image.jpg">',
    displayWidth: 300,
    displayHeight: 200
};
const options = {
    // ...
};
const file = // An image file as a Buffer or a String (base64 encoded image or textual SVG image)

try {
    const result = await analyzeImage(file, browserData, options);
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
| html | `string` |  | html code for the `img` or `picture` element, can be retrived in JS with `imageElement.outerHTML` |
| displayWidth | `number` |  | number of "CSS pixels" the image is displayed on, can be retrieved in JS with `imageElement.width` |
| displayHeight | `number` |  | number of "CSS pixels" the image is displayed on, can be retrieved in jS with `imageElement.height` |
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

```js
{
    // Contains various data extracted from the original image
    stats: {
        format: // [String] Name of the image format detected (`jpg`, `png`, `webp`, `avif`, `gif`, `svg`)
        mymeType: // [string] Official mime type of the image format (i.e. `image/jpeg`)
        fileSize: // [number] Number of bytes of the provided image
        width: // [number] Provided image's width in pixel
        height: // [number] Provided image's height in pixel
        displayRatio: // [number] Provided image's dimensions divided by the dimensions of the physical pixels the image is displayed on. The image is too large if > 1, too small if < 1
        displayDensity: // [number] Provided image's dimensions divided by the dimensions of the CSS pixels the image is displayed on. Basically, displayDensity = displayRatio x dpr
    },
    // Contains the various transformations tested on the image
    transforms: {
        // Property only available if the image was successfuly optimized
        optimized: {
            fileSize: // [number] Weight in bytes of the original file
            newFileSize: // [number] Weight in bytes after optimization
            body: // [buffer] Optimized file
        },
        // Property only available if resizing the image provides good results (requires `displayWidth` and `displayHeight` inputs)
        resized: {
            naturalWidth: // [number] Provided image's width in pixel
            naturalHeight: // [number] Provided image's height in pixel
            fileSize: // [number] Weight in bytes of the image before resizing. Using the optimized weight if available, because it makes no sense comparing rescaled+optimized vs unoptimized.
            newWidth: // [number] New file's width in pixel
            newHeight: // [number] New file's height in pixel
            dpr: // [numer] Screen density used to determine new dimensions
            newFileSize: // [number] Weight in bytes after resizing
            body: // [buffer] Resized file
        },
        // Property only available if converting the image to WebP provides good results
        webpEncoded: {
            currentFormat: // [string] Type of the original file
            fileSize: // [number] Weight in bytes of the original file
            newFileSize: // [number] Weight in bytes after conversion
            body: // [buffer] WebP file
        },
        // Property only available if converting the image to AVIF provides good results
        avifEncoded: {
            currentFormat: // [string] Type of the original file
            fileSize: // [number] Weight in bytes of the original file
            newFileSize: // [number] Weight in bytes after conversion
            body: // [buffer] AVIF file
        }
    },
    // Contains the various transformations tested on the image
    offenders: {
        // Appears only if the image could be significantly smaller with a better compression
        imageNotOptimized: {
            fileSize: // [number] Weight in bytes of the original file
            newFileSize: // [number] Weight in bytes after optimization
        },
        // Appears only if the image could be significantly smaller when resized to fit tis display dimensions
        imageScaledDown: {
            naturalWidth: // [number] Provided image's width in pixel
            naturalHeight: // [number] Provided image's height in pixel
            fileSize: // [number] Weight in bytes of the image before resizing. Using the optimized weight if available, because it makes no sense comparing rescaled+optimized vs unoptimized.
            newWidth: // [number] New file's width in pixel
            newHeight: // [number] New file's height in pixel
            dpr: // [numer] Screen density used to determine new dimensions
            newFileSize: // [number] Weight in bytes after resizing
        },
        // Appears only if the image density is >2.2 on a high density screen (>2.2 dpr)
        imageExcessiveDensity: {
            alreadyResized: // [boolean] If true, means that we are using the resized file as a reference, otherwise it is the optimized image or the original image
            referenceDensity: // [number] The density we are comparing from
            fileSize: // [number] Weight of the reference image
            recommendedMaxDensity: // [number] The density above which the human eye hardly sees a difference
            recommendedWidth: // [number] Corresponding dimensions in pixels
            recommendedHeight: // [number] Corresponding dimensions in pixels
            newFileSize: // [number] Weight in bytes after resizing

        },
        // Appears only if the image could be significantly smaller if re-encoded in a new format (WebP or AVIF)
        imageOldFormat: {
            currentFormat: // [string] Type of the original file
            fileSize: // [number] Weight in bytes of the original file
            newFileSize: // [number] Weight in bytes of the best found format
            webpSize: // [number] Weight in bytes in WebP
            avifSize: // [number] Weight in bytes in AVIF
        },
        // Appears only if the sizes parameter on a responsive image is more than 10% smaller or larger compared to the onscreen dimensions (only for images with a "w" srcset)
        imageWithIncorrectSizesParam: {
            sizesAttribute: // [string] The sizes attribute extracted from the HTML
            convertedInPx: // [number] The number of pixels calculated from the sizes attribute
            displayWidth: // [number] The number of pixels the image is displayed on (same as browserdata.displayWidth)
        }
    },
    generator: // [string] Name and version of the current tool (i.e. `analyze-image vX.X.X`)
}
````


## Error codes

| Code | Description |
| ---- | ----------- |
| 252 | the provided image is empty |
| 253 | the provided image is not a valid image |
