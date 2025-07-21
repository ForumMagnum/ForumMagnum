import { toEmbeddableJson } from "@/lib/utils/jsonUtils";


export const embedAsGlobalVar = (name: keyof Window, value: unknown): string =>
  `<script>window.${String(name)} = ${toEmbeddableJson(value)}</script>`;
