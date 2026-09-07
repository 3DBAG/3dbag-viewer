import { getViewerSelection, getViewerQuery } from '@/utils/viewerRoute';

const basemaps = { standaard: {}, grijs: {}, luchtfoto: {}, openfreemap: {} };
const lods = { lod22: {}, lod13: {} };
const resolve = query => getViewerSelection( query, basemaps, lods, 'openfreemap', 'lod22' );

describe( 'viewer URL selections', () => {

	it( 'restores both selections and uses manifest defaults when parameters disappear', () => {

		expect( resolve( { basemap: 'luchtfoto', lod: 'lod13' } ) ).toEqual( { basemap: 'luchtfoto', lod: 'lod13' } );
		expect( resolve( {} ) ).toEqual( { basemap: 'openfreemap', lod: 'lod22' } );

	} );

	it( 'rejects unsupported selections, unavailable LoDs, repeated parameters and inherited keys', () => {

		for ( const query of [
			{ basemap: 'unknown', lod: 'lod12' },
			{ basemap: [ 'luchtfoto' ], lod: [ 'lod13' ] },
			{ basemap: 'constructor', lod: 'toString' },
			{ basemap: null, lod: null }
		] ) {

			expect( resolve( query ) ).toEqual( { basemap: 'openfreemap', lod: 'lod22' } );

		}

	} );

	it( 'preserves camera and other parameters and writes explicit defaults', () => {

		const query = { rdx: '123', rdy: '456', ox: '1', oy: '2', oz: '3', placeMarker: 'true' };
		const updated = getViewerQuery( query, resolve( query ) );
		expect( updated ).toEqual( { ...query, basemap: 'openfreemap', lod: 'lod22' } );
		expect( query.basemap ).toBeUndefined();
		expect( getViewerQuery( updated, resolve( updated ) ) ).toEqual( updated );

	} );

	it( 'omits LoD when the manifest has no supported tileset', () => {

		const selection = getViewerSelection( { lod: 'lod13' }, basemaps, {}, 'standaard', null );
		expect( getViewerQuery( { lod: 'lod13' }, selection ) ).toEqual( { basemap: 'standaard' } );

	} );

} );
