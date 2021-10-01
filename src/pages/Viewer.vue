<template>
  <div id="viewer">
    <section
      id="map-options"
      class="field has-addons"
    >
      <DropDownSelector
        v-model="basemapPreset"
        :options="basemaps"
        :title="$t('viewer.baselayer2')"
      />
      <DropDownSelector
        v-model="tileset"
        title="LoD"
        :options="lods"
      />
      <search-bar
        @select-place="moveToPlace"
      />
      <Compass
        ref="compass"
        :rotation="camRotationZ"
        @orient-north="orientNorth"
      />
    </section>
    <BuildingInformation
      :building="pickedBuilding"
      :show="showBuildingInfo"
      @close-info="showBuildingInfo = false"
      @report-data="getReportDataIssuePathWithId( pickedBuilding.attributes.identificatie )"
    />
    <ThreeViewer
      ref="threeviewer"
      :tiles-url="tilesUrl"
      :basemap-options="basemapOptions"
      @object-picked="objectPicked"
      @cam-offset="onCamOffset"
      @cam-rotation-z="onCamRotationZ"
    />
    <div
      v-if="true"
      id="attribution"
      class="has-background-white has-text-grey"
    >
      <p>
        <span v-if="basemapOptions.attribution">
          {{ $t("viewer.baselayer1") }}
          <a
            v-if="basemapOptions.attributionURL"
            href="https://www.pdok.nl/"
          >
            {{ basemapOptions.attribution }}
          </a>
          <span v-else>
            {{ basemapOptions.attribution }}
          </span> |
        </span>
        <a :href="'https://docs.3dbag.nl/'+$route.params.locale+'/copyright' ">© 3D BAG by tudelft3d</a>
      </p>
    </div>
    <div id="debug-panel" />
  </div>
</template>

<script>
import BuildingInformation from '@/components/BuildingInformation.vue';
import DropDownSelector from '@/components/DropDownSelector.vue';
import SearchBar from '@/components/SearchBar.vue';
import ThreeViewer from '@/components/ThreeViewer.vue';
import Compass from '@/components/Compass.vue';

