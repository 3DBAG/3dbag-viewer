import {
	Vector2,
	Vector3,
	Plane,
	Raycaster,
	Sphere
} from 'three';

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

		const x = this.tileMatrix.minX + this.col * this.tileMatrix.tileSpanX + this.tileMatrix.tileSpanX / 2 - offset.x;
		const y = this.tileMatrix.maxY - this.row * this.tileMatrix.tileSpanY - this.tileMatrix.tileSpanY / 2 - offset.y;

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
		upperLeft.x = this.tileMatrix.minX + this.col * this.tileMatrix.tileSpanX - transform.x;
		upperLeft.y = this.tileMatrix.maxY - this.row * this.tileMatrix.tileSpanY - transform.y;
		upperLeft.z = 0;

		var upperRight = new Vector3( upperLeft.x + this.tileMatrix.tileSpanX, upperLeft.y, 0 );
		var lowerLeft = new Vector3( upperLeft.x, upperLeft.y - this.tileMatrix.tileSpanY, 0 );
		var lowerRight = new Vector3( upperLeft.x + this.tileMatrix.tileSpanX, upperLeft.y - this.tileMatrix.tileSpanY, 0 );
		var centre = new Vector3( upperLeft.x + this.tileMatrix.tileSpanX / 2, upperLeft.y + this.tileMatrix.tileSpanY / 2, 0 );

		return [ centre, lowerLeft, upperRight, upperLeft, lowerRight ];

	}

	getWkt() {

		var points = this.getExtentPoints( new Vector2( 0, 0 ) );
		return `POLYGON ( ( ${points[ 1 ].x} ${points[ 1 ].y}, ${points[ 3 ].x} ${points[ 3 ].y}, ${points[ 2 ].x} ${points[ 2 ].y}, ${points[ 4 ].x} ${points[ 4 ].y}, ${points[ 1 ].x} ${points[ 1 ].y} ) ) \n`;

	}

	getBoundingBox() {

		// Calculate tile bounds and center
		const minX = this.tileMatrix.minX + this.col * this.tileMatrix.tileSpanX;
		const maxY = this.tileMatrix.maxY - this.row * this.tileMatrix.tileSpanY;
		const maxX = minX + this.tileMatrix.tileSpanX;
		const minY = maxY - this.tileMatrix.tileSpanY;

		return [ minX, minY, maxX, maxY ];

	}

	getBoundingSphere( transform ) {

		const center = this.getCenterPosition( transform );

		return new Sphere( new Vector3( center.x, 0, - center.y ), Math.max( this.tileMatrix.tileSpanX, this.tileMatrix.tileSpanY ) );

	}

	inFrustum( frustum, transform ) {

		const sphere = this.getBoundingSphere( transform );

		return frustum.intersectsSphere( sphere );

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

		this.tileWidth = tileWidth;
		this.tileHeight = tileHeight;
		this.pixelSpan = pixelSpan;
		this.tileSpanX = tileSpanX;
		this.tileSpanY = tileSpanY;
		this.matrixWidth = matrixWidth;
		this.matrixHeight = matrixHeight;
		this.scaleDenominator = scaleDenominator;

	}

	getTileAt( position ) {

		const col = Math.floor( ( position.x - this.minX ) / this.tileSpanX );
		const row = Math.floor( this.matrixHeight - ( position.y - this.minY ) / this.tileSpanX );

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

		return this.tileMatrixSet[ this.tileMatrixSet.length - 1 ];

	}

	createGrid( dimension ) {

		var grid = [];
		for ( let i = 0; i < dimension; i ++ ) {

			grid.push( [] );

			for ( let j = 0; j < dimension; j ++ ) {

				grid[ i ].push( 0 );

			}

		}

		return grid;

	}

	createQuadtree( centerTile, distThreshold, n ) {

		var quadtree = [];

		const dist = distThreshold * n;

		const rootTileMatrix = this.tileMatrixSet[ centerTile.tileMatrix.level - n ];

		const centerPosition = centerTile.getCenterPosition();

		const rootCenterTile = rootTileMatrix.getTileAt( centerPosition );

		quadtree.push( rootCenterTile );

		const neighbours = rootCenterTile.getNeighbours();

		for ( let i = 0; i < neighbours.length; i ++ ) {

			quadtree.push( neighbours[ i ] );

		}

		return quadtree;

	}

	traverseNode( node, n, distThreshold, qtLevels, tiles, center ) {

		const dist = center.distanceTo( node.getCenterPosition() );

		if ( n != qtLevels && dist < distThreshold * ( qtLevels - n ) * 2 ) {

			var children = [];
			var higherTileLevel = this.tileMatrixSet[ node.tileMatrix.level + 1 ];
			var topLeft = new Tile( higherTileLevel, node.col * 2, node.row * 2 );
			var topRight = new Tile( higherTileLevel, topLeft.col + 1, topLeft.row );
			var bottomLeft = new Tile( higherTileLevel, topLeft.col, topLeft.row + 1 );
			var bottomRight = new Tile( higherTileLevel, topLeft.col + 1, topLeft.row + 1 );

			children.push( topLeft );
			children.push( topRight );
			children.push( bottomLeft );
			children.push( bottomRight );

			for ( let i = 0; i < children.length; i ++ ) {

				this.traverseNode( children[ i ], n + 1, distThreshold, qtLevels, tiles, center )

			}


		} else {

			tiles.push( node );

		}

	}

	traverseQuadtree( root, distThreshold, qtLevels, tiles, center ) {

		for ( let i = 0; i < root.length; i ++ ) {

			this.traverseNode( root[ i ], 0, distThreshold, qtLevels, tiles, center );

		}

	}

	getTilesInView( camera, controls, resFactor, transform ) {

		if ( this.tileMatrixSet.length == 0 ) {

			return [];

		}

		var raycastY = 0 - ( controls.getPolarAngle() / ( Math.PI / 2 ) * 0.25 );

		const raycaster = new Raycaster();
		raycaster.setFromCamera( { x: 0, y: raycastY }, camera );

		let position = new Vector3();
		raycaster.ray.intersectPlane( new Plane( new Vector3( 0, 1, 0 ), 0 ), position );

		const dist = camera.position.distanceTo( position );

		const tilePosition = position.clone();

		tilePosition.x = position.x + transform.x;
		tilePosition.y = - position.z + transform.y;

		// const angle = controls.getPolarAngle();
		// var multiplier = 1;

		// if ( angle > Math.PI / 4 ) {

		// 	multiplier = ( Math.PI - angle ) / Math.PI;

		// }

		const tileMatrix = this.getTileMatrix( dist * resFactor );

		const centerTile = tileMatrix.getTileAt( tilePosition );

		position.set( position.x + transform.x, - position.z + transform.y, position.y + transform.z );

		const qtLevels = 4;
		const distThreshold = centerTile.tileMatrix.tileSpanX * 5;
		const root = this.createQuadtree( centerTile, distThreshold, qtLevels );

		var tiles = [];
		this.traverseQuadtree( root, distThreshold, qtLevels, tiles, centerTile.getCenterPosition() );

		return tiles;

	}

}

export { Tile, TileMatrix, BaseTileScheme };
