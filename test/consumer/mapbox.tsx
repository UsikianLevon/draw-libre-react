import mapboxgl from "mapbox-gl";
import DrawLibre from "draw-libre-react";

const map = new mapboxgl.Map({ container: "map" });

export const view = <DrawLibre map={map} placement="bottom-left" />;
