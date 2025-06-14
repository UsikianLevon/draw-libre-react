# DrawLibre

> ⭐ Early supporter? Your star makes a difference!

**⚠️ This is a React wrapper for the core library [draw-libre](https://github.com/UsikianLevon/draw-libre). If you're looking for the vanilla JS version, check out the main repo.**

## 🚀 Features

- Undo/redo support
- Break closed geometry
- Draw LineStrings (open/closed) and Polygons
- Compatible with MapLibre GL (v2–v5) and Mapbox GL (v1–v3)
- Works with all projections
- Fully customizable UI & controls
- Event-driven architecture for seamless integration

---

### 🎯 Manual Point Generation

> Extra points are added when a line is clicked

![Manual Point Generation](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDZscnowMHNndmtiZzcwb3Bvc2Y2b29qbHdndndndGE3Mzk5Z2Q0cSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/m6lig0ZCfL45FZQo7b/giphy.gif)

### 🤖 Automatic Point Generation

> Auxiliary point is generated between every two primary points

![Automatic Point Generation](https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2VieG1rd3ZkaWt5azVhYWpqaWEwZnVybGdjYW90d2xwNWwzeWtzayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6ohjkf9L1NWUESTaQA/giphy.gif)

---

## 📦 Installation

```bash
npm install draw-libre-react
```

---

## ⚡ Quick Start

```tsx
import maplibregl from "maplibre-gl";
import DrawLibre from "draw-libre-react";

const map = // your map instance

{map && <DrawLibre map={map} />}
```

---

## ⚙️ API Reference

### Configuration

```tsx
<DrawLibre
  map={map}
  pointGeneration="manual" // or "auto"; pointGeneration controls whether additional points are automatically generated on the line or if you place them manually by clicking.
  modes={{
    initial: null, // default value; can be "line" or "polygon". Initial mode for drawing
    breakGeometry: { visible: true }, // Controls visibility of the break geometry button
    line: {
      closeGeometry: true, // Enables/disables ability to close a LineString
      visible: true, // Controls visibility of the line drawing button
    },
    polygon: { visible: true }, // Controls visibility of the polygon drawing button
  }}
  panel={{
    size: "medium", // "large" || "small" - Controls size of the panel that appears after pressing a button
    buttons: {
      delete: { visible: true }, // Controls visibility of the delete all points button
      redo: { visible: true }
      save: {
        clearOnSave: true, // Whether to clear all points after saving
        visible: true, // Controls visibility of the save button
      },
      undo: { visible: true }, // Controls visibility of the undo button
    },
  }}
  locale={{
    // Customize button labels and tooltips
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
  layersPaint={{
    // Customize layer styles here. Refer to MapLibre's layer specifications for options.
    onLinePoint: {}, // CircleLayerSpecification["paint"]
    firstPoint: {}, // CircleLayerSpecification["paint"]
    points: {}, // CircleLayerSpecification["paint"]
    line: {}, // LineLayerSpecification["paint"]
    polygon: {}, // FillLayerSpecification["paint"]
    breakLine: {}, // LineLayerSpecification["paint"]
  }}
  dynamicLine={true} // Whether to draw a dynamic line following the cursor after placing the first point. It's always false for mobile phones(when the viewport is less than 768)
  initial={{
    // Initialize with pre-existing GeoJSON data
    closeGeometry: false, // Specify if the geometry is closed. Must be true if the geometry type is polygon.
    generateId: true, // Whether to generate unique IDs for your geometries. Should be true if there are no IDs for each point in `steps`.
    geometry: "line", // "line" | "polygon" - Specifies the type of geometry to initialize
    steps: [
      // Array of {id?: string | number, lat: number, lng: number}
      // The first and the last point should be the same if the geometry is closed.
      // The closeGeometry also should be true in this case.
      { lat: 40, lng: 30 },
      { lat: 31, lng: 21 },
      { lat: 31, lng: 21 },
    ],
  }}
/>
```

---

## 🔔 Events

Use event callbacks to handle user interaction:

```tsx
<DrawLibre
  map={map}
  onPointAdd={() => console.log("Point added")}
  onPointEnter={() => console.log("Point entered")}
  onPointLeave={() => console.log("Point leave")}
  onModeChange={(mode) => console.log("Mode changed to:", mode)}
  onPointMove={(point) => console.log("Point moved", point)}
  onRemoveAll={() => console.log("All points removed")}
  onRightClickRemove={() => console.log("Right click remove")}
  onSave={(steps) => console.log("Saved steps:", steps)}
  onUndo={() => console.log("Undo action")}
  onUndoStackChanged={(event) => console.log(event)}
  onRedoStackChanged={(event) => console.log(event)}
/>
```

### Available Event Types

- `onRightClickRemove` (PointRightClickRemoveEvent)
- `onPointEnter` (PointEnterEvent)
- `onPointLeave` (PointLeaveEvent)
- `onPointMove` (PointMoveEvent)
- `onPointAdd` (PointAddEvent)
- `onUndo` (UndoEvent)
- `onRemoveAll` (RemoveAllEvent)
- `onSave` (SaveEvent)
- `onModeChange` (ModeChangeEvent)
- `onUndoStackChanged` (UndoStackChangeEvent)
- `onRedoStackChanged` (RedoStackChangeEvent)

---

## 🧠 Methods

```tsx
import DrawLibre, { DrawLibreRef } from "draw-libre-react";
const drawRef = useRef<DrawLibreRef>(null);

<DrawLibre
  ref={drawRef}
  map={map}
/>

// Retrieves a step from the store by its ID.
drawRef.current.findStepById(id: string)

// Retrieves a node from the store by its ID.
drawRef.current.findNodeById(id: string)

// Get all steps, optionally specifying the return type. Selecting 'linkedlist' will return a circular doubly linked list. Have fun.
drawRef.current.getAllSteps(type?: "array" | "linkedlist")

// Set new steps. If ID is not provided, it will be generated automatically
drawRef.current.setSteps(steps: {lat: number; lng: number; id?: string}[])

// Remove all steps
drawRef.current.removeAllSteps()

// If you don't like the panel, you can hide it in options and use these handlers to create your own panel
// Clear all steps from the drawing
drawRef.current.clear()
// Save the current drawing state
drawRef.current.save()
// Undo the last action. Pass the original(!) DOM event when the dynamic line is enabled. Check the mdl:undostackchanged to disable/enable the button
drawRef.current.undo(e)
// Redo the last undone action. Pass the original(!) DOM event when the dynamic line is enabled. Check the mdl:redostackchanged to disable/enable the button
drawRef.current.redo(e)

// Update options. Note that options are immutable, so return a new object with spread values.
drawRef.current.setOptions((options: RequiredDrawOptions) => {
  return {
    ...options,
    locale: {
      ...options.locale,
      save: "Save update",
    },
    modes: {
      ...options.modes,
      line: {
        ...options.modes.line,
        closeGeometry: false,
      },
    },
    dynamicLine: false,
  };
});
```

---

## 📄 License

[MIT License](https://opensource.org/licenses/MIT)
