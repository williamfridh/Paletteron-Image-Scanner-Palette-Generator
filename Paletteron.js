/**
 * Paletteron.js
 * 
 * A simple library for extracting a color palette from a picture element.
 * The logic is based on pixel extraction and counting, bundling,
 * comparing vectors distances, and based on this assigning score.
 * 
 * HOW TO USE:
 * 1. Include the script in your HTML file.
 * 2. Create a new Paletteron object with optional parameters.
 * 3. Load an image and call getPalette with the image element.
 * 4. The palette will be returned as an array of RGB values.
 * 
 * OPTIONAL STEPS:
 * 5. Print the palette to an HTML element for debugging by calling printDebuggingPalette.
 * 
 * NOTES:
 * 1. Make sure to set the CORS policy of the image to anonymous (can be set by getPalette).
 * 2. The scale, colorsToPick, and minCoverage can be set in the constructor.
 * 3. The image must be loaded before calling getPalette (see test/all.html).
 * 
 * Author: William Fridh
 * GitHub: https://github.com/williamfridh
 */

class Paletteron {

    /**
     * Static variables.
     * 
     * These variables are to not be changed and are used for calculations.
     */
    static MAX_COLORS_AMOUNT = 16777216         // 256^3
    static MAX_COLORS_SPACE_DISTANCE = 443.405  // sqrt(3*256^3)

    /**
     * Constructor.
     * 
     * Opertunity to set the scale, colors to pick and min coverage.
     * Larger scale will result in faster processing but less accurate results.
     * 
     * @param {number} scale - The scale to downscale the image with.
     * @param {number} colorsToPick - The amount of colors to pick from the image.
     * @param {number} minCoverage - The minimum coverage of a color to be included in the palette.
     */
    constructor(scale, colorsToPick, minCoverage) {
        // Check input values
        if (scale && (scale < 0 || scale > 1))
            throw new Error(`Scale must be between 0 and 1.`)
        if (colorsToPick && (colorsToPick < 1 || colorsToPick > Paletteron.MAX_COLORS_AMOUNT))
            throw new Error(`Colors to pick must be between 1 and ${Paletteron.MAX_COLORS_AMOUNT}.`)
        if (minCoverage && (minCoverage < 0 || minCoverage > 1))
            throw new Error(`Min coverage must be between 0 and 1.`)
        // Set the values
        this.scale          = scale          || 0.2
        this.colorsToPick   = colorsToPick   || 5
        this.minCoverage    = minCoverage    || 0.001
    }

    /**
     * Extracts a color palette from an image element.
     * 
     * @param {HTMLImageElement} imageElement - The image element to extract the palette from.
     * @param {boolean} forceAnonymous - Whether to force the CORS policy to anonymous.
     * @returns {number[][]} - The extracted color palette as an array of RGB values.
     */
    getPalette(imageElement, forceAnonymous = false) {

        // Set the CORS policy to anonymous if forced
        if (forceAnonymous) imageElement.crossOrigin = 'anonymous';

        // Downscale the image
        const [canvas, context] = this.downscale(imageElement);

        // Extract the pixels from the canvas
        const pixels = this.extractPixels(context);

        // Process the pixels to find the most common colors
        const flattenedColors = this.flattenColors(pixels);
        console.log(`flattenedColors: `, flattenedColors);
        const bundledColors = this.bundleColors(flattenedColors);
        console.log(`bundledColors: `, bundledColors);
        const noLowCoverageColors = this.removeLowCoverageColors(bundledColors);
        console.log(`noLowCoverageColors: `, noLowCoverageColors);
        const colorsWithScore = this.calculateScore(noLowCoverageColors);
        console.log(`colorsWithScore: `, colorsWithScore);
        const finalColors = this.finalizeColors(colorsWithScore);
        console.log(`finalColors: `, finalColors);

        // Cleanup the canvas
        canvas.remove();

        // Return the final color palette
        return finalColors;
    }

