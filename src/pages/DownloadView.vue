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
            <th>SHA-256</th>
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
            <td>{{ activeTileData[format]['sha256'] ? activeTileData[format]['sha256'] : $t("download.sha256inwfs") }}</td>
            <td>{{ $root.$data[ "version_number" ] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <button
      class="mx-1 mb-5 button is-primary"
      @click="showMap()"
    >
      <p v-if="selectedTile">
        {{ $t("download.picktile2true") }}
      </p>
      <p v-else>
        {{ $t("download.picktile2false") }}
      </p>
    </button>

    <p>
      {{ $t("download.tile_index_par") }}
    </p>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>{{ $t("download.file") }}</th>
            <th>{{ $t("download.format") }}</th>
            <th>{{ $t("download.version") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a
                :href="TileIndexFileURL"
                download
              > {{ TileIndexFileURL }} </a>
            </td>
            <td>
              FlatGeoBuf
              <a
                :href="'https://docs.3dbag.nl/' + this.$route.params.locale + '/delivery/fgb'"
                target="_blank"
              ><b-icon
                size="is-small"
                icon="help-circle"
              /></a>
            </td>
            <td>{{ $root.$data[ "version_number" ] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

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
                :href="'https://docs.3dbag.nl/' + $route.params.locale + '/delivery/webservices#wms-2d'"
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
                :href="'https://docs.3dbag.nl/' + $route.params.locale + '/delivery/webservices#wfs-2d'"
                target="_blank"
              ><b-icon
                size="is-small"
                icon="help-circle"
              /></a>
            </td>
            <td><a :href="WFSURL+'?request=getcapabilities'">{{ WFSURL+'?request=getcapabilities' }}</a></td>
          </tr>
          <tr>
            <td>
              3D API (experimental) <a
                :href="'https://docs.3dbag.nl/' + $route.params.locale + '/delivery/webservices#3dbag-api-3d'"
                target="_blank"
              ><b-icon
                size="is-small"
                icon="help-circle"
              /></a>
            </td>
            <td><a :href="OGCAPIURL">{{ OGCAPIURL }}</a></td>
          </tr>
        </tbody>
      </table>
    </div>

    <h1
      id="downloads-gpkg-dump"
      class="title is-3"
    >
      GPKG data dump
    </h1>

    <p>{{ $t("download.gpgkdumppar") }}</p>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>{{ $t("download.file") }}</th>
            <th>SHA-256</th>
            <th>{{ $t("download.format") }}</th>
            <th>{{ $t("download.size") }}</th>
            <th>{{ $t("download.version") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a
                :href="GPGKDumpFileURL"
                download
              > {{ GPGKDumpFileURL.split('/').pop() }} </a>
            </td>
            <td>
              {{ GPGKDumpFileSHA256 }}
            </td>
            <td>
              GPKG
              <a
                :href="'https://docs.3dbag.nl/' + this.$route.params.locale + '/delivery/gpkg'"
                target="_blank"
              ><b-icon
                size="is-small"
                icon="help-circle"
              /></a>
            </td>
            <td>{{ GPGKDumpFilesize }}</td>
            <td>{{ $root.$data[ "version_number" ] }}</td>
          </tr>
        </tbody>
      </table>
    </div>


    <h1
      id="metadata"
      class="title is-3"
    >
      Metadata
    </h1>

    <p>{{ $t("download.metadatapar") }}</p>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>{{ $t("download.format") }}</th>
            <th>{{ $t("download.file") }}</th>
            <th>{{ $t("download.version") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              JSON
            </td>
            <td>
              <a
                :href="metadata_url"
                download
              > metadata.json </a>
            </td>
            <td>{{ $root.$data[ "version_number" ] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <b-button
      label="Preview Metadata"
      icon-left="magnify"
      @click="showMetadataJSON=true"
    />

    <b-modal
      v-model="showMetadataJSON"
      has-modal-card
      width="90%"
    >
      <div
        class="modal-card"
        style="width: auto"
      >
        <section class="modal-card-body image">
          <vue-json-pretty
            :data="metadata_json"
            :show-length="true"
          />
        </section>
      </div>
    </b-modal>


    <h1
      id="downloads-versions-dump"
      class="title is-3"
    >
      {{ $t("download.archived_title") }}
    </h1>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>{{ $t("download.version") }}</th>
            <th>Metadata</th>
            <th>{{ $t("download.gpkg_dump") }}</th>
            <th>{{ $t("download.tile_index") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(data, version) in versions_data_archived"
            :key="version"
          >
            <td>{{ version }}</td>
            <td>
              <a
                :href="data['metadata']"
                download
              > metadata.json </a>
            </td>
            <td>
              <a
                :href="data['GPKG_DUMP']['url']"
                download
              > {{ data['GPKG_DUMP']['url'].split('/').pop() }}</a>
              (SHA-256)
            </td>
            <td>
              <a
                :href="data['TILE_INDEX']"
                download
              > {{ data['TILE_INDEX'] }}</a>
            </td>
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
      >3DBAG</a> by the
      <a
        rel="cc:attributionURL dct:creator"
        property="cc:attributionName"
        href="https://3d.bk.tudelft.nl/"
      >3D geoinformation research group</a>
      and
      <a
        rel="cc:attributionURL dct:creator"
        property="cc:attributionName"
        href="https://3dgi.xyz/"
      >3DGI</a>
      is licensed under
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
      >terms of use for the 3DBAG</a>.
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

import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';

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

	components: {
		VueJsonPretty
	},

	data() {

		return {
			mapVisible: false,
			showMetadataJSON: false,
			map: null,
			tileFormats: [ "CityJSON", "OBJ", "GPKG" ],

			selectedTile: null,
			TileIndexFileURL: this.$root.$data[ "version_data" ][ "TILE_INDEX" ],
			GPGKDumpFileURL: this.$root.$data[ "version_data" ][ "GPKG_DUMP" ][ "url" ],
			GPGKDumpFilesize: this.$root.$data[ "version_data" ][ "GPKG_DUMP" ][ "filesize" ],
			GPGKDumpFileSHA256: this.$root.$data[ "version_data" ][ "GPKG_DUMP" ][ "sha256" ],
			WFSURL: this.$root.$data[ "version_data" ][ "WFS" ],
			WMSURL: this.$root.$data[ "version_data" ][ "WMS" ],
			OGCAPIURL: this.$root.$data[ "version_data" ][ "OGCAPI" ],
			metadata_url: this.$root.$data[ "version_data" ][ "metadata" ],
			versions_data_archived: this.$root.$data[ "versions_data_archived" ],
			metadata_json: Object(),
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

		console.log( this.metadata_url );
		console.log( this.versions_data_archived );

		fetch( this.metadata_url )
			.then( res => res.json() )
			.then( ( out ) => {

				this.metadata_json = out;

			} ).catch( err => console.error( err ) );

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

		setFormatHash( format, sha256 ) {

			this.activeTileData[ format ][ "sha256" ] = sha256;

		},

		setFormatData( format ) {

			let tilecoords = this.selectedTile.split( "-" );
			this.activeTileData[ format ][ "fileURL" ] = this.$root.$data[ "version_data" ][ format ].replaceAll( "{TID_X}", tilecoords[ 0 ] ).replaceAll( "{TID_Y}", tilecoords[ 1 ] ).replaceAll( "{TID_Z}", tilecoords[ 2 ] );
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
              'version=1.1.0&request=GetFeature&typename=BAG3D:Tiles&' +
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

						let tile_id = e.selected[ 0 ].get( 'tile_id' );
						tile_id = tile_id.replaceAll( '/', '-' );
						console.log( tile_id );
						that.setActiveTile( tile_id );

						let cityjson_sha256 = e.selected[ 0 ].get( 'cj_sha256' );
						that.setFormatHash( "CityJSON", cityjson_sha256 );
						let obj_sha256 = e.selected[ 0 ].get( 'obj_sha256' );
						that.setFormatHash( "OBJ", obj_sha256 );
						let gpkg_sha256 = e.selected[ 0 ].get( 'gpkg_sha256' );
						that.setFormatHash( "GPKG", gpkg_sha256 );

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

.vjs-value-string {
  color: #2c3e50;
}
.vjs-key {
  color: #4f7de6;
  font-weight: bold;
}

</style>
