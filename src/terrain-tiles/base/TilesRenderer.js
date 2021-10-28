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

		this.tileLevel = - 1;

		this.resFactor = 4.5;

		this.tileMatrixLevels = null;
		this.activeTiles = {};
		this.downloadQueue = new Map();

		this.tilesInView = null;

		this.group = new Group();
		this.resourceTracker = new ResourceTracker();
		this.track = this.resourceTracker.track.bind( this.resourceTracker );
		this.needsTileLevelClean = false;

		this.onLoadTile = null;

		this.tempMaterial = new MeshBasicMaterial( { color: 0xFFFFFF } );
		this.tempMaterial.depthWrite = false;
		this.geometries = {};
		this.toBeDeleted = [];

	}

	update( sceneCenter, camera, controls ) {

		// Get indices of all tiles that are in view
		const inView = this.tileScheme.getTilesInView( camera, controls, this.resFactor, sceneCenter );
		this.tilesInView = inView.tiles;
		const level = inView.level;

		for ( let i = 0; i < this.toBeDeleted.length; i ++ ) {

			const entry = this.toBeDeleted[ i ];
			const time = new Date().getTime();
			const timeLapsed = time - entry.time;
			if ( timeLapsed >= 5000 ) {

				entry.ids.forEach( tid => {

					const mesh = this.activeTiles[ tid ];

					if ( mesh ) {

						if ( mesh.renderOrder == 1 || mesh.renderOrder == 2 ) {

							console.log( "ja" );
							if ( mesh.material.map )
								mesh.material.map.dispose();
							// mesh.geometry.dispose();
							mesh.material.dispose();

							this.group.remove( mesh );
							delete this.activeTiles[ tid ];

						}

					}

				}, this );

			} else {

				break;

			}

		}

		// check if we just changed tileLevel
		if ( Object.keys( this.tilesInView ).length && level != this.tileLevel ) {

			this.abortDownloads();
			this.changeRenderOrder();
			this.needsTileLevelClean = true;
			this.tileLevel = level;

		} else {

			// Cancel pending tile downloads that are not in view anymore
			setTimeout( () => {

				const tidsInView = Object.keys( this.tilesInView );

				for ( let [ tid, abortCtrl ] of this.downloadQueue.entries() ) {

					if ( ! tidsInView.includes( tid ) ) {

						abortCtrl.abort();

					}

				}

			} );

		}

		for ( const [ tid, tile ] of Object.entries( this.tilesInView ) ) {

			if ( ! Object.keys( this.activeTiles ).includes( tid ) ) {

				this.createTile( tile, sceneCenter );

			} else if ( this.activeTiles[ tid ].renderOrder == 1 || this.activeTiles[ tid ].renderOrder == 2 ) {

				this.activeTiles[ tid ].renderOrder += 2;

			}

		};

		if ( this.needsTileLevelClean && this.downloadQueue.size == 0 ) {

			this.cleanTileLevels();

		} else {

			const time = new Date().getTime();
			var dict = { "time": time, "ids": [] };
			// this.toBeDeleted.push( dict );

			for ( const [ tid, mesh ] of Object.entries( this.activeTiles ) ) {

				if ( ! Object.keys( this.tilesInView ).includes( tid ) ) {

					mesh.renderOrder -= 2;
					// dict[ "ids" ].push( tid );

					// setTimeout( function () {

					if ( mesh.material.map )
						mesh.material.map.dispose();
					mesh.material.dispose();

					this.group.remove( mesh );
					delete this.activeTiles[ tid ];

					// }, 3000, this );

				}

			}

		}

	}

	changeRenderOrder() {

		for ( let i = this.group.children.length - 1; i > 0; i -- ) {

			const obj = this.group.children[ i ];

			if ( obj.name != this.tileLevel && obj.renderOrder > 2 ) {

				// Place tiles of old tileLevel above temporary (white) tiles, but underneath fully loaded tiles of new tileLevel
				obj.renderOrder -= 2;

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

		this.needsTileLevelClean = false;

		this.group.children.forEach( obj => {

			if ( obj.level != this.tileLevel ) {

				this.group.remove( obj );
				this.resourceTracker.untrack( obj );
				if ( obj.material.map )
					obj.material.map.dispose();
				obj.material.dispose();

				this.group.remove( obj );
				delete this.activeTiles[ obj.name ];

			}

		} );

	}

	getRequestURL( tile ) {

	}

	createTile( tile, transform ) {

		if ( ! ( tile.tileMatrix.level in this.geometries ) ) {

			this.geometries[ tile.tileMatrix.level ] = this.track( new PlaneBufferGeometry( tile.tileMatrix.tileSpanX, tile.tileMatrix.tileSpanY ) );

		}

		var mesh = new Mesh( this.geometries[ tile.tileMatrix.level ], this.tempMaterial );
		mesh.name = tile.getId();
		mesh.level = this.tileLevel;
		// The temporary (white) tiles on the bottom
		mesh.renderOrder = 0;
		this.group.add( mesh );
		this.activeTiles[ tile.getId() ] = mesh;

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
			if ( tile.tileMatrix.level == scope.tileLevel ) {

				mesh.renderOrder = 4;

			} else {

				mesh.renderOrder = 3;

			}

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
			delete scope.activeTiles[ tileId ];
			// scope.resourceTracker.untrack( geometry );

		} );

		const scenePosition = tile.getCenterPosition( transform );

		mesh.position.x = scenePosition.x;
		mesh.position.y = scenePosition.y;
		mesh.updateMatrix();

	}

}
