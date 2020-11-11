# SearchBar

**Author:** 3D geoinformation group

A search bar that conduct geocoding to PDOK service.

## Data

| Name            | Type      | Description                                 | Initial value |
| --------------- | --------- | ------------------------------------------- | ------------- |
| `geocodeResult` | `array`   | The result of the geocoding request         | `[]`          |
| `isGeocoding`   | `boolean` | Flag to indicate that geocoding is underway | `false`       |

## Events

| Name           | Description                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `select-place` | Emitted when a location is selected.<br>**Arguments**<br><ul><li>**`res: object`** — An object containing the location information.</li></ul> |

## Methods

### selectPlace()

Select the specified location.

**Syntax**

```typescript
selectPlace(res: object): void
```

**Parameters**

- `res: object`<br>
  An object containing the location information.

### doGeocode()

Make the geocoding request to the server.

**Syntax**

```typescript
doGeocode(name: string): void
```

**Parameters**

- `name: string`<br>
  The search term to look for.

