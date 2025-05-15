import { toEmbeddableJson } from "../../../lib/utils/jsonUtils";
import { DatabaseServerSetting } from "../../databaseSettings";

export const healthCheckUserAgentSetting = new DatabaseServerSetting<string>("healthCheckUserAgent", "ELB-HealthChecker/2.0");

export const embedAsGlobalVar = (name: keyof Window, value: unknown): string =>
  `<script>window.${String(name)} = ${toEmbeddableJson(value)}</script>`;
