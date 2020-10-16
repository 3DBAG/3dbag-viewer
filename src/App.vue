<template>
  <div id="app">
    <section id="search">
      <div class="field has-addons">
        <div class="control">
          <b-button @click="showSidebar=true"
                    icon-right="menu" />
        </div>
        <div class="control">
          <b-button @click="showSidebar=true"
                    icon-right="cog">LoD</b-button>
          <b-button @click="showSidebar=true"
                    icon-right="cog">Map</b-button>
        </div>
        <b-autocomplete
          id="search-input"
          class="control"
          field="weergavenaam"
          :data="geocodeResult"
          :loading="isGeocoding"
          placeholder="Search"
          icon-right="magnify"
          @typing="doGeocode"
          @select="(res) => {
            if(res){
              $router.push( {
                path:'/', 
                query: {rdx:res.rd_x, rdy:res.rd_y, ox: camOffset.x, oy: camOffset.y, oz: camOffset.z}
              })
            }
          }"
          >
          <template slot="empty">No results found</template>
          <template slot-scope="props">
              <div class="media">
                  <div class="media-left">
                    <b-icon
                        icon="map-marker"
                        size="is-small">
                    </b-icon>
                  </div>
                  <div class="media-content">
                    <p class="has-text-left">
                      {{ props.option.weergavenaam }}
                      <br>
                      <small>
                          {{ props.option.type }} ({{ props.option.bron }})
                      </small>
                    </p>
                  </div>
              </div>
          </template>
        </b-autocomplete>
      </div>
    </section>
    <b-message type="is-warning" id="picking-msg" size="is-small" title="Building information" v-model="showBuildingInfo" aria-close-label="Close message">
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
            <td>{{pickedBuilding.batchID}}</td>
          </tr>
          <tr v-for="[name, val] in Object.entries(pickedBuilding.attributes)">
            <td>{{ name }}</td>
            <td>{{ val }}</td>
          </tr>
        </tbody>
      </table>
    </b-message>
    <b-sidebar
      type="is-light"
      :fullheight=true
      v-model="showSidebar"
    >
      <div style="padding:0.25rem">
        <h1 class="title">3D BAG</h1>
        <h3>Tiles settings</h3>
        <div>
          <label for="lod">Active LoD: </label>
          <select id="lod" v-model="tileset">
            <option value="nl_lod22_opt">LoD2.2 (Quadtree)</option>
            <option value="nl_lod22_attr">LoD2.2 (NL+attributes)</option>
            <option value="nl_lod22">LoD2.2 (NL)</option>
            <option value="nl_lod13">LoD1.3 (NL)</option>
            <option value="zh_lod22">LoD2.2 (ZH)</option>
            <option value="zh_lod13">LoD1.3 (ZH)</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div v-if="tileset == 'custom'">
          <label for="customTileset">Custom URL: </label>
          <input type="text" id="customTileset" v-model="customTilesUrl">
        </div>
        <h3>WMS settings</h3>
        <div>
          <label for="wmsPreset">Preset: </label>
          <select id="wmsPreset" v-model="wmsPreset">
            <option value="top10nl">TOP10NL</option>
            <option value="luchfoto2018">Orthophotos 2018</option>
          </select>
        </div>
      </div>
    </b-sidebar>
    <div id="viewer">
      <img id="logo" alt="Vue logo" src="http://3dbag.bk.tudelft.nl/static/img/logo-tud-3d-black.png">
      <ThreeViewer
        :tiles-url="tilesUrl"
        :wms-options="wmsOptions"
        @object-picked="objectPicked"
        @cam-offset="onCamOffset"
      />
    </div>
  </div>
</template>

<script>
import ThreeViewer from './components/ThreeViewer.vue';
import debounce from 'debounce';

export default {

  name: 'App',

  components: {

    ThreeViewer

  },

  data() {

    return {

      tileset: 'nl_lod22_opt',
      customTilesUrl: 'https://godzilla.bk.tudelft.nl/3dtiles/lod22_kadaster/tileset1.json',

      camOffset : {
        x : 400,
        y : 400,
        z : 400
      },

      wmsPreset: 'top10nl',

      pickedBuilding: {

        batchID: "-",
        attributes: []

      },

      geocodeResult: [],
      isGeocoding: false,

      showSidebar: false,
      showBuildingInfo: false,

    }

  },

  methods: {

    onCamOffset: function( event ) {
      
      this.camOffset = event;

    },

    objectPicked: function( event ) {

      this.pickedBuilding = event;
      this.showBuildingInfo = true;

    },

    doGeocode: debounce(function ( name ) {

      if (!name.length) {
        this.geocodeResult = []
        return
      }

      this.isGeocoding = true;
      fetch( 'https://geodata.nationaalgeoregister.nl/locatieserver/v3/free?q=' + name + '&fl=weergavenaam,bron,type,bron,id,centroide_rd&rows=10' )
      .then( res => {
        const contentType = res.headers.get("content-type");
        if ( res.ok && contentType && contentType.indexOf("application/json") !== -1) {

          return res.json();

        }

      })
      .catch((error) => {
        this.geocodeResult = [];
        throw error;
      })
      .then( json => {
        var re = /\d+\.?\d*/g;
        this.geocodeResult = json.response.docs.map( a => { 
          let m = a.centroide_rd.match(re);
          a.rd_x = parseFloat(m[0]);
          a.rd_y = parseFloat(m[1]);
          return a; 
        } );

      })
      .finally( () => {
        this.isGeocoding = false;
      });


    })

  },

  computed: {

    filteredDataArray() {
        return this.data.filter((option) => {
            return option
                .toString()
                .toLowerCase()
                .indexOf(this.name.toLowerCase()) >= 0
        })
    },

    tilesUrl: function () {

      if ( this.tileset == 'custom' ) {

          return  this.customTilesUrl;

      }

      const sources = {
        zh_lod22: 'https://godzilla.bk.tudelft.nl/3dtiles/ZuidHolland/tileset1.json',
        zh_lod13: 'https://godzilla.bk.tudelft.nl/3dtiles/ZuidHolland/lod13/tileset1.json',
        nl_lod22: 'https://godzilla.bk.tudelft.nl/3dtiles/lod22_kadaster/tileset1.json',
        nl_lod13: 'https://godzilla.bk.tudelft.nl/3dtiles/lod13_kadaster/tileset1.json',
        nl_lod22_attr: 'https://godzilla.bk.tudelft.nl/3dtiles/lod22_allattrs/tileset1.json',
        nl_lod22_opt: 'https://godzilla.bk.tudelft.nl/3dtiles/lod22_allattrs/tileset2.json'
      }

      return sources[ this.tileset ];

    },

    wmsOptions: function () {

      const wms_sources = {

        top10nl: {

          url: 'https://geodata.nationaalgeoregister.nl/top10nlv2/ows?',
          layer: 'top10nlv2',
          style: '',
          imageFormat: 'image/png'

        },
        luchfoto2018: {

            url: 'https://geodata.nationaalgeoregister.nl/luchtfoto/rgb/wmts?',
            layer: '2018_ortho25',
            style: 'default',
            imageFormat: 'image/png'
  
        }

      }

      return wms_sources[ this.wmsPreset ];

    }

  }

}
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
