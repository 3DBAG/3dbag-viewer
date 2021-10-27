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
		this.activeTiles = new Set();
		this.downloadQueue = new Map();

		this.tilesInView = null;

		this.group = new Group();
		this.resourceTracker = new ResourceTracker();
		this.track = this.resourceTracker.track.bind( this.resourceTracker );
		this.needsTileLevelClean = false;

		this.onLoadTile = null;

		// this.tempMaterial = new MeshBasicMaterial( { color: 0xFFFFFF, transparent: true, opacity: 0.0 } );
		this.tempMaterial = new MeshBasicMaterial( { color: 0xFFFFFF } );
		this.tempMaterial.depthWrite = false;
		this.geometries = {};

	}

	update( sceneCenter, camera, controls ) {

		// Get indices of all tiles that are in view
		const [ tiles, tileLevel ] = this.tileScheme.getTilesInView( camera, controls, this.resFactor, sceneCenter );

		if ( this.tileLevel == - 1 )
			this.tileLevel = tileLevel;

		this.tilesInView = tiles;

		var tidsInView = new Set();
		this.tilesInView.forEach( function ( ti ) {

			tidsInView.add( ti.getId() );

		} );

		// Cancel pending tile downloads that are not in view anymore
		setTimeout( () => {

			for ( let [ tid, abortCtrl ] of this.downloadQueue.entries() ) {

				if ( ! tidsInView.has( tid ) ) {

					abortCtrl.abort();

				}

			}

		} );

		var deleteLater = new Set();

		this.tilesInView.forEach( function ( ti ) {

			const tileId = ti.getId();

			if ( ! this.activeTiles.has( tileId ) ) {

				const intersectingTiles = ti.intersectsWith();
				intersectingTiles.forEach( tile => deleteLater.add( tile ) );

				this.activeTiles.add( tileId );
				this.createTile( ti, sceneCenter, intersectingTiles );

			} else {

				const intersectingTiles = ti.intersectsWith();
				intersectingTiles.forEach( tile => deleteLater.add( tile ) );

				const tile = this.group.getObjectByName( tileId );
				tile.renderOrder = 2;

			}

		}, this );

		this.activeTiles.forEach( function ( tid ) {

			if ( ! tidsInView.has( tid ) && ! deleteLater.has( tid ) ) {

				this.disposeTileIds( [ tid ] );

			}

		}, this );

	}

	removeOldTiles() {

		for ( let i = this.group.children.length - 1; i > 0; i -- ) {

			const obj = this.group.children[ i ];

			if ( obj.renderOrder == 1 ) {

				this.activeTiles.delete( obj.name );
				this.disposeTileIds( [ obj.tid ] );

			}

		}

	}

	disposeTileIds( tids ) {

		for ( let i = 0; i < tids.length; i ++ ) {

			const tid = tids[ i ];
			const mesh = this.group.getObjectByName( tid );

			if ( mesh ) {

				if ( mesh.material.map )
					mesh.material.map.dispose();
				mesh.geometry.dispose();
				mesh.material.dispose();
				this.group.remove( mesh );

			}

			this.activeTiles.delete( tid );

		}

	}

	changeRenderOrder() {

		for ( let i = this.group.children.length - 1; i > 0; i -- ) {

			if ( this.group.children[ i ].name != this.tileLevel ) {

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

	getRequestURL( tile ) {

	}

	createTile( tile, transform, intersectingTiles ) {

		if ( ! ( tile.tileMatrix.tileSpanX.toString() in this.geometries ) ) {

			this.geometries[ tile.tileMatrix.tileSpanX.toString() ] = this.track( new PlaneBufferGeometry( tile.tileMatrix.tileSpanX, tile.tileMatrix.tileSpanY ) );

		}

		const tex = new Texture();
		tex.magFilter = LinearFilter;
		tex.minFilter = LinearFilter;
		tex.generateMipmaps = false;
		tex.format = RGBFormat;
		var material = new MeshBasicMaterial( { map: this.track( tex ) } );
		material.color.set( 0xFFFFFF );
		material.depthWrite = false;
		var mesh = new Mesh( this.geometries[ tile.tileMatrix.tileSpanX.toString() ], this.tempMaterial );

		mesh.name = tile.getId();
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

			var image = new Image();
			image.src = 'data:image/png;base64,' + arrayBuffer2Base64( buffer );
			image.onload = function () {

				mesh.material = material;
				tex.image = image;
				tex.needsUpdate = true;
				mesh.renderOrder = 2;
				scope.disposeTileIds( intersectingTiles );

				scope.onLoadTile();

			};

		} ).catch( function ( e ) {

			// we end up here if abort() is called on the Abortcontroller attached to this tile
			scope.downloadQueue.delete( tileId );
			scope.activeTiles.delete( tileId );
			// scope.resourceTracker.untrack( geometry );
			scope.disposeTileIds( [ tileId ] );

		} );

		const scenePosition = tile.getCenterPosition( transform );

		mesh.position.x = scenePosition.x;
		mesh.position.y = scenePosition.y;
		mesh.updateMatrix();

	}

}
