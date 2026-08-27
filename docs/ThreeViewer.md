# ThreeViewer

`ThreeViewer` combines a MapLibre map with a Three.js custom 3D layer. MapLibre owns the canvas, camera, basemap, Mapterhorn terrain, hillshade, controls, and render scheduling. The custom layer renders the 3DBAG 3D Tiles 1.1 feed through the same WebGL context and exposes `EXT_mesh_features` and `EXT_structural_metadata` data when a building is picked.

The ECEF tileset is dynamically rebased into a local east/up/south frame around the map center. This keeps Three.js coordinates precise while the MapLibre camera moves through the nationwide tileset.

After the root tileset loads, its oriented bounding box is projected to a geographic extent and shown as a primary-blue dashed line draped over the terrain. A translucent mask darkens the map outside that extent. The boundary updates when the tileset or basemap changes.

Buildings can be colored from named `colormaps` in a version entry in `manifest.json`. Each map targets a structural-metadata property and preserves the configured value type, so numeric metadata must use numeric values. Click-to-select still applies the amber semantic highlight on top of the active vertex colors.

```json
"colormaps": {
  "toolbar": true,
  "default": "underpasses",
  "maps": {
    "underpasses": {
      "attribute": "add_underpass_success",
      "name": { "en": "Underpasses", "nl": "Onderdoorgangen" },
      "title": { "en": "Underpasses", "nl": "Onderdoorgangen" },
      "other": {
        "color": "#c4c8cf",
        "label": { "en": "No underpass", "nl": "Geen onderdoorgang" }
      },
      "values": [
        { "value": 1, "color": "#009E73", "label": "true" },
        { "value": 0, "color": "#0072B2", "label": "false" }
      ]
    },
    "point-cloud-source": {
      "attribute": "b3_pw_bron",
      "name": "Point cloud source",
      "values": {
        "ahn3": "#0072B2",
        "ahn4": { "color": "#E69F00", "label": "AHN4" }
      }
    }
  }
}
```

With `toolbar: true`, the Color dropdown lets users select any valid map or disable color coding. With `toolbar: false` (the default), no control is shown and the configured default map is always active. If `default` is missing or invalid, the first valid map is used. Names, titles, and labels accept either strings or localized objects.

The building attribute panel can be limited per version with an ordered `visible_attributes` array. Without this setting, all structural-metadata properties on the selected feature are shown. An empty array hides all metadata properties without affecting picking, styling, or issue reporting.

## Props

| Name | Type | Description |
| --- | --- | --- |
| `tiles-url` | `String` | URL of the 3D Tiles tileset. The default points to the current LoD 2.2 Cesium 3D Tiles feed. |
| `basemap-preset` | `String` | `openfreemap`, `standaard`, `grijs`, or `luchtfoto`. The three Dutch presets are supplied by NLMaps. |
| `colormap` | `Object` | Normalized colormap from the version manifest, or `null` when none is configured. |
| `locations` | `Array` | Valid route-compatible startup locations from the manifest root. When empty, the root tileset bounds determine the initial camera target. |

## Configuration

| Environment variable | Default | Description |
| --- | --- | --- |
| `VUE_APP_MAP_STYLE_URL` | `https://tiles.openfreemap.org/styles/liberty` | Default OpenFreeMap style URL. |
| `VUE_APP_TERRAIN_TILEJSON_URL` | `https://terrain.reearth.land/mapbox/ellipsoid/tilejson.json` | MapLibre raster-dem TileJSON source. |
| `VUE_APP_TERRAIN_ENCODING` | `mapbox` | Raster DEM encoding: `mapbox` or `terrarium`. |

The former `VUE_APP_TERRAIN_URL` quantized-mesh setting and viewer-specific PDOK service URL overrides are no longer used.
The default terrain endpoint combines Mapterhorn's orthometric DEM with EGM2008 geoid undulation. Its WGS84-ellipsoidal heights match the 3DBAG ECEF tiles, avoiding a vertical offset between terrain and buildings.
Basemap style changes preserve the terrain and hillshade sources, including their loaded tile caches.

## Events

| Name | Description |
| --- | --- |
| `cam-offset` | Camera offset in the route-compatible local east/up/south frame. |
| `cam-rotation-z` | Compass rotation relative to local north. |
| `object-picked` | Semantic selection containing `featureId`, `featureClass`, `attributes`, `height`, `heightReference`, `azimuthAngle`, and nullable `tileID`. `batchID` and `pz` remain compatibility aliases. An empty selection emits `undefined`. |

## Route compatibility

The existing `rdx`, `rdy`, `ox`, `oy`, and `oz` query parameters remain supported. RD target coordinates are transformed to WGS84 and camera offsets retain their east, up, and south meanings.

Without route camera parameters, a configured manifest location is selected at random. If the manifest root has no valid `locations`, the viewer targets the root 3D Tiles bounding-sphere center from a capped 100-500 metre distance so large tilesets still open near building level.

Address markers snap to a building roof when the address ray intersects loaded 3D Tiles geometry. Otherwise they use `Map.queryTerrainElevation()` and are corrected as building or terrain tiles load.

Map pitch is capped at 80 degrees from nadir. This keeps close-range panning clear of MapLibre's near-horizontal terrain collision correction.

## Public methods

- `pointCameraToNorth()` animates the MapLibre bearing to north.
- `setCameraPosFromRoute(query)` restores a MapLibre camera from the route query.
- `setRouteFromCameraPos()` serializes the synchronized camera back to the route query.
