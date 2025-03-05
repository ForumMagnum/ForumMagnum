const fs = require('fs');
const path = require('path');
const util = require('util');

// Import the function to test
const { htmlToChangeMetrics } = require('./packages/lesswrong/server/editor/utils');

// Read the HTML content from the test file
const html = fs.readFileSync('./test_html.txt', 'utf8');

// Test with identical HTML
console.log("Testing identical HTML:");
const result = htmlToChangeMetrics(html, html);
console.log("Result:", util.inspect(result, { depth: null }));

// Test with a small modification
const modifiedHtml = html.replace('Introduction', 'Modified Introduction');
console.log("\nTesting with modification:");
const resultWithMod = htmlToChangeMetrics(html, modifiedHtml);
console.log("Result with modification:", util.inspect(resultWithMod, { depth: null })); 