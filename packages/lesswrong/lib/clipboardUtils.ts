/**
 * Copies text to the clipboard, where the text isn't known yet at the time the
 * user clicks (eg because it has to be fetched first).
 *
 * Safari revokes the transient user activation that permits a clipboard write
 * as soon as you `await`, so `writeText(await getText())` silently fails there.
 * Handing `ClipboardItem` the still-unresolved promise is explicitly allowed to
 * resolve later. Firefox lacks promise-valued clipboard items but doesn't
 * revoke the permission, so it falls through to `writeText`.
 */
export const copyTextToClipboard = async (textPromise: Promise<string>): Promise<void> => {
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      const blobPromise = textPromise.then(
        (text) => new Blob([text], {type: "text/plain"}),
      );
      await navigator.clipboard.write([new ClipboardItem({"text/plain": blobPromise})]);
      return;
    } catch {
      // The promise-valued item was rejected, or producing the text failed.
      // Retry simply, which surfaces the underlying error if there was one.
    }
  }
  await navigator.clipboard.writeText(await textPromise);
};
