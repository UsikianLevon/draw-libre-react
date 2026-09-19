import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import Core from "draw-libre";
import type { DrawLibreControl, DrawLibreEventType, DrawOptions } from "draw-libre";

export type DrawLibreRef = Core;

type Placement = "top-left" | "top-right" | "bottom-left" | "bottom-right";

// method syntax keeps parameters bivariant, so maplibre and mapbox maps both fit
interface DrawLibreMap {
  addControl(control: DrawLibreControl, position?: Placement): unknown;
  removeControl(control: DrawLibreControl): unknown;
}

const EVENT_BY_PROP = {
  onPointAdd: "mdl:add",
  onPointRemove: "mdl:pointremove",
  onPointEnter: "mdl:pointenter",
  onPointLeave: "mdl:pointleave",
  onPointMove: "mdl:moveend",
  onUndo: "mdl:undo",
  onRedo: "mdl:redo",
  onRemoveAll: "mdl:removeall",
  onSave: "mdl:save",
  onBreak: "mdl:break",
  onModeChange: "mdl:modechanged",
  onUndoStackChanged: "mdl:undostackchanged",
  onRedoStackChanged: "mdl:redostackchanged",
} as const satisfies Record<string, keyof DrawLibreEventType>;

type EventByProp = typeof EVENT_BY_PROP;
type HandlerProp = keyof EventByProp;

type DrawLibreEventHandlers = {
  [P in HandlerProp]?: (event: DrawLibreEventType[EventByProp[P]]) => void;
};

export interface DrawLibreProps extends DrawOptions, DrawLibreEventHandlers {
  map: DrawLibreMap;
  placement?: Placement;
}

const HANDLER_PROPS = Object.keys(EVENT_BY_PROP) as HandlerProp[];

// a new core option fails tsc here instead of being dropped at runtime
const OPTION_KEYS = {
  pointGeneration: true,
  panel: true,
  modes: true,
  layersPaint: true,
  layersLayout: true,
  initial: true,
  locale: true,
  dynamicLine: true,
} satisfies Record<keyof DrawOptions, true>;

const pickOptions = (props: DrawLibreProps): DrawOptions => {
  const options: Record<string, unknown> = {};
  for (const key of Object.keys(OPTION_KEYS) as (keyof DrawOptions)[]) options[key] = props[key];
  return options as DrawOptions;
};

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const DrawLibre = forwardRef<DrawLibreRef, DrawLibreProps>(function DrawLibre(props, ref) {
  const { map } = props;
  const latest = useRef(props);
  useIsomorphicLayoutEffect(() => {
    latest.current = props;
  });

  const [draw, setDraw] = useState<DrawLibreRef | null>(null);
  useImperativeHandle<DrawLibreRef | null, DrawLibreRef | null>(ref, () => draw, [draw]);

  useEffect(() => {
    const control = new Core(pickOptions(latest.current));
    const subscriptions = HANDLER_PROPS.map((prop) =>
      control.on(EVENT_BY_PROP[prop], (event) => latest.current[prop]?.(event as never)),
    );
    map.addControl(control, latest.current.placement ?? "bottom-right");
    setDraw(control);
    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      map.removeControl(control);
    };
  }, [map]);

  return null;
});

export default DrawLibre;
