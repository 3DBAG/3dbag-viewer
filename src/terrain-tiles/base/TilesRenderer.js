import {
	Texture,
	NearestFilter,
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
		this.activeTiles = new Set();
		this.downloadQueue = new Map();

		this.tilesInView = null;

		this.group = new Group();
		this.resourceTracker = new ResourceTracker();
		this.track = this.resourceTracker.track.bind( this.resourceTracker );

		this.onLoadTile = null;

		this.tempMaterial = new MeshBasicMaterial( { color: 0xFFFFFF } );

	}

	update( sceneCenter, camera ) {

		// Get indices of all tiles that are in view
		const tiles = this.tileScheme.getTilesInView( camera, this.resFactor, sceneCenter );
		this.tilesInView = tiles;

		// check if we just changed tileLevel
		if ( tiles.length && tiles[ 0 ].tileMatrix.level != this.tileLevel ) {

			this.cleanTiles();
			this.tileLevel = tiles[ 0 ].tileMatrix.level;

		} else {

			// Cancel pending tile downloads that are not in view anymore
			setTimeout( () => {

				var tidsInView = new Set();
				this.tilesInView.forEach( function ( ti ) {

					tidsInView.add( ti.getId() );

				} );

				for ( let [ tid, abortCtrl ] of this.downloadQueue.entries() ) {

					if ( ! tidsInView.has( tid ) ) {

						abortCtrl.abort();

					}

				}

			} );

		}

		// Create tiles that hadn't been created yet
		tiles.forEach( function ( ti ) {

			const tileId = ti.getId();

			if ( ! this.activeTiles.has( tileId ) ) {

				this.activeTiles.add( tileId );

				this.createTile( ti, sceneCenter );

			}

		}, this );


	}

	cleanTiles() {

		while ( this.group.children.length ) {

			this.group.remove( this.group.children[ 0 ] );

		}

		this.resourceTracker.dispose();

		this.activeTiles.clear();

		for ( let abortCtrl of this.downloadQueue.values() ) {

			abortCtrl.abort();

		}

		this.downloadQueue.clear();

	}

	getRequestURL( tile ) {

	}

	createTile( tile, transform ) {

		var geometry = this.track( new PlaneBufferGeometry( tile.tileMatrix.tileSpanX, tile.tileMatrix.tileSpanY ) );

		var mesh = new Mesh( geometry, this.tempMaterial );
		this.group.add( mesh );

		const requestURL = this.getRequestURL( tile );

		const scope = this;
		const tileId = tile.getId();
		var controller = new AbortController();
		var signal = controller.signal;
		this.downloadQueue.set( tileId, controller );
		fetch( requestURL, { signal } ).then( function ( res ) {

			scope.downloadQueue.delete( tileId );
			return res.blob();

		} ).then( function ( blob ) {

			return createImageBitmap( blob, { premultiplyAlpha: 'none', imageOrientation: 'flipY' } );

		} ).then( function ( imageBitmap ) {

			const tex = new Texture( imageBitmap );
			tex.magFilter = NearestFilter;
			tex.minFilter = NearestFilter;
			tex.generateMipmaps = false;
			tex.needsUpdate = tsrue;

			var material = new MeshBasicMaterial( { map: scope.track( tex ) } );
			mesh.material = material;
			scope.onLoadTile();

		} ).catch( function ( e ) {

			// we end up here if abort() is called on the Abortcontroller attached to this tile
			scope.downloadQueue.delete( tileId );
			scope.activeTiles.delete( tileId );

		} );

		const scenePosition = tile.getCenterPosition( transform );

		mesh.position.x = scenePosition.x;
		mesh.position.y = scenePosition.y;
		mesh.updateMatrix();

	}

}
