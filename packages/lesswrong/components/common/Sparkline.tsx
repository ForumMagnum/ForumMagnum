import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import countBy from "lodash/countBy";

const styles = (theme: ThemeType): JssStyles => ({
  path: {
    strokeWidth: '2px',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
  },
  line: {
    strokeWidth: '2px',
  },
})

// The width and height of the SVG coordinate system
const svgWidth = 1000
const svgHeight = 30

/**
 * Generate an SVG sparkline based on the given data.
 * The x-axis is the data, normalized to be between 0-1 (rounded to 2 decimal places),
 * and the y-axis is the frequency of each data point.
 *
 * This was made for ForumEventPoll, so if you want to use it elsewhere,
 * you'll want to audit the code first.
 */
const Sparkline = ({data, min=0, max=1, classes }: {
  data: number[],
  min?: number,
  max?: number,
  classes: ClassesType<typeof styles>
}) => {
  // Normalize the data
  const normalizedData = data.map(v => {
    // Round to 2 decimal places
    return Math.round(100 * (v - min) / (max - min)) / 100
  }).sort()
  
  // Calculate the frequency of each data point
  const frequencyMap: Record<number, number> = countBy(normalizedData)
  const maxFrequency = Math.max(...Object.values(frequencyMap))
  const normalizedFrequencies = normalizedData.map(v => frequencyMap[v] / maxFrequency)
  
  // Track the y-values for the center tick mark
  let tickY1 = svgHeight - 10
  let tickY2 = svgHeight

  const getPath = () => {
    // Start the path at the first data point
    let path = `M 0,${(1 - normalizedFrequencies[0]) * svgHeight}`
    
    // Loop through the data points starting from the second point
    for (let i = 1; i < normalizedData.length; i++) {
      // Calculate the x-coordinate for the current point
      const x = normalizedData[i] * svgWidth
      // Calculate the y-coordinate for the current point, inverting the normalized frequency
      const y = (1 - normalizedFrequencies[i]) * svgHeight
      
      path += ` L ${x},${y}`
      
      // Update the y-values for the center tick mark
      if (Math.round(x / 10) === 50) {
        tickY1 = Math.max(y - 5, 0)
        tickY2 = Math.min(y + 5, svgHeight)
      }
    }
    
    return path
  }

  return (
    <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
      <path
        d={getPath()}
        fill="none"
        className={classes.path}
      />
      <line x1="500" y1={tickY1} x2="500" y2={tickY2} className={classes.line} />
    </svg>
  );
};

const SparklineComponent = registerComponent("Sparkline", Sparkline, { styles });

declare global {
  interface ComponentTypes {
    Sparkline: typeof SparklineComponent;
  }
}
