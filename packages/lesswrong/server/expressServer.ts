import express from 'express'
import { StatsD } from 'hot-shots';

export const app = express();
app.disable("x-powered-by");

export const dogstatsd = new StatsD({
  prefix: 'forummagnum.'
});
