import {
	Vector2,
	Vector3,
	Plane,
	Raycaster,
	Frustum,
	Matrix4,
	Sphere,
	MeshBasicMaterial,
	Mesh,
	PlaneBufferGeometry
} from 'three';

class Tile {

	constructor( tileMatrix, col, row ) {

		this.tileMatrix = tileMatrix;
		this.col = col;
		this.row = row;
		this.id = `${this.tileMatrix.level}-${this.row}-${this.col}`;

	}

	getCenterPosition( offset = new Vector3() ) {

		const x = this.tileMatrix.minX + this.col * this.tileMatrix.tileSpanX + this.tileMatrix.tileSpanX / 2 - offset.x;
		const y = this.tileMatrix.maxY - this.row * this.tileMatrix.tileSpanY - this.tileMatrix.tileSpanY / 2 - offset.y;
		const z = - offset.z;

		return new Vector3( x, y, z );

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

	withinMatrix() {

		const width = parseInt( this.tileMatrix.matrixWidth );
		const height = parseInt( this.tileMatrix.matrixHeight );
		return this.col >= 0 && this.col < width && this.row >= 0 && this.row < height;

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

	createBackgroundPlane() {

		const tileSpanX = this.tileMatrixSet[ 0 ].tileSpanX;
		const tileSpanY = this.tileMatrixSet[ 0 ].tileSpanY;

		const geometry = new PlaneBufferGeometry( tileSpanX, tileSpanY );
		const material = new MeshBasicMaterial( { color: 0xffffff } );
		material.depthWrite = false;
		const plane = new Mesh( geometry, material );
		plane.position.setComponent( 2, - 1 );
		plane.name = "backgroundPlane";
		return plane;

	}

	getTilesInView( camera, controls, resFactor, transform ) {

		if ( this.tileMatrixSet.length == 0 ) {

			return { "level": undefined, "tiles": [] };

		}

		var raycastY = 0 - ( controls.getPolarAngle() / ( Math.PI / 2 ) * 0.25 );
		const raycaster = new Raycaster();
		raycaster.setFromCamera( { x: 0, y: raycastY }, camera );

		const dist = camera.position.distanceTo( controls.target );
		var tileMatrix = this.getTileMatrix( dist * resFactor );

		var position = new Vector3();
		raycaster.ray.intersectPlane( new Plane( new Vector3( 0, 1, 0 ), 0 ), position );
		const tilePosition = position.clone();
		tilePosition.x = position.x + transform.x;
		tilePosition.y = - position.z + transform.y;

		const centerTile = tileMatrix.getTileAt( tilePosition );

		position.set( position.x + transform.x, - position.z + transform.y, position.y + transform.z );

		const distThreshold = centerTile.tileMatrix.tileSpanX * 10;
		const tiles = this.growRegion( centerTile, camera, transform, position, distThreshold );

		return tiles;

	}

	growRegion( centerTile, camera, transform, cameraCenter, distThreshold ) {

		let visited = new Set( centerTile.id );
		let queue = [ centerTile ];
		let tilesInView = {};
		if ( centerTile.withinMatrix )
			tilesInView[ centerTile.id ] = centerTile;

		let frustum = new Frustum();
		let projScreenMatrix = new Matrix4();
		projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
		frustum.setFromProjectionMatrix( new Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );

		let counter = 0;

		while ( queue.length != 0 ) {

			const tile = queue.pop();
			var neighbours = tile.getNeighbours();

			for ( var n of neighbours ) {

				// Continue if tile already visited
				if ( visited.has( n.id ) ) {

					continue;

				}

				visited.add( n.id );

				const dist = cameraCenter.distanceTo( n.getCenterPosition() );

				if ( dist < distThreshold ) {

					queue.push( n );
					if ( n.withinMatrix() )
						tilesInView[ n.id ] = n;

				} else if ( dist < distThreshold * 3 ) {

					if ( n.tileMatrix.level == centerTile.tileMatrix.level && n.tileMatrix.level >= 2 ) {

						const lowerTileLevel = this.tileMatrixSet[ n.tileMatrix.level - 2 ];
						n = new Tile( lowerTileLevel, Math.floor( n.col / 4 ), Math.floor( n.row / 4 ) );

					}
					queue.push( n );
					visited.add( n.id );
					if ( n.withinMatrix() )
						tilesInView[ n.id ] = n;

				}

			}

			// prevent infinite loop
			counter ++;
			if ( counter == 1000 ) {

				console.log( "Too many tiles in view! Skipping at 1000..." );
				break;

			}

		}

		return ( { "level": centerTile.tileMatrix.level, "tiles": tilesInView } );

	}

}

export { Tile, TileMatrix, BaseTileScheme };
