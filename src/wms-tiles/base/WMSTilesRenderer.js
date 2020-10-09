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

export class WMSTilesRenderer {

	constructor( url, layer, style, tiles_renderer ) {

		this.baseUrl = url;
		this.layer = layer;
		this.style = style;
		this.imageFormat = "image/png";

		this.group = new Group();

		this.tiles = tiles_renderer;

		this.activeTiles = [];
		this.maxTiles = 200;
		this.resolution = 0.256;

		this.onLoadTile = null;

		this.resourceTracker = new ResourceTracker();
		this.track = this.resourceTracker.track.bind( this.resourceTracker );

	}

	update() {

		if ( this.tiles.root ) {

			this.traverse( this.tiles.root );

		}

	}

	traverse( tile, debug = false ) {

		if ( ! tile.__inFrustum ) {

			return;

		}

		if ( "children" in tile ) {

			for ( let i = 0; i < tile.children.length; i ++ ) {

				this.traverse( tile.children[ i ] );

			}

		}

		if ( tile.__visible && "content" in tile ) {

			let tile_id = tile.content.uri;

			if ( ! this.activeTiles.some( e => e == tile_id ) && this.activeTiles.length < this.maxTiles ) {

				this.activeTiles.push( tile_id );
				let x = tile.cached.boxTransform.elements[ 12 ];
				let y = tile.cached.boxTransform.elements[ 13 ];

				let real_x = tile.boundingVolume.box[ 0 ];
				let real_y = tile.boundingVolume.box[ 1 ];

				let width = tile.cached.box.max.x - tile.cached.box.min.x;
				let height = tile.cached.box.max.y - tile.cached.box.min.y;
				this.create_tile( this.baseUrl, this.layer, this.imageFormat, this.style, x, y, real_x, real_y, width, height, this.resolution );

			}

		}

	}

	create_tile( url, layer, format, style, x, y, real_x, real_y, mesh_width, mesh_height, ppm ) {

		// https://geodata.nationaalgeoregister.nl/luchtfoto/rgb/wmts?request=GetMap&service=wms&version=1.3.0&layers=2016_ortho25&width=256&height=256&crs=EPSG:28992&bbox=112409,399765,112664,399926&format=image/jpeg&styles=default
		let request_url = url;
		request_url += "request=GetMap&service=wms&version=1.3.0";
		request_url += `&layers=${ layer }`;
		request_url += `&format=${ format }`;
		request_url += `&styles=${ style }`;
		request_url += `&width=${ mesh_width * ppm }&height=${ mesh_height * ppm }`;
		request_url += `&crs=EPSG:28992`;
		request_url += `&bbox=${ x - mesh_width / 2 },${ y - mesh_height / 2 },${ x + mesh_width / 2 },${ y + mesh_height / 2 }`;

		var loader = new TextureLoader();

		var diffuseMap = loader.load( request_url, this.onLoadTile );
		diffuseMap.minFilter = LinearFilter;
		diffuseMap.generateMipmaps = false;

		var geometry = this.track( new PlaneBufferGeometry( mesh_width, mesh_height ) );
		var material = new MeshBasicMaterial( { map: this.track( diffuseMap ) } );

		var mesh = new Mesh( geometry, material );
		this.group.add( mesh );

		mesh.position.x = real_x;
		mesh.position.y = real_y;
		mesh.updateMatrix();

	}

}
