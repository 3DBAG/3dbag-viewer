<template>
  <section class="section content">
    <h1
      id="webservices"
      class="title is-3"
    >
      Webservices
    </h1>

    <p>
      If you don't want to download the data for the whole country, you can use one of the web services.
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
            <td><a href="http://3dbag.bk.tudelft.nl/data/wms?request=getcapabilities">http://3dbag.bk.tudelft.nl/data/wms?request=getcapabilities</a></td>
          </tr>
          <tr>
            <td>WFS</td>
            <td><a href="http://3dbag.bk.tudelft.nl/data/wfs?request=getcapabilities">http://3dbag.bk.tudelft.nl/data/wfs?request=getcapabilities</a></td>
          </tr>
        </tbody>
      </table>
    </div>

    <h1
      id="downloads"
      class="title is-3"
    >
      Static downloads per tile
    </h1>

    <p>
      We offer the 3D BAG in various formats for download. Each format contains the data for the whole Netherlands and a new version is generated every month.
    </p>
    <button
      class="mx-1 button is-info"
      @click="showMap()"
    >
      Pick a tile
    </button>

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
      </div>
      <button
        class="modal-close is-large"
        aria-label="close"
        @click="hideMap()"
      />
    </div>

    <div
      v-if="selectedTile"
      class="tabs is-boxed is-medium"
    >
      <ul style="margin-left:0">
        <li :class="{'is-active': activeTileFormat=='CityJSON'}">
          <a @click="activeTileFormat='CityJSON'">CityJSON</a>
        </li>
        <li :class="{'is-active': activeTileFormat=='OBJ'}">
          <a @click="activeTileFormat='OBJ'">OBJ</a>
        </li>
        <li :class="{'is-active': activeTileFormat=='GPKG'}">
          <a @click="activeTileFormat='GPKG'">GPKG</a>
        </li>
        <li :class="{'is-active': activeTileFormat=='CSV'}">
          <a @click="activeTileFormat='CSV'">CSV</a>
        </li>
      </ul>
    </div>
    <div
      v-if="selectedTile"
      class="table-wrapper"
    >
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Size</th>
            <th>Version</th>
            <th>MD5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ activeTileData[ activeTileFormat ]["fileURL"] }}</td>
            <td>{{ activeTileData[ activeTileFormat ]["fileSize"] }}</td>
            <td>{{ activeTileData[ activeTileFormat ]["version"] }}</td>
            <td>{{ activeTileData[ activeTileFormat ]["MD5hash"] }}</td>
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

    The PostgreSQL backup files contain the data for the whole Netherlands, including geometry and attributes from both the BAG and the 3D BAG. Besides the data backup, the file bagactueel_schema.backup contains the custom data types used by the BAG. The backups can be restored as:
  </section>
</template>

<style>
#embedded {
  width: 100%;
  height: 100%;
}
#map {
  width: 100%;
  height:100%;
  margin: 0;
  padding: 0;
  position: absolute;
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
			activeTileFormat: "CityJSON",

			activeTileData: {
				CityJSON: Object(),
				OBJ: Object(),
				GPKG: Object(),
				CSV: Object(),
			},
		};

	},

	watch: {
		selectedTile: function ( newTole, oldTile ) {

			console.log( newTole );
			this.activeTileData.CityJSON.fileURL = this.downloadURL( "CityJSON", "json" );
			this.activeTileData.OBJ.fileURL = this.downloadURL( "OBJ", "obj" );
			this.activeTileData.GPKG.fileURL = this.downloadURL( "GPKG", "gpkg" );
			this.activeTileData.CSV.fileURL = this.downloadURL( "CSV", "csv" );

		}
	},

	updated() {

		if ( ! this.map ) {

		  this.initiateMap();

		}

	},

	methods: {

		closeInfo() {

			this.$emit( 'close-info' );

		},

		downloadURL( format, extension ) {

			const latest = this.$root.$data[ "latest" ];
			return this.$root.$data[ "versions" ][ latest ][ "downloadBaseURL" ] + format + "/bag3d_" + this.selectedTile + "." + extension;

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

				var bag_tiles = new VectorLayer( {
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

				that.map = new Map( {
					layers: [ brt, bag_tiles ],
					target: document.getElementById( 'map' ),
					view: view,
				} );

				var select = new OLSelect( { condition: OLclick, } );

				if ( select !== null ) {

					that.map.addInteraction( select );
					select.on( 'select', function ( e ) {

						that.selectedTile = e.selected[ 0 ].get( 'tile_id' );
						setTimeout( that.hideMap, 100 );

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
