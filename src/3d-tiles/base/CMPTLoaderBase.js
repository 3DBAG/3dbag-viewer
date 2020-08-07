// CMPT File Format
// https://github.com/CesiumGS/3d-tiles/blob/master/specification/TileFormats/Composite/README.md

export class CMPTLoaderBase {

	constructor() {

		this.fetchOptions = {};

	}

	load( url ) {

		return fetch( url, this.fetchOptions )
			.then( res => res.arrayBuffer() )
			.then( buffer => this.parse( buffer ) );

	}

	parse( buffer ) {

		const dataView = new DataView( buffer );

		// 16-byte header

		// 4 bytes
		const magic =
			String.fromCharCode( dataView.getUint8( 0 ) ) +
			String.fromCharCode( dataView.getUint8( 1 ) ) +
			String.fromCharCode( dataView.getUint8( 2 ) ) +
			String.fromCharCode( dataView.getUint8( 3 ) );

		console.assert( magic === 'cmpt' );

		// 4 bytes
		const version = dataView.getUint32( 4, true );

		console.assert( version === 1 );

		// 4 bytes
		const byteLength = dataView.getUint32( 8, true );

		console.assert( byteLength === buffer.byteLength );

		// 4 bytes
		const tilesLength = dataView.getUint32( 12, true );

		const tiles = [];
		let offset = 16;
		for ( let i = 0; i < tilesLength; i ++ ) {

			const tileView = new DataView( buffer, offset, 12 );
			const tileMagic =
				String.fromCharCode( tileView.getUint8( 0 ) ) +
				String.fromCharCode( tileView.getUint8( 1 ) ) +
				String.fromCharCode( tileView.getUint8( 2 ) ) +
				String.fromCharCode( tileView.getUint8( 3 ) );
			const tileVersion = tileView.getUint32( 4, true );
			const byteLength = tileView.getUint32( 8, true );

			const tileBuffer = new Uint8Array( buffer, offset, byteLength );
			tiles.push( {

				type: tileMagic,
				buffer: tileBuffer,
				version: tileVersion,

			} );
			offset += byteLength;

		}

		return {
			version,
			tiles,
		};

	}

}

