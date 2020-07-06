import { addCronJob } from '../cronUtil';

export const releaseEmailBatches = ({now}) => {
}

addCronJob({
  name: "Hourly notification batch",
  schedule(parser) {
    return parser.cron('0 ? * * *');
  },
  job() {
    releaseEmailBatches({ now: new Date() });
  }
});
