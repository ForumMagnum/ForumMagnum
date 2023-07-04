import { DatabaseServerSetting } from "../../databaseSettings";

export const healthCheckUserAgentSetting = new DatabaseServerSetting<string>("healthCheckUserAgent", "ELB-HealthChecker/2.0");

/**
 * Given something serializable (can be JSON.stringify'ed), serialize it into
 * a form that can be embedded into an HTML document. Escapes </script> tags
 * but does *not* wrap it in quotes or escape quotes.
 */
export const toEmbeddableJson = (serializable: unknown): string => {
  return JSON.stringify(serializable)
    .replace(/<\//g, "<\\/")
}

export const embedAsGlobalVar = (name: keyof Window, value: unknown): string => {
  return `<script>window.${name} = ${toEmbeddableJson(value)}</script>`;
};
