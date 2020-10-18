import {
	TextureLoader,
	LinearFilter,
	PlaneBufferGeometry,
	MeshBasicMaterial,
	Mesh,
	Group,
	Vector2,
	Vector3,
	Frustum,
	Matrix4, Raycaster, Plane
} from 'three';
import {
	ResourceTracker
} from './ResourceTracker.js';
import * as X2JS from 'x2js';

export class WMTSTilesRenderer {

	constructor( wmtsOptions ) {

		this.format = wmtsOptions.format;
		this.request = wmtsOptions.request;
		this.service = wmtsOptions.service;
		this.tileMatrixSet = wmtsOptions.tileMatrixSet;
		this.url = wmtsOptions.url;
		this.tileLevel = 8;
		this.tileMatrix = wmtsOptions.tileMatrix + ":" + this.tileLevel;

		this.resFactor = 25;

		this.capabilitiesURL = this.url + "request=GetCapabilities&service=WMTS";
		this.tileMatrixLevels = null;
		this.activeTiles = [];

		this.wmtsOptions = wmtsOptions;
		this.wmtsOptions.tileMatrix = this.tileMatrix;

		this.group = new Group();
		this.resourceTracker = new ResourceTracker();
		this.track = this.resourceTracker.track.bind( this.resourceTracker );

		this.onLoadTile = null;

		this.fetchCapabilities( this.capabilitiesURL ).then( capabilities => {

			console.log( capabilities );

			this.capabilities = capabilities;
			this.setTileMatrixLayer();

		} );

		this.tempMaterial = new MeshBasicMaterial( { color: 0xFFFFFF } );

	}

