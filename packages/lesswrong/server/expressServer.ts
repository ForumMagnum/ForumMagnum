import express from 'express'
import { StatsD } from 'hot-shots';

export const app = express();
export const dogstatsd = new StatsD({
  prefix: 'forummagnum.'
});
