import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';

// Elements here should match switch cases in recommendations.js
const recommendationAlgorithms = [
  {
    name: "top",
    description: "Top scored"
  },
  {
    name: "sampleScore2",
    description: "Sample weighted by score^2"
  },
  {
    name: "sampleScore3",
    description: "Sample weighted by score^3"
  },
  {
    name: "sampleScore4",
    description: "Sample weighted by score^4"
  }
];

const RecommendationsAlgorithmPicker = ({ onPickAlgorithm, selectedAlgorithm }) => {
  return (<select
    onChange={(ev) => onPickAlgorithm(ev.target.value)}
    value={selectedAlgorithm}
  >
    {recommendationAlgorithms.map(algorithm =>
      <option value={algorithm.name} key={algorithm.name}>
        {algorithm.description}
      </option>
    )}
  </select>);
}

registerComponent("RecommendationsAlgorithmPicker", RecommendationsAlgorithmPicker);