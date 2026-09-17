import { Map } from "maplibre-gl";

// a style URL instead of an inline object, so a mount right after new Map reliably happens before the style loads
const STYLE_URL = new URL("../fixtures/style.json", import.meta.url).href;

const maps: Map[] = [];

export function createMap() {
  const container = document.createElement("div");
  container.style.width = "400px";
  container.style.height = "300px";
  document.body.append(container);
  const map = new Map({ container, style: STYLE_URL, attributionControl: false });
  maps.push(map);
  return map;
}

export async function createLoadedMap() {
  const map = createMap();
  await new Promise<void>((resolve) => map.once("load", () => resolve()));
  return map;
}

// a map that is never removed keeps the draw libre guard taken for the rest of the page
export function removeMaps() {
  for (const map of maps.splice(0)) {
    const container = map.getContainer();
    map.remove();
    container.remove();
  }
}
