import {
	TilesRenderer
} from '../base/TilesRenderer.js';
import { NLTileScheme } from './NLTileScheme.js';

export class WMSTilesRenderer extends TilesRenderer {

	constructor( url, layer, style ) {

		super();

		this.baseUrl = url;
		this.layer = layer;
		this.style = style;
		this.imageFormat = "image/png";

		this.tileScheme = new NLTileScheme();

	}

	getRequestURL( tile ) {

		// https://geodata.nationaalgeoregister.nl/luchtfoto/rgb/wmts?request=GetMap&service=wms&version=1.3.0&layers=2016_ortho25&width=256&height=256&crs=EPSG:28992&bbox=112409,399765,112664,399926&format=image/jpeg&styles=default
		let requestURL = this.baseUrl;
		requestURL += "request=GetMap&service=wms&version=1.3.0";
		requestURL += `&layers=${ this.layer }`;
		requestURL += `&format=${ this.imageFormat }`;
		requestURL += `&styles=${ this.style }`;
		requestURL += `&width=${ tile.tileMatrix.tileWidth }&height=${ tile.tileMatrix.tileHeight }`;
		requestURL += `&crs=EPSG:28992`;

		const bbox = tile.getBoundingBox();

		requestURL += `&bbox=${ bbox[ 0 ] },${ bbox[ 1 ] },${ bbox[ 2 ] },${ bbox[ 3 ] }`;

		return requestURL;

	}

}
