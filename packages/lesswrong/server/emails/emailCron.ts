import { addCronJob } from '../cronUtil';

export const releaseEmailBatches = ({now}) => {
}

addCronJob({
  name: "Hourly notification batch",
  schedule(parser) {
    return parser.cron('0 ? * * *');
  },
  job() {
    console.log("Hourly notification batch"); //eslint-disable-line no-console
    releaseEmailBatches({ now: new Date() });
    console.log("Done with hourly notification batch"); //eslint-disable-line no-console
  }
});
