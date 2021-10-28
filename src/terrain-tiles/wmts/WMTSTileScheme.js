import { Vector2 } from 'three';
import {
	TileMatrix,
	BaseTileScheme
} from '../base/TileScheme.js';
import * as X2JS from 'x2js';

export class WMTSTileScheme extends BaseTileScheme {

	constructor( url, tileMatrixSetId, onLoadTileScheme = null ) {

		super();

		this.url = url;
		this.tileMatrixSetId = tileMatrixSetId;

		const capabilitiesURL = this.url + "request=GetCapabilities&service=WMTS";

		this.fetchCapabilities( capabilitiesURL ).then( capabilities => {

			this.capabilities = capabilities;
			this.getTileMatrixSet();
			onLoadTileScheme();

		} );

	}

	fetchCapabilities( url ) {

		// Fetch WMTS capabilities and convert to JSON
		var x2js = new X2JS();

		return fetch( url )
			.then( res => res.text() )
			.then( xml => {

				return x2js.xml2js( xml );

			} );

	}

	getTileMatrixSet() {

		this.capabilities[ "Capabilities" ][ "Contents" ][ "TileMatrixSet" ].forEach( function ( tms ) {

			if ( tms[ "Identifier" ][ "__text" ] == this.tileMatrixSetId ) {

				const tileMatrices = tms[ "TileMatrix" ];
				this.tileMatrixSet = [];

				let i = 0;
				for ( const tm of tileMatrices ) {

					this.tileMatrixSet.push( this.toTileMatrix( i ++, tm ) );

				}

			}

		}, this );

	}

	toTileMatrix( level, tileMatrixData ) {

		// Calculations based on WMTS specs
		const matrixHeight = tileMatrixData[ "MatrixHeight" ];
		const matrixWidth = tileMatrixData[ "MatrixWidth" ];
		const scaleDenominator = parseFloat( tileMatrixData[ "ScaleDenominator" ] );
		const tileWidth = tileMatrixData[ "TileWidth" ];
		const tileHeight = tileMatrixData[ "TileHeight" ];
		const topLeftCornerStr = tileMatrixData[ "TopLeftCorner" ].split( " " );
		const topLeftCorner = new Vector2( parseFloat( topLeftCornerStr[ 0 ] ), parseFloat( topLeftCornerStr[ 1 ] ) );

		return new TileMatrix( level, matrixHeight, matrixWidth, scaleDenominator, tileHeight, tileWidth, topLeftCorner );

	}

}
