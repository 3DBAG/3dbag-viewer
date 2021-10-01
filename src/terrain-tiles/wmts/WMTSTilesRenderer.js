import {
	TilesRenderer
} from '../base/TilesRenderer.js';


import {
	WMTSTileScheme
} from './WMTSTileScheme.js';

export class WMTSTilesRenderer extends TilesRenderer {

	constructor( wmtsOptions, onLoadTileScheme = null ) {

		super();

		this.format = wmtsOptions.format;
		this.request = wmtsOptions.request;
		this.service = wmtsOptions.service;
		this.tileMatrixSet = wmtsOptions.tileMatrixSet;
		this.url = wmtsOptions.url;

		this.wmtsOptions = wmtsOptions;

		this.tileScheme = new WMTSTileScheme( this.url, this.tileMatrixSet, onLoadTileScheme );

	}

	getRequestURL( tile ) {

		let requestURL = this.url;

		for ( const [ k, v ] of Object.entries( this.wmtsOptions ) ) {

			if ( k != Object.keys( this.wmtsOptions )[ 0 ] ) {

				requestURL += "&";

			}

			requestURL += k + "=" + v;

		}

		requestURL += "&TileCol=" + tile.col.toString();
		requestURL += "&TileRow=" + tile.row.toString();
		requestURL += "&tileMatrix=" + tile.tileMatrix.level.toString();

		return requestURL;

	}

}
