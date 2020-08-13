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
  AmbientLight,
  Vector2,
  Raycaster
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
    },
    castOnHover: {
      type: Boolean,
      default: false
    },
    tilesUrl: {
      type: String,
      default: 'http://godzilla.bk.tudelft.nl/3dtiles/ZuidHolland/lod13/tileset1.json'
    }
  },
  beforeCreate() {
    this.renderer = null;
    this.scene = null;
    this.offsetParent = null;
    this.camera = null;
    this.controls = null;
    this.material = null;

    this.raycaster = null;
    this.mouse = null;

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

    },
    tilesUrl: function( val ) {

      this.reinitTiles();
      this.renderScene();

    }
  },
  methods: {
    reinitTiles() {
      if ( this.tiles ) {

          this.offsetParent.remove( this.tiles.group );

      }

      this.tiles = new TilesRenderer( this.tilesUrl );

      this.tiles.errorTarget = this.errorTarget;
      this.tiles.errorThreshold = this.errorThreshold;
      this.tiles.loadSiblings = false;
      this.tiles.maxDepth = 15;

      this.tiles.downloadQueue.priorityCallback = tile => 1 / tile.cached.distance;

      this.tiles.setCamera( this.camera );
      this.tiles.setResolutionFromRenderer( this.camera, this.renderer );

      this.tiles.onLoadModel = ( s ) => {

        s.traverse( c => {

          if ( c.material ) {

            c.material = this.material;

          }

        } );

        let render = this.renderScene;
        setInterval(function(){ render(); }, 3000);

      }

      this.offsetParent.add( this.tiles.group );

    },
    initScene() {
      this.scene = new Scene();

      this.material = new MeshLambertMaterial();
      this.material.color.setHex( 0x7a0000 );

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

      this.raycaster = new Raycaster();

      this.mouse = new Vector2();

      this.reinitTiles();

      this.controls = new OrbitControls( this.camera, this.renderer.domElement );
      this.controls.screenSpacePanning = false;
      this.controls.minDistance = 1;
      this.controls.maxDistance = 10000;
      this.controls.addEventListener( "change", this.renderScene );

      this.renderer.domElement.addEventListener( 'mousemove', this.onMouseMove, false );
      this.renderer.domElement.addEventListener( 'mousedown', this.onMouseDown, false );
      this.renderer.domElement.addEventListener( 'mouseup', this.onMouseUp, false );
      this.renderer.domElement.addEventListener( 'mouseleave', this.onMouseLeave, false );

      // lights
      const dirLight = new DirectionalLight( 0xffffff );
      dirLight.position.set( 1, 2, 3 );
      this.scene.add( dirLight );

      const ambLight = new AmbientLight( 0xffffff, 0.2 );
      this.scene.add( ambLight );

      this.offsetParent.rotation.x = - Math.PI / 2;

      this.renderScene();
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
    onMouseMove( e ) {
      if ( this.castOnHover ) {

        this.castRay();

      }
    },
    onMouseDown() {
      
    },
    onMouseUp() {
      this.castRay();
    },
    onMouseLeave() {

    },
    castRay() {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ( (event.clientX - rect.left) / this.renderer.domElement.clientWidth) * 2 - 1;
      this.mouse.y = -( (event.clientY - rect.top) / this.renderer.domElement.clientHeight) * 2 + 1;
      
      this.raycaster.setFromCamera( this.mouse, this.camera );
      
      const results = this.raycaster.intersectObject( this.tiles.group, true );
      
      if ( results.length ) {

        const object = results[ 0 ].object;

        const idx = results[ 0 ].face.a;
        const b_offset = object.geometry.attributes._batchid.offset;
        const stride = object.geometry.attributes._batchid.data.stride;
        const batch_id = object.geometry.attributes._batchid.data.array[ b_offset + stride * idx ];

        if ( 'identificatie' in object.parent.batchAttributes ) {

          const identificatie = object.parent.batchAttributes.identificatie[ batch_id ];
          this.$emit( 'object-picked', { "batchID": batch_id, "identificatie": identificatie } );

        }

      }
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