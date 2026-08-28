<template>
  <section class="section content">
    <h1
      v-if="hasTileDownloads"
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

    <p v-if="hasTileDownloads">
      {{ $t("download.staticpar") }}
    </p>

    <div
      v-if="hasTileDownloads"
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
      v-if="hasTileDownloads && selectedTile"
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
                v-if="menu.documentation"
                :href="activeTileData[format]['docsURL']"
                target="_blank"
              ><b-icon
                size="is-small"
                icon="help-circle"
              /></a>
            </td>
            <td>
              <span class="tile-file-actions">
                <a
                  :href="activeTileData[format]['fileURL']"
                  download
                >{{ getFileName( format ) }}</a>
                <a
                  v-if="getCJLoupeUrl( format )"
                  :href="getCJLoupeUrl( format )"
                  class="button is-small is-light"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <b-icon
                    size="is-small"
                    icon="open-in-new"
                  />
                  <span>CJLoupe</span>
                </a>
              </span>
            </td>
            <td>{{ activeTileData[format]['sha256'] ? activeTileData[format]['sha256'] : $t("download.sha256inwfs") }}</td>
            <td>{{ $root.$data[ "version_number" ] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <button
      v-if="hasTileDownloads"
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

    <p v-if="hasTileIndex">
      {{ $t("download.tile_index_par") }}
    </p>
    <div
      v-if="hasTileIndex"
      class="table-wrapper"
    >
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
                v-if="menu.documentation"
                :href="config.docsUrl + '/' + $route.params.locale + '/delivery/fgb'"
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
      v-if="webServiceRows.length"
      id="webservices"
      class="title is-3"
    >
      Webservices
    </h1>

    <p v-if="webServiceRows.length">
      {{ $t("download.webservicespar") }}
    </p>

    <div
      v-if="webServiceRows.length"
      class="table-wrapper"
    >
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="source in webServiceRows"
            :key="source.key"
          >
            <td>
              {{ source.label }} <a
                v-if="menu.documentation"
                :href="config.docsUrl + '/' + $route.params.locale + source.docsPath"
                target="_blank"
              ><b-icon
                size="is-small"
                icon="help-circle"
              /></a>
            </td>
            <td><a :href="source.href">{{ source.href }}</a></td>
          </tr>
        </tbody>
      </table>
    </div>

    <h1
      v-if="gpkgDump"
      id="downloads-gpkg-dump"
      class="title is-3"
    >
      GPKG data dump
    </h1>

    <p v-if="gpkgDump">
      {{ $t("download.gpgkdumppar") }}
    </p>
    <div
      v-if="gpkgDump"
      class="table-wrapper"
    >
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
                :href="gpkgDump.url"
                download
              > {{ getUrlFileName( gpkgDump.url ) }} </a>
            </td>
            <td>
              {{ gpkgDump.sha256 || '—' }}
            </td>
            <td>
              GPKG
              <a
                v-if="menu.documentation"
                :href="config.docsUrl + '/' + $route.params.locale + '/delivery/gpkg'"
                target="_blank"
              ><b-icon
                size="is-small"
                icon="help-circle"
              /></a>
            </td>
            <td>{{ gpkgDump.filesize || '—' }}</td>
            <td>{{ $root.$data[ "version_number" ] }}</td>
          </tr>
        </tbody>
      </table>
    </div>


    <h1
      v-if="auxiliaryFiles.length"
      id="metadata"
      class="title is-3"
    >
      Metadata
    </h1>

    <p v-if="auxiliaryFiles.length">
      {{ $t("download.metadatapar") }}
    </p>

    <div
      v-if="auxiliaryFiles.length"
      class="table-wrapper"
    >
      <table>
        <thead>
          <tr>
            <th>{{ $t("download.format") }}</th>
            <th>{{ $t("download.file") }}</th>
            <th>{{ $t("download.description") }}</th>
            <th>{{ $t("download.version") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="file in auxiliaryFiles"
            :key="file.key"
          >
            <td>{{ file.format }}</td>
            <td>
              <a
                :href="file.url"
                download
              >{{ getUrlFileName( file.url ) }}</a>
            </td>
            <td>{{ $t( file.descriptionKey ) }}</td>
            <td>{{ $root.$data[ "version_number" ] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <b-button
      v-if="metadataUrl"
      label="Preview metadata.json"
      icon-left="magnify"
      @click="showMetadataJSON=true"
    />

    <b-modal
      v-if="metadataUrl"
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
      v-if="archivedVersions.length"
      id="downloads-versions-dump"
      class="title is-3"
    >
      {{ $t("download.archived_title") }}
    </h1>

    <div
      v-if="archivedVersions.length"
      class="notification archived-downloads-notice"
    >
      <b-icon
        icon="information-outline"
        size="is-small"
        aria-hidden="true"
      />
      <span>{{ $t("download.archived_unavailable") }}</span>
    </div>

    <div
      v-if="archivedVersions.length"
      class="table-wrapper"
    >
      <table>
        <thead>
          <tr>
            <th>{{ $t("download.version") }}</th>
            <th v-if="hasArchivedMetadata">
              Metadata
            </th>
            <th v-if="hasArchivedGpkgDump">
              {{ $t("download.gpkg_dump") }}
            </th>
            <th v-if="hasArchivedTileIndex">
              {{ $t("download.tile_index") }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in archivedVersions"
            :key="entry.version"
          >
            <td>{{ entry.version }}</td>
            <td v-if="hasArchivedMetadata">
              <span
                v-if="entry.metadata"
                class="has-text-grey"
                aria-disabled="true"
              >{{ getUrlFileName( entry.metadata ) }}</span>
              <span v-else>—</span>
            </td>
            <td v-if="hasArchivedGpkgDump">
              <span
                v-if="entry.gpkgDump"
                class="has-text-grey"
                aria-disabled="true"
              >{{ getUrlFileName( entry.gpkgDump.url ) }}</span>
              <template v-if="entry.gpkgDump">
                (<span
                  class="has-text-grey"
                  aria-disabled="true"
                >SHA-256</span>)
              </template>
              <span v-else>—</span>
            </td>
            <td v-if="hasArchivedTileIndex">
              <span
                v-if="entry.tileIndex"
                class="has-text-grey"
                aria-disabled="true"
              >{{ entry.tileIndex }}</span>
              <span v-else>—</span>
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
        :href="config.webUrl"
      >3DBAG</a> by the
      <a
        rel="cc:attributionURL dct:creator"
        property="cc:attributionName"
        :href="config.geoinfoUrl"
      >3D geoinformation research group</a>
      and
      <a
        rel="cc:attributionURL dct:creator"
        property="cc:attributionName"
        :href="config.threeDgiUrl"
      >3DGI</a>
      is licensed under
      <a
        :href="config.creativecommonsUrl"
        target="_blank"
        rel="license noopener noreferrer"
        style="display:inline-block;"
      >CC BY 4.0<img
        style="height:22px!important;margin-left:3px;vertical-align:text-bottom;"
        :src="config.creativeCommonsIconUrl + '/cc.svg?ref=chooser-v1'"
      ><img
        style="height:22px!important;margin-left:3px;vertical-align:text-bottom;"
        :src="config.creativeCommonsIconUrl + '/by.svg?ref=chooser-v1'"
      ></a>
    </p>
    <p v-if="menu.documentation">
      Read the <a
        :href="config.docsUrl + '/en/copyright'"
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
import { WMTSCapabilities } from 'ol/format';
import { Select as OLSelect } from 'ol/interaction';
import { click as OLclick } from 'ol/events/condition';
import { register as olproj4register } from 'ol/proj/proj4';
import { get as olproj4get } from 'ol/proj';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { generic as FlatGeoBufGeneric, ol as FlatGeoBuf } from 'flatgeobuf';

import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import { appConfig } from '@/config';
import {
	getArchivedVersions,
	getAuxiliaryFiles,
	getGpkgDump,
	getTileFormats,
	getWebServiceRows,
	isDefinedUrl
} from '@/utils/manifest';

function formatBytes( bytes, decimals ) {

	if ( ! Number.isFinite( bytes ) ) return null;
	if ( bytes == 0 ) return '0 Bytes';
	var k = 1024,
		dm = decimals || 2,
		sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ],
		i = Math.floor( Math.log( bytes ) / Math.log( k ) );
	return parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( dm ) ) + ' ' + sizes[ i ];

}

function getFlatGeoBufExtent( bytes ) {

	if ( bytes.byteLength < 16 ) return null;
	const view = new DataView( bytes.buffer, bytes.byteOffset, bytes.byteLength );
	const headerOffset = 12;
	const headerLength = view.getUint32( 8, true );
	if ( headerLength < 8 || headerOffset + headerLength > bytes.byteLength ) return null;

	const rootOffset = headerOffset + view.getInt32( headerOffset, true );
	if ( rootOffset < headerOffset || rootOffset + 4 > headerOffset + headerLength ) return null;
	const vtableOffset = rootOffset - view.getInt32( rootOffset, true );
	if ( vtableOffset < headerOffset || vtableOffset + 8 > headerOffset + headerLength ) return null;

	const envelopeFieldOffset = view.getUint16( vtableOffset + 6, true );
	if ( envelopeFieldOffset === 0 ) return null;
	const envelopeVectorOffset = rootOffset + envelopeFieldOffset;
	if ( envelopeVectorOffset + 4 > headerOffset + headerLength ) return null;
	const envelopeOffset = envelopeVectorOffset + view.getInt32( envelopeVectorOffset, true );
	if ( envelopeOffset + 36 > headerOffset + headerLength || view.getUint32( envelopeOffset, true ) < 4 ) return null;

	const extent = [
		view.getFloat64( envelopeOffset + 4, true ),
		view.getFloat64( envelopeOffset + 12, true ),
		view.getFloat64( envelopeOffset + 20, true ),
		view.getFloat64( envelopeOffset + 28, true ),
	];
	return extent.every( Number.isFinite ) ? extent : null;

}

export default {

	name: 'DownloadView',

	components: {
		VueJsonPretty
	},

	data() {

		const versionData = this.$root.$data[ "version_data" ] || {};

		return {
			config: appConfig,
			menu: this.$root.$data.menu,
			settings: this.$root.$data.settings || {},
			versionData,
			versionsDataArchived: this.$root.$data[ "versions_data_archived" ] || {},
			mapVisible: false,
			showMetadataJSON: false,
			map: null,
			selectedTile: null,
			metadata_json: {},
			activeTileData: {},
		};

	},

	computed: {
		tileFormatDefinitions() {

			return getTileFormats( this.versionData );

		},
		tileFormats() {

			return this.tileFormatDefinitions.map( definition => definition.key );

		},
		hasTileIndex() {

			return isDefinedUrl( this.versionData.TILE_INDEX );

		},
		hasTileDownloads() {

			return this.hasTileIndex && this.tileFormats.length > 0;

		},
		TileIndexFileURL() {

			return this.hasTileIndex ? this.versionData.TILE_INDEX : null;

		},
		gpkgDump() {

			return getGpkgDump( this.versionData );

		},
		metadataUrl() {

			return isDefinedUrl( this.versionData.metadata ) ? this.versionData.metadata : null;

		},
		auxiliaryFiles() {

			return getAuxiliaryFiles( this.versionData );

		},
		webServiceRows() {

			return getWebServiceRows( this.versionData );

		},
		archivedVersions() {

			return getArchivedVersions( this.versionsDataArchived );

		},
		hasArchivedMetadata() {

			return this.archivedVersions.some( entry => entry.metadata );

		},
		hasArchivedGpkgDump() {

			return this.archivedVersions.some( entry => entry.gpkgDump );

		},
		hasArchivedTileIndex() {

			return this.archivedVersions.some( entry => entry.tileIndex );

		},
	},

	watch: {

		$route( to ) {

			if ( this.hasTileDownloads && to.query.tid ) {

				this.updateTileData( to.query.tid );

			}

		}

	},

	mounted() {

		const tid = this.$router.currentRoute.query.tid;
		if ( this.hasTileDownloads && tid ) {

			this.updateTileData( tid );

		}

		if ( ! this.metadataUrl ) return;
		fetch( this.metadataUrl )
			.then( res => res.json() )
			.then( ( out ) => {

				this.metadata_json = out;

			} ).catch( err => console.error( err ) );

	},

	methods: {

		async getTileIndexExtent() {

			try {

				const response = await fetch( this.TileIndexFileURL, { headers: { Range: 'bytes=0-65535' } } );
				if ( ! response.ok ) throw new Error( `Could not read tile index header: ${ response.status } ${ response.statusText }` );
				return getFlatGeoBufExtent( new Uint8Array( await response.arrayBuffer() ) );

			} catch ( error ) {

				console.warn( 'Could not determine the FlatGeoBuf tile index extent.', error );
				return null;

			}

		},

		setActiveTile( tid ) {

			this.$router.push(
				{ query: { ...this.$route.query, tid } }
			).catch( () => {} );
			this.updateTileData( tid );

		},

		getUrlFileName( url ) {

			if ( ! isDefinedUrl( url ) ) return '';
			try {

				return decodeURIComponent( new URL( url, window.location.href ).pathname.split( '/' ).pop() );

			} catch ( error ) {

				return url.split( /[?#]/ )[ 0 ].split( '/' ).pop();

			}

		},

		getFileName( format ) {

			const data = this.activeTileData[ format ];
			return data && data.fileURL ? this.getUrlFileName( data.fileURL ) : null;

		},

		getCJLoupeUrl( format ) {

			if ( ! this.settings.cjloupe || ! [ 'CityJSON', 'CityJSONL' ].includes( format ) ) return null;
			const data = this.activeTileData[ format ];
			if ( ! data || ! isDefinedUrl( data.fileURL ) ) return null;
			return `https://3dgi.github.io/CJLoupe/?cj=${ encodeURIComponent( data.fileURL ) }`;

		},

		updateTileData( tid ) {

			if ( tid === this.selectedTile && Object.keys( this.activeTileData ).length > 0 ) return;
			this.selectedTile = tid;
			this.activeTileData = {};
			this.tileFormatDefinitions.forEach( definition => this.setFormatData( definition.key ) );

		},

		setFormatHash( format, sha256 ) {

			if ( this.activeTileData[ format ] && sha256 ) {

				this.$set( this.activeTileData[ format ], "sha256", sha256 );

			}

		},

		setFormatData( format ) {

			const pattern = this.versionData[ format ];
			if ( ! this.selectedTile || ! isDefinedUrl( pattern ) ) return;
			let tilecoords = this.selectedTile.split( "-" );
			const formatData = {
				fileURL: pattern.replaceAll( "{TID_X}", tilecoords[ 0 ] ).replaceAll( "{TID_Y}", tilecoords[ 1 ] ).replaceAll( "{TID_Z}", tilecoords[ 2 ] ),
			};
			const format_lower = format.toLowerCase();
			if ( this.menu.documentation ) {

				formatData.docsURL = appConfig.docsUrl + '/' + this.$route.params.locale + '/delivery/' + format_lower;

			}
			this.$set( this.activeTileData, format, formatData );

			fetch( formatData.fileURL, {
				method: 'HEAD'
			} )
				.then( response => {

					if ( response.ok ) {

						this.$set( formatData, "Content-Length", formatBytes( parseFloat( response.headers.get( 'Content-Length' ) ), 2 ) );

					}

				} )
				.catch( () => {

					this.$set( formatData, "Content-Length", "" );

				} );

		},

		initiateMap() {

			var parser = new WMTSCapabilities();
			Proj4.defs( "EPSG:28992", "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs" );
			olproj4register( Proj4 );
			var dutchProjection = olproj4get( 'EPSG:28992' );

			var that = this;
			const tileIndexExtent = this.getTileIndexExtent();

			fetch( appConfig.brtUrl + 'request=getcapabilities&service=wmts' ).then( function ( response ) {

				return response.text();

			} ).then( async function ( text ) {

				var result = parser.read( text );
				const layers = result.Contents && result.Contents.Layer;
				if ( ! layers || layers.length === 0 ) {

					throw new Error( 'The BRT WMTS capabilities response contains no layers.' );

				}

				const layer = layers.find( entry => entry.Identifier === 'standaard' ) || layers[ 0 ];

				var brt_options = WMTSoptionsFromCapabilities( result, {
					layer: layer.Identifier,
					matrixSet: 'EPSG:28992',
					format: 'image/png8',
					crossOrigin: 'anonymous'
				} );

				var brt = new TileLayer( {
					// extent: [84902.936976066296,446592.57878318388,85540.648956581674,447052.9389111299],
					source: new WMTSSource( ( brt_options ) )
				} );

				const vectorSource = new VectorSource( {
					loader: async function ( extent, resolution, projection, success, failure ) {

						const features = [];
						const rect = {
							minX: extent[ 0 ],
							minY: extent[ 1 ],
							maxX: extent[ 2 ],
							maxY: extent[ 3 ],
						};

						try {

							// The tile index declares Unknown at collection level, but its features are Polygons.
							const tileIndex = FlatGeoBuf.deserialize( that.TileIndexFileURL, rect, ( header ) => {

								header.geometryType = FlatGeoBufGeneric.GeometryType.Polygon;

							} );

							for await ( const feature of tileIndex ) {

								feature.setId( feature.get( 'tile_id' ) );
								features.push( feature );

							}

							this.addFeatures( features );
							success( features );

						} catch ( error ) {

							this.removeLoadedExtent( extent );
							failure();
							console.error( 'Failed to load the FlatGeoBuf tile index.', error );

						}

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
					center: [ 155000.0, 463000.0 ],
					maxZoom: 19,
					zoom: 12
				} );

				that.map = new Map( {
					layers: [ brt, bag_tiles ],
					target: document.getElementById( 'map' ),
					view: view,
				} );
				const extent = await tileIndexExtent;
				if ( extent ) {

					that.map.updateSize();
					view.fit( extent, { size: that.map.getSize(), padding: [ 48, 48, 48, 48 ], maxZoom: 19 } );

				}

				var select = new OLSelect( { condition: OLclick, } );

				if ( select !== null ) {

					that.map.addInteraction( select );
					select.on( 'select', function ( e ) {

						if ( e.selected.length === 0 ) return;
						const feature = e.selected[ 0 ];
						let tile_id = feature.get( 'tile_id' );
						tile_id = tile_id.replaceAll( '/', '-' );
						that.setActiveTile( tile_id );

						that.tileFormatDefinitions.forEach( definition => {

							that.setFormatHash( definition.key, feature.get( definition.hashProperty ) );

						} );

					} );

				}

			} );

		},

		showMap() {

			if ( ! this.hasTileDownloads ) return;
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

.archived-downloads-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: #4a4a4a;
  font-size: 0.875rem;
  background-color: #f5f5f5;
  border: 1px solid #dbdbdb;
}

.tile-file-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.vjs-value-string {
  color: #2c3e50;
}
.vjs-key {
  color: #4f7de6;
  font-weight: bold;
}

</style>
