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
    name: "sample",
    description: "Weighted sample"
  },
];

const RecommendationsAlgorithmPicker = ({ settings, onChange }) => {
  return <div>
    <div>{"Algorithm "}
      <select
        onChange={(ev) => onChange({ ...settings, method: ev.target.value })}
        value={settings.method}
      >
        {recommendationAlgorithms.map(method =>
          <option value={method.name} key={method.name}>
            {method.description}
          </option>
        )}
      </select>
    </div>
    <div>{"Count "}
      <Input type="number"
        value={settings.count}
        onChange={(ev) => onChange({ ...settings, count: ev.target.value })}
      />
    </div>
    <div>
      {"Weight: (score - "}
      <Input type="number"
        value={settings.scoreOffset}
        onChange={(ev) => onChange({ ...settings, scoreOffset: ev.target.value })}
      />
      {") ^ "}
      <Input type="number"
        value={settings.scoreExponent}
        onChange={(ev) => onChange({ ...settings, scoreExponent: ev.target.value })}
      />
    </div>
    <div>
      {"Personal blogpost modifier "}
      <Input type="number"
        value={settings.personalBlogpostModifier}
        onChange={(ev) => onChange({ ...settings, personalBlogpostModifier: ev.target.value })}
      />
    </div>
    <div>
      {"Frontpage modifier "}
      <Input type="number"
        value={settings.frontpageModifier}
        onChange={(ev) => onChange({ ...settings, frontpageModifier: ev.target.value })}
      />
    </div>
    <div>
      {"Curated modifier "}
      <Input type="number"
        value={settings.curatedModifier}
        onChange={(ev) => onChange({ ...settings, curatedModifier: ev.target.value })}
      />
    </div>
  </div>;
}

registerComponent("RecommendationsAlgorithmPicker", RecommendationsAlgorithmPicker);