    /**
     * Prints the color palette to a specified HTML element for debugging purposes.
     * 
     * @param {number[][]} palette - The palette to print.
     * @param {HTMLElement} paletteElement - The element to print the palette to.
     */
    printDebuggingPalette(palette, paletteElement) {
        // Clear the element
        paletteElement.innerHTML = '';

        // Loop over each color in the palette
        for (const color of palette) {
            // Create a div element for each color
            const div = document.createElement('div');
            div.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

            // Add the RGB value as text to the div
            const text = document.createTextNode(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
            div.appendChild(text);

            // Append the div to the palette element
            paletteElement.appendChild(div);
        }
    }

    /**
     * Downscales an image using a canvas element.
     * 
     * This step is important to avoid memory issues and speed up processing.
     * 
     * @param {HTMLImageElement} picture - The image to downscale.
     * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]} - The canvas and its context.
     */
    downscale(picture) {
        // Calculate new dimensions
        const w = picture.width * this.scale;
        const h = picture.height * this.scale;

        // Create a canvas element
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const context = canvas.getContext('2d');

        // Draw the picture on the canvas
        context.drawImage(picture, 0, 0, w, h);

        // Append the canvas to the document (hidden)
        document.body.appendChild(canvas);
        canvas.style.position = 'fixed';
        canvas.style.top = '9999px';
        canvas.style.left = '9999px';

        // Return the canvas and its context
        return [canvas, context];
    }

    /**
     * Extracts pixel data from a canvas context and generates a 3D array of color counts.
     * 
     * @param {CanvasRenderingContext2D} context - The canvas context to extract the pixels from.
     * @returns {number[][][]} - A 3D array representing the count of each RGB color.
     */
    extractPixels(context) {
        // Create a 3D array of zeros
        const pixels = new Array(256).fill(0).map(() => new Array(256).fill(0).map(() => new Array(256).fill(0)));

        // Get the image data from the canvas
        const imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);

        // Loop over each pixel and increment the corresponding value in the 3D array
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            pixels[r][g][b]++;
        }

        return pixels;
    }

    /**
     * Flattens a given 3D colors array into a 1D array of colors.
     * 
     * @param {number[][][]} pixels - The 3D array of pixels.
     * @returns {Object[]} - The 1D array of color objects with score values.
     */
    flattenColors(pixels) {
        const flattenedColors = [];
        for (let r = 0; r < pixels.length; r++) {
            for (let g = 0; g < pixels[r].length; g++) {
                for (let b = 0; b < pixels[r][g].length; b++) {
                    const amount = pixels[r][g][b];
                    if (amount > 0) {
                        flattenedColors.push({ r, g, b, amount, score: 0 });
                    }
                }
            }
        }
        return flattenedColors;
    }

    /**
     * Removes colors that have less than the minimum required coverage.
     * This is used to avoid color transition contamination.
     * 
     * @param {Object[]} colors - The array of color objects.
     * @returns {Object[]} - The filtered array of color objects.
     */
    removeLowCoverageColors(colors) {
        // Calculate the total amount of pixels.
        const totalPixels = colors.reduce((acc, color) => acc + color.amount, 0);
        const minAmount = totalPixels * this.minCoverage;
        return colors.filter(color => color.amount >= minAmount);
    }

    /**
     * Calculate the average color distance between all pairs of colors.
     * 
     * This method calculates the average Euclidean distance between all pairs of colors
     * in the provided array. The distance is a measure of how different the colors are.
     * 
     * @param {Object[]} colors - The array of color objects.
     * @returns {number} - The average color distance.
     */
    findAverageColorDistance(colors) {
        let totalColorSpaceDistance = 0;
        let colorPairs = 0;

        // Loop over each pair of colors
        for (let i = 0; i < colors.length; i++) {
            for (let j = i + 1; j < colors.length; j++) {
                // Calculate the distance between the two colors
                totalColorSpaceDistance += this.calculateDistance(
                    [colors[i].r, colors[i].g, colors[i].b],
                    [colors[j].r, colors[j].g, colors[j].b]
                );
                colorPairs++;
            }
        }

        // Return the average distance
        return totalColorSpaceDistance / colorPairs;
    }

    /**
     * Bundle colors together that are close to each other.
     * 
     * This method sorts the colors by their amount, calculates the average color distance,
     * and then merges colors that are close to each other based on the average distance.
     * 
     * @param {Object[]} colors - The array of color objects.
     * @returns {Object[]} - The bundled array of color objects.
     */
    bundleColors(colors) {
        // Sort the array by the amount of pixels of each color to prioritize the most common colors.
        colors.sort((a, b) => b.amount - a.amount);

        // Calculate the average color distance.
        const averageColorDistance = this.findAverageColorDistance(colors);

        // Bundle/merge colors that are close to each other.
        for (let i = 0; i < colors.length; i++) {
            for (let j = i + 1; j < colors.length; j++) {
                // If the distance between the colors is less than the average distance, merge them.
                if (this.calculateDistance([colors[i].r, colors[i].g, colors[i].b], [colors[j].r, colors[j].g, colors[j].b]) < averageColorDistance) {
                    // Scale the amount based on the distance between the colors.
                    const distanceScaler = this.calculateDistance([colors[i].r, colors[i].g, colors[i].b], [colors[j].r, colors[j].g, colors[j].b]) / averageColorDistance;
                    colors[i].amount += colors[j].amount * distanceScaler;
                    colors.splice(j, 1);
                    j--;
                }
            }
        }

        return colors;
    }

    /**
     * Calculate the Euclidean distance between two colors in RGB space.
     * 
     * This method calculates the distance between two colors using the Euclidean
     * distance formula. The distance is a measure of how different the two colors are.
     * 
     * @param {number[]} color1 - The first color as an array of RGB values [r, g, b].
     * @param {number[]} color2 - The second color as an array of RGB values [r, g, b].
     * @returns {number} - The Euclidean distance between the two colors.
     */
    calculateDistance(color1, color2) {
        const r = color1[0] - color2[0];
        const g = color1[1] - color2[1];
        const b = color1[2] - color2[2];

        return Math.sqrt(r * r + g * g + b * b);
    }


    /**
     * Find the center of the given colors.
     * 
     * This method calculates the average color (center) of the provided array of colors.
     * 
     * @param {Object[]} colors - The array of color objects.
     * @param {number} [number] - The number of colors to consider. If not provided, all colors are considered.
     * @returns {number[]} - The RGB values of the color center.
     */
    findColorsCenter(colors, number) {
        // If number is not provided, use the length of the colors array.
        if (!number) number = colors.length;

        // Initialize the center color.
        let center = [0, 0, 0];

        // Sum up the RGB values of the colors.
        for (let i = 0; i < number; i++) {
            center[0] += colors[i].r;
            center[1] += colors[i].g;
            center[2] += colors[i].b;
        }

        // Calculate the average RGB values.
        center[0] /= number;
        center[1] /= number;
        center[2] /= number;

        // Return the center color.
        return center;
    }

    /**
     * Calculate the average distance to the color center.
     * 
     * This method calculates the average distance of each color in the array
     * to the color center. The color center is the average of all colors in the array.
     * 
     * @param {Object[]} colors - The array of color objects.
     * @returns {number} - The average distance to the color center.
     */
    calculateAverageDistanceToCenter(colors) {
        // Find the color center.
        const center = this.findColorsCenter(colors);
        
        // Initialize the total distance.
        let totalDistance = 0;
        
        // Calculate the total distance of each color to the center.
        for (const color of colors) {
            totalDistance += this.calculateDistance([color.r, color.g, color.b], center);
        }
        
        // Return the average distance.
        return totalDistance / colors.length;
    }


    /**
     * Calculate score and sort the colors.
     * 
     * This method calculates a score for each color based on its amount and its distance
     * to the color center. The colors are then sorted by their score in descending order.
     * 
     * @param {Object[]} colors - The array of color objects.
     * @returns {Object[]} - The sorted array of color objects.
     */
    calculateScore(colors) {
        // Calculate the total amount of colors.
        const totalColors = colors.reduce((acc, color) => acc + color.amount, 0);

        // Find the color center.
        const colorCenter = this.findColorsCenter(colors);

        // Find the average distance to the color center.
        const averageDistanceToCenter = this.calculateAverageDistanceToCenter(colors);

        // Set each color's score based on its amount and distance to the color center.
        for (const color of colors) {
            // Add score for the amount of the color.
            color.score += color.amount / totalColors;

            // Add score for the distance to the color center, scaled by the logarithm of the amount.
            color.score += (this.calculateDistance([color.r, color.g, color.b], colorCenter) / averageDistanceToCenter) * Math.log(color.amount);
        }

        // Sort the colors by their score in descending order.
        colors.sort((a, b) => b.score - a.score);

        // Return the sorted array of colors.
        return colors;
    }

    /**
     * Sort, slice and convert colors to RGB format and return as array.
     * 
     * This method takes the array of colors, sorts them by their score,
     * slices the array to keep only the top colors as specified by `colorsToPick`,
     * and then converts the color objects to RGB format.
     * 
     * @param {Object[]} colors - The array of color objects.
     * @returns {number[][]} - The array of colors in RGB format.
     */
    finalizeColors(colors) {
        // Sort the colors by their score in descending order
        colors.sort((a, b) => b.score - a.score);
        
        // Slice the array to the amount of colors we want to pick
        colors = colors.slice(0, this.colorsToPick);
        
        // Convert the color objects to RGB format
        const rgbColors = colors.map(color => [color.r, color.g, color.b]);
        
        // Return the array of RGB colors
        return rgbColors;
    }

}

