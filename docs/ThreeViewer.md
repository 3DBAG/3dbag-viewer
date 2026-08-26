# ThreeViewer

`ThreeViewer` combines a MapLibre map with a Three.js custom 3D layer. MapLibre owns the canvas, camera, basemap, Mapterhorn terrain, hillshade, controls, and render scheduling. The custom layer renders the 3DBAG 3D Tiles 1.1 feed through the same WebGL context and exposes `EXT_mesh_features` and `EXT_structural_metadata` data when a building is picked.

The ECEF tileset is dynamically rebased into a local east/up/south frame around the map center. This keeps Three.js coordinates precise while the MapLibre camera moves through the nationwide tileset.

## Props

| Name | Type | Description |
| --- | --- | --- |
| `tiles-url` | `String` | URL of the 3D Tiles tileset. The default points to the current LoD 2.2 Cesium 3D Tiles feed. |
| `basemap-preset` | `String` | `openfreemap`, `standaard`, `grijs`, or `luchtfoto`. The three Dutch presets are supplied by NLMaps. |

## Configuration

| Environment variable | Default | Description |
| --- | --- | --- |
| `VUE_APP_MAP_STYLE_URL` | `https://tiles.openfreemap.org/styles/liberty` | Default OpenFreeMap style URL. |
| `VUE_APP_TERRAIN_TILEJSON_URL` | `https://terrain.reearth.land/mapbox/ellipsoid/tilejson.json` | MapLibre raster-dem TileJSON source. |

The former `VUE_APP_TERRAIN_URL` quantized-mesh setting and viewer-specific PDOK service URL overrides are no longer used.
The terrain endpoint combines Mapterhorn's orthometric DEM with EGM2008 geoid undulation. Its WGS84-ellipsoidal heights match the 3DBAG ECEF tiles, avoiding a vertical offset between terrain and buildings.
Basemap style changes preserve the terrain and hillshade sources, including their loaded tile caches.

## Events

| Name | Description |
| --- | --- |
| `cam-offset` | Camera offset in the route-compatible local east/up/south frame. |
| `cam-rotation-z` | Compass rotation relative to local north. |
| `object-picked` | Semantic selection containing `featureId`, `featureClass`, `attributes`, `height`, `heightReference`, `azimuthAngle`, and nullable `tileID`. `batchID` and `pz` remain compatibility aliases. An empty selection emits `undefined`. |

## Route compatibility

The existing `rdx`, `rdy`, `ox`, `oy`, and `oz` query parameters remain supported. RD target coordinates are transformed to WGS84 and camera offsets retain their east, up, and south meanings.

Address markers snap to a building roof when the address ray intersects loaded 3D Tiles geometry. Otherwise they use `Map.queryTerrainElevation()` and are corrected as building or terrain tiles load.

Map pitch is capped at 60 degrees from nadir. This keeps close-range panning clear of MapLibre's near-horizontal terrain collision correction.

## Public methods

- `pointCameraToNorth()` animates the MapLibre bearing to north.
- `setCameraPosFromRoute(query)` restores a MapLibre camera from the route query.
- `setRouteFromCameraPos()` serializes the synchronized camera back to the route query.
