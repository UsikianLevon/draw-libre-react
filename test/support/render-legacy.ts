import type { ReactElement } from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";

// typings come from react dom 19, which dropped the legacy API this file calls on React 16 and 17
const legacy = ReactDOM as unknown as {
  render(element: ReactElement, container: Element): void;
  unmountComponentAtNode(container: Element): boolean;
};

export const supportsStrictEffects = false;

export function render(element: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  act(() => {
    legacy.render(element, container);
  });
  return {
    rerender: (next: ReactElement) =>
      act(() => {
        legacy.render(next, container);
      }),
    unmount: () => {
      act(() => {
        legacy.unmountComponentAtNode(container);
      });
      container.remove();
    },
  };
}
