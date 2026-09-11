import { Doc, XmlText } from "yjs";

/**
 * Removes "orphan" XmlText embeds from the main doc's root — live children of
 * root that have no `__type` attribute and whose own `_map` is empty. These
 * are an artifact of yjs/yjs#534: undoing a tracked cascade-delete of an
 * XmlText whose attribute items had already been tombstoned via an untracked
 * origin. `redoItem` rebuilds the XmlText via `content.copy()`, which for
 * YXmlText returns a fresh empty instance, and the missing attr items never
 * get redone — producing a root embed that Lexical rejects at load time.
 *
 * The orphan carries no recoverable data, so removing it via `root.delete`
 * emits a normal Yjs update that self-heals the document. Returns item ids for
 * logging.
 */
export function repairOrphanXmlTextsInRoot(doc: Doc): string[] {
  const root = doc.get("root", XmlText);
  const removed: string[] = [];
  doc.transact(() => {
    const delta = root.toDelta();
    let offset = 0;
    const orphanOffsets: number[] = [];
    for (const entry of delta as Array<{ insert: unknown }>) {
      const ins = entry.insert;
      if (typeof ins === "string") {
        offset += ins.length;
        continue;
      }
      if (ins instanceof XmlText) {
        const hasType = ins.getAttribute("__type") !== undefined;
        const mapSize = (
          ins as unknown as { _map: Map<string, unknown> }
        )._map.size;
        if (!hasType && mapSize === 0) {
          orphanOffsets.push(offset);
          const item = (
            ins as unknown as {
              _item?: { id: { client: number; clock: number } };
            }
          )._item;
          if (item) removed.push(`${item.id.client}@${item.id.clock}`);
        }
      }
      offset += 1;
    }
    for (let i = orphanOffsets.length - 1; i >= 0; i--) {
      root.delete(orphanOffsets[i], 1);
    }
  }, "orphan-repair");
  return removed;
}
