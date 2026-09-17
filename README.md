# DrawLibre React

React wrapper for [draw-libre](https://github.com/UsikianLevon/draw-libre), a tool for drawing lines and polygons on
[MapLibre GL](https://maplibre.org/) and [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/) maps.

Requires React 16.14 or newer and draw-libre 1.x.

## Installation

```bash
npm install draw-libre-react draw-libre maplibre-gl
```

Import the draw-libre styles once, next to your map styles:

```ts
import "maplibre-gl/dist/maplibre-gl.css";
import "draw-libre/dist/index.css";
```

## Quick start

```tsx
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import DrawLibre from "draw-libre-react";

export function App() {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  useEffect(() => {
    const instance = new maplibregl.Map({
      container: container.current!,
      style: "https://demotiles.maplibre.org/style.json",
    });
    // the control can be added only after the style has loaded
    instance.once("load", () => setMap(instance));
    return () => {
      setMap(null);
      instance.remove();
    };
  }, []);

  return (
    <>
      <div ref={container} style={{ height: "100vh" }} />
      {map && <DrawLibre map={map} panel={{ buttons: { undo: { visible: true }, save: { visible: true } } }} />}
    </>
  );
}
```

Render `<DrawLibre>` only after the map fired `load`. Mounting earlier throws `Style is not done loading` into the
nearest error boundary.

## Props

| Prop        | Type                                                                 | Default          |
| ----------- | -------------------------------------------------------------------- | ---------------- |
| `map`       | a maplibre-gl or mapbox-gl `Map`                                     | required         |
| `placement` | `"top-left"` \| `"top-right"` \| `"bottom-left"` \| `"bottom-right"` | `"bottom-right"` |

Every draw-libre option is a prop: `pointGeneration`, `modes`, `panel`, `locale`, `layersPaint`, `dynamicLine` and
`initial`. See the [draw-libre configuration](https://github.com/UsikianLevon/draw-libre#configuration) for their
shapes and defaults. The built-in panel buttons are hidden unless you set `visible: true`.

### Options are read once

Options and `placement` are read when the control mounts. Later changes to them are ignored, so a parent re-render
never wipes the drawing. To apply new options, change the `key`:

```tsx
<DrawLibre key={language} map={map} locale={LOCALES[language]} />
```

A new `key`, or a different `map`, mounts a new control: the drawing and the undo history are lost.

## Events

Event handlers may change on every render, the latest one is always called.

| Prop                 | draw-libre event       | Payload type           |
| -------------------- | ---------------------- | ---------------------- |
| `onPointAdd`         | `mdl:add`              | `PointAddEvent`        |
| `onPointRemove`      | `mdl:pointremove`      | `PointRemoveEvent`     |
| `onPointEnter`       | `mdl:pointenter`       | `PointEnterEvent`      |
| `onPointLeave`       | `mdl:pointleave`       | `PointLeaveEvent`      |
| `onPointMove`        | `mdl:moveend`          | `PointMoveEvent`       |
| `onUndo`             | `mdl:undo`             | `UndoEvent`            |
| `onRedo`             | `mdl:redo`             | `RedoEvent`            |
| `onRemoveAll`        | `mdl:removeall`        | `RemoveAllEvent`       |
| `onSave`             | `mdl:save`             | `SaveEvent`            |
| `onBreak`            | `mdl:break`            | `BreakEvent`           |
| `onModeChange`       | `mdl:modechanged`      | `ModeChangeEvent`      |
| `onUndoStackChanged` | `mdl:undostackchanged` | `UndoStackChangeEvent` |
| `onRedoStackChanged` | `mdl:redostackchanged` | `RedoStackChangeEvent` |

Payload types come from `draw-libre`:

```tsx
import type { SaveEvent } from "draw-libre";

const onSave = (event: SaveEvent) => console.log(event.steps);
```

`onModeChange` also fires while the control mounts, with the initial mode (`null` unless `modes.initial` is set). In
development under `StrictMode` React mounts effects twice, so it fires on each mount.

## Ref

The ref holds the draw-libre instance, so every [draw-libre method](https://github.com/UsikianLevon/draw-libre#methods)
is available:

```tsx
import { useRef } from "react";
import DrawLibre, { type DrawLibreRef } from "draw-libre-react";

const drawRef = useRef<DrawLibreRef>(null);

<DrawLibre ref={drawRef} map={map} />;

drawRef.current?.getAllSteps();
drawRef.current?.setSteps([{ lat: 40, lng: 30 }]);
drawRef.current?.undo();
drawRef.current?.redo();
drawRef.current?.clear();
drawRef.current?.save();
```

`drawRef.current` is `null` until the control is mounted and after it is removed. It is also still `null` inside the
parent's own mount effect: the instance arrives one render later. Pass starting geometry through `initial` instead of
calling `setSteps` on mount.

The parent does not re-render when the instance arrives. To react to it, pass a callback ref:
`<DrawLibre ref={(draw) => draw && onReady(draw)} map={map} />`.

## One control at a time

draw-libre allows one mounted control per page, across all maps. A second `<DrawLibre>` mounted at the same time
throws `DrawLibre is already added to a map` into the nearest error boundary, while the first keeps working. Unmount
the first one before mounting another. Changing `key` or `map` is fine: the old control is removed before the new
one is added.

Calling `map.remove()` before `<DrawLibre>` unmounts is safe.

## TypeScript

`DrawLibreProps` and `DrawLibreRef` are exported. Option and event types come from `draw-libre`. `map` accepts
maplibre-gl and mapbox-gl maps without casts; the typings are checked against maplibre-gl 2, 5 and 6, mapbox-gl 3 and
`@types/react` 16, 18 and 19. With mapbox-gl and `skipLibCheck: false`, install `@types/geojson`: the draw-libre
typings reference it and mapbox-gl does not bring it.

## License

[MIT](https://opensource.org/licenses/MIT)
