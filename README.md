
<img src="https://github.com/williamfridh/Paletteron-Image-Scanner-Palette-Maker/blob/main/assets/logo.jpg?raw=true" alt="Paletteron logo">


# Paletteron - Image Scanner & Palette Maker

**Paletteron is a free to use JavaScript-based tool for scanning images (img elements) and generating color palettes on the front-end. It's plain JavaScript and comes with support for a list of options to make it fi tyou the best.**

## Installation

Before usage, you need to install/include required files.

### Option 1

File hosted by [JSDELIVER](https://www.jsdelivr.com/). Simply add this code to your site:

```
<script src="https://cdn.jsdelivr.net/gh/williamfridh/Paletteron-Image-Scanner-Palette-Maker@main/Paletteron.min.js"></script>
```

### Option 2

Download and include **Paletteron.min.js** or **Paletteron.js** if you wish to have readable code.

## How to Use

1. Include the script in your HTML file.
2. Create a new Paletteron object with optional parameters.
3. Load an image and call getPalette with the image element.
4. The palette will be returned as an array of RGB values.
5. Print or do something else cool with the receiver data!
6. (Optional step for debugging) Print the palette to an HTML element for debugging by calling printDebuggingPalette.

### getPalette()
**PARAMETERS:**
1. scale - The scale to downscale the image with (recommended is 0.3).
2. colorsToPick - The amount of colors to pick from the image (recommended is 5).
3. minCoverage - The minimum coverage of a color to be included in the palette (recommended is 0).
4. minWhiteDistance - Percentage of maximum color space distance to be min to include color (recommended is 0).
5. minBlackDistance - Percentage of maximum color space distance to be min to include color (recommended is 0).

### printDebuggingPalette()
**PARAMETERS:**
1. palette - The resulting palette returned from getPalette().
2. paletteElement - The element to which it should print the debugging palette.

## Examples

### Code Example

Before sending the img element to Palettereon, you need to make sure it's fully loaded. This can be done in many different ways. For instance:

```
const img = imgHolder.querySelector('img');
const paletteElement = imgHolder.querySelector('.palette');

if (img.complete) {
    console.log('Image already loaded');
    const palette = paletteron.getPalette(img);
    paletteron.printDebuggingPalette(palette, paletteElement);
} else {
    img.addEventListener('load', () => {
        console.log('Image loaded');
        const palette = paletteron.getPalette(img);
        paletteron.printDebuggingPalette(palette, paletteElement);
    });
}
```

### Result Example
![Example of color palettes](https://github.com/williamfridh/Paletteron-Image-Scanner-Palette-Maker/blob/main/assets/Example_1.png?raw=true)

## Reporting Issues

If you find a bug or have a feature request, please create an issue on GitHub.

