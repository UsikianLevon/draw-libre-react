import { createRef, StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, supportsStrictEffects } from "#render";

import type { DrawOptions } from "draw-libre";

import DrawLibre, { type DrawLibreRef } from "../src/index";
import { ErrorBoundary } from "./support/error-boundary";
import { createLoadedMap, createMap, removeMaps } from "./support/map";

const INITIAL: DrawOptions["initial"] = {
  geometry: "line",
  closeGeometry: false,
  generateId: true,
  steps: [
    { lat: 10, lng: 10 },
    { lat: 11, lng: 11 },
  ],
};

// save clears the drawing by default, the tests read the steps afterwards
const KEEP_ON_SAVE: DrawOptions["panel"] = { buttons: { save: { clearOnSave: false } } };

const controlsAt = (map: { getContainer(): HTMLElement }, placement: string) =>
  map.getContainer().querySelectorAll(`.maplibregl-ctrl-${placement} > *`).length;

const silenceReactErrors = () => vi.spyOn(console, "error").mockImplementation(() => {});

afterEach(() => {
  removeMaps();
  vi.restoreAllMocks();
});

describe("mounting", () => {
  it("adds the control at the placement and exposes the instance through ref", async () => {
    const map = await createLoadedMap();
    const ref = createRef<DrawLibreRef>();

    const view = render(<DrawLibre ref={ref} map={map} placement="top-left" initial={INITIAL} />);

    expect(controlsAt(map, "top-left")).toBe(1);
    expect(ref.current?.getAllSteps()).toHaveLength(2);

    view.unmount();

    expect(controlsAt(map, "top-left")).toBe(0);
    expect(ref.current).toBeNull();
  });

  it("uses bottom-right by default", async () => {
    const map = await createLoadedMap();

    const view = render(<DrawLibre map={map} />);

    expect(controlsAt(map, "bottom-right")).toBe(1);
    view.unmount();
  });

  it("passes layersLayout to the core layers", async () => {
    const map = await createLoadedMap();

    const view = render(<DrawLibre map={map} layersLayout={{ line: { "line-cap": "round" } }} />);

    expect(map.getLayoutProperty("mdl-line-layer", "line-cap")).toBe("round");
    view.unmount();
  });

  it.skipIf(!supportsStrictEffects)("mounts a single working control in StrictMode", async () => {
    const map = await createLoadedMap();
    const ref = createRef<DrawLibreRef>();
    const onSave = vi.fn();

    const view = render(
      <StrictMode>
        <DrawLibre ref={ref} map={map} onSave={onSave} />
      </StrictMode>,
    );
    ref.current?.save();

    expect(controlsAt(map, "bottom-right")).toBe(1);
    expect(onSave).toHaveBeenCalledTimes(1);
    view.unmount();
  });
});

