<template>
  <section class="section content">
    <h1
      id="webservices"
      class="title is-3"
    >
      Webservices
    </h1>

    <p>
      These allow you to explore the entire dataset in another software (eg. QGIS) without having to download anything beforehand.
    </p>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>WMS</td>
            <td><a :href="WMSURL+'?request=getcapabilities'">{{ WMSURL+'?request=getcapabilities' }}</a></td>
          </tr>
          <tr>
            <td>WFS</td>
            <td><a :href="WFSURL+'?request=getcapabilities'">{{ WFSURL+'?request=getcapabilities' }}</a></td>
          </tr>
        </tbody>
      </table>
    </div>

    <h1
      id="downloads"
      class="title is-3"
    >
      Static downloads {{ selectedTile ? 'for tile number ' + selectedTile : 'per tile' }}
    </h1>

    <p>
      To keep filesizes manageable the 3D BAG dataset is subdived in tiles. For each tile we offer the data in a number of different file formats. Use the button below to select the tile of interest to see the download options.
    </p>

    <div
      class="modal"
      :class="{'is-active': mapVisible}"
    >
      <div class="modal-background" />
      <div
        class="modal-content"
        style="height:100%"
      >
        <div
          id="map"
          class="map"
        />
        <div
          id="tilemap-overlay"
          class="message is-primary"
        >
          <div class="message-header">
            Pick a tile
            <button
              class="delete"
              aria-label="delete"
              @click="hideMap()"
            />
          </div>
          <div class="message-body">
            <p v-if="selectedTile">
              You have selected tile number <b>{{ selectedTile }}</b>
            </p>
            <p v-else>
              Select a tile from the map
            </p>
            <button
              v-if="selectedTile"
              class="button is-primary"
              @click="hideMap()"
            >
              Confirm selection
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="selectedTile"
      class="table-wrapper box"
    >
      <table>
        <thead>
          <tr>
            <th>Tile ID</th>
            <th>Format</th>
            <th>File</th>
            <th>Download size</th>
            <th>Version</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="format in tileFormats"
            :key="format"
          >
            <td>{{ selectedTile }}</td>
            <td>{{ format }}</td>
            <td>
              <a
                :href="activeTileData[format]['fileURL']"
                download
              > {{ activeTileData[format]["fileURL"].split('/').pop() }} </a>
            </td>
            <td>{{ activeTileData[format]["Content-Length"] }}</td>
            <td>{{ $root.$data[ "latest" ] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <button
      class="mx-1 button is-primary"
      @click="showMap()"
    >
      Pick a{{ selectedTile ? 'nother' : '' }} tile
    </button>

    <h1
      id="downloads-postgres"
      class="title is-3"
    >
      PostgreSQL data dump
    </h1>

    <p>The PostgreSQL files below contain the raw 3D BAG data for the whole of the Netherlands, including geometry and attributes. Beware, this is a very large file to download.</p>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Size</th>
            <th>Version</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a
                :href="PostgresFileURL"
                download
              > {{ PostgresFileURL.split('/').pop() }} </a>
            </td>
            <td>>20GB (>90GB unzipped)</td>
            <td>{{ $root.$data[ "latest" ] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style>
#map {
  width: 98%;
  height:98%;
  margin: 1%;
  padding: 0;
  position: absolute;
}
#tilemap-overlay {
  position: relative;
  margin: auto;
  top: 2em;
  width: 80%;
  max-width: 500px;
  box-shadow: 0 0.5em 1em -0.125em rgb(10 10 10 / 10%), 0 0px 0 1px rgb(10 10 10 / 2%)
}
</style>

<script>
import "ol/ol.css";
import Map from 'ol/Map';
import Proj4 from 'proj4';
import View from "ol/View";
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { WMTS as WMTSSource, Vector as VectorSource } from 'ol/source';
import { optionsFromCapabilities as WMTSoptionsFromCapabilities } from 'ol/source/WMTS';
import { WMTSCapabilities, GeoJSON } from 'ol/format';
import { Select as OLSelect } from 'ol/interaction';
import { click as OLclick } from 'ol/events/condition';
import { register as olproj4register } from 'ol/proj/proj4';
import { get as olproj4get } from 'ol/proj';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';

function formatBytes( bytes, decimals ) {

	if ( bytes == 0 ) return '0 Bytes';
	var k = 1024,
		dm = decimals || 2,
		sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ],
		i = Math.floor( Math.log( bytes ) / Math.log( k ) );
	return parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( dm ) ) + ' ' + sizes[ i ];

}

