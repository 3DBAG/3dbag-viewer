# ThreeViewer

## Props

| Name              | Type     | Description | Default                                                                                                                                                                                                                                                                        |
| ----------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tiles-url`       | `String` |             | `"http://godzilla.bk.tudelft.nl/3dtiles/ZuidHolland/lod13/tileset1.json"`                                                                                                                                                                                                      |
| `basemap-options` | `Object` |             | `() => { return { type: "wmts", options: { url: 'https://geodata.nationaalgeoregister.nl/tiles/service/wmts?', layer: 'brtachtergrondkaart', style: 'default', tileMatrixSet: "EPSG:28992", service: "WMTS", request: "GetTile", version: "1.0.0", format: "image/png" } }; }` |

## Events

| Name            | Description                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `cam-offset`    | emit camera offset for url generation in the parent app<br>**Arguments**<br><ul><li>**`cam_offset: any`**</li></ul>       |
| `object-picked` | <br>**Arguments**<br><ul><li>**`{ "batchID": batch_id, "identificatie": identificatie, "rmse": "-" }: object`**</li></ul> |

## Methods

### initTweakPane()

**Syntax**

```typescript
initTweakPane(): void
```

### setCameraPosFromRoute()

**Syntax**

```typescript
setCameraPosFromRoute(q: unknow): void
```

### setRouteFromCameraPos()

**Syntax**

```typescript
setRouteFromCameraPos(): void
```

### reinitTiles()

**Syntax**

```typescript
reinitTiles(): void
```

### reinitBasemap()

**Syntax**

```typescript
reinitBasemap(): void
```

### initScene()

**Syntax**

```typescript
initScene(): void
```

### onWindowResize()

**Syntax**

```typescript
onWindowResize(): void
```

### onPointerMove()

**Syntax**

```typescript
onPointerMove(e: unknow): void
```

### onPointerDown()

**Syntax**

```typescript
onPointerDown(): void
```

### onDblClick()

**Syntax**

```typescript
onDblClick(): void
```

### onPointerLeave()

**Syntax**

```typescript
onPointerLeave(): void
```

### castRay()

**Syntax**

```typescript
castRay(): void
```

### updateTerrain()

**Syntax**

```typescript
updateTerrain(): unknow
```

### renderScene()

**Syntax**

```typescript
renderScene(): void
```

