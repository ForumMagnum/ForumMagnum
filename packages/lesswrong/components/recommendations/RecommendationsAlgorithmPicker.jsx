import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import Input from '@material-ui/core/Input';

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

const RecommendationsAlgorithmPicker = ({ settings, onChange }) => {
  return <div>
    <div>{"Algorithm "}
      <select
        onChange={(ev) => onChange({ ...settings, algorithm: ev.target.value })}
        value={settings.algorithm}
      >
        {recommendationAlgorithms.map(algorithm =>
          <option value={algorithm.name} key={algorithm.name}>
            {algorithm.description}
          </option>
        )}
      </select>
    </div>
    <div>{"Count "}
      <Input
        value={settings.count}
        type="number"
        onChange={(ev) => onChange({ ...settings, count: ev.target.value })}
      />
    </div>
  </div>;
}

registerComponent("RecommendationsAlgorithmPicker", RecommendationsAlgorithmPicker);