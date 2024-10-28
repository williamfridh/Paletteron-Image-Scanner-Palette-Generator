﻿# Paletteron - Image Scanner & Palette Maker

**Paletteron is a free to use JavaScript-based tool for scanning images (img elements) and generating color palettes. It's plain JS and comes with support for a list of options.**

## Installation

To get started, you have two options:
1. Download and include **Paletteron.min.js** or **Paletteron.js** if you wish to have readable code.
2. Include the following JS-file:

```
<script src="https://cdn.jsdelivr.net/gh/williamfridh/Paletteron-Image-Scanner-Palette-Maker@main/Paletteron.min.js"></script>
```

## How to Use

1. Include the script in your HTML file.
2. Create a new Paletteron object with optional parameters.
3. Load an image and call getPalette with the image element.
4. The palette will be returned as an array of RGB values.
5. (Optional step for debugging) Print the palette to an HTML element for debugging by calling printDebuggingPalette.

## Calling getPalette()
**PARAMETERS:**
1. scale - The scale to downscale the image with (recommended is 0.3).
2. colorsToPick - The amount of colors to pick from the image (recommended is 5).
3. minCoverage - The minimum coverage of a color to be included in the palette (recommended is 0).
4. minWhiteDistance - Percentage of maximum color space distance to be min to include color (recommended is 0).
5. minBlackDistance - Percentage of maximum color space distance to be min to include color (recommended is 0).

## Examples

### Code Example

Before sending the img element to Palettereon, you need to make sure it's fully loaded. This can be done in many different ways. For instance:

```
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
