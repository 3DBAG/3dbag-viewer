<template>
  <div id="canvas"></div>
</template>

<script>
import {
  Scene,
  MeshLambertMaterial,
  WebGLRenderer,
  sRGBEncoding,
  PerspectiveCamera,
  Group,
  Box3,
  DirectionalLight,
  AmbientLight
} from 'three';
import {
  TilesRenderer
} from '../3d-tiles/index.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default {
  name: 'ThreeViewer',
  props: {
    errorTarget: {
      type: Number,
      default: 50
    },
    errorThreshold: {
      type: Number,
      default: 60
    }
  },
  beforeCreate() {
    this.renderer = null;
    this.scene = null;
    this.offsetParent = null;
    this.camera = null;
    this.controls = null;
    this.material = null;

    this.box = null;

    this.tiles = null;
  },
  mounted() {
    this.initScene();
  },
  watch: {
    errorTarget: function( val ) {
      this.tiles.errorTarget = val;
      this.renderScene();
    },
    errorThreshold: function( val ) {
      this.tiles.errorThreshold = val;
      this.renderScene();
    }
  },
  methods: {
    initScene() {
      this.scene = new Scene();

      this.material = new MeshLambertMaterial();

      let canvas = document.getElementById("canvas");

      this.renderer = new WebGLRenderer( { antialias: true } );
      this.renderer.setPixelRatio( window.devicePixelRatio );
      this.renderer.setSize( canvas.clientWidth, canvas.clientHeight );
      this.renderer.setClearColor( 0xd9eefc );
      this.renderer.outputEncoding = sRGBEncoding;

      canvas.appendChild( this.renderer.domElement );

      this.camera = new PerspectiveCamera( 60, canvas.clientWidth / canvas.clientHeight, 1, 40000 );
      this.camera.position.set( 400, 400, 400 );

      this.offsetParent = new Group();
      this.scene.add( this.offsetParent );

      this.box = new Box3();

      this.tiles = new TilesRenderer( 'http://localhost:8000/tileset1.json' );

      this.tiles.errorTarget = 50;
      this.tiles.errorThreshold = 60;
      this.tiles.loadSiblings = false;
      this.tiles.maxDepth = 15;

      this.tiles.downloadQueue.priorityCallback = tile => 1 / tile.cached.distance;

      this.tiles.setCamera( this.camera );
      this.tiles.setResolutionFromRenderer( this.camera, this.renderer );

      this.controls = new OrbitControls( this.camera, this.renderer.domElement );
      this.controls.screenSpacePanning = false;
      this.controls.minDistance = 1;
      this.controls.maxDistance = 10000;
      this.controls.addEventListener( "change", this.renderScene );

      // var geometry = new BoxBufferGeometry( 10, 10, 10 );
      // var material = new MeshBasicMaterial( {color: 0x00ff00} );
      // var cube = new Mesh( geometry, material );
      // this.scene.add( cube );

      // lights
      const dirLight = new DirectionalLight( 0xffffff );
      dirLight.position.set( 1, 2, 3 );
      this.scene.add( dirLight );

      const ambLight = new AmbientLight( 0xffffff, 0.2 );
      this.scene.add( ambLight );
      
      this.offsetParent.add( this.tiles.group );
      this.offsetParent.rotation.x = - Math.PI / 2;

      this.renderScene();

      window.addEventListener( 'resize', this.onWindowResize, false );
    },
    onWindowResize() {

      let canvas = document.getElementById("canvas");
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.renderer.setSize( canvas.clientWidth, canvas.clientHeight )

      this.camera.updateProjectionMatrix();
      this.renderer.setPixelRatio( window.devicePixelRatio );

      this.renderScene();

    },
    renderScene() {
      // update tiles center
      if ( this.tiles.getBounds( this.box ) ) {

        this.box.getCenter( this.tiles.group.position );
        this.tiles.group.position.multiplyScalar( - 1 );

      }

      this.camera.updateMatrixWorld();
      this.tiles.update();
      this.renderer.render( this.scene, this.camera );
    }
  }
}
</script>

<style scoped>
#canvas {
  width: 100%;
  height: 100%;
}
</style>