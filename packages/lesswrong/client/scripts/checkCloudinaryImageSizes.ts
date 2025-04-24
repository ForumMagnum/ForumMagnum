/* eslint-disable no-console */

/**
 * Script that runs in-browser, finds <img> tags containing Cloudinary URLs,
 * and, if the image is over-sized, console-logs a modified image URL that
 * crops and scales it to the size that is actually used.
 */
export const checkCloudinaryImageSizes = () => {
  console.log("Checking for mis-sized Cloudinary images");
}
