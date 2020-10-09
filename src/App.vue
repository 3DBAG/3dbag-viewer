<template>
  <div id="app">
    <div id="sidebar">
      <h1>3D BAG</h1>
      <input type="text" id="search" v-model="searchTerm" @keyup="doSearch">
      <ul>
        <li v-for="res in searchResults" :key="res.id">
          <router-link :to="{path:'/', query: {rdx:res.rd_x, rdy:res.rd_y, ox: camOffset.x, oy: camOffset.y, oz: camOffset.z}}">{{ res.name }}</router-link>
        </li>
      </ul>

      <h3>Selection information</h3>
      <div>
        <label for="batchId">Batch ID: </label>
        <input type="text" id="batchId" readonly v-model="selectedInfo.batchID">
      </div>
      <div>
        <label for="identificatie">Identificatie: </label>
        <input type="text" id="identificatie" readonly v-model="selectedInfo.identificatie">
      </div>
      <div>
        <label for="rmse">RMSE: </label>
        <input type="text" id="rmse" readonly v-model="selectedInfo.rmse">
      </div>
      <h3>Tiles settings</h3>
      <div>
        <label for="lod">Active LoD: </label>
        <select id="lod" v-model="tileset">
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
import ThreeViewer from './components/ThreeViewer.vue'

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

      selectedInfo: {

        batchID: "-",
        identificatie: "-",
        rmse: "-"

      },

      searchTerm: null,
      searchResults: []

    }

  },

  methods: {

    onCamOffset: function( event ) {
      
      this.camOffset = event;

    },

    objectPicked: function( event ) {

      this.selectedInfo = event;

    },

    doSearch: function ( e ) {

      if ( e.keyCode == 13 ) {

        fetch( 'https://geodata.nationaalgeoregister.nl/locatieserver/v3/free?q=' + this.searchTerm + '&fq=bron:BAG&fl=weergavenaam,id,centroide_rd&rows=10' )
        .then( res => {
          const contentType = res.headers.get("content-type");
          if ( res.ok && contentType && contentType.indexOf("application/json") !== -1) {

            return res.json();

          }

        })
        .then( json => {
          var re = /\d+\.?\d*/g;
          this.searchResults = json.response.docs.map( a => { 
            let m = a.centroide_rd.match(re);
            return { id: a.id, name: a.weergavenaam, rd_x: parseFloat(m[0]), rd_y: parseFloat(m[1]) } 
          } );

        });

      }

    }

  },

  computed: {

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

#sidebar {

  width: 20%;
  padding: 10px;

}

#viewer {

  width: 80%;
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
