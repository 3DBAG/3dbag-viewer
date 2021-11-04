<template>
  <section class="section content">
    <h1
      id="tile-downloads"
      class="title is-3"
    >
      <template v-if="selectedTile">
        {{ $t("download.statictitle") }} {{ $t("download.staticpicked") }} {{ selectedTile }}
      </template>

      <template v-else>
        {{ $t("download.statictitle") }} {{ $t("download.staticunpicked") }}
      </template>
    </h1>

    <p>
      {{ $t("download.staticpar") }}
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
            {{ $t("download.picktile") }}
            <button
              class="delete"
              aria-label="delete"
              @click="hideMap()"
            />
          </div>
          <div class="message-body">
            <p v-if="selectedTile">
              {{ $t("download.selectedtiletrue") }} <b>{{ selectedTile }}</b> {{ $t("download.selectedtiletrue2") }}
            </p>
            <p v-else>
              {{ $t("download.selectedtilefalse") }}
            </p>
            <button
              v-if="selectedTile"
              class="button is-primary"
              @click="hideMap()"
            >
              {{ $t("download.confirm") }}
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
            <th>{{ $t("tilenumber") }}</th>
            <th>{{ $t("download.format") }}</th>
            <th>{{ $t("download.file") }}</th>
            <th>{{ $t("download.version") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="format in tileFormats"
            :key="format"
          >
            <td>{{ selectedTile }}</td>
            <td>
              {{ format }} <a
                :href="activeTileData[format]['docsURL']"
                target="_blank"
              ><b-icon
                size="is-small"
                icon="help-circle"
              /></a>
            </td>
            <td>
              <a
                :href="activeTileData[format]['fileURL']"
                download
              > {{ getFileName( format ) }} </a>
            </td>
            <td>{{ $root.$data[ "latest" ] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <button
      class="mx-1 button is-primary"
      @click="showMap()"
    >
      <p v-if="selectedTile">
        {{ $t("download.picktile2true") }}
      </p>
      <p v-else>
        {{ $t("download.picktile2false") }}
      </p>
    </button>

    <h1
      id="webservices"
      class="title is-3"
    >
      Webservices
    </h1>

    <p>
      {{ $t("download.webservicespar") }}
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
            <td>
              WMS <a
                :href="'https://docs.3dbag.nl/' + $route.params.locale + '/delivery/webservices#wms'"
                target="_blank"
              ><b-icon
                size="is-small"
                icon="help-circle"
              /></a>
            </td>
            <td><a :href="WMSURL+'?request=getcapabilities'">{{ WMSURL+'?request=getcapabilities' }}</a></td>
          </tr>
          <tr>
            <td>
              WFS <a
                :href="'https://docs.3dbag.nl/' + $route.params.locale + '/delivery/webservices#wfs'"
                target="_blank"
              ><b-icon
                size="is-small"
                icon="help-circle"
              /></a>
            </td>
            <td><a :href="WFSURL+'?request=getcapabilities'">{{ WFSURL+'?request=getcapabilities' }}</a></td>
          </tr>
        </tbody>
      </table>
    </div>

    <h1
      id="downloads-postgres"
      class="title is-3"
    >
      PostgreSQL data dump
    </h1>

    <p>{{ $t("download.psqlpar") }}</p>
    <div
      class="alert alert-warning"
      role="alert"
    >
      <b>We fixed the <code>pand</code> table for v21.09.8 (it was broken at release), and now it contains the appropriate data.</b>
    </div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>{{ $t("download.file") }}</th>
            <th>{{ $t("download.format") }}</th>
            <th>{{ $t("download.size") }}</th>
            <th>{{ $t("download.version") }}</th>
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
            <td>
              PostgreSQL
              <a
                :href="'https://docs.3dbag.nl/' + $route.params.locale + '/delivery/postgresql'"
                target="_blank"
              ><b-icon
                size="is-small"
                icon="help-circle"
              /></a>
            </td>
            <td>35GB</td>
            <td>{{ $root.$data[ "latest" ] }}</td>
          </tr>
        </tbody>
      </table>
    </div>


    <h1 class="title is-3">
      Terms of use
    </h1>
    <p
      xmlns:cc="http://creativecommons.org/ns#"
      xmlns:dct="http://purl.org/dc/terms/"
    >
      <a
        property="dct:title"
        rel="cc:attributionURL"
        href="https://3dbag.nl"
      >3D BAG</a> by
      <a
        rel="cc:attributionURL dct:creator"
        property="cc:attributionName"
        href="https://3d.bk.tudelft.nl/"
      >3D geoinformation research group</a> is licensed under
      <a
        href="http://creativecommons.org/licenses/by/4.0/?ref=chooser-v1"
        target="_blank"
        rel="license noopener noreferrer"
        style="display:inline-block;"
      >CC BY 4.0<img
        style="height:22px!important;margin-left:3px;vertical-align:text-bottom;"
        src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1"
      ><img
        style="height:22px!important;margin-left:3px;vertical-align:text-bottom;"
        src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1"
      ></a>
    </p>
    <p>
      Read the <a
        href="https://docs.3dbag.nl/en/copyright"
        target="_blank"
      >terms of use for the 3D BAG</a>.
    </p>
  </section>
</template>

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

	data() {

		return {
			mapVisible: false,
			map: null,
			tileFormats: [ "CityJSON", "OBJ", "GPKG" ],

			selectedTile: null,
			PostgresFileURL: this.$root.$data[ "versions" ][ this.$root.$data[ "latest" ] ][ "PostgreSQL" ],
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

		$route( to, from ) {

			console.log( to );

			if ( to.query.tid ) {

				this.updateTileData( to.query.tid );

			}

		},

		selectedTile: function ( ) {

			this.setFormatData( "CityJSON" );
			this.setFormatData( "OBJ" );
			this.setFormatData( "GPKG" );

		}

	},

	mounted() {

		const tid = this.$router.currentRoute.query.tid;
		if ( tid ) {

			this.updateTileData( tid );

		}

	},

	methods: {

		setActiveTile( tid ) {

			this.$router.push(
				{ url: '/', query: { tid: tid } }
			).catch( err => {

				console.log( err );

			} );
			this.updateTileData( tid );
			// this.$forceUpdate();

		},

		getFileName( format ) {

			const data = this.activeTileData[ format ];
			if ( data.fileURL )
				return data.fileURL.split( '/' ).pop();
			else
				return null;

		},

		updateTileData( tid ) {

			this.selectedTile = tid;

		},

		setFormatData( format ) {

			const latest = this.$root.$data[ "latest" ];
			this.activeTileData[ format ][ "fileURL" ] = this.$root.$data[ "versions" ][ latest ][ format ].replace( "{TID}", this.selectedTile );
			const format_lower = format.toLowerCase();
			this.activeTileData[ format ][ "docsURL" ] = 'https://docs.3dbag.nl/' + this.$route.params.locale + '/delivery/' + format_lower;

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

			fetch( 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0?request=getcapabilities&service=wmts' ).then( function ( response ) {

				return response.text();

			} ).then( function ( text ) {

				var result = parser.read( text );
				// console.log( result );

				var brt_options = WMTSoptionsFromCapabilities( result, {
					layer: 'standaard',
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
					maxZoom: 19,
					zoom: 12
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

						that.setActiveTile( e.selected[ 0 ].get( 'tile_id' ) );

					} );

				}

			} );

		},

		showMap() {

			this.mapVisible = true;

			if ( ! this.map ) {

		    this.initiateMap();

			}

		},


		hideMap() {

			this.mapVisible = false;

		}

	}
};

</script>

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
