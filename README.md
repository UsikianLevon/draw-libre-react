# DrawLibre React

React wrapper for [draw-libre](https://github.com/UsikianLevon/draw-libre). For the vanilla JS version, see the main repo.

## Installation

```bash
npm install draw-libre-react
```

## Quick start

```tsx
import maplibregl from "maplibre-gl";
import DrawLibre from "draw-libre-react";

const map = // your map instance

{map && <DrawLibre map={map} />}
```

## Configuration

All props besides `map` are optional. The options mirror the core library — see [draw-libre docs](https://github.com/UsikianLevon/draw-libre) for details.

```tsx
<DrawLibre
  map={map}
  // "manual" (default) — click a segment to add a point
  // "auto" — midpoints generated automatically
  pointGeneration="manual"
  modes={{
    initial: null, // starting mode: null | "line" | "polygon"
    breakGeometry: { visible: true },
    line: {
      closeGeometry: true,
      visible: true,
    },
    polygon: { visible: true },
  }}
  panel={{
    size: "medium", // "small" | "medium" | "large"
    buttons: {
      delete: { visible: true },
      redo: { visible: true },
      undo: { visible: true },
      save: {
        clearOnSave: true,
        visible: true,
      },
    },
  }}
  locale={{
    break: "Break",
    closeLine: "Close",
    createPolygon: "Create",
    delete: "Delete",
    line: "Line",
    polygon: "Polygon",
    save: "Save",
    undo: "Undo",
    redo: "Redo",
  }}
  // Override layer paint properties.
  // See MapLibre style spec for available options.
  layersPaint={{
    onLinePoint: {}, // CircleLayerSpecification["paint"]
    firstPoint: {}, // CircleLayerSpecification["paint"]
    points: {}, // CircleLayerSpecification["paint"]
    line: {}, // LineLayerSpecification["paint"]
    polygon: {}, // FillLayerSpecification["paint"]
    breakLine: {}, // LineLayerSpecification["paint"]
  }}
  // Dynamic line following cursor after first point.
  // Always false on viewports < 768px.
  dynamicLine={true}
  initial={{
    geometry: "line", // "line" | "polygon"
    closeGeometry: false, // must be true for polygons
    generateId: true, // auto-generate IDs if missing
    steps: [
      // For closed geometries, first and last point must match.
      { lat: 40, lng: 30 },
      { lat: 31, lng: 21 },
      { lat: 31, lng: 21 },
    ],
  }}
/>
```

## Events

```tsx
<DrawLibre
  map={map}
  onPointAdd={(e) => console.log("added", e)}
  onPointMove={(e) => console.log("moved", e)}
  onPointEnter={(e) => console.log("enter", e)}
  onPointLeave={(e) => console.log("leave", e)}
  onRightClickRemove={(e) => console.log("removed", e)}
  onRemoveAll={(e) => console.log("cleared", e)}
  onModeChange={(e) => console.log("mode", e)}
  onSave={(e) => console.log("saved", e)}
  onUndo={(e) => console.log("undo", e)}
  onUndoStackChanged={(e) => console.log(e)}
  onRedoStackChanged={(e) => console.log(e)}
/>
```

| Prop                 | Event type                   |
| -------------------- | ---------------------------- |
| `onPointAdd`         | `PointAddEvent`              |
| `onPointMove`        | `PointMoveEvent`             |
| `onPointEnter`       | `PointEnterEvent`            |
| `onPointLeave`       | `PointLeaveEvent`            |
| `onRightClickRemove` | `PointRightClickRemoveEvent` |
| `onRemoveAll`        | `RemoveAllEvent`             |
| `onModeChange`       | `ModeChangeEvent`            |
| `onSave`             | `SaveEvent`                  |
| `onUndo`             | `UndoEvent`                  |
| `onUndoStackChanged` | `UndoStackChangeEvent`       |
| `onRedoStackChanged` | `RedoStackChangeEvent`       |

## Methods

Access imperative methods via ref:

```tsx
import DrawLibre, { DrawLibreRef } from "draw-libre-react";

const drawRef = useRef<DrawLibreRef>(null);

<DrawLibre ref={drawRef} map={map} />;
```

```tsx
// Query
drawRef.current.findStepById(id: string)
drawRef.current.findNodeById(id: string)
drawRef.current.getAllSteps(type?: "array" | "linkedlist")

// Mutate
drawRef.current.setSteps(steps: { lat: number; lng: number; id?: string }[])
drawRef.current.removeAllSteps()

// Panel actions (useful if you hide the built-in panel)
drawRef.current.clear()
drawRef.current.save()
drawRef.current.undo(e)   // pass DOM event when dynamicLine is on
drawRef.current.redo(e)   // same
```

Check `onUndoStackChanged` / `onRedoStackChanged` to know when undo/redo are available.

### Updating options at runtime

Options are immutable — return a new object:

```tsx
drawRef.current.setOptions((options: RequiredDrawOptions) => ({
  ...options,
  dynamicLine: false,
  locale: { ...options.locale, save: "Save update" },
  modes: {
    ...options.modes,
    line: { ...options.modes.line, closeGeometry: false },
  },
}));
```

## License

[MIT](https://opensource.org/licenses/MIT)