export default {

	name: 'DownloadView',

	// props: {
	// 	selecTile: {
	// 		type: Object
	// 	},
	// },

	data() {

		return {
			mapVisible: false,
			map: null,
			selectedTile: null,
			tileFormats: [ "CityJSON", "OBJ", "GPKG" ],

			PostgresFileURL: this.$root.$data[ "versions" ][ this.$root.$data[ "latest" ] ][ "Postgres" ],
			WFSURL: this.$root.$data[ "versions" ][ this.$root.$data[ "latest" ] ][ "WFS" ],
			WMSURL: this.$root.$data[ "versions" ][ this.$root.$data[ "latest" ] ][ "WMS" ],
			activeTileData: {
				CityJSON: Object(),
				OBJ: Object(),
				GPKG: Object(),
			},
		};

	},

	watch: {
		selectedTile: function ( newTile, oldTile ) {

			this.setSelectedTile( newTile );

		},

		// $route( to, from ) {

		// 	this.setSelectedTile( to.query.tid );

		// },
	},

	updated() {

		if ( ! this.map ) {

		  this.initiateMap();

		}

	},

	methods: {

		setSelectedTile( tid ) {

			this.selectedTile = tid;

			this.setFormatData( "CityJSON" );
			this.setFormatData( "OBJ" );
			this.setFormatData( "GPKG" );

		},

		setFormatData( format ) {

			const latest = this.$root.$data[ "latest" ];
			this.activeTileData[ format ][ "fileURL" ] = this.$root.$data[ "versions" ][ latest ][ format ].replace( "{TID}", this.selectedTile );

			// we should be able to figure out md5 hasd and files size with a HEAD request
			// also can check if the file exists to not put broken link
			fetch( this.activeTileData[ format ][ "fileURL" ], {
				method: 'HEAD'
			} )
				.then( response => {

					if ( response.ok ) {

						this.activeTileData[ format ][ "Content-Length" ] = formatBytes( parseFloat( response.headers.get( 'Content-Length' ) ), 2 );

					}

				} )
				.catch( ( error ) => {

					this.activeTileData[ format ][ "fileURL" ] = "";
					this.activeTileData[ format ][ "Content-Length" ] = "";

				} );

		},

		initiateMap() {

			var parser = new WMTSCapabilities();
			Proj4.defs( "EPSG:28992", "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs" );
			olproj4register( Proj4 );
			var dutchProjection = olproj4get( 'EPSG:28992' );

			var that = this;

			fetch( 'https://geodata.nationaalgeoregister.nl/wmts?request=GetCapabilities' ).then( function ( response ) {

				return response.text();

			} ).then( function ( text ) {

				var result = parser.read( text );
				// console.log( result );

				var brt_options = WMTSoptionsFromCapabilities( result, {
					layer: 'brtachtergrondkaart',
					matrixSet: 'EPSG:28992',
					format: 'image/png8',
					crossOrigin: 'anonymous'
				} );

				var brt = new TileLayer( {
					// extent: [84902.936976066296,446592.57878318388,85540.648956581674,447052.9389111299],
					source: new WMTSSource( ( brt_options ) )
				} );

				var vectorSource = new VectorSource( {
					format: new GeoJSON(),
					url: function ( extent ) {

						return (
							that.WFSURL + '?' +
              'version=1.1.0&request=GetFeature&typename=BAG3d_v2:bag_tiles_3k&' +
              'outputFormat=application/json&srsname=EPSG:28992&' +
              'bbox=' +
              extent.join( ',' ) +
              ',EPSG:28992'
						);

					},
					strategy: bboxStrategy,
				} );

				var bag_tiles = new VectorLayer( {
					source: vectorSource,
				} );

				var view = new View( {
					projection: dutchProjection,
					// sample data center
					// center: [120953, 486328],
					// 3Dgeoinfo office
					center: [ 85177.9151549, 446749.16831151 ],
					maxZoom: 13,
					zoom: 6
				} );

				that.map = new Map( {
					layers: [ brt, bag_tiles ],
					target: document.getElementById( 'map' ),
					view: view,
				} );

				var select = new OLSelect( { condition: OLclick, } );

				if ( select !== null ) {

					that.map.addInteraction( select );
					select.on( 'select', function ( e ) {

						// that.$router.push(
						// 	{ url: '/', query: { tid: e.selected[ 0 ].get( 'tile_id' ) } }
						// ).catch( err => {

						// 	console.log( err );

						// } );
						that.selectedTile = e.selected[ 0 ].get( 'tile_id' );
						// setTimeout( that.hideMap, 100 );

					} );

				}

			} );

		},

		showMap() {

			this.mapVisible = true;

		},


		hideMap() {

			this.mapVisible = false;

		}

	}
};

</script>
