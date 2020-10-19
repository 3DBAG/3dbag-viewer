import {
	TextureLoader,
	LinearFilter,
	PlaneBufferGeometry,
	MeshBasicMaterial,
	Mesh,
	Group,
	Vector3,
	Frustum,
	Matrix4, Raycaster, Plane
} from 'three';
import {
	ResourceTracker
} from './ResourceTracker.js';
import {
	Tile,
	TileMatrix
} from './TileScheme.js';
import {
	WMTSTileScheme
} from '../wmts/WMTSTileScheme.js';

export class WMTSTilesRenderer {

	constructor( wmtsOptions ) {

		this.format = wmtsOptions.format;
		this.request = wmtsOptions.request;
		this.service = wmtsOptions.service;
		this.tileMatrixSet = wmtsOptions.tileMatrixSet;
		this.url = wmtsOptions.url;

		this.wmtsOptions = wmtsOptions;

		this.tileLevel = 0;

		this.resFactor = 25;

		this.tileScheme = new WMTSTileScheme( this.url, this.tileMatrixSet );

		this.tileMatrixLevels = null;
		this.activeTiles = [];

		this.group = new Group();
		this.resourceTracker = new ResourceTracker();
		this.track = this.resourceTracker.track.bind( this.resourceTracker );

		this.onLoadTile = null;

		this.tempMaterial = new MeshBasicMaterial( { color: 0xFFFFFF } );

	}

	update( sceneCenter, camera ) {

		// Get indices of all tiles that are in view
		var tiles = this.tileScheme.getTilesInView( camera, this.resFactor, sceneCenter );

		if ( tiles.length && tiles[ 0 ].tileMatrix.level != this.tileLevel ) {

			this.cleanTiles();
			this.tileLevel = tiles[ 0 ].tileMatrix.level;

		}

		// Create tiles that hadn't been created yet
		tiles.forEach( function ( ti ) {

			if ( ! this.activeTiles.includes( ti.getId() ) ) {

				this.createTile( ti, sceneCenter );

			}

		}, this );


	}

	cleanTiles() {

		while ( this.group.children.length ) {

			this.group.remove( this.group.children[ 0 ] );

		}

		this.resourceTracker.dispose();

		this.activeTiles = [];

	}

	createTile( tile, transform ) {

		var requestURL = this.url;

		for ( const [ k, v ] of Object.entries( this.wmtsOptions ) ) {

			if ( k != Object.keys( this.wmtsOptions )[ 0 ] ) {

				requestURL += "&";

			}
			requestURL += k + "=" + v;

		}

		requestURL += "&TileCol=" + tile.col.toString();
		requestURL += "&TileRow=" + tile.row.toString();
		requestURL += "&tileMatrix=" + tile.tileMatrix.level.toString();

		//console.log(requestURL);

		var geometry = this.track( new PlaneBufferGeometry( tile.tileMatrix.tileSpanX, tile.tileMatrix.tileSpanY ) );

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

		const scenePosition = tile.getCenterPosition( transform );

		mesh.position.x = scenePosition.x;
		mesh.position.y = scenePosition.y;
		mesh.updateMatrix();

		this.activeTiles.push( tile.getId() );

	}

}
