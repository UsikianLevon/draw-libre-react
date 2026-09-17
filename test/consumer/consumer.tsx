import { useRef } from "react";
import DrawLibre, { type DrawLibreProps, type DrawLibreRef } from "draw-libre-react";
import type { PointAddEvent, SaveEvent } from "draw-libre";

declare const map: DrawLibreProps["map"];

export function Handlers() {
  const ref = useRef<DrawLibreRef>(null);
  const onSave = (event: SaveEvent) => void event.steps;
  return (
    <DrawLibre
      ref={ref}
      map={map}
      placement="top-left"
      pointGeneration="auto"
      panel={{ size: "small", buttons: { save: { visible: true, clearOnSave: false } } }}
      onSave={onSave}
      onPointAdd={(event) => {
        const added: PointAddEvent = event;
        void added;
      }}
      onModeChange={(event) => void event.mode}
      onBreak={(event) => void event.target}
    />
  );
}

export function CallbackRef() {
  return <DrawLibre map={map} ref={(draw: DrawLibreRef | null) => void draw?.save()} />;
}

// @ts-expect-error map is required to add the control
export const withoutMap = <DrawLibre />;

// @ts-expect-error a plain object is not a map
export const plainObject = <DrawLibre map={{}} />;

// @ts-expect-error the payload of mdl:save is not a point event
export const wrongPayload = <DrawLibre map={map} onSave={(event: PointAddEvent) => void event} />;

// @ts-expect-error onRightClickRemove was renamed to onPointRemove in 1.0
export const removedProp = <DrawLibre map={map} onRightClickRemove={() => {}} />;
