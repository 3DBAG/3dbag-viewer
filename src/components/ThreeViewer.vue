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
  Vector3,
  Raycaster
} from 'three';
import {
  TilesRenderer
} from '../../3DTilesRendererJS/src/index.js'
import {
  WMSTilesRenderer
} from '../wms-tiles'
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
    },
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

    this.needsRerender = 0;
  },
  mounted() {
    this.initScene();
  },
  watch: {
    errorTarget: function( val ) {

      this.tiles.errorTarget = val;
      this.needsRerender = 1;

    },
    errorThreshold: function( val ) {

      this.tiles.errorThreshold = val;
      this.needsRerender = 1;

    },
    tilesUrl: function( val ) {

      this.reinitTiles();
      this.wmsTiles.tiles = this.tiles;
      this.needsRerender = 1;

    },
    wmsOptions: function( val ) {

      this.reinitWms();
      this.needsRerender = 1;

    },
    $route(to , from) {
      // console.log(to.query);
      this.setCameraPosFromRoute(to.query);
    }
  },
  methods: {
    setCameraPosFromRoute(q) {
      let rd_x = parseFloat(q.rdx); 
      let rd_y = parseFloat(q.rdy);
      let ox = parseFloat(q.ox);
      let oy = parseFloat(q.oy);
      let oz = parseFloat(q.oz);
      // compute local tileset coordinates
      let tileset_offset_x = this.tiles.root.cached.transform.elements[12];
      let tileset_offset_y = this.tiles.root.cached.transform.elements[13];
      let local_x = rd_x - tileset_offset_x;
      let local_y = 0;
      let local_z = -(rd_y - tileset_offset_y);

      // move target and maintain the relative camera position
      this.controls.target.x = local_x;
      this.controls.target.z = local_z;
      this.camera.position.x = local_x+ox;
      this.camera.position.y = local_y+oy;
      this.camera.position.z = local_z+oz;

      this.controls.update();
    },
    setRouteFromCameraPos() {
      // compute current camera position relative to target
      let local_x = this.controls.target.x;
      let local_z = this.controls.target.z;
      let tileset_offset_x = this.tiles.root.cached.transform.elements[12];
      let tileset_offset_y = this.tiles.root.cached.transform.elements[13];

      // compute RD coordinates
      let RdX = local_x + tileset_offset_x;
      let RdY = (-local_z) + tileset_offset_y;

      let cam_offset = { 
        x: this.camera.position.x - this.controls.target.x, 
        y: this.camera.position.y - this.controls.target.y, 
        z: this.camera.position.z - this.controls.target.z};

      // emit camera offset for url generation in the parent app
      this.$emit( 'cam-offset', cam_offset );
      // push values to url, catch errors (ie NavigationDuplicated, when pushin a route that is equal to the current route)
      this.$router.push(
        {url:'/', query: {rdx:RdX, rdy: RdY, ox: cam_offset.x, oy: cam_offset.y, oz: cam_offset.z}}
      ).catch(err => {});

      // console.log( {rdx: RdX, rdy: RdY, cam_offset: cam_offset} );
    },
    reinitTiles() {
      if ( this.tiles ) {

          this.offsetParent.remove( this.tiles.group );

      }

      this.tiles = new TilesRenderer( this.tilesUrl );

      this.tiles.errorTarget = this.errorTarget;
      this.tiles.errorThreshold = this.errorThreshold;
      this.tiles.loadSiblings = false;
      this.tiles.maxDepth = 15;
      this.tiles.showEmptyTiles = true;

      this.tiles.downloadQueue.priorityCallback = tile => 1 / tile.cached.distance;

      this.tiles.setCamera( this.camera );
      this.tiles.setResolutionFromRenderer( this.camera, this.renderer );

      this.tiles.onLoadTileSet = () => {
        
        // Ensure the tileset is loaded prior to setting the position form the url parameters (we need the tileset transform to do that)
        let q = this.$router.currentRoute.query;
        if("rdx" in q && "rdy" in q && "ox" in q && "oy" in q && "oz" in q) {
          this.setCameraPosFromRoute(q);
        }

        this.needsRerender = 2

      };
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

        this.needsRerender = 1;

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

      this.wmsTiles.onLoadTile = () => this.needsRerender = 1;
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
      this.controls.addEventListener( "change", () => this.needsRerender = 1 );
      this.controls.addEventListener( "end", this.setRouteFromCameraPos );

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

      this.reinitWms();

      this.needsRerender = 1;
      this.renderScene();

      window.addEventListener( 'resize', this.onWindowResize, false );
    },
    onWindowResize() {

      let canvas = document.getElementById("canvas");
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.renderer.setSize( canvas.clientWidth, canvas.clientHeight )

      this.camera.updateProjectionMatrix();
      this.renderer.setPixelRatio( window.devicePixelRatio );

      this.needsRerender = 1;

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

        if ( object.parent.batchTable.getKeys().includes( "identificatie" ) ) {

          const identificatie = object.parent.batchTable.getData( "identificatie" )[ batch_id ];
          this.$emit( 'object-picked', { "batchID": batch_id, "identificatie": identificatie, "rmse": "-" } );

        }
        else if ( object.parent.batchTable.getKeys().includes( "attrs" ) ) {

          const attrs = JSON.parse( object.parent.batchTable.getData( "attrs" )[ batch_id ] );
          this.$emit( 'object-picked', { "batchID": batch_id, "identificatie": attrs.identificatie, "rmse": attrs.rmse } );

          // eslint-disable-next-line no-console
          console.log( attrs );
        }

      }
    },
    renderScene() {

      requestAnimationFrame( this.renderScene );

      if ( this.needsRerender > 0 ) {

        this.needsRerender--;

        // update tiles center
        if ( this.tiles.getBounds( this.box ) ) {
  
          this.box.getCenter( this.tiles.group.position );
          this.tiles.group.position.multiplyScalar( - 1 );
  
        }

        this.camera.updateMatrixWorld();
  
        this.cameraTileFocus = JSON.parse(JSON.stringify(this.camera.position));
        this.tiles.update();
        this.wmsTiles.update();
  
        this.renderer.render( this.scene, this.camera );

      }
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