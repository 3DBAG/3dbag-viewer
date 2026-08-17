# ThreeViewer

`ThreeViewer` renders 3DBAG 3D Tiles 1.1 content in its native ECEF coordinate frame. It enables meshopt-compressed glTF content and exposes per-building `EXT_mesh_features` and `EXT_structural_metadata` data when an object is picked.

## Props

| Name | Type | Description |
| --- | --- | --- |
| `tiles-url` | `String` | URL of the 3D Tiles tileset. The default points to the current LoD 2.2 Cesium 3D Tiles feed. |
| `basemap-options` | `Object` | PDOK WMTS source configuration. Globe overlays require an EPSG:3857 tile matrix set. |

## Events

| Name | Description |
| --- | --- |
| `cam-offset` | Camera offset in the route-compatible local east/up/south frame. |
| `cam-rotation-z` | Compass rotation relative to local north. |
| `object-picked` | Semantic selection containing `featureId`, `featureClass`, `attributes`, `height`, `heightReference` (`WGS84_ELLIPSOID`), `azimuthAngle`, and nullable `tileID`. `batchID` and `pz` are temporary compatibility aliases for `featureId` and `height`. An empty selection emits `undefined`. |

## Route compatibility

The existing `rdx`, `rdy`, `ox`, `oy`, and `oz` query parameters remain supported. RD target coordinates are transformed to WGS84/ECEF; offsets retain their former east, up, and south meanings.

Address markers initially use the ellipsoid target. They snap to a building roof when the address ray intersects the 3D Tiles geometry, otherwise they use terrain elevation. The height is recalculated as building and terrain tiles load and refine.

## Public methods

- `pointCameraToNorth()` rotates the camera to face local north without changing its range or altitude.
- `setCameraPosFromRoute(query)` restores a camera position from the route query.
- `setRouteFromCameraPos()` serializes the current globe camera back to the route query.
