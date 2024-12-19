import { forceFullReactRerender } from '@/client/start';

export function viteHandleReload() {
  // @ts-ignore
  if (import.meta.hot) {
    // Prevent full reload, see https://github.com/vitejs/vite/issues/5763#issuecomment-1974235806
    // This is a horrible hack, which will very likely break in a future
    // vite version. We are deliberately tricking the code in
    // https://github.com/vitejs/vite/blob/20fdf210ee0ac0824b2db74876527cb7f378a9e8/packages/vite/src/client/client.ts#L253
    // into thinking that we're using HTML files for routing, and that the
    // file that was updated is an HTML file and isn't the one that was
    // updated. There is no proper API for this (but there are requests for
    // an API outstanding).
    //
    // @ts-ignore
    import.meta.hot.on('vite:beforeFullReload', (payload: AnyBecauseHard) => {
      // eslint-disable-next-line no-console
      console.log("Suppressing vite reload");
      payload.path = "(WORKAROUND).html";
      
      forceFullReactRerender();
    });
  }
}
