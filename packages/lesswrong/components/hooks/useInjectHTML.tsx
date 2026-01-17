import { useContext, createContext, useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";

type InjectedHTMLContextType = {
  pendingScripts: string[]
}
const InjectedHTMLContext = createContext<InjectedHTMLContextType|null>(null);
export const HTMLInjector = ({children}: {
  children: React.ReactNode
}) => {
  const contextRef = useRef<InjectedHTMLContextType>({
    pendingScripts: [],
  });

  useServerInsertedHTML(() => {
    const result = <>{contextRef.current.pendingScripts.map((script: string) => <script key={script} dangerouslySetInnerHTML={{ __html: script }}/>)}</>
    contextRef.current.pendingScripts.splice(0, contextRef.current.pendingScripts.length);
    return result;
  });

  return <InjectedHTMLContext.Provider value={contextRef.current}>
    {children}
  </InjectedHTMLContext.Provider>
};


export const useInjectHTML = (): ((html: string) => void) => {
  const context = useContext(InjectedHTMLContext);
  if (!context) {
    throw new Error("useInjectHTML called outside of InjectedHTMLContext");
  }
  return (html: string) => {
    context.pendingScripts.push(html);
  }
}

export function escapeInlineScriptJson(json: string): string {
  // Prevent `</script>` from terminating the tag. Also escape JS line separators.
  return json
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}