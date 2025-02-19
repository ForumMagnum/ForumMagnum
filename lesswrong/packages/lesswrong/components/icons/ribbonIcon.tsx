// Copyright (c) Flaticon. All rights reserved.
import React from 'react';

// NOTE: This ribbon icon expliticly has filters on it to make it look more "hand-drawn", as part of the EA Forum Wrapped page
export const RibbonIcon = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" id="Icons" viewBox="0 0 60 60" className={className}>
  <defs>
    <filter filterUnits="objectBoundingBox" id="pencilTexture5">
      <feTurbulence type="fractalNoise" baseFrequency="0.1" stitchTiles="stitch" result="t1">
      </feTurbulence>
      <feComposite operator="in" in2="t1" in="SourceGraphic" result="SourceTextured">
      </feComposite>
      <feTurbulence type="fractalNoise" baseFrequency="0.03" seed="1" result="f1">
      </feTurbulence>
      <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="5" in="SourceTextured" in2="f1" result="f4">
      </feDisplacementMap>
    </filter>
  </defs>
  <path filter="url(#pencilTexture5)" d="M50.5,11c-5.238,0-9.5,3.141-9.5,7v4.562a47.56,47.56,0,0,1-10.612-3.484C25.626,17.073,20.7,15,14,15,7.646,15,3.643,16.959,1.822,18.127A3.962,3.962,0,0,0,0,21.484V42c0,3.859,4.262,7,9.5,7S19,45.859,19,42V37.438a47.56,47.56,0,0,1,10.612,3.484C34.374,42.927,39.3,45,46,45c6.354,0,10.357-1.959,12.178-3.127A3.962,3.962,0,0,0,60,38.516V18C60,14.141,55.738,11,50.5,11ZM43,19.4a19.211,19.211,0,0,0,5,.6,14.572,14.572,0,0,0,5.5-.965.366.366,0,0,1,.5.335v2.481A23.88,23.88,0,0,1,46,23a29.568,29.568,0,0,1-3-.167ZM9.5,47C5.364,47,2,44.757,2,42a3.649,3.649,0,0,1,2-2.89v1.52a2.359,2.359,0,0,0,3.257,2.185A12.61,12.61,0,0,1,12,42a16.186,16.186,0,0,1,4.926.664C16.436,45.107,13.3,47,9.5,47ZM17,40.6a19.211,19.211,0,0,0-5-.6,14.572,14.572,0,0,0-5.5.965A.367.367,0,0,1,6,40.63V38.149A23.88,23.88,0,0,1,14,37a29.568,29.568,0,0,1,3,.167Zm41-2.083a1.972,1.972,0,0,1-.9,1.673C55.462,41.239,51.844,43,46,43c-6.3,0-10.822-1.905-15.612-3.922C25.626,37.073,20.7,35,14,35c-6.152,0-9.94,1.337-12,3.1V21.484a1.972,1.972,0,0,1,.9-1.673C4.538,18.761,8.156,17,14,17c6.3,0,10.822,1.905,15.612,3.922C34.374,22.927,39.3,25,46,25c6.152,0,9.94-1.337,12-3.1ZM56,20.89V19.37a2.359,2.359,0,0,0-3.257-2.185A12.61,12.61,0,0,1,48,18a16.186,16.186,0,0,1-4.926-.664C43.564,14.893,46.7,13,50.5,13c4.136,0,7.5,2.243,7.5,5A3.649,3.649,0,0,1,56,20.89Z"/>
</svg>

