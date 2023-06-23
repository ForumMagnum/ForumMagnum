import { DatabaseServerSetting } from "../../databaseSettings";

export const healthCheckUserAgentSetting = new DatabaseServerSetting<string>("healthCheckUserAgent", "ELB-HealthChecker/2.0");

// Given something serializable (can be JSON.stringify'ed), serialize it into
// a form that can be embedded into an HTML document. Escapes </script> tags
// but does *not* wrap it in quotes or escape quotes.
const toEmbeddableJson = (serializable: any): string => {
  return JSON.stringify(serializable)
    .replace(/<\//g, "<\\/")
}

export const embedAsGlobalVar = (name: keyof Window, value: any): string => {
  return `<script>window.${name} = ${toEmbeddableJson(value)}</script>`;
};
