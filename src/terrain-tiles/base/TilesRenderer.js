import {
	Texture,
	PlaneBufferGeometry,
	MeshBasicMaterial,
	Mesh,
	Group,
	RGBFormat,
	LinearFilter
} from 'three';

import {
	ResourceTracker
} from './ResourceTracker.js';

import {
	arrayBuffer2Base64
} from './ArrayBuffer2Base64.js';

export class TilesRenderer {

	constructor() {

		this.tileLevel = -1;

		this.resFactor = 4.5;

		this.tileMatrixLevels = null;
		this.activeTiles = new Set();
		this.downloadQueue = new Map();

		this.tilesInView = null;

		this.group = new Group();
		this.resourceTracker = new ResourceTracker();
		this.track = this.resourceTracker.track.bind( this.resourceTracker );
		this.needsTileLevelClean = false;

		this.onLoadTile = null;

		this.tempMaterial = new MeshBasicMaterial( { color: 0xFFFFFF } );
		this.tempMaterial.depthWrite = false;

	}

	update( sceneCenter, camera, controls ) {

		// Get indices of all tiles that are in view
		const [ tiles, tileLevel ] = this.tileScheme.getTilesInView( camera, controls, this.resFactor, sceneCenter );

		if ( this.tileLevel == - 1 )
			this.tileLevel = tileLevel;
		
		this.tilesInView = tiles;

		// check if we just changed tileLevel
		if ( tiles.length && tileLevel != this.tileLevel ) {

			this.abortDownloads();
			this.changeRenderOrder();
			this.needsTileLevelClean = true;
			this.tileLevel = tileLevel;

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

		// Create tiles that hadn't been created yet and remove ones out of view
		var tilesIds = new Set();
		tiles.forEach( function ( ti ) {

			const tileId = ti.getId();
			tilesIds.add( tileId );

			if ( ! this.activeTiles.has( tileId ) ) {

				this.activeTiles.add( tileId );

				this.createTile( ti, sceneCenter );

			}

		}, this );



		this.activeTiles.forEach( function ( tid ) {

			if ( ! tilesIds.has( tid ) ) {

				this.activeTiles.delete( tid );
				this.disposeTileId( tid );

			}

		}, this );

		// if ( this.needsTileLevelClean && this.downloadQueue.size == 0 ) {

		// 	this.cleanTileLevels();

		// }

	}

	disposeTileId( tid ) {

		const mesh = this.group.getObjectByName( tid );
		if ( mesh.material.map)
			mesh.material.map.dispose();
		mesh.geometry.dispose();
		mesh.material.dispose();
		this.group.remove( mesh );

	}

	changeRenderOrder() {

		for ( let i = this.group.children.length - 1; i > 0; i -- ) {

			if ( this.group.children[ i ].name != this.tileLevel ) {

				// Place tiles of old tileLevel above temporary (white) tiles, but underneath fully loaded tiles of new tileLevel
				this.group.children[ i ].renderOrder = 1;

			}

		}

	}

	abortDownloads() {

		for ( let abortCtrl of this.downloadQueue.values() ) {

			abortCtrl.abort();

		}

		this.downloadQueue.clear();

	}

	cleanTileLevels() {

		this.needsOldTileLevelClean = false;
		const scope = this;

		for ( let i = this.group.children.length - 1; i > 0; i -- ) {

			const tileLevel = this.group.children[ i ].name.split( '-' )[ 0 ];

			if ( tileLevel != this.tileLevel ) {

				this.group.remove( this.group.children[ i ] );
				this.resourceTracker.untrack( this.group.children[ i ] );

			}

		}

		this.activeTiles.forEach( function ( tile ) {

			if ( tile.split( "-" )[ 0 ] != scope.tileLevel ) {

				scope.activeTiles.delete( tile );

			}

		} );

	}

	getRequestURL( tile ) {

	}

	createTile( tile, transform ) {

		var geometry = this.track( new PlaneBufferGeometry( tile.tileMatrix.tileSpanX, tile.tileMatrix.tileSpanY ) );

		var mesh = new Mesh( geometry, this.tempMaterial );
		mesh.name = tile.getId();
		// The temporary (white) tiles on the bottom
		mesh.renderOrder = 0;
		this.group.add( mesh );

		const requestURL = this.getRequestURL( tile );

		const scope = this;
		const tileId = tile.getId();
		var controller = new AbortController();
		var signal = controller.signal;
		this.downloadQueue.set( tileId, controller );
		fetch( requestURL, { signal } ).then( function ( res ) {

			return res.arrayBuffer();

		} ).then( function ( buffer ) {

			scope.downloadQueue.delete( tileId );

			// Place tiles of new/current tile level with loaded texture completely on top
			mesh.renderOrder = 2;

			const tex = new Texture();
			var image = new Image();
			image.src = 'data:image/png;base64,' + arrayBuffer2Base64( buffer );
			image.onload = function () {

				tex.image = image;
				tex.magFilter = LinearFilter;
				tex.minFilter = LinearFilter;
				tex.generateMipmaps = false;
				tex.needsUpdate = true;
				tex.format = RGBFormat;
				var material = new MeshBasicMaterial( { map: scope.track( tex ) } );
				material.depthWrite = false;
				mesh.material = material;
				scope.onLoadTile();

			};

		} ).catch( function ( e ) {

			// we end up here if abort() is called on the Abortcontroller attached to this tile
			scope.downloadQueue.delete( tileId );
			scope.activeTiles.delete( tileId );
			scope.resourceTracker.untrack( geometry );

		} );

		const scenePosition = tile.getCenterPosition( transform );

		mesh.position.x = scenePosition.x;
		mesh.position.y = scenePosition.y;
		mesh.updateMatrix();

	}

}
