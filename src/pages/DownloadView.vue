<template>
  <div
    id="map"
    class="map"
  />
</template>

<script>

import 'ol/ol.css';
import Map from "ol/Map";
import View from "ol/View";
import Tile from "ol/layer/Tile";
import Vector from "ol/layer/Vector";
import { Vector as VectorSource } from "ol/source";
import optionsFromCapabilities from "ol/source/WMTS";
import WMTS from "ol/source/WMTS";
import WMTSCapabilities from "ol/format/WMTSCapabilities";
import GeoJSON from "ol/format/GeoJSON";
import Select from "ol/interaction/Select";
import { click as click } from "ol/events/condition";
import proj4 from "proj4";
import { register as registerTransform } from "ol/proj/proj4";
import { get as getTransform } from 'ol/proj/transforms.js';

export default {
	name: 'DownloadView',
	mounted() {

		var parser = new WMTSCapabilities();
		proj4.defs( "EPSG:28992", "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs" );
		registerTransform( proj4 );
		var dutchProjection = getTransform( 'EPSG:28992' );

		fetch( 'https://geodata.nationaalgeoregister.nl/wmts?request=GetCapabilities' ).then( function ( response ) {

			return response.text();

		} ).then( function ( text ) {

			var result = parser.read( text );
			// console.log( result );

			var brt_options = optionsFromCapabilities( result, {
				layer: 'brtachtergrondkaartgrijs',
				matrixSet: 'EPSG:28992',
				format: 'image/png8',
				crossOrigin: 'anonymous'
			} );

			var brt = new Tile( {
				// extent: [84902.936976066296,446592.57878318388,85540.648956581674,447052.9389111299],
				source: new WMTS( brt_options )
			} );

			var bag_tiles = new Vector( {
				source: new VectorSource( {
					url: './bag_tiles_3k.geojson',
					format: new GeoJSON( {
						dataProjection: dutchProjection
					} ),
				} ),
			} );

			var view = new View( {
				projection: dutchProjection,
				// sample data center
				// center: [120953, 486328],
				// 3Dgeoinfo office
				center: [ 85177.9151549, 446749.16831151 ],
				maxZoom: 28,
				zoom: 12
			} );

			var map = new Map( {
				layers: [ brt, bag_tiles ],
				target: document.getElementById( 'map' ),
				view: view,
			} );


			// var select = null; // ref to currently selected interaction

			// select interaction working on "singleclick"
			var select = new Select( { condition: click, } );

			if ( select !== null ) {

				map.addInteraction( select );
				select.on( 'select', function ( e ) {

					console.log( 'Selected: ' + e.selected[ 0 ].get( 'tile_id' ) );
					var filename = e.selected[ 0 ].get( 'tile_id' ) + '.json.gz';
					window.location.href = 'http://godzilla.bk.tudelft.nl/v20100/' + filename;

				} );

			}

		} );

	},
};

/* Map and layer sources */




</script>

<style>
#map {
  width: 100%;
  height: 100%;
}
</style>
