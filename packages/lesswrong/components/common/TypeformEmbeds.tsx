import React, { FC, useEffect } from "react";
import { Helmet } from "../../lib/utils/componentsWithChildren";

type TypeformParameters = Record<string, boolean | string>;

const TypeformScript: FC = () => (
  <Helmet>
    <script src="https://embed.typeform.com/next/embed.js" />
  </Helmet>
);

const useTypeformCallback = (
  widgetId: string,
  event: "close" | "submit",
  onEvent?: () => void,
) => {
  const callbackName = `fm_tf_on_${event}_${widgetId}`;
  useEffect(() => {
    if (onEvent) {
      // Typeform needs to be supplied with a function name that is defined on
      // the window object
      // @ts-ignore
      window[callbackName] = onEvent;
      return () => {
        // @ts-ignore
        delete window[callbackName];
      };
    }
  }, [callbackName, onEvent]);
  return onEvent ? {[`data-tf-on-${event}`]: callbackName} : {};
}

export const TypeformStandardEmbed: FC<{
  widgetId: string,
  domain?: string,
  title: string,
  parameters?: TypeformParameters,
  className?: string,
}> = ({widgetId, domain, title, parameters, className}) => (
  <>
    <TypeformScript />
    <div
      data-tf-widget={widgetId}
      data-tf-domain={domain}
      data-tf-opacity="100"
      data-tf-iframe-props={`title=${title}`}
      data-tf-transitive-search-params
      data-tf-medium="snippet"
      className={className}
      {...parameters}
    />
  </>
);

export const TypeformFullPageEmbed: FC<{
  widgetId: string,
  title: string,
  domain?: string,
  parameters?: TypeformParameters,
  className?: string,
}> = ({widgetId, domain, title, parameters, className}) => (
  <TypeformStandardEmbed
    widgetId={widgetId}
    title={title}
    domain={domain}
    className={className}
    parameters={{
      "data-tf-inline-on-mobile": true,
      "data-tf-auto-focus": true,
      "data-tf-full-screen": true,
      ...parameters,
    }}
  />
);

export const TypeformPopupEmbed: FC<{
  widgetId: string,
  domain?: string,
  title: string,
  label?: string,
  onClose?: () => void,
  onSubmit?: () => void,
  parameters?: TypeformParameters,
  className?: string,
}> = ({widgetId, domain, title, label, onClose, onSubmit, parameters, className}) => {
  const onCloseProps = useTypeformCallback(widgetId, "close", onClose);
  const onSubmitProps = useTypeformCallback(widgetId, "submit", onSubmit);
  return (
    <>
      <TypeformScript />
      <button
        data-tf-popup={widgetId}
        data-tf-domain={domain}
        data-tf-opacity="100"
        data-tf-size="100"
        data-tf-iframe-props={`title=${title}`}
        data-tf-transitive-search-params
        data-tf-medium="snippet"
        className={className}
        {...onCloseProps}
        {...onSubmitProps}
        {...parameters}
      >
        {label ?? title}
      </button>
    </>
  );
}

/**
 * Defines when to open the side popup.
 * The default is "onClick" which waits for the button to be pressed.
 * "onLoad" opens the popup immediately on page load.
 * A number value between 0-100 opens the popup when the user scrolls that
 * percentage down the page.
 */
export type TypeformSideEmbedOpenBehaviour = "onClick" | "onLoad" | number;

export const TypeformSideEmbed: FC<{
  widgetId: string,
  domain?: string,
  title: string,
  label?: string,
  onClose?: () => void,
  onSubmit?: () => void,
  parameters?: TypeformParameters,
  openBehaviour?: TypeformSideEmbedOpenBehaviour,
  className?: string,
}> = ({
  widgetId,
  domain,
  title,
  label,
  onClose,
  onSubmit,
  parameters,
  openBehaviour = "onClick",
  className,
}) => {
  const onCloseProps = useTypeformCallback(widgetId, "close", onClose);
  const onSubmitProps = useTypeformCallback(widgetId, "submit", onSubmit);
  const tfOpen = openBehaviour === "onClick"
    ? undefined
    : (openBehaviour === "onLoad" ? "load" : "scroll");
  const tfOpenValue = typeof openBehaviour === "number"
    ? String(openBehaviour)
    : undefined;
  return (
    <>
      <TypeformScript />
      <button
        data-tf-slider={widgetId}
        data-tf-domain={domain}
        data-tf-position="right"
        data-tf-opacity="100"
        data-tf-iframe-props={`title=${title}`}
        data-tf-transitive-search-params
        data-tf-medium="snippet"
        data-tf-open={tfOpen}
        data-tf-open-value={tfOpenValue}
        className={className}
        {...onCloseProps}
        {...onSubmitProps}
        {...parameters}
      >
        {label ?? title}
      </button>
    </>
  );
}
