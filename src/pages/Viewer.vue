<template>
  <div id="viewer">
    <section
      v-if="tilesUrl"
      id="map-options"
      class="field has-addons"
    >
      <DropDownSelector
        v-model="basemapPreset"
        :options="basemaps"
        :title="$t('viewer.baselayer2')"
      />
      <DropDownSelector
        v-if="availableLodCount > 1"
        v-model="tileset"
        title="LoD"
        :options="lods"
      />
      <div
        v-if="colormap"
        class="control"
      >
        <b-button
          :class="{ 'is-primary': colormapEnabled }"
          icon-left="palette"
          :title="$t( 'viewer.colormap' )"
          @click="colormapEnabled = ! colormapEnabled"
        >
          <span class="is-hidden-mobile">{{ $t( 'viewer.colormap' ) }}</span>
        </b-button>
      </div>
      <search-bar
        @select-place="moveToPlace"
      />
      <Compass
        ref="compass"
        :rotation="camRotationZ"
        @orient-north="orientNorth"
      />
    </section>
    <transition name="fade">
      <div
        v-if="showLocationBox"
        id="locationbox"
        class="box"
        @click="toggleLocationBox"
      >
        {{ locationBoxText }}
      </div>
    </transition>
    <BuildingInformation
      :building="pickedBuilding"
      :show="showBuildingInfo"
      :documentation-enabled="menu.documentation"
      :feedback-enabled="menu.feedback"
      @close-info="showBuildingInfo = false"
      @report-data="getReportDataIssuePathWithId( pickedBuilding.attributes.identificatie )"
    />
    <ThreeViewer
      v-if="tilesUrl"
      ref="threeviewer"
      :tiles-url="tilesUrl"
      :basemap-preset="basemapPreset"
      :colormap="colormap"
      :colormap-enabled="colormapEnabled"
      @object-picked="objectPicked"
      @cam-offset="onCamOffset"
      @cam-rotation-z="onCamRotationZ"
    />
    <div
      v-else
      class="viewer-data-unavailable"
      role="status"
    >
      <strong>{{ $t( 'viewer.threeDUnavailable' ) }}</strong>
      <span>{{ $t( 'viewer.threeDUnavailableDescription' ) }}</span>
    </div>
    <div
      v-if="tilesUrl"
      id="attribution"
      class="has-background-white has-text-grey"
    >
      <p>
        <a
          v-if="menu.documentation"
          :href="config.docsUrl + '/' + $route.params.locale + '/copyright' "
        >© 3DBAG by tudelft3d and 3DGI</a>
        <span v-else>© 3DBAG by tudelft3d and 3DGI</span>
      </p>
    </div>
    <div
      v-if="tilesUrl && colormapEnabled && colormap"
      id="attribute-legend"
      class="box"
    >
      <h4>{{ colormapTitle }}</h4>
      <div
        v-for="entry in colormapLegend"
        :key="entry.value"
        class="legend-row"
      >
        <span
          class="legend-swatch"
          :style="{ backgroundColor: entry.color }"
        />
        <span>{{ entry.value === 'other' ? $t( 'viewer.colormapOther' ) : entry.label }}</span>
      </div>
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
import { appConfig } from '@/config';
import { getAttributeLegend, resolveColormapTitle } from '@/utils/attributeStyles';
import { getColormap, getDefaultLod, getLodOptions, getTilesetSources } from '@/utils/manifest';

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

		const versionData = this.$root.$data[ 'version_data' ] || {};

		return {

			config: appConfig,
			menu: this.$root.$data.menu,
			BAG3DVersionData: versionData,

			camOffset: {
				x: 400,
				y: 400,
				z: 400
			},
			camRotationZ: 0,

			basemapPreset: 'openfreemap',
			basemaps: {
				openfreemap: {
					name: "OpenFreeMap",
					icon: "map"
				},
				standaard: {
					name: "BRT Achtergrondkaart",
					icon: "map"
				},
				grijs: {
					name: "BRT Achtergrondkaart (Grijs)",
					icon: "map"
				},
				luchtfoto: {
					name: "Luchtfoto Actueel",
					icon: "map"
				}
			},

			showLocationBox: false,
			locationBoxText: "",

			tileset: getDefaultLod( versionData ),
			lods: getLodOptions( versionData ),

			pickedBuilding: {

				featureId: null,
				attributes: []

			},

			showBuildingInfo: false,
			colormap: getColormap( versionData ),
			colormapEnabled: Boolean( getColormap( versionData ) ),



		};

	},
	computed: {
		availableLodCount() {

			return Object.keys( this.lods ).length;

		},

		colormapTitle() {

			return resolveColormapTitle( this.colormap, this.$i18n.locale );

		},

		colormapLegend() {

			return getAttributeLegend( this.colormap );

		},

		filteredDataArray() {

			return this.data.filter( ( option ) => {

				return option
					.toString()
					.toLowerCase()
					.indexOf( this.name.toLowerCase() ) >= 0;

			} );

		},

		tilesUrl: function () {

			return getTilesetSources( this.BAG3DVersionData )[ this.tileset ] || null;

		},

		reportDataIssueUrl: function () {

			return `https://docs.google.com/forms/d/e/
				1FAIpQLScIVBEWkpOraOIpOb1SOwRvpSnlQxLFDDYsqK4MrZgOqvNjWw/viewform?
				entry.401142300=${ this.tilesUrl }&
				entry.1880096492=${ escape( appConfig.webUrl + "/#" + this.$route.fullPath ) }`;

		}

	},

	watch: {

		$route( to, from ) {

			if ( to.query.lod && this.lods[ to.query.lod ] ) {

				this.tileset = to.query.lod;

			}

		},

		tileset( to, from ) {

			if ( to && to != from ) {

				let q = Object.assign( {}, this.$router.currentRoute.query );
				q.lod = to;

				this.$router.push(
					{ url: '/', query: q }
				).catch( err => {} );

			}

		}

	},
	mounted() {

		if ( this.lods[ this.$router.currentRoute.query.lod ] ) {

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

		},

		toggleLocationBox: function () {

			this.showLocationBox = ! this.showLocationBox;

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
	z-index: 3;
	margin: 0px;
	top: 0.5rem;
	margin: 0 0.5rem;
}

#viewer {

	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	overscroll-behavior: none;

}
.viewer-data-unavailable {
	position: absolute;
	top: 50%;
	left: 50%;
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	max-width: 28rem;
	padding: 1rem 1.25rem;
	text-align: center;
	background: rgba(255, 255, 255, 0.9);
	border-radius: 0.25rem;
	transform: translate(-50%, -50%);
}
#locationbox {
	z-index: 2;
	text-align: center;
	position: relative;
	bottom: 2rem;
	padding: 0.5rem;
	background: rgba(255,255,255,0.8);
	border: 0;
	transition: opacity 0.3s;
	position: absolute;
	left: 0;
	right: 0;
	margin-left: auto;
	margin-right: auto;
	width: fit-content;
}
#attribution {
	position: absolute;
	padding: 0 0.1rem;
	font-size: 13px;
	line-height: 15px;
	left: 0;
	bottom: 0;
	opacity: 0.8;
}
#attribute-legend {
	position: absolute;
	z-index: 2;
	right: 0.5rem;
	bottom: 0.5rem;
	min-width: 10rem;
	padding: 0.65rem 0.85rem;
	margin: 0;
}
#attribute-legend h4 {
	margin: 0 0 0.35rem 0;
	color: #333;
	font-size: 0.75rem;
	font-weight: 600;
}
.legend-row {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 0.15rem;
	color: #333;
	font-size: 0.75rem;
	line-height: 1.4;
}
.legend-swatch {
	flex: 0 0 auto;
	width: 0.9rem;
	height: 0.75rem;
	border: 1px solid rgba(0, 0, 0, 0.15);
	border-radius: 2px;
}
</style>
