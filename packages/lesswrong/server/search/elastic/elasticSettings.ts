import { PublicInstanceSetting } from "../../../lib/instanceSettings";

export {isElasticEnabled} from '../../../lib/instanceSettings'

export const elasticCloudIdSetting = new PublicInstanceSetting<string|null>(
  "elasticsearch.cloudId",
  null,
  "optional",
);

export const elasticUsernameSetting = new PublicInstanceSetting<string|null>(
  "elasticsearch.username",
  null,
  "optional",
);

export const elasticPasswordSetting = new PublicInstanceSetting<string|null>(
  "elasticsearch.password",
  null,
  "optional",
);

export const searchOriginDate = new PublicInstanceSetting<string>(
  "searchOriginDate",
  "2014-06-01T01:00:00Z",
  "optional",
);