	setTileMatrixLayer() {

		var tileMatrixSetCRS = this.tileMatrixSet;

		this.capabilities[ "Capabilities" ][ "Contents" ][ "TileMatrixSet" ].forEach( function ( tm, i ) {

			if ( tm[ "Identifier" ][ "__text" ] == tileMatrixSetCRS ) {

				this.tileMatrixLayer = tm[ "TileMatrix" ];

			}

		}, this );

		this.tileMatrixLevels = this.tileMatrix.length;

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

	getTileMatrixParams( tileLayer ) {

		// Calculations based on WMTS specs
		var matrixHeight = tileLayer[ "MatrixHeight" ];
		var matrixWidth = tileLayer[ "MatrixWidth" ];
		var scaleDenominator = tileLayer[ "ScaleDenominator" ];
		var tileWidth = tileLayer[ "TileWidth" ];
		var tileHeight = tileLayer[ "TileHeight" ];
		var topLeftCorner = tileLayer[ "TopLeftCorner" ].split( " " );
		var tileMatrixMinX = parseFloat( topLeftCorner[ 0 ] );
		var tileMatrixMaxY = parseFloat( topLeftCorner[ 1 ] );

		var pixelSpan = scaleDenominator * 0.00028;
		var tileSpanX = tileWidth * pixelSpan;
		var tileSpanY = tileHeight * pixelSpan;
		var tileMatrixMaxX = tileMatrixMinX + tileSpanX * matrixWidth;
		var tileMatrixMinY = tileMatrixMaxY - tileSpanY * matrixHeight;

		var xWidth = ( tileMatrixMaxX - tileMatrixMinX ) / matrixWidth;
		var yWidth = ( tileMatrixMaxY - tileMatrixMinY ) / matrixHeight;

		return {

			minX: tileMatrixMinX,
			maxX: tileMatrixMaxX,
			minY: tileMatrixMinY,
			maxY: tileMatrixMaxY,
			tileWidth: xWidth,
			tileHeight: yWidth,
			pixelSpan: pixelSpan,
			tileSpanX: tileSpanX,
			tileSpanY: tileSpanY,
			matrixWidth: matrixWidth,
			matrixHeight: matrixHeight

		};

	}

	getTileFromPosition( position, tileMatrixParams ) {

		const xTile = Math.floor( ( position.x - tileMatrixParams.minX ) / tileMatrixParams.tileWidth );
		const yTile = Math.floor( tileMatrixParams.matrixHeight - ( position.y - tileMatrixParams.minY ) / tileMatrixParams.tileHeight );

		return [ xTile, yTile ];

	}

	getTilePositionFromIndex( tileIndex, tileMatrixParams, offset ) {

		let scenePosition = new Vector2();
		scenePosition.x = tileMatrixParams.minX + tileIndex[ 0 ] * tileMatrixParams.tileWidth + tileMatrixParams.tileWidth / 2 - offset.x;
		scenePosition.y = tileMatrixParams.maxY - tileIndex[ 1 ] * tileMatrixParams.tileHeight - tileMatrixParams.tileHeight / 2 - offset.y;

		return scenePosition;

	}

	update( sceneCenter, camera ) {

		if ( typeof this.tileMatrixLayer == "undefined" ) {

			return;

		}

		const raycaster = new Raycaster();
		raycaster.setFromCamera( { x: 0, y: 0 }, camera );
		let position = new Vector3();
		raycaster.ray.intersectPlane( new Plane( new Vector3( 0, 1, 0 ), 0 ), position );

		const dist = camera.position.distanceTo( position );

		position.x = position.x + sceneCenter.x;
		position.y = - position.z + sceneCenter.y;

		let new_level = 0;
		for ( let i = 0; i < this.tileMatrixLayer.length; i ++ ) {

			if ( this.tileMatrixLayer[ i ][ "ScaleDenominator" ] < dist * this.resFactor ) {

				new_level = i;
				break;

			}

		}

		if ( new_level != this.tileLevel ) {

			this.cleanTiles();
			this.tileLevel = new_level;

			this.wmtsOptions.tileMatrix = this.wmtsOptions.tileMatrix + ":" + this.tileLevel;

		}

		// todo: determine which tile level you want to load (which should depend on the SSE?)
		const tileLayer = this.tileMatrixLayer[ this.tileLevel ];

		const tileLayerParams = this.getTileMatrixParams( tileLayer );

		const tileIndex = this.getTileFromPosition( position, tileLayerParams );

		// Get indices of all tiles that are in view
		var tiles = this.growRegion( tileIndex, camera, tileLayerParams, sceneCenter );

		// Create tiles that hadn't been created yet
		tiles.forEach( function ( ti ) {

			if ( JSON.stringify( this.activeTiles ).indexOf( JSON.stringify( ti ) ) == - 1 ) {

				const scenePosition = this.getTilePositionFromIndex( ti, tileLayerParams, sceneCenter );

				this.createTile( ti, tileLayerParams.tileSpanX, tileLayerParams.tileSpanY, scenePosition );

			}

		}, this );


	}

	getTileNeighbours( tileIndex ) {

		// var neighbours = {};
		// var directions = ["nw", "w", "sw", "n", "c", "s", "ne", "e", "se"];
		var neighbours = [];

		[ - 1, 0, 1 ].forEach( function ( i ) {

			[ - 1, 0, 1 ].forEach( function ( j ) {

				if ( ! ( i == 0 && j == 0 ) ) {

				   //  var dir = directions[i_i*3 + j_i]

				   //  neighbours[dir] = [tileIndex[0] + i, tileIndex[1] + j];
				   neighbours.push( [ tileIndex[ 0 ] + i, tileIndex[ 1 ] + j ] );

				}

			} );

		} );

		return neighbours;

	}

	getExtentPoints( tileIndex, tileLayerParams, sceneCenter ) {

		// Calculate tile bounds and center
		var upperLeft = new Vector3();
		upperLeft.x = tileLayerParams.minX + tileIndex[ 0 ] * tileLayerParams.tileWidth - sceneCenter.x;
		upperLeft.y = 0;
		upperLeft.z = - ( tileLayerParams.maxY - tileIndex[ 1 ] * tileLayerParams.tileHeight - sceneCenter.y );

		var upperRight = new Vector3( upperLeft.x + tileLayerParams.tileWidth, 0, upperLeft.z );
		var lowerLeft = new Vector3( upperLeft.x, 0, upperLeft.z + tileLayerParams.tileHeight );
		var lowerRight = new Vector3( upperLeft.x + tileLayerParams.tileWidth, 0, upperLeft.z + tileLayerParams.tileHeight );
		var centre = new Vector3( upperLeft.x + tileLayerParams.tileWidth / 2, 0, upperLeft.z + tileLayerParams.tileHeight / 2 );

		return [ centre, lowerLeft, upperRight, upperLeft, lowerRight ];

	}

	growRegion( tileIndex, camera, tileLayerParams, sceneCenter ) {

		var frustum = new Frustum();
		var projScreenMatrix = new Matrix4();
		projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
		frustum.setFromProjectionMatrix( new Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );

		var visited = [ tileIndex ];
		var queue = [ tileIndex ];
		var tilesInView = [ tileIndex ];

		var test = 0;

		while ( queue.length != 0 ) {

			var index = queue.pop();
			var neighbours = this.getTileNeighbours( index );

			for ( const n of neighbours ) {

				// Continue if tile already visited
				if ( JSON.stringify( visited ).indexOf( n ) != - 1 ) {

					continue;

				}

				visited.push( n );

				const positions = this.getExtentPoints( n, tileLayerParams, sceneCenter );

				// If any of these positions lies in frustum, tile is in view
				for ( const v of positions ) {

					if ( frustum.containsPoint( v ) ) {

						queue.push( n );
						tilesInView.push( n );

						break;

					}

				}

			}

			// prevent infinite loop
			test += 1;
			if ( test == 1000 ) {

				console.log( "break" );
				break;

			}

		}

		return ( tilesInView );

	}

	cleanTiles() {

		while ( this.group.children.length ) {

			this.group.remove( this.group.children[ 0 ] );

		}

		this.resourceTracker.dispose();

		this.activeTiles = [];

	}

	createTile( tileIndex, tileSpanX, tileSpanY, scenePosition ) {

		var requestURL = this.url;

		for ( const [ k, v ] of Object.entries( this.wmtsOptions ) ) {

			if ( k != Object.keys( this.wmtsOptions )[ 0 ] ) {

				requestURL += "&";

			}
			requestURL += k + "=" + v;

		}

		requestURL += "&TileCol=" + tileIndex[ 0 ].toString();
		requestURL += "&TileRow=" + tileIndex[ 1 ].toString();

		//console.log(requestURL);

		var geometry = this.track( new PlaneBufferGeometry( tileSpanX, tileSpanY ) );

		var mesh = new Mesh( geometry, this.tempMaterial );
		this.group.add( mesh );

		var loader = new TextureLoader();

		loader.load( requestURL, ( tex ) => {

			tex.minFilter = LinearFilter;
			tex.generateMipmaps = false;
			var material = new MeshBasicMaterial( { map: this.track( tex ) } );
			mesh.material = material;
			this.onLoadTile();

		} );

		mesh.position.x = scenePosition.x;
		mesh.position.y = scenePosition.y;
		mesh.updateMatrix();

		this.activeTiles.push( tileIndex );

	}

}
