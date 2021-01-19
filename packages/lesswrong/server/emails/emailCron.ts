import { addCronJob } from '../cronUtil';

export const releaseEmailBatches = ({now}) => {
}

addCronJob({
  name: "Hourly notification batch",
  cronStyleSchedule: '0 ? * * *',
  job() {
    releaseEmailBatches({ now: new Date() });
  }
});
