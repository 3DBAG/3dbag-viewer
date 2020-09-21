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
  PointLight,
  AmbientLight,
  HemisphereLight,
  Vector2,
  Raycaster
} from 'three';
import {
  TilesRenderer
} from '../3d-tiles/index.js'
import {
  WMSTilesRenderer
} from '../wms-tiles'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';

import * as dat from 'dat.gui';

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
    },
    wmsOptions: {
      type: Object,
      default: function() {
        return {
          url: 'https://geodata.nationaalgeoregister.nl/top10nlv2/ows?',
          layer: 'top10nlv2',
          style: '',
          imageFormat: 'image/png'
        }
      }
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
    this.cameraTileFocus = null;

    this.pLight = null;
    this.dirLight = null;
    this.ambLight = null;
    //this.hemLight = null;

    this.dirX = null;
    this.dirY = null;
    this.dirZ = null;

    this.meshShading = null;
    this.meshcolor = null;

    
  },
  mounted() {
    this.guiParams();

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
      this.wmsTiles.tiles = this.tiles;
      this.renderScene();

    },
    wmsOptions: function( val ) {

      this.reinitWms();
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

            if ( c.geometry ) {

              c.geometry.computeBoundingBox();
              c.position.y = - c.geometry.boundingBox.min.y;

            }

          }

        } );
      }

      this.offsetParent.add( this.tiles.group );

    },
    reinitWms() {
      if ( this.wmsTiles ) {

        this.offsetParent.remove( this.wmsTiles.group );

      }

      this.wmsTiles = new WMSTilesRenderer(
        this.wmsOptions.url,
        this.wmsOptions.layer,
        this.wmsOptions.style,
        this.tiles
      );

      this.wmsTiles.imageFormat = this.wmsOptions.imageFormat;

      this.offsetParent.add( this.wmsTiles.group );

      this.wmsTiles.onLoadTile = this.renderScene;
    },
    initScene() {
      this.scene = new Scene();

      this.material = new MeshLambertMaterial();

      this.material.color.set( this.meshcolor );

      let canvas = document.getElementById("canvas");

      this.renderer = new WebGLRenderer( { antialias: true } );
      this.renderer.setPixelRatio( window.devicePixelRatio );
      this.renderer.setSize( canvas.clientWidth, canvas.clientHeight );
      this.renderer.setClearColor( 0xd9eefc );
      this.renderer.outputEncoding = sRGBEncoding;

      canvas.appendChild( this.renderer.domElement );

      this.camera = new PerspectiveCamera( 60, canvas.clientWidth / canvas.clientHeight, 1, 40000 );
      this.camera.position.set( 400, 400, 400 );
      this.cameraTileFocus = JSON.parse(JSON.stringify(this.camera.position));

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


      this.composer = new EffectComposer( this.renderer );
      var ssaoPass = new SSAOPass(this.scene, this.camera, canvas.cliendWidth, canvas.clientHeight);
      ssaoPass.kernelRadius = 16;
      this.composer.addPass(ssaoPass);

      // lights
      this.pLight = new PointLight( 0xffffff, this.pointIntensity, 0, 1 );
      this.camera.add( this.pLight );
      this.scene.add(this.camera);

      this.dirLight = new DirectionalLight( 0xffffff, this.directionalIntensity );
      this.dirLight.position.set( this.dirX, this.dirY, this.dirZ );
      this.scene.add( this.dirLight );

      this.ambLight = new AmbientLight( 0xffffff, this.ambientIntensity );
      this.scene.add( this.ambLight );

      //this.hemLight = new HemisphereLight( 0xffffbb, 0x080820, 1 );
      //this.scene.add(this.hemLight);

      this.offsetParent.rotation.x = - Math.PI / 2;

      this.reinitWms();

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

      // Only update tiles if camera moved sufficiently
      var camera_delta = [ Math.abs(this.camera.position.x - this.cameraTileFocus.x),
       Math.abs(this.camera.position.y - this.cameraTileFocus.y),
       Math.abs(this.camera.position.z - this.cameraTileFocus.z) ]

       if (camera_delta.some(n => n > 500)){
        this.cameraTileFocus = JSON.parse(JSON.stringify(this.camera.position));
        this.tiles.update();
        this.wmsTiles.update();
       }

      this.camera.updateMatrixWorld();
      if (this.meshShading == "normal"){
        this.renderer.render( this.scene, this.camera );
      }
      else if (this.meshShading == "ssao"){
        this.composer.render();
      }
      

    },

    guiParams(){
      var _this = this;
      
        var params = {
          meshcolor: 0x7a0000,  //RED
          amblight: 1,
          dirlight: 1,
          plight: 1,
          shading: "normal", 
          dirX: 0,
          dirY: 1,
          dirZ: 0

      }

      this.ambientIntensity = params.amblight;
      this.directionalIntensity = params.dirlight;
      this.pointIntensity = params.plight;
      this.meshShading = params.shading;
      this.meshcolor = params.meshcolor;
      this.dirX = params.dirX;
      this.dirY = params.dirY;
      this.dirZ = params.dirZ;

      const gui = new dat.GUI();

      var intensityFolder = gui.addFolder("Light intensities")

      intensityFolder.add(params, "amblight", 0, 2, 0.01)
        .name("AmbientLight")
        .onChange( function(value){
          _this.ambLight.intensity = value;
          _this.renderScene(); });

      intensityFolder.add(params, "dirlight", 0, 2, 0.01)
        .name("DirectionalLight")
        .onChange( function(value){
        _this.dirLight.intensity = value;
        _this.renderScene(); });

      intensityFolder.add(params, "plight", 0, 2, 0.01)
        .name("PointLight")
        .onChange( function(value){
        _this.pLight.intensity = value;
        _this.renderScene(); });

      var dirFolder = gui.addFolder("DirectionalLight direction")

      dirFolder.add(params, "dirX", 0, 1, 0.01)
        .onChange( function(value){
        _this.dirX = value;
        _this.dirLight.position.set(_this.dirX, _this.dirY, _this.dirZ)
        _this.renderScene(); 
        });

      dirFolder.add(params, "dirY", 0, 1, 0.01)
        .onChange( function(value){
        _this.dirY = value;
        _this.dirLight.position.set(_this.dirX, _this.dirY, _this.dirZ)
        _this.renderScene(); 
        });

      dirFolder.add(params, "dirZ", 0, 1, 0.01)
        .onChange( function(value){
        _this.dirZ = value;
        _this.dirLight.position.set(_this.dirX, _this.dirY, _this.dirZ)
        _this.renderScene(); 
        });

      gui.add(params, "shading", { normal: "normal", SSAO: "ssao"})
        .name("Shading")
        .onChange( function(value){
        _this.meshShading = value;
        _this.renderScene(); });


      gui.addColor(params, 'meshcolor')
        .name('Mesh color')
        .onChange(function(value) {
          _this.meshcolor = value;
          _this.material.color.set(value);
          _this.renderScene();
        });   
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