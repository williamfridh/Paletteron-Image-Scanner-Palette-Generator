/**
 * 
 */
function getPalette(picture, scale, amountToPick, minCoverage, bundleDistance, paletteElement) {
    console.log('getPalette');

    // Downscale the picture
    const context = downscale(picture, scale);

    // Extract the pixels from the canvas
    const pixels = extractPixels(context);

    // Find the X most common colors
    const mostCommonColors = findMostCommonColors(context, pixels, amountToPick, minCoverage, bundleDistance);

    // Print out the palette to the document
    printPalette(mostCommonColors, paletteElement);
}

/**
 * Print out the palette to the document.
 */
function printPalette(palette, paletteElement) {
    console.log('printPalette');
    console.log(palette);

    // Clear the element
    paletteElement.innerHTML = '';

    // Loop over each color in the palette
    for (const color of palette) {
        // Create a div element
        const div = document.createElement('div');
        div.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

        // Write the color to the div
        const text = document.createTextNode(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
        div.appendChild(text);

        // Append the div to the document
        paletteElement.appendChild(div);
    }
}

/**
 * Takes a given picture and downscale it using canvas.
 * 
 * @param {string} picture - The picture to downscale.
 * @param {number} scale - The scale to downscale the picture.
 * @returns {CanvasRenderingContext2D} - The canvas context of the downscaled picture.
 */
function downscale(picture, scale) {
    console.log('downscale');

    // Calculate new dimensions
    const width = picture.width * scale;
    const height = picture.height * scale;

    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    // No impage improvement needed

    // Draw the picture on the canvas
    context.drawImage(picture, 0, 0, width, height);

    // Draw the canvas on the document
    document.body.appendChild(canvas);

    // Return the canvas context
    return context;
}

/**
 * Generates a 3d array of size 256, 256, 256 of zeros.
 * Then it loops over each pixel of the provided canvas context and
 * increments the corresponding value in the 3d array.
 * 
 * @param {CanvasRenderingContext2D} context - The canvas context to extract the pixels from.
 * @returns {number[][][]} - The 3d array of pixels.
 */
function extractPixels(context) {
    console.log('extractPixels');

    // Create a 3d array of zeros
    const pixels = new Array(256).fill(0).map(() => new Array(256).fill(0).map(() => new Array(256).fill(0)));

    // Get the image data from the canvas
    const imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);

    // Loop over each pixel
    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];

        // Increment the corresponding value in the 3d array
        pixels[r][g][b]++;
    }

    return pixels;
}

/**
 * Search trough the 3d array of pixels and find the X most common colors
 * and return those as a new array in the format [r, g, b].
 * 
 * @param {CanvasRenderingContext2D} context - The canvas context of the picture.
 * @param {number[][][]} pixels - The 3d array of pixels.
 * @param {number} amountToPick - The amount of colors to pick.
 * @param {number} minCoverage - The minimum coverage of the color in the picture.
 * @param {number} bundleDistance - The minimum distance between the colors.
 */
function findMostCommonColors(context, pixels, amountToPick, minCoverage, bundleDistance) {
    console.log('findMostCommonColors');
    
    // Get amount of pixels in the picture
    const pixelAmount = context.canvas.width * context.canvas.height;

    // Find colorSpaceCenter of color space
    let colorSpaceCenter = [0, 0, 0];
    let count = 0;
    for (let r = 0; r < pixels.length; r++) {
        for (let g = 0; g < pixels[r].length; g++) {
            for (let b = 0; b < pixels[r][g].length; b++) {
                const amount = pixels[r][g][b];
                if (amount > 0) {
                    colorSpaceCenter[0] += r * amount;
                    colorSpaceCenter[1] += g * amount;
                    colorSpaceCenter[2] += b * amount;
                    count += amount;
                }
            }
        }
    }
    colorSpaceCenter[0] /= count;
    colorSpaceCenter[1] /= count;
    colorSpaceCenter[2] /= count;

    console.log(`colorSpaceCenter: ${colorSpaceCenter}`);
    
    // Loop trough the 3d array and create a new array of objects
    // with the colors and the amount of pixels of that color,
    // but only include colors with more than 0 pixels to speed
    // up the process.
    let colors = [];
    for (let r = 0; r < pixels.length; r++) {
        for (let g = 0; g < pixels[r].length; g++) {
            for (let b = 0; b < pixels[r][g].length; b++) {
                const amount = pixels[r][g][b];
                if (amount > 0) {
                    colors.push({ r, g, b, amount });
                }
            }
        }
    }


    // Sort the array by the amount of pixels
    colors.sort((a, b) => b.amount - a.amount);

    // Bundle/merge colors that are close to each other
    for (let i = 0; i < colors.length; i++) {
        for (let j = i + 1; j < colors.length; j++) {
            if (calculateDistance([colors[i].r, colors[i].g, colors[i].b], [colors[j].r, colors[j].g, colors[j].b]) < bundleDistance * 441.6729559300637) {
                colors[i].amount += colors[j].amount;
                colors.splice(j, 1);
                j--;
            }
        }
    }

    console.log(colors)
    // Increase the amount of colors that are close to the colorSpaceCenter of the color space
    for (let i = 0; i < colors.length; i++) {
        const distance = calculateDistance([colors[i].r, colors[i].g, colors[i].b], colorSpaceCenter);
        colors[i].amount *= Math.log(1 + distance);
    }
    console.log(colors)

    // Sort based on max total distance from the other colors.
    colors.sort((a, b) => {
        let totalDistanceA = 0;
        let totalDistanceB = 0;
        for (const color of colors) {
            totalDistanceA += calculateDistance([a.r, a.g, a.b], [color.r, color.g, color.b]);
            totalDistanceB += calculateDistance([b.r, b.g, b.b], [color.r, color.g, color.b]);
        }
        return totalDistanceB - totalDistanceA;
    });

    // Reorder the array
    //colors.sort((a, b) => b.amount - a.amount);
    

    // Remove colors with less than minCoverage
    if (minCoverage > 0)
        colors = colors.filter(color => color.amount >= minCoverage * pixelAmount);

    // Add first color to the result array
    // Then compare each color to the latest color in the result array
    // If the distance is greater than the minDistance add it to the result array
    /*const result = [colors[0]];
    for (const color of colors) {
        if (result.every(c => calculateDistance([c.r, c.g, c.b], [color.r, color.g, color.b]) > minDistance)) {
            result.push(color);
        }
    }*/

        //colors.sort((a, b) => b.amount - a.amount);
    console.log(colors)

    // Return the X most common colors
    return colors.slice(0, amountToPick).map(color => [color.r, color.g, color.b]);
}

/**
 * Calculate the distance between two colors.
 * 
 * @param {number[]} color1 - The first color.
 * @param {number[]} color2 - The second color.
 * @returns {number} - The distance between the two colors.
 */
function calculateDistance(color1, color2) {
    //console.log('calculateDistance');

    const r = color1[0] - color2[0];
    const g = color1[1] - color2[1];
    const b = color1[2] - color2[2];

    return Math.sqrt(r * r + g * g + b * b);
}

