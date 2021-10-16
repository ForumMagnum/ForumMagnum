/*
 * For https://github.com/CultureHQ/add-to-calendar
 * Adapted from their styles.css
 */
 
 export default `
 .chq-atc {
   display: inline-block;
   position: relative;
 }

 .chq-atc--button {
   background: transparent;
   box-sizing: border-box;
   color: inherit;
   cursor: pointer;
   display: inline;
   font-family: inherit;
   font-size: inherit;
   line-height: inherit;
   margin: 0;
   padding: 0;
 }

 .chq-atc--button:hover {
   opacity: 0.5
 }

 .chq-atc--button svg {
   vertical-align: text-bottom;
   fill: currentColor;
 }

 .chq-atc--dropdown {
   background-color: white;
   border-radius: 4px;
   border: 1px solid #eaeaea;
   box-shadow: rgb(0 0 0 / 20%) 0px 2px 1px -1px, rgb(0 0 0 / 14%) 0px 1px 1px 0px, rgb(0 0 0 / 12%) 0px 1px 3px 0px;
   box-sizing: border-box;
   position: absolute;
   text-align: left;
   white-space: nowrap;
   z-index: 3;
 }

 .chq-atc--dropdown a {
   color: #212121;
   display: block;
   padding: 8px 15px;
   text-decoration: none;
 }

 .chq-atc--dropdown a:hover {
   opacity: 0.5
 }
 `;
