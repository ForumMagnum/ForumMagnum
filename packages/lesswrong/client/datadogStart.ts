import { isDatadogEnabledOnSite } from "../lib/instanceSettings";

if (isDatadogEnabledOnSite()) {
  const { initDatadog } = require("./datadogRum");
  void initDatadog();
}