export default {

	name: 'Viewer',

	components: {
		BuildingInformation,
		DropDownSelector,
		SearchBar,
		ThreeViewer,
		Compass
	},

	data() {

		return {

			customTilesUrl: 'https://godzilla.bk.tudelft.nl/3dtiles/lod22_kadaster/tileset1.json',
			BAG3DVersion: this.$root.$data[ 'versions' ][ this.$root.$data[ "latest" ] ],

			camOffset: {
				x: 400,
				y: 400,
				z: 400
			},
			camRotationZ: 0,

			basemapPreset: 'brtachtergrondkaart',
			basemaps: {
				brtachtergrondkaart: {
					name: "BRT Achtergrondkaart",
					icon: "map"
				},
				brtachtergrondkaartgrijs: {
					name: "BRT Achtergrondkaart (Grijs)",
					icon: "map"
				},
				luchtfoto2020wmts: {
					name: "Luchtfoto 2020",
					icon: "map"
				}
			},

			tileset: 'lod22',
			lods: {
				lod22: {
					name: "LoD 2.2",
					icon: "home"
				},
				lod13: {
					name: "LoD 1.3",
					icon: "home"
				},
				lod12: {
					name: "LoD 1.2",
					icon: "home"
				}
			},

			pickedBuilding: {

				batchID: "-",
				attributes: []

			},

			showBuildingInfo: false,

		};

	},
	computed: {

		filteredDataArray() {

			return this.data.filter( ( option ) => {

				return option
					.toString()
					.toLowerCase()
					.indexOf( this.name.toLowerCase() ) >= 0;

			} );

		},

		tilesUrl: function () {

			if ( this.tileset == 'custom' ) {

				return this.customTilesUrl;

			}

			return this.BAG3DVersion[ '3DTilesets' ][ this.tileset ];

		},

		basemapOptions: function () {

			const sources = {

				top10nl: {

					type: "wms",
					attribution: "PDOK",
					attributionURL: "https://www.pdok.nl/",
					options: {
						url: 'https://geodata.nationaalgeoregister.nl/top10nlv2/ows?',
						layer: 'top10nlv2',
						style: '',
						imageFormat: 'image/png'
					}

				},

				luchtfoto2018: {
					type: "wms",
					attribution: "PDOK",
					attributionURL: "https://www.pdok.nl/",
					options: {
						url: 'https://geodata.nationaalgeoregister.nl/luchtfoto/rgb/wmts?',
						layer: '2018_ortho25',
						style: 'default',
						imageFormat: 'image/png'
					}
				},

				brtachtergrondkaart: {
					type: "wmts",
					attribution: "PDOK",
					attributionURL: "https://www.pdok.nl/",
					options: {
						url: 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0?',
						layer: 'standaard',
						style: 'default',
						tileMatrixSet: "EPSG:28992",
						service: "WMTS",
						request: "GetTile",
						version: "1.0.0",
						format: "image/png"
					}
				},

				brtachtergrondkaartgrijs: {
					type: "wmts",
					attribution: "PDOK",
					attributionURL: "https://www.pdok.nl/",
					options: {
						url: 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0?',
						layer: 'grijs',
						style: 'default',
						tileMatrixSet: "EPSG:28992",
						service: "WMTS",
						request: "GetTile",
						version: "1.0.0",
						format: "image/png"
					}
				},

				luchtfoto2020wmts: {
					type: "wmts",
					attribution: "PDOK",
					attributionURL: "https://www.pdok.nl/",
					options: {
						url: 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0?',
						layer: '2020_ortho25',
						style: 'default',
						tileMatrixSet: "EPSG:28992",
						service: "WMTS",
						request: "GetTile",
						version: "1.0.0",
						format: "image/png"
					}
				},



			};

			return sources[ this.basemapPreset ];

		},

		reportDataIssueUrl: function () {

			return `https://docs.google.com/forms/d/e/
				1FAIpQLScIVBEWkpOraOIpOb1SOwRvpSnlQxLFDDYsqK4MrZgOqvNjWw/viewform?
				entry.401142300=${ this.tilesUrl }&
				entry.1880096492=${ escape( "https://3dbag.nl/#" + this.$route.fullPath ) }`;

		}

	},

	watch: {

		$route( to, from ) {

			if ( to.query.lod ) {

				this.tileset = to.query.lod;

			}

		},

		tileset( to, from ) {

			if ( to != from ) {

				let q = Object.assign( {}, this.$router.currentRoute.query );
				q.lod = to;

				this.$router.push(
					{ url: '/', query: q }
				).catch( err => {} );

			}

		}

	},
	mounted() {

		if ( this.$router.currentRoute.query.lod ) {

			this.tileset = this.$router.currentRoute.query.lod;

		}

	},
	methods: {

		onCamOffset: function ( event ) {

			this.camOffset = event;

		},

		onCamRotationZ: function ( value ) {

			this.$refs.compass.setRotation( value );

		},

		orientNorth: function ( value ) {

			this.$refs.threeviewer.pointCameraToNorth();

		},

		moveToPlace: function ( res ) {

			if ( res ) {

				this.$router.push( {
					path: '/' + this.$route.params.locale + '/viewer',
					query: {
						rdx: res.rd_x,
						rdy: res.rd_y,
						ox: this.camOffset.x,
						oy: this.camOffset.y,
						oz: this.camOffset.z,
						placeMarker: true
					}
				} );

			}

		},

		objectPicked: function ( event ) {

			if ( event ) {

				this.pickedBuilding = event;
				this.showBuildingInfo = true;

			} else {

				this.showBuildingInfo = false;

			}

		},

		getReportDataIssuePathWithId: function ( identificatie ) {

			window.open( this.reportDataIssueUrl + `&entry.547110854=${ identificatie }`, '_blank' );

		}

	}

};
</script>

<style>
#building-info {
	position: absolute;
	bottom: 0.5rem;
	margin: 0 0.5rem;
}
.table-value {
	overflow-x: auto;
}
#building-info .message-body {
	overflow: auto;
	max-height: 1%;
}

#map-options {
	position: absolute;
	margin: 0px;
	top: 3.75rem;
	margin: 0 0.5rem;
}

#viewer {

	width: 100%;
	height: 100%;

}

#attribution {
	position: absolute;
	padding: 0 0.1rem;
	font-size: 13px;
	line-height: 15px;
	right: 0;
	bottom: 0;
	opacity: 0.8;
}
</style>
