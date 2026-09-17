import * as maplibregl from "maplibre-gl";
import DrawLibre from "draw-libre-react";

const map = new maplibregl.Map({ container: "map", style: { version: 8, sources: {}, layers: [] } });

export const view = <DrawLibre map={map} placement="bottom-left" />;
