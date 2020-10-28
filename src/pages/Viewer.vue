<template>
  <div id="viewer">
    <search-bar
      @menu-clicked="$emit('hamburger-clicked')"
      @select-place="moveToPlace"
    />
    <section
      id="map-options"
      class="field has-addons"
    >
      <div class="control">
        <b-dropdown
          v-model="basemapPreset"
          position="is-top-right"
          aria-role="list"
        >
          <button
            slot="trigger"
            class="button is-primary"
            type="button"
          >
            <template v-if="basemapPreset=='top10nl'">
              <b-icon icon="map" />
              <span>TOP10NL</span>
            </template>
            <template v-else-if="basemapPreset=='brtachtergrondkaart'">
              <b-icon icon="map" />
              <span>BRT Achtergrondkaart</span>
            </template>
            <template v-else-if="basemapPreset=='brtachtergrondkaartgrijs'">
              <b-icon icon="map" />
              <span>BRT Achtergrondkaart grijs</span>
            </template>
            <template v-else-if="basemapPreset=='luchtfoto2018wmts'">
              <b-icon icon="map" />
              <span>Orthophotos (WMTS)</span>
            </template>
            <template v-else>
              <b-icon icon="map" />
              <span>Orthophotos (WMS)</span>
            </template>
            <b-icon icon="menu-up" />
          </button>

          <b-dropdown-item
            :value="'brtachtergrondkaart'"
            aria-role="listitem"
          >
            <div class="media">
              <b-icon
                class="media-left"
                icon="map"
              />
              <div class="media-content">
                <p>BRT Achtergrondkaart</p>
              </div>
            </div>
          </b-dropdown-item>

          <b-dropdown-item
            :value="'brtachtergrondkaartgrijs'"
            aria-role="listitem"
          >
            <div class="media">
              <b-icon
                class="media-left"
                icon="map"
              />
              <div class="media-content">
                <p>BRT Achtergrondkaart grijs</p>
              </div>
            </div>
          </b-dropdown-item>

          <b-dropdown-item
            :value="'top10nl'"
            aria-role="listitem"
          >
            <div class="media">
              <b-icon
                class="media-left"
                icon="map"
              />
              <div class="media-content">
                <p>TOP10NL</p>
              </div>
            </div>
          </b-dropdown-item>

          <b-dropdown-item
            :value="'luchtfoto2018wmts'"
            aria-role="listitem"
          >
            <div class="media">
              <b-icon
                class="media-left"
                icon="map"
              />
              <div class="media-content">
                <p>Orthophotos (WMTS)</p>
              </div>
            </div>
          </b-dropdown-item>

          <b-dropdown-item
            :value="'luchtfoto2018'"
            aria-role="listitem"
          >
            <div class="media">
              <b-icon
                class="media-left"
                icon="map"
              />
              <div class="media-content">
                <p>Orthophotos (WMS)</p>
              </div>
            </div>
          </b-dropdown-item>
        </b-dropdown>
      </div>
      <div class="control">
        <b-dropdown
          v-model="tileset"
          position="is-top-right"
          aria-role="list"
        >
          <button
            slot="trigger"
            class="button is-info"
            type="button"
          >
            <template v-if="tileset=='nl_lod22_opt'">
              <b-icon icon="home-floor-2" />
              <span>LoD 2.2</span>
            </template>
            <template v-else>
              <b-icon icon="home-floor-1" />
              <span>LoD 1.3</span>
            </template>
            <b-icon icon="menu-up" />
          </button>

          <b-dropdown-item
            :value="'nl_lod22_opt'"
            aria-role="listitem"
          >
            <div class="media">
              <b-icon
                class="media-left"
                icon="home-floor-2"
              />
              <div class="media-content">
                <p>LoD 2.2</p>
              </div>
            </div>
          </b-dropdown-item>

          <b-dropdown-item
            :value="'nl_lod13'"
            aria-role="listitem"
          >
            <div class="media">
              <b-icon
                class="media-left"
                icon="home-floor-1"
              />
              <div class="media-content">
                <p>LoD1.3</p>
              </div>
            </div>
          </b-dropdown-item>
        </b-dropdown>
      </div>
    </section>
    <BuildingInformation
      :building="pickedBuilding"
      :show="showBuildingInfo"
    />
    <img
      id="logo"
      alt="Vue logo"
      src="http://3dbag.bk.tudelft.nl/static/img/logo-tud-3d-black.png"
    >
    <ThreeViewer
      :tiles-url="tilesUrl"
      :basemap-options="basemapOptions"
      @object-picked="objectPicked"
      @cam-offset="onCamOffset"
    />
  </div>
</template>

<script>
import BuildingInformation from '@/components/BuildingInformation.vue';
import SearchBar from '@/components/SearchBar.vue';
import ThreeViewer from '@/components/ThreeViewer.vue';

export default {

	name: 'Viewer',

	components: {
		BuildingInformation,
		SearchBar,
		ThreeViewer
	},

	data() {

		return {

			tileset: 'nl_lod22_opt',
			customTilesUrl: 'https://godzilla.bk.tudelft.nl/3dtiles/lod22_kadaster/tileset1.json',

			camOffset: {
				x: 400,
				y: 400,
				z: 400
			},

			basemapPreset: 'brtachtergrondkaart',

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
				zh_lod22: 'https://godzilla.bk.tudelft.nl/3dtiles/ZuidHolland/tileset1.json',
				zh_lod13: 'https://godzilla.bk.tudelft.nl/3dtiles/ZuidHolland/lod13/tileset1.json',
				nl_lod22: 'https://godzilla.bk.tudelft.nl/3dtiles/lod22_kadaster/tileset1.json',
				nl_lod13: 'https://godzilla.bk.tudelft.nl/3dtiles/lod13_kadaster/tileset1.json',
				nl_lod22_attr: 'https://godzilla.bk.tudelft.nl/3dtiles/lod22_allattrs/tileset1.json',
				nl_lod22_opt: 'https://godzilla.bk.tudelft.nl/3dtiles/lod22_allattrs/tileset2.json'
			};

			return sources[ this.tileset ];

		},

		basemapOptions: function () {

			const sources = {

				top10nl: {

					type: "wms",
					options: {
						url: 'https://geodata.nationaalgeoregister.nl/top10nlv2/ows?',
						layer: 'top10nlv2',
						style: '',
						imageFormat: 'image/png'
					}

				},

				luchtfoto2018: {
					type: "wms",
					options: {
						url: 'https://geodata.nationaalgeoregister.nl/luchtfoto/rgb/wmts?',
						layer: '2018_ortho25',
						style: 'default',
						imageFormat: 'image/png'
					}
				},

				brtachtergrondkaart: {
					type: "wmts",
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

		}

	},

	methods: {

		onCamOffset: function ( event ) {

			this.camOffset = event;

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

		}

	}

};
</script>

<style>
#search {
  position: absolute;
  margin-top: 20px;
  margin-left: 20px;
}

#picking-msg {
  position: absolute;
  bottom: 80px;
  margin-left: 20px;
}

#map-options {
  position: absolute;
  bottom: 20px;
  margin-left: 20px;
}

#search-input {
  width: 500px;
}

#viewer {

  width: 100%;
  height: 100%;

}

#logo {

  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 10%;

}
</style>
