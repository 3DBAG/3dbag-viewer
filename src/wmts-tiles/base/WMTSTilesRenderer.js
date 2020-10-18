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
	Matrix4,
	SphereGeometry
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

		this.capabilitiesURL = this.url + "request=GetCapabilities&service=WMTS";
		this.tileMatrixLevels = null;
		this.activeTiles = [];

		this.wmtsOptions = wmtsOptions;
		this.wmtsOptions.tileMatrix = this.tileMatrix;

		this.group = new Group();
		this.resourceTracker = new ResourceTracker();
		this.track = this.resourceTracker.track.bind( this.resourceTracker );

		this.onLoadTile = null;

		// for debugging
		this.gridCreated = false;

		this.fetchCapabilities( this.capabilitiesURL ).then( capabilities => {

			console.log( capabilities );

			this.capabilities = capabilities;
			this.setTileMatrixLayer();

		} );


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

	createGrid( tileMatrixMinX, tileMatrixMaxX, tileMatrixMinY, tileMatrixMaxY, xWidth, yWidth, matrixWidth, matrixHeight, sceneCenter ) {

		// For debugging: create spheres at centers of tiles

		for ( var i = 120; i < 130; i ++ ) {

			for ( var j = 120; j < 130; j ++ ) {

				var scenePosition = new Vector2();
				scenePosition.x = tileMatrixMinX + i * xWidth + xWidth / 2 - sceneCenter.x;
				scenePosition.y = tileMatrixMaxY - j * yWidth - yWidth / 2 - sceneCenter.y;

				var geometry = new SphereGeometry( 100, 100, 100 );
				var material = new MeshBasicMaterial( { color: 0xffff00 } );
				var sphere = new Mesh( geometry, material );

				this.group.add( sphere );

				sphere.position.x = scenePosition.x;
				sphere.position.y = scenePosition.y;

				sphere.updateMatrix();

			}

		}

		this.gridCreated = true;

	}

	update( cameraInfo, sceneCenter, camera ) {

		if ( typeof this.tileMatrixLayer == "undefined" ) {

			return;

		}

		// todo: determine which tile level you want to load (which should depend on the SSE?)
		var tileLayer = this.tileMatrixLayer[ this.tileLevel ];

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

		// Calculate index of tile that is in the middle of the screen
		var position = cameraInfo[ 0 ][ "position" ];
		var xTile = Math.floor( ( position.x - tileMatrixMinX ) / xWidth );
		var yTile = Math.floor( matrixHeight - ( position.y - tileMatrixMinY ) / yWidth );

		var tileIndex = [ xTile, yTile ];

		// Get indices of all tiles that are in view
		var tiles = this.grow_region( tileIndex, camera, tileMatrixMinX, tileMatrixMaxY, xWidth, yWidth, sceneCenter );

		// Create tiles that hadn't been created yet
		tiles.forEach( function ( ti ) {

			if ( JSON.stringify( this.activeTiles ).indexOf( JSON.stringify( ti ) ) == - 1 ) {

				var scenePosition = new Vector2();
				scenePosition.x = tileMatrixMinX + ti[ 0 ] * xWidth + xWidth / 2 - sceneCenter.x;
				scenePosition.y = tileMatrixMaxY - ti[ 1 ] * yWidth - yWidth / 2 - sceneCenter.y;

				this.create_tile( ti, tileSpanX, tileSpanY, scenePosition );

			}

		}, this );


	}

	get_tile_neighbours( tileIndex ) {

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

	get_extent_points( n, tileMatrixMinX, tileMatrixMaxY, xWidth, yWidth, sceneCenter ) {

		// Calculate tile bounds and center
		var upperLeft = new Vector3();
		upperLeft.x = tileMatrixMinX + n[ 0 ] * xWidth - sceneCenter.x;
		upperLeft.y = 0;
		upperLeft.z = - ( tileMatrixMaxY - n[ 1 ] * yWidth - sceneCenter.y );

		var upperRight = new Vector3( upperLeft.x + xWidth, 0, upperLeft.z );
		var lowerLeft = new Vector3( upperLeft.x, 0, upperLeft.z + yWidth );
		var lowerRight = new Vector3( upperLeft.x + xWidth, 0, upperLeft.z + yWidth );
		var centre = new Vector3( upperLeft.x + xWidth / 2, 0, upperLeft.z + yWidth / 2 );

		return [ centre, lowerLeft, upperRight, upperLeft, lowerRight ];

	}

	grow_region( tileIndex, camera, tileMatrixMinX, tileMatrixMaxY, xWidth, yWidth, sceneCenter ) {

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
			var neighbours = this.get_tile_neighbours( index );

			for ( const n of neighbours ) {

				// Continue if tile already visited
				if ( JSON.stringify( visited ).indexOf( n ) != - 1 ) {

					continue;

				}

				visited.push( n );

				const positions = this.get_extent_points( n, tileMatrixMinX, tileMatrixMaxY, xWidth, yWidth, sceneCenter );

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



	create_tile( tileIndex, tileSpanX, tileSpanY, scenePosition ) {

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

		var loader = new TextureLoader();

		var diffuseMap = loader.load( requestURL, this.onLoadTile );
		diffuseMap.minFilter = LinearFilter;
		diffuseMap.generateMipmaps = false;

		var geometry = this.track( new PlaneBufferGeometry( tileSpanX, tileSpanY ) );
		var material = new MeshBasicMaterial( { map: this.track( diffuseMap ) } );

		var mesh = new Mesh( geometry, material );
		this.group.add( mesh );

		mesh.position.x = scenePosition.x;
		mesh.position.y = scenePosition.y;
		mesh.updateMatrix();

		this.activeTiles.push( tileIndex );

	}

}
