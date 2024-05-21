/*
Adapted from react-click-away-listener
https://github.com/ooade/react-click-away-listener

MIT License

Copyright (c) 2019 Ademola Adegbuyi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
import React, {
  useRef,
  useEffect,
  RefCallback,
  cloneElement,
  ReactElement,
  HTMLAttributes,
  MutableRefObject,
  FunctionComponent
} from 'react';

type FocusEvents = 'focusin' | 'focusout';
type MouseEvents = 'click' | 'mousedown' | 'mouseup';
type TouchEvents = 'touchstart' | 'touchend';
export type ClickAwayEvent = FocusEvent | MouseEvent | TouchEvent;

interface Props extends HTMLAttributes<HTMLElement> {
  onClickAway: (event: ClickAwayEvent) => void;
  focusEvent?: FocusEvents;
  mouseEvent?: MouseEvents;
  touchEvent?: TouchEvents;
  children: ReactElement<any>;
}

const eventTypeMapping = {
  click: 'onClick',
  focusin: 'onFocus',
  focusout: 'onFocus',
  mousedown: 'onMouseDown',
  mouseup: 'onMouseUp',
  touchstart: 'onTouchStart',
  touchend: 'onTouchEnd'
};

const ClickAwayListener: FunctionComponent<Props> = ({
  children,
  onClickAway,
  focusEvent = 'focusin',
  mouseEvent = 'click',
  touchEvent = 'touchend'
}) => {
  const node = useRef<HTMLElement | null>(null);
  const bubbledEventTarget = useRef<EventTarget | null>(null);
  const mountedRef = useRef(false);

  /**
   * Prevents the bubbled event from getting triggered immediately
   * https://github.com/facebook/react/issues/20074
   */
  useEffect(() => {
    setTimeout(() => {
      mountedRef.current = true;
    }, 0);

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleBubbledEvents =
    (type: string) =>
    (event: ClickAwayEvent): void => {
      bubbledEventTarget.current = event.target;

      const handler = children?.props[type];

      if (handler) {
        handler(event);
      }
    };

  const handleChildRef = (childRef: HTMLElement) => {
    node.current = childRef;

    let { ref } = children as typeof children & {
      ref: RefCallback<HTMLElement> | MutableRefObject<HTMLElement>;
    };

    if (typeof ref === 'function') {
      ref(childRef);
    } else if (ref) {
      ref.current = childRef;
    }
  };

  useEffect(() => {
    const nodeDocument = node.current?.ownerDocument ?? document;

    const handleEvents = (event: ClickAwayEvent): void => {
      if (!mountedRef.current) return;

      if (
        (node.current && node.current.contains(event.target as Node)) ||
        bubbledEventTarget.current === event.target ||
        !nodeDocument.contains(event.target as Node)
      ) {
        return;
      }

      onClickAway(event);
    };

    nodeDocument.addEventListener(mouseEvent, handleEvents);
    nodeDocument.addEventListener(touchEvent, handleEvents);
    nodeDocument.addEventListener(focusEvent, handleEvents);

    return () => {
      nodeDocument.removeEventListener(mouseEvent, handleEvents);
      nodeDocument.removeEventListener(touchEvent, handleEvents);
      nodeDocument.removeEventListener(focusEvent, handleEvents);
    };
  }, [focusEvent, mouseEvent, onClickAway, touchEvent]);

  const mappedMouseEvent = eventTypeMapping[mouseEvent];
  const mappedTouchEvent = eventTypeMapping[touchEvent];
  const mappedFocusEvent = eventTypeMapping[focusEvent];

  return React.Children.only(
    cloneElement(children as ReactElement<any>, {
      ref: handleChildRef,
      [mappedFocusEvent]: handleBubbledEvents(mappedFocusEvent),
      [mappedMouseEvent]: handleBubbledEvents(mappedMouseEvent),
      [mappedTouchEvent]: handleBubbledEvents(mappedTouchEvent)
    })
  );
};

ClickAwayListener.displayName = 'ClickAwayListener';

export default ClickAwayListener;
