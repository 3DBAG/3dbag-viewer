<template>
  <div id="app">
    <search-bar
      @menu-clicked="showSidebar = true;"
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
    <b-message
      id="picking-msg"
      v-model="showBuildingInfo"
      type="is-warning"
      size="is-small"
      title="Building information"
      aria-close-label="Close message"
    >
      <table class="table has-text-left">
        <thead>
          <tr>
            <th>Attribute</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Batch ID</td>
            <td>{{ pickedBuilding.batchID }}</td>
          </tr>
          <tr
            v-for="[name, val] in Object.entries(pickedBuilding.attributes)"
            :key="name"
          >
            <td>{{ name }}</td>
            <td>{{ val }}</td>
          </tr>
        </tbody>
      </table>
    </b-message>
    <b-sidebar
      v-model="showSidebar"
      type="is-light"
      :fullheight="true"
    >
      <h1 class="title">
        3D BAG
      </h1>
      <b-button
        style="width: min-content; position: absolute; top: 0; left: 220px;"
        class="is-light"
        icon-right="close"
        @click="showSidebar=false"
      />
      <b-menu>
        <b-menu-list label="Base Layer">
          <b-menu-item
            active
            label="TOP10NL"
            icon="map"
            @click="wmsPreset='top10nl'"
          />
          <b-menu-item
            label="Orthophoto"
            icon="camera"
            @click="wmsPreset='luchtfoto2018'"
          />
        </b-menu-list>
      </b-menu>
      <b-menu>
        <b-menu-list label="Level of Detail">
          <b-menu-item
            active
            label="LoD 2.2"
            icon="home-floor-2"
            @click="tileset='nl_lod22_opt'"
          />
          <b-menu-item
            label="LoD 1.3"
            icon="home-floor-1"
            @click="tileset='nl_lod13'"
          />
        </b-menu-list>
      </b-menu>
      <hr>
      <b-menu>
        <b-menu-list label="Menu">
          <b-menu-item
            label="3D Viewer"
            :active="true"
            :expanded="true"
            icon="video-3d-variant"
          />
          <b-menu-item
            icon="file-document"
            label="Attribute specification"
          />
          <b-menu-item
            icon="frequently-asked-questions"
            label="FAQ"
          />
        </b-menu-list>
      </b-menu>
    </b-sidebar>
    <div id="viewer">
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
  </div>
</template>

<script>
import ThreeViewer from './components/ThreeViewer.vue';
import SearchBar from './components/SearchBar.vue';

export default {

	name: 'App',

	components: {

		ThreeViewer,
		SearchBar

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

			showSidebar: false,
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
					path: '/',
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
#app {

  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
  margin: 0px;
  display: flex;

}

#search {
  position: absolute;
  top: 20px;
  left: 20px;
}

#picking-msg {
  position: absolute;
  bottom: 80px;
  left: 20px;
}

#map-options {
  position: absolute;
  bottom: 20px;
  left: 20px;
}

#search-input {
  width: 400px;
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

html, body {
  height: 100%;
  margin: 0px;
  overflow: hidden;
}
</style>
