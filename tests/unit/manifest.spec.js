import {
	getArchivedVersions,
	getActiveColormap,
	getAuxiliaryFiles,
	getColormapConfig,
	getDefaultLod,
	getGpkgDump,
	getLodOptions,
	getTileFormats,
	getTilesetSources,
	getViewerLocations,
	getWebServiceRows,
	isDefinedUrl,
	normalizeMenu
} from '@/utils/manifest';

describe( 'manifest configuration', () => {
	it( 'uses backwards-compatible menu defaults and accepts explicit flags', () => {

		expect( normalizeMenu() ).toEqual( {
			documentation: true,
			dashboard: false,
			feedback: true,
		} );
		expect( normalizeMenu( {
			menu: {
				documentation: false,
				dashboard: true,
				feedback: false,
			},
		} ) ).toEqual( {
			documentation: false,
			dashboard: true,
			feedback: false,
		} );

	} );

	it( 'supports a minimal experimental-only manifest', () => {

		const manifest = {
			menu: {
				documentation: false,
				dashboard: false,
				feedback: false,
			},
			latest: 'experiment',
			versions: {
				experiment: {
					Cesium3DTilesets: {
						lod22: 'https://example.test/experiment/tileset.json',
					},
				},
			},
		};
		const version = manifest.versions[ manifest.latest ];

		expect( normalizeMenu( manifest ) ).toEqual( {
			documentation: false,
			dashboard: false,
			feedback: false,
		} );
		expect( getDefaultLod( version ) ).toBe( 'lod22' );
		expect( getWebServiceRows( version ).map( row => row.key ) ).toEqual( [ '3dtiles-lod22' ] );
		expect( getTileFormats( version ) ).toEqual( [] );

	} );

	it( 'accepts valid viewer locations from arrays or named objects', () => {

		const valid = { name: 'Example', rdx: '1', rdy: 2, ox: 3, oy: 4, oz: 5 };
		expect( getViewerLocations( { locations: [ valid, { rdx: 1 } ] } ) ).toEqual( [ valid ] );
		expect( getViewerLocations( { locations: { example: valid } } ) ).toEqual( [ valid ] );
		expect( getViewerLocations() ).toEqual( [] );

	} );

	it( 'ignores invalid menu values instead of disabling features accidentally', () => {

		expect( normalizeMenu( {
			menu: {
				documentation: 'false',
				dashboard: null,
			},
		} ) ).toEqual( {
			documentation: true,
			dashboard: false,
			feedback: true,
		} );
		expect( normalizeMenu( { menu: null } ) ).toEqual( {
			documentation: true,
			dashboard: false,
			feedback: true,
		} );

	} );

	it( 'prefers Cesium tilesets and filters missing LoDs', () => {

		const version = {
			Cesium3DTilesets: {
				lod22: 'https://example.test/cesium/tileset.json',
				lod13: '',
			},
			'3DTilesets': {
				lod12: 'https://example.test/legacy/tileset.json',
			},
		};

		expect( getTilesetSources( version ) ).toEqual( {
			lod22: 'https://example.test/cesium/tileset.json',
		} );
		expect( getLodOptions( version ) ).toEqual( {
			lod22: { name: 'LoD 2.2', icon: 'home' },
		} );
		expect( getDefaultLod( version ) ).toBe( 'lod22' );

	} );

	it( 'falls back to legacy tilesets and selects the first available LoD', () => {

		const version = {
			'3DTilesets': {
				lod13: 'https://example.test/lod13/tileset.json',
				custom: 'https://example.test/custom/tileset.json',
			},
		};

		expect( getTilesetSources( version ) ).toEqual( version[ '3DTilesets' ] );
		expect( Object.keys( getLodOptions( version ) ) ).toEqual( [ 'lod13' ] );
		expect( getDefaultLod( version ) ).toBe( 'lod13' );

	} );

	it( 'derives only defined per-tile formats from a partial version', () => {

		const formats = getTileFormats( {
			CityJSON: 'https://example.test/{TID_X}.json',
			OBJ: '   ',
			IFC: null,
		} );

		expect( formats ).toEqual( [
			{ key: 'CityJSON', hashProperty: 'cj_sha256' },
		] );
		expect( isDefinedUrl( 'https://example.test/data' ) ).toBe( true );
		expect( isDefinedUrl( undefined ) ).toBe( false );

	} );

	it( 'handles a version without any supported sources', () => {

		expect( getTilesetSources( {} ) ).toEqual( {} );
		expect( getLodOptions( {} ) ).toEqual( {} );
		expect( getDefaultLod( {} ) ).toBeNull();
		expect( getTileFormats( {} ) ).toEqual( [] );
		expect( getWebServiceRows( {} ) ).toEqual( [] );
		expect( getAuxiliaryFiles( {} ) ).toEqual( [] );
		expect( getGpkgDump( {} ) ).toBeNull();

	} );

	it( 'derives only web services and auxiliary files that are defined', () => {

		const version = {
			WMS: 'https://example.test/wms?service=WMS',
			WFS: '',
			metadata: 'https://example.test/metadata.json',
			missing_buildings: 'https://example.test/missing.txt',
			GPKG_DUMP: {
				url: 'https://example.test/all.gpkg.zip',
			},
			Cesium3DTilesets: {
				lod22: 'https://example.test/tileset.json',
			},
		};

		expect( getWebServiceRows( version ).map( row => row.key ) ).toEqual( [ 'WMS', '3dtiles-lod22' ] );
		expect( getWebServiceRows( version )[ 0 ].href ).toBe( 'https://example.test/wms?service=WMS&request=getcapabilities' );
		expect( getAuxiliaryFiles( version ).map( file => file.key ) ).toEqual( [ 'metadata', 'missing_buildings' ] );
		expect( getGpkgDump( version ) ).toEqual( version.GPKG_DUMP );

	} );

	it( 'normalizes partial archived records without dereferencing missing fields', () => {

		expect( getArchivedVersions( {
			withMetadata: {
				metadata: 'https://example.test/metadata.json',
			},
			withTileIndex: {
				TILE_INDEX: 'https://example.test/index.fgb',
			},
			empty: {},
			invalid: null,
		} ) ).toEqual( [
			{
				version: 'withMetadata',
				metadata: 'https://example.test/metadata.json',
				gpkgDump: null,
				tileIndex: null,
			},
			{
				version: 'withTileIndex',
				metadata: null,
				gpkgDump: null,
				tileIndex: 'https://example.test/index.fgb',
			},
		] );

	} );

	it( 'normalizes multiple named colormaps and ignores invalid maps and values', () => {

		expect( getColormapConfig() ).toBeNull();
		expect( getColormapConfig( {
			colormaps: {
				toolbar: true,
				default: 'underpasses',
				maps: {
					source: {
						attribute: 'b3_pw_bron',
						name: 'Point cloud source',
						title: { en: 'Point cloud source', nl: 'Puntwolkbron' },
						other: '#ccc',
						values: {
							ahn3: '#0072B2',
							ahn4: { color: '#E69F00', label: 'AHN4' },
							bad: 'blue'
						}
					},
					underpasses: {
						attribute: 'add_underpass_success',
						name: { en: 'Underpasses', nl: 'Onderdoorgangen' },
						other: { color: '#ccc', label: { en: 'Missing', nl: 'Ontbreekt' } },
						values: [
							{ value: 1, color: '#009E73', label: 'yes' },
							{ value: 0, color: '#0072B2', label: 'no' }
						]
					},
					invalid: { attribute: 'missing-values' }
				}
			}
		} ) ).toEqual( {
			toolbar: true,
			default: 'underpasses',
			maps: {
				source: {
					attribute: 'b3_pw_bron',
					name: 'Point cloud source',
					title: { en: 'Point cloud source', nl: 'Puntwolkbron' },
					icon: 'palette',
					other: '#cccccc',
					otherLabel: 'other',
					values: [
						{ value: 'ahn3', color: '#0072B2', label: 'ahn3' },
						{ value: 'ahn4', color: '#E69F00', label: 'AHN4' }
					]
				},
				underpasses: {
					attribute: 'add_underpass_success',
					name: { en: 'Underpasses', nl: 'Onderdoorgangen' },
					title: 'add_underpass_success',
					icon: 'palette',
					other: '#cccccc',
					otherLabel: { en: 'Missing', nl: 'Ontbreekt' },
					values: [
						{ value: 1, color: '#009E73', label: 'yes' },
						{ value: 0, color: '#0072B2', label: 'no' }
					]
				}
			}
		} );

	} );

	it( 'defaults to an always-on first colormap when toolbar settings are absent or invalid', () => {

		const config = getColormapConfig( {
			colormaps: {
				default: 'unknown',
				maps: {
					first: {
						attribute: 'height',
						values: { tall: '#0072B2' }
					}
				}
			}
		} );

		expect( config.toolbar ).toBe( false );
		expect( config.default ).toBe( 'first' );
		expect( Object.keys( config.maps ) ).toEqual( [ 'first' ] );
		expect( getActiveColormap( config, '__none__' ) ).toBe( config.maps.first );
		expect( getActiveColormap( { ...config, toolbar: true }, '__none__' ) ).toBeNull();

	} );
} );