describe("updates", () => {
  it("keeps the control on rerender and calls the latest handler", async () => {
    const map = await createLoadedMap();
    const ref = createRef<DrawLibreRef>();
    const first = vi.fn();
    const second = vi.fn();

    const view = render(<DrawLibre ref={ref} map={map} onSave={first} initial={INITIAL} panel={KEEP_ON_SAVE} />);
    const mounted = ref.current;
    view.rerender(<DrawLibre ref={ref} map={map} onSave={second} initial={null} placement="top-left" />);
    ref.current?.save();

    expect(ref.current).toBe(mounted);
    expect(ref.current?.getAllSteps()).toHaveLength(2);
    expect(controlsAt(map, "bottom-right")).toBe(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it("remounts with the new options when the key changes", async () => {
    const map = await createLoadedMap();
    const ref = createRef<DrawLibreRef>();

    const view = render(<DrawLibre key="a" ref={ref} map={map} initial={INITIAL} />);
    const mounted = ref.current;
    view.rerender(<DrawLibre key="b" ref={ref} map={map} placement="top-left" />);

    expect(ref.current).not.toBe(mounted);
    expect(ref.current?.getAllSteps()).toHaveLength(0);
    expect(controlsAt(map, "bottom-right")).toBe(0);
    expect(controlsAt(map, "top-left")).toBe(1);
    view.unmount();
  });

  it("moves to the new map when the map changes", async () => {
    const firstMap = await createLoadedMap();
    const secondMap = await createLoadedMap();
    const ref = createRef<DrawLibreRef>();

    const view = render(<DrawLibre ref={ref} map={firstMap} />);
    const mounted = ref.current;
    view.rerender(<DrawLibre ref={ref} map={secondMap} />);

    expect(ref.current).not.toBe(mounted);
    expect(controlsAt(firstMap, "bottom-right")).toBe(0);
    expect(controlsAt(secondMap, "bottom-right")).toBe(1);
    view.unmount();
  });
});

describe("events", () => {
  it("reports the initial mode on mount", async () => {
    const map = await createLoadedMap();
    const onModeChange = vi.fn();

    const view = render(<DrawLibre map={map} modes={{ initial: "polygon" }} onModeChange={onModeChange} />);

    expect(onModeChange).toHaveBeenCalledTimes(1);
    expect(onModeChange.mock.calls[0]?.[0]).toMatchObject({ type: "mdl:modechanged", mode: "polygon" });
    view.unmount();
  });

  it("forwards events triggered through the ref", async () => {
    const map = await createLoadedMap();
    const ref = createRef<DrawLibreRef>();
    const onSave = vi.fn();
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const onRemoveAll = vi.fn();

    const view = render(
      <DrawLibre
        ref={ref}
        map={map}
        initial={INITIAL}
        panel={KEEP_ON_SAVE}
        onSave={onSave}
        onUndo={onUndo}
        onRedo={onRedo}
        onRemoveAll={onRemoveAll}
      />,
    );
    ref.current?.save();
    ref.current?.undo();
    ref.current?.redo();
    ref.current?.clear();

    expect(onSave.mock.calls[0]?.[0].steps).toHaveLength(2);
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).toHaveBeenCalledTimes(1);
    expect(onRemoveAll).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it("stops calling handlers after unmount", async () => {
    const map = await createLoadedMap();
    const ref = createRef<DrawLibreRef>();
    const onSave = vi.fn();

    const view = render(<DrawLibre ref={ref} map={map} onSave={onSave} />);
    const mounted = ref.current!;
    view.unmount();

    expect(() => mounted.save()).toThrow(/not added to a map/);

    // the core accepts a removed instance again, so a leftover wrapper subscription would receive this save
    map.addControl(mounted);
    mounted.save();
    map.removeControl(mounted);

    expect(onSave).not.toHaveBeenCalled();
  });
});

describe("errors", () => {
  it("sends a second simultaneous control to the error boundary and keeps the first", async () => {
    const map = await createLoadedMap();
    const first = createRef<DrawLibreRef>();
    const onError = vi.fn();
    silenceReactErrors();

    const view = render(
      <>
        <DrawLibre ref={first} map={map} initial={INITIAL} />
        <ErrorBoundary onError={onError}>
          <DrawLibre map={map} />
        </ErrorBoundary>
      </>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0].message).toMatch(/already added to a map/);
    expect(first.current?.getAllSteps()).toHaveLength(2);
    view.unmount();

    const ref = createRef<DrawLibreRef>();
    const next = render(<DrawLibre ref={ref} map={map} />);
    expect(ref.current).not.toBeNull();
    next.unmount();
  });

  it("sends a mount before the style load to the error boundary and mounts after load", async () => {
    const map = createMap();
    const onError = vi.fn();
    silenceReactErrors();

    const early = render(
      <ErrorBoundary onError={onError}>
        <DrawLibre map={map} />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0].message).toMatch(/Style is not done loading/);
    early.unmount();

    await new Promise<void>((resolve) => map.once("load", () => resolve()));
    const ref = createRef<DrawLibreRef>();
    const view = render(<DrawLibre ref={ref} map={map} />);

    expect(ref.current).not.toBeNull();
    view.unmount();
  });
});

describe("disposal", () => {
  it("survives map.remove() before unmount and mounts again on a new map", async () => {
    const map = await createLoadedMap();
    const ref = createRef<DrawLibreRef>();
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});

    const view = render(<DrawLibre ref={ref} map={map} />);
    expect(ref.current).not.toBeNull();

    map.remove();
    expect(() => view.unmount()).not.toThrow();
    expect(ref.current).toBeNull();
    expect(errors).not.toHaveBeenCalled();

    const next = await createLoadedMap();
    const nextRef = createRef<DrawLibreRef>();
    const again = render(<DrawLibre ref={nextRef} map={next} />);

    expect(nextRef.current).not.toBeNull();
    again.unmount();
  });
});
