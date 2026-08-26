import { DEFAULT_OTHER_COLOR, normalizeHexColor } from '@/utils/attributeStyles';

const MENU_DEFAULTS = Object.freeze( {
	documentation: true,
	dashboard: false,
	feedback: true,
} );

const LOD_DEFINITIONS = Object.freeze( [
	{ key: 'lod22', name: 'LoD 2.2', icon: 'home' },
	{ key: 'lod13', name: 'LoD 1.3', icon: 'home' },
	{ key: 'lod12', name: 'LoD 1.2', icon: 'home' },
] );

const TILE_FORMAT_DEFINITIONS = Object.freeze( [
	{ key: 'CityJSON', hashProperty: 'cj_sha256' },
	{ key: 'OBJ', hashProperty: 'obj_sha256' },
	{ key: 'GPKG', hashProperty: 'gpkg_sha256' },
	{ key: 'IFC', hashProperty: 'ifc_sha256' },
] );

export function isDefinedUrl( value ) {

	return typeof value === 'string' && value.trim().length > 0;

}

function asRecord( value ) {

	return value && typeof value === 'object' && ! Array.isArray( value ) ? value : {};

}

export function normalizeMenu( manifest = {} ) {

	const configured = asRecord( asRecord( manifest ).menu );
	return Object.keys( MENU_DEFAULTS ).reduce( ( menu, key ) => {

		menu[ key ] = typeof configured[ key ] === 'boolean' ? configured[ key ] : MENU_DEFAULTS[ key ];
		return menu;

	}, {} );

}

function validTilesets( value ) {

	if ( ! value || typeof value !== 'object' || Array.isArray( value ) ) return {};
	return Object.keys( value ).reduce( ( result, key ) => {

		if ( isDefinedUrl( value[ key ] ) ) result[ key ] = value[ key ];
		return result;

	}, {} );

}

export function getTilesetSources( versionData = {} ) {

	const data = asRecord( versionData );
	const cesiumTilesets = validTilesets( data.Cesium3DTilesets );
	if ( Object.keys( cesiumTilesets ).length > 0 ) return cesiumTilesets;
	return validTilesets( data[ '3DTilesets' ] );

}

export function getLodOptions( versionData = {} ) {

	const sources = getTilesetSources( versionData );
	return LOD_DEFINITIONS.reduce( ( options, definition ) => {

		if ( sources[ definition.key ] ) {

			options[ definition.key ] = {
				name: definition.name,
				icon: definition.icon,
			};

		}
		return options;

	}, {} );

}

export function getDefaultLod( versionData = {} ) {

	const options = getLodOptions( versionData );
	if ( options.lod22 ) return 'lod22';
	return Object.keys( options )[ 0 ] || null;

}

function parseColormapEntry( value, key ) {

	if ( typeof value === 'string' ) {

		const color = normalizeHexColor( value );
		return color ? { value: key, color, label: key } : null;

	}
	if ( ! value || typeof value !== 'object' || Array.isArray( value ) ) return null;
	const color = normalizeHexColor( value.color );
	if ( ! color ) return null;
	const label = typeof value.label === 'string' && value.label.trim() ? value.label.trim() : key;
	return { value: key, color, label };

}

function normalizeColormapTitle( value, fallback ) {

	if ( typeof value === 'string' && value.trim() ) return value.trim();
	if ( value && typeof value === 'object' && ! Array.isArray( value ) ) {

		const localized = Object.keys( value ).reduce( ( title, locale ) => {

			if ( typeof value[ locale ] === 'string' && value[ locale ].trim() ) title[ locale ] = value[ locale ].trim();
			return title;

		}, {} );
		if ( Object.keys( localized ).length > 0 ) return localized;

	}
	return fallback;

}

export function getColormap( versionData = {} ) {

	const configured = asRecord( asRecord( versionData ).colormap );
	const attribute = typeof configured.attribute === 'string' ? configured.attribute.trim() : '';
	if ( ! attribute ) return null;
	const rawValues = asRecord( configured.values );
	const values = Object.keys( rawValues )
		.map( key => parseColormapEntry( rawValues[ key ], key ) )
		.filter( Boolean );
	if ( values.length === 0 ) return null;

	return {
		attribute,
		title: normalizeColormapTitle( configured.title, attribute ),
		other: normalizeHexColor( configured.other ) || DEFAULT_OTHER_COLOR,
		values
	};

}

export function getTileFormats( versionData = {} ) {

	const data = asRecord( versionData );
	return TILE_FORMAT_DEFINITIONS.filter( definition => isDefinedUrl( data[ definition.key ] ) );

}

export function getGpkgDump( versionData = {} ) {

	const dump = asRecord( versionData ).GPKG_DUMP;
	return dump && typeof dump === 'object' && ! Array.isArray( dump ) && isDefinedUrl( dump.url ) ? dump : null;

}

export function getAuxiliaryFiles( versionData = {} ) {

	const data = asRecord( versionData );
	const files = [];
	if ( isDefinedUrl( data.metadata ) ) {

		files.push( {
			key: 'metadata',
			format: 'JSON',
			url: data.metadata,
			descriptionKey: 'download.metadatadesc',
		} );

	}
	if ( isDefinedUrl( data.missing_buildings ) ) {

		files.push( {
			key: 'missing_buildings',
			format: 'txt',
			url: data.missing_buildings,
			descriptionKey: 'download.nonreconstructeddesc',
		} );

	}
	return files;

}

function getCapabilitiesUrl( url ) {

	const separator = url.includes( '?' ) ? ( /[?&]$/.test( url ) ? '' : '&' ) : '?';
	return `${ url }${ separator }request=getcapabilities`;

}

export function getWebServiceRows( versionData = {} ) {

	const data = asRecord( versionData );
	const rows = [];
	if ( isDefinedUrl( data.WMS ) ) {

		rows.push( {
			key: 'WMS',
			label: 'WMS',
			href: getCapabilitiesUrl( data.WMS ),
			docsPath: '/delivery/webservices#wms-2d',
		} );

	}
	if ( isDefinedUrl( data.WFS ) ) {

		rows.push( {
			key: 'WFS',
			label: 'WFS',
			href: getCapabilitiesUrl( data.WFS ),
			docsPath: '/delivery/webservices#wfs-2d',
		} );

	}
	if ( isDefinedUrl( data.OGCAPI ) ) {

		rows.push( {
			key: 'OGCAPI',
			label: '3D API (experimental)',
			href: data.OGCAPI,
			docsPath: '/delivery/webservices#3dbag-api-3d',
		} );

	}

	const tilesets = getTilesetSources( data );
	const lodOptions = getLodOptions( data );
	[ 'lod12', 'lod13', 'lod22' ].forEach( key => {

		if ( lodOptions[ key ] ) {

			rows.push( {
				key: `3dtiles-${ key }`,
				label: `3D Tiles (${ lodOptions[ key ].name })`,
				href: tilesets[ key ],
				docsPath: '/delivery/webservices#3d-tiles',
			} );

		}

	} );
	return rows;

}

export function getArchivedVersions( versions = {} ) {

	if ( ! versions || typeof versions !== 'object' || Array.isArray( versions ) ) return [];
	return Object.entries( versions ).map( ( [ version, data ] ) => {

		const versionData = asRecord( data );
		return {
			version,
			metadata: isDefinedUrl( versionData.metadata ) ? versionData.metadata : null,
			gpkgDump: getGpkgDump( versionData ),
			tileIndex: isDefinedUrl( versionData.TILE_INDEX ) ? versionData.TILE_INDEX : null,
		};

	} ).filter( entry => entry.metadata || entry.gpkgDump || entry.tileIndex );

}
