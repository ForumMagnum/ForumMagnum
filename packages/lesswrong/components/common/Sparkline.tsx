import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType): JssStyles => ({
  path: {
    stroke: `color-mix(in oklab, var(--forum-event-contrast), ${theme.palette.grey[500]})`,
    strokeWidth: '2px',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
  }
});

/**
 * This was made for ForumEventPoll, and I haven't put much effort into making it generically usable yet
 */
const Sparkline = ({data, min=0, max=1, classes }: {
  data: number[],
  min?: number,
  max?: number,
  classes: ClassesType
}) => {
  // Calculate the frequency of each data point
  const frequencyMap: { [key: number]: number } = {};
  data.forEach(value => {
    // Round to 2 decimal places
    const v = Math.round(value * 100) / 100
    if (frequencyMap[v]) {
      frequencyMap[v]++;
    } else {
      frequencyMap[v] = 1;
    }
  })
  
  // Normalize the data points and their frequencies
  const normalizedData = Object.keys(frequencyMap).map(Number).sort((a, b) => a - b)
  const maxFrequency = Math.max(...Object.values(frequencyMap))
  const normalizedFrequencies = normalizedData.map(value => frequencyMap[value] / maxFrequency)

  const getPath = () => {
    // Define the width and height of the SVG coordinate system
    const width = 1000
    const height = 30

    // Start the path at the first data point
    let path = `M 0,${(1 - normalizedFrequencies[0]) * height}`
    
    // Loop through the data points starting from the second point
    for (let i = 1; i < normalizedData.length; i++) {
      // Calculate the x-coordinate for the current point
      const x = (normalizedData[i] - min) / (max - min) * width
      
      // Calculate the y-coordinate for the current point, inverting the normalized frequency
      const y = (1 - normalizedFrequencies[i]) * height
      
      // Add a line to the path
      path += ` L ${x},${y}`
    }
    
    return path
  }

  return (
    <svg width="100%" height="30" viewBox="0 0 1000 30">
      <path
        d={getPath()}
        fill="none"
        className={classes.path}
      />
    </svg>
  );
};

const SparklineComponent = registerComponent("Sparkline", Sparkline, { styles });

declare global {
  interface ComponentTypes {
    Sparkline: typeof SparklineComponent;
  }
}
