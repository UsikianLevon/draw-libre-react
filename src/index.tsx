import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { Map as LibreMap } from "maplibre-gl";
import type { Map as MapboxMap } from "mapbox-gl";
import DL, {
  type PointRightClickRemoveEvent,
  type DrawOptions,
  type SaveEvent,
  type UndoEvent,
  type ModeChangeEvent,
  type PointAddEvent,
  type PointEnterEvent,
  type PointLeaveEvent,
  type PointMoveEvent,
  type RemoveAllEvent,
} from "draw-libre";
import "draw-libre/dist/index.css";

interface DrawLibreEventHandlers {
  onRightClickRemove?: (event: PointRightClickRemoveEvent) => void;
  onSave?: (event: SaveEvent) => void;
  onUndo?: (event: UndoEvent) => void;
  onRemoveAll?: (event: RemoveAllEvent) => void;
  onModeChange?: (event: ModeChangeEvent) => void;
  onPointEnter?: (event: PointEnterEvent) => void;
  onPointLeave?: (event: PointLeaveEvent) => void;
  onPointMove?: (event: PointMoveEvent) => void;
  onPointAdd?: (event: PointAddEvent) => void;
  onUndoStackChanged?: (event: { length: number }) => void;
  onRedoStackChanged?: (event: { length: number }) => void;
}

export interface DrawLibreRef {
  findStepById: ReturnType<typeof DL.getInstance>["findStepById"];
  findNodeById: ReturnType<typeof DL.getInstance>["findNodeById"];
  getAllSteps: ReturnType<typeof DL.getInstance>["getAllSteps"];
  setSteps: ReturnType<typeof DL.getInstance>["setSteps"];
  removeAllSteps: ReturnType<typeof DL.getInstance>["removeAllSteps"];
  undo: ReturnType<typeof DL.getInstance>["undo"];
  redo: ReturnType<typeof DL.getInstance>["redo"];
  clear: ReturnType<typeof DL.getInstance>["clear"];
  save: ReturnType<typeof DL.getInstance>["save"];
}

const handlersStub: DrawLibreRef = {
  findStepById: () => null,
  findNodeById: () => null,
  getAllSteps: () => [],
  setSteps: () => {},
  removeAllSteps: () => {},
  undo: () => {},
  redo: () => {},
  clear: () => {},
  save: () => {},
};

interface Props extends DrawOptions, DrawLibreEventHandlers {
  map: LibreMap | MapboxMap;
  placement?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const DrawLibre = forwardRef<DrawLibreRef, Props>(
  ({ map, placement = "bottom-right", ...props }, ref) => {
    const [drawInstance, setDrawInstance] = useState<ReturnType<
      typeof DL.getInstance
    > | null>(null);

    useEffect(() => {
      if (!map) {
        throw new Error("Map instance is required");
      }
      const draw = DL.getInstance({
        ...props,
      });
      // we just don't care about the type(Map from libre or box) here, as we know it's a Map instance which has addControl method(because they all do)
      // @ts-ignore
      map.addControl(draw, placement);
      setDrawInstance(draw);

      return () => {
        if (!map) return;
        // @ts-ignore
        map.removeControl(draw);
      };
    }, [map, placement, props]);

    useImperativeHandle(
      ref,
      () => {
        if (!drawInstance) {
          return handlersStub;
        }
        return {
          findStepById: drawInstance.findStepById,
          findNodeById: drawInstance.findNodeById,
          getAllSteps: drawInstance.getAllSteps,
          setSteps: drawInstance.setSteps,
          removeAllSteps: drawInstance.removeAllSteps,
          undo: drawInstance.undo,
          redo: drawInstance.redo,
          clear: drawInstance.clear,
          save: drawInstance.save,
        };
      },
      [drawInstance]
    );

    useEvent(map, "mdl:rightclickremove", props.onRightClickRemove);
    useEvent(map, "mdl:save", props.onSave);
    useEvent(map, "mdl:undo", props.onUndo);
    useEvent(map, "mdl:add", props.onPointAdd);
    useEvent(map, "mdl:removeall", props.onRemoveAll);
    useEvent(map, "mdl:modechanged", props.onModeChange);
    useEvent(map, "mdl:pointenter", props.onPointEnter);
    useEvent(map, "mdl:pointleave", props.onPointLeave);
    useEvent(map, "mdl:moveend", props.onPointMove);
    useEvent(map, "mdl:undostackchanged", props.onUndoStackChanged);
    useEvent(map, "mdl:redostackchanged", props.onRedoStackChanged);

    return null;
  }
);

const useEvent = (
  map: MapboxMap | LibreMap,
  eventName: string,
  callback: ((event: any) => void) | undefined
) => {
  useEffect(() => {
    if (!map) return;
    if (!callback) return;

    // again, we don't care, it's a map instance for sure
    // @ts-ignore
    map.on(eventName, callback);
    return () => {
      if (!map) return;
      if (!callback) return;

      // @ts-ignore
      map.off(eventName, callback);
    };
  }, [map, eventName, callback]);
};

export default DrawLibre;
