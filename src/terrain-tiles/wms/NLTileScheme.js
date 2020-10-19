import { Vector2 } from 'three';
import {
	TileMatrix,
	BaseTileScheme
} from '../base/TileScheme.js';

export class NLTileScheme extends BaseTileScheme {

	constructor() {

		super();

		this.tileMatrixSet = [];

		let i = 0;
		for ( let scale = 12288000.0; scale >= 750.0; scale /= 2 ) {

			const topLeftCorner = new Vector2( - 285401.92, 903401.92 );
			const width = ( i + 1 ) * 2;

			const tileMatrix = new TileMatrix( i ++, width, width, scale, 256, 256, topLeftCorner );

			this.tileMatrixSet.push( tileMatrix );

		}

	}

}
