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
        @menu-clicked="$emit('hamburger-clicked')"
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
      id="attribution"
      class="has-background-white has-text-grey"
    >
      <p class="is-size-7">
        <a
          class="tag"
          href="https://docs.google.com/forms/d/e/1FAIpQLSe2XLCYNmoFVHrgt_uRXeLLwfzDK7gS2kE7mGH8rnk6ltE0LQ/viewform?"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ $t("viewer.feedback") }}
        </a> |
        <a
          class="tag is-danger"
          :href="reportDataIssueUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ $t("viewer.issue") }}
        </a> |
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
        {{ $t("viewer.3dgeoinfo1") }} <a href="https://3d.bk.tudelft.nl/">{{ $t("viewer.3dgeoinfo2") }}</a>
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
				luchtfoto2018wmts: {
					name: "Luchtfoto 2018",
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

			const sources = {
				lod22: 'https://godzilla.bk.tudelft.nl/3dtiles/v20110_lod22/tileset_qt.json',
				lod13: 'https://godzilla.bk.tudelft.nl/3dtiles/v20110_lod13/tileset_qt.json',
				lod12: 'https://godzilla.bk.tudelft.nl/3dtiles/v20110_lod12/tileset_qt.json',
			};

			return sources[ this.tileset ];

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
						url: 'https://geodata.nationaalgeoregister.nl/tiles/service/wmts?',
						layer: 'brtachtergrondkaart',
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
						url: 'https://geodata.nationaalgeoregister.nl/tiles/service/wmts?',
						layer: 'brtachtergrondkaartgrijs',
						style: 'default',
						tileMatrixSet: "EPSG:28992",
						service: "WMTS",
						request: "GetTile",
						version: "1.0.0",
						format: "image/png"
					}
				},

				luchtfoto2018wmts: {
					type: "wmts",
					attribution: "PDOK",
					attributionURL: "https://www.pdok.nl/",
					options: {
						url: 'https://geodata.nationaalgeoregister.nl/luchtfoto/rgb/wmts?',
						layer: '2018_ortho25',
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
				entry.1880096492=${ escape( "https://tudelft3d.github.io/3dbag-viewer/#" + this.$route.fullPath ) }`;

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
					path: '/viewer',
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
	max-width: 170px;
	overflow-x: auto;
}
#building-info .message-body {
	overflow: auto;
	height: 500px;
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
	padding: 0.2rem;
	right: 0;
	bottom: 0;
	opacity: 0.8;
}
</style>
