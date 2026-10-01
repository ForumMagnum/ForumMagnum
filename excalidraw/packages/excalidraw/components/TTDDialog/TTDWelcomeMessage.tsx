// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { t } from "../../i18n";

export const TTDWelcomeMessage = () => {
  return (
    <div className="chat-interface__welcome-screen__welcome-message">
      <h3>{t("chat.placeholder.title")}</h3>
      <p>{t("chat.placeholder.description")}</p>
      <p>{t("chat.placeholder.hint")}</p>
    </div>
  );
};
