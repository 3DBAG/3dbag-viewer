import {
	TextureLoader,
	LinearFilter,
	PlaneBufferGeometry,
	MeshBasicMaterial,
	Mesh,
	Group
} from 'three';

import {
	ResourceTracker
} from './ResourceTracker.js';

export class TilesRenderer {

	constructor() {

		this.tileLevel = 0;

		this.resFactor = 8;

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

				this.activeTiles.push( ti.getId() );

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

	getRequestURL( tile ) {

	}

	createTile( tile, transform ) {

		var geometry = this.track( new PlaneBufferGeometry( tile.tileMatrix.tileSpanX, tile.tileMatrix.tileSpanY ) );

		var mesh = new Mesh( geometry, this.tempMaterial );
		this.group.add( mesh );

		var loader = new TextureLoader();

		const requestURL = this.getRequestURL( tile );

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

	}

}
