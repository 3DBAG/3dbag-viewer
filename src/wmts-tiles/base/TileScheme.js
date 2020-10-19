import {
	Vector2,
	Vector3,
	Plane,
	Raycaster,
	Frustum,
	Matrix4
} from "three";

class Tile {

	constructor( tileMatrix, col, row ) {

		this.tileMatrix = tileMatrix;
		this.col = col;
		this.row = row;

	}

	getId() {

		return `${this.tileMatrix.level}-${this.row}-${this.col}`;

	}

	getCenterPosition( offset = new Vector2() ) {

		const x = this.tileMatrix.minX + this.col * this.tileMatrix.tileWidth + this.tileMatrix.tileWidth / 2 - offset.x;
		const y = this.tileMatrix.maxY - this.row * this.tileMatrix.tileHeight - this.tileMatrix.tileHeight / 2 - offset.y;

		return new Vector2( x, y );

	}

	getNeighbours() {

		var neighbours = [];

		for ( const i of [ - 1, 0, 1 ] ) {

			for ( const j of [ - 1, 0, 1 ] ) {

				if ( ! ( i == 0 && j == 0 ) ) {

				   neighbours.push( new Tile( this.tileMatrix, this.col + i, this.row + j ) );

				}

			}

		}

		return neighbours;

	}

	getExtentPoints( transform ) {

		// Calculate tile bounds and center
		var upperLeft = new Vector3();
		upperLeft.x = this.tileMatrix.minX + this.col * this.tileMatrix.tileWidth - transform.x;
		upperLeft.y = 0;
		upperLeft.z = - ( this.tileMatrix.maxY - this.row * this.tileMatrix.tileHeight - transform.y );

		var upperRight = new Vector3( upperLeft.x + this.tileMatrix.tileWidth, 0, upperLeft.z );
		var lowerLeft = new Vector3( upperLeft.x, 0, upperLeft.z + this.tileMatrix.tileHeight );
		var lowerRight = new Vector3( upperLeft.x + this.tileMatrix.tileWidth, 0, upperLeft.z + this.tileMatrix.tileHeight );
		var centre = new Vector3( upperLeft.x + this.tileMatrix.tileWidth / 2, 0, upperLeft.z + this.tileMatrix.tileHeight / 2 );

		return [ centre, lowerLeft, upperRight, upperLeft, lowerRight ];

	}

	inFrustum( frustum, transform ) {

		const positions = this.getExtentPoints( transform );

		// If any of these positions lies in frustum, tile is in view
		for ( const v of positions ) {

			if ( frustum.containsPoint( v ) ) {

				return true;

			}

		}

		return false;

	}

}

class TileMatrix {

	constructor( level, matrixHeight, matrixWidth, scaleDenominator, tileHeight, tileWidth, topLeftCorner ) {

		const pixelSpan = scaleDenominator * 0.00028;
		const tileSpanX = tileWidth * pixelSpan;
		const tileSpanY = tileHeight * pixelSpan;

		this.level = level;

		this.minX = topLeftCorner.x;
		this.maxY = topLeftCorner.y;

		this.maxX = this.minX + tileSpanX * matrixWidth;
		this.minY = this.maxY - tileSpanY * matrixHeight;

		this.tileWidth = ( this.maxX - this.minX ) / matrixWidth;
		this.tileHeight = ( this.maxY - this.minY ) / matrixHeight;
		this.pixelSpan = pixelSpan;
		this.tileSpanX = tileSpanX;
		this.tileSpanY = tileSpanY;
		this.matrixWidth = matrixWidth;
		this.matrixHeight = matrixHeight;
		this.scaleDenominator = scaleDenominator;

	}

	getTileAt( position ) {

		const col = Math.floor( ( position.x - this.minX ) / this.tileWidth );
		const row = Math.floor( this.matrixHeight - ( position.y - this.minY ) / this.tileHeight );

		return new Tile( this, col, row );

	}

}

class BaseTileScheme {

	constructor() {

		this.tileMatrixSet = [];

	}

	getTileMatrix( scale ) {

		// TODO: Make this more robust - Now it relies on a descending ordered list
		for ( const tileMatrix of this.tileMatrixSet ) {

			if ( tileMatrix.scaleDenominator < scale ) {

				return tileMatrix;

			}

		}

	}

	getTilesInView( camera, resFactor, transform ) {

		if ( this.tileMatrixSet.length == 0 ) {

			return [];

		}

		const raycaster = new Raycaster();
		raycaster.setFromCamera( { x: 0, y: 0 }, camera );

		let position = new Vector3();
		raycaster.ray.intersectPlane( new Plane( new Vector3( 0, 1, 0 ), 0 ), position );

		const dist = camera.position.distanceTo( position );

		position.x = position.x + transform.x;
		position.y = - position.z + transform.y;

		const tileMatrix = this.getTileMatrix( dist * resFactor );

		const centerTile = tileMatrix.getTileAt( position );

		const tiles = this.growRegion( centerTile, camera, transform );

		return tiles;

	}

	growRegion( centerTile, camera, transform ) {

		let visited = [ centerTile.getId() ];
		let queue = [ centerTile ];
		let tilesInView = [ centerTile ];

		let frustum = new Frustum();
		let projScreenMatrix = new Matrix4();
		projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
		frustum.setFromProjectionMatrix( new Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );

		let counter = 0;

		while ( queue.length != 0 ) {

			const tile = queue.pop();
			var neighbours = tile.getNeighbours();

			for ( const n of neighbours ) {

				// Continue if tile already visited
				if ( visited.includes( n.getId() ) ) {

					continue;

				}

				visited.push( n.getId() );

				if ( n.inFrustum( frustum, transform ) ) {

					queue.push( n );
					tilesInView.push( n );

				}

			}

			// prevent infinite loop
			counter ++;
			if ( counter == 1000 ) {

				console.log( "Too many tiles in view! Skipping at 1000..." );
				break;

			}

		}

		return ( tilesInView );

	}

}

export { Tile, TileMatrix, BaseTileScheme };
