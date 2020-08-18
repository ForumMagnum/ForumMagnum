import React from 'react';
import { ABTest } from './abTestImpl';

// An A/B test which doesn't do anything (other than randomize you), for testing
// the A/B test infrastructure.
export const noEffectABTest = new ABTest({
  name: "abTestNoEffect",
  description: "A placeholder A/B test which has no effect",
  groups: {
    group1: {
      description: "The smaller test group",
      weight: 1,
    },
    group2: {
      description: "The larger test group",
      weight: 2,
    },
  }
});

export const numPostsOnHomePage = new ABTest({
  name: "numPostsOnHomePage",
  description: "Number of Posts in Latest Posts Section of Home Page",
  groups: {
    "10": {
      description: "Ten posts",
      weight: 1,
    },
    "13": {
      description: "Thirteen posts",
      weight: 4,
    },
    "16": {
      description: "Sixteen posts",
      weight: 1,
    },
  },
});
