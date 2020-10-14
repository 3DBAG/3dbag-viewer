<template>
  <div id="canvas"></div>
</template>

<script>
import {
  Scene,
  Color,
  FogExp2,
  MeshLambertMaterial,
  WebGLRenderer,
  sRGBEncoding,
  RGBFormat,
  PerspectiveCamera,
  Group,
  Box3,
  DirectionalLight,
  PointLight,
  AmbientLight,
  HemisphereLight,
  Vector2,
  Vector3,
  Raycaster,
  MOUSE,
  ShaderMaterial,
  ShaderLib,
  UniformsUtils,
  Float32BufferAttribute,
  DataTexture
} from 'three';
import {
  Lut
} from 'three/examples/jsm/math/Lut';
import {
  TilesRenderer
} from '../../3DTilesRendererJS/src/index.js';
import {
  WMSTilesRenderer
} from '../wms-tiles'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';

const Tweakpane = require('tweakpane');

// Adjusts the three.js standard shader to include batchid highlight
function batchIdHighlightShaderMixin( shader ) {
	const newShader = { ...shader };
  const cmlut = new Lut('rainbow', 512);
  const cm_data = new Uint8Array(3*512);
  cmlut.lut.forEach( (col, i) => {
    var r = Math.floor( col.r * 255 );
    var g = Math.floor( col.g * 255 );
    var b = Math.floor( col.b * 255 );

    var stride = i * 3;

    cm_data[ stride ] = r;
    cm_data[ stride + 1 ] = g;
    cm_data[ stride + 2 ] = b;
  });
  const cm = new DataTexture(cm_data, 512, 1, RGBFormat);

	newShader.uniforms = {
    valMin: {value: 0.0},
    valMax: {value: 0.5},
    colormap: { type: "t", value: cm },
		highlightedBatchId: { value: - 1 },
		highlightColor: { value: new Color( 0xFFC107 ).convertSRGBToLinear() },
		...UniformsUtils.clone( shader.uniforms ),
	};
	newShader.extensions = {
		derivatives: true,
	};
	newShader.lights = true;
	newShader.fog = true;
	newShader.vertexShader =
		`
			attribute float _batchid;
      attribute float rmse;
			varying float batchid;
			varying float rmse_v;
		` +
		newShader.vertexShader.replace(
			/#include <uv_vertex>/,
			`
			#include <uv_vertex>
			batchid = _batchid;
			rmse_v = rmse;
			`
		);
	newShader.fragmentShader =
		`
			varying float batchid;
			varying float rmse_v;
			uniform float valMin;
			uniform float valMax;
			uniform float highlightedBatchId;
			uniform vec3 highlightColor;
      uniform sampler2D colormap;
		` +
		newShader.fragmentShader.replace(
			/vec4 diffuseColor = vec4\( diffuse, opacity \);/,
			`
      float texCoord = (rmse_v - valMin)/(valMax-valMin);
      vec3 diffuse_ = texture2D( colormap, vec2(texCoord,0) ).xyz;
			vec4 diffuseColor =
				abs( batchid - highlightedBatchId ) < 0.5 ?
				vec4( highlightColor, opacity ) :
				vec4( diffuse_, opacity );
			`
		);

	return newShader;

}

export default {
  name: 'ThreeViewer',
  props: {
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
    this.dummyCamera = null;
    this.controls = null;
    this.material = null;
    this.highlightMaterial = null;

    this.raycaster = null;
    this.mouse = null;

    this.box = null;

    this.tiles = null;
    this.cameraTileFocus = null;
    
    this.needsRerender = 0;

    this.colormap = null;

    // debug
    this.pointIntensity = 0.4;
    this.directionalIntensity = 0.8;
    this.ambientIntensity = 0.5;

    this.dirX = 0.63;
    this.dirY = 1;
    this.dirZ = 0;

    this.meshShading = "normal";
    this.meshColor = "#697275";

    this.nearPlane = 1;
    this.farPlane = 10000;
    this.dummyFarPlane = 3500;

    this.fog = null;
    this.enableFog = false;
    this.fogDensity = 0.0004;
    this.fogColor = '#eeeeee';

    this.errorTarget = 0;
    this.errorThreshold = 60;

    this.castOnHover = false;

    this.enableWMS = true;
    this.pane = new Tweakpane({title: 'debug'});

    this.selectedObject = null;
  },
  mounted() {

    this.initScene();
    this.initTweakPane();

  },
  watch: {
    tilesUrl: function( val ) {

      this.reinitTiles();
      this.wmsTiles.tiles = this.tiles;
      this.needsRerender = 1;

    },
    wmsOptions: function( val ) {

      this.reinitWms();
      this.wmsTiles.tiles = this.tiles;
      this.needsRerender = 1;

    },
    $route(to , from) {
      // console.log(to.query);
      this.setCameraPosFromRoute(to.query);
    },
  },
  methods: {
    initTweakPane(){
      // tweakpane (for debugging)
      // see https://cocopon.github.io/tweakpane/

      // 3DTiles
      const f1 = this.pane.addFolder({
        expanded: true,
        title: '3DTile render',
      });
      f1.addInput(this, "errorTarget").on( 'change', (val) => this.tiles.errorTarget = val );
      f1.addInput(this, "errorThreshold").on( 'change', (val) => this.tiles.errorThreshold = val );
      
      // Terrain tiles
      const f2 = this.pane.addFolder({
        expanded: true,
        title: 'Terrain tiles',
      });
      f2.addInput(this, "enableWMS").on( 'change', (val) => this.reinitWms() );
      
      // Camera
      const f3 = this.pane.addFolder({
        expanded: true,
        title: 'Camera',
      })
      f3.addInput(this, "nearPlane", {min: 1, max:1000}).on( 'change', (val) => {this.camera.near = val; this.camera.updateProjectionMatrix();} );
      f3.addInput(this, "farPlane", {min: 100, max:20000}).on( 'change', (val) => {this.camera.far = val; this.camera.updateProjectionMatrix();} );
      f3.addInput(this, "dummyFarPlane", {min: 100, max:5000}).on( 'change', (val) => {this.dummyCamera.far = val; this.dummyCamera.updateProjectionMatrix();} );

      f3.addInput(this, "enableFog").on( 'change', (val) => val ? this.scene.fog = this.fog : this.scene.fog = null );
      f3.addInput(this, "fogDensity", {min: 0.0001, max:0.01}).on( 'change', (val) => this.fog.density=val );
      f3.addInput(this, "fogColor").on( 'change', (val) => {this.fog.color.set(val); this.scene.background.set(val)} );

      // Appearance
      const f4 = this.pane.addFolder({
        expanded: true,
        title: 'Appearance',
      })
      f4.addInput(this, "ambientIntensity", {min: 0, max:2, step:0.1}).on('change', (val) => {this.ambLight.intensity = val});
      f4.addInput(this, "directionalIntensity", {min: 0, max:2, step:0.1}).on('change', (val) => {this.dirLight.intensity = val});
      f4.addInput(this, "pointIntensity", {min: 0, max:2, step:0.1}).on('change', (val) => {this.pLight.intensity = val});
      const f5  = f4.addFolder({
          expanded: true,
          title: 'PointLight dir',
      }).on('change', (val) => this.dirLight.position.set(this.dirX, this.dirY, this.dirZ))
      f5.addInput(this, "dirX", {min: 0, max:1, step:0.01});
      f5.addInput(this, "dirY", {min: 0, max:1, step:0.01});
      f5.addInput(this, "dirZ", {min: 0, max:1, step:0.01});
      
      f4.addInput(this, "meshShading", {options: { normal: "normal", SSAO: "ssao" }});
      f4.addInput(this, "meshColor").on('change', (val) => {
        
        this.material.uniforms.diffuse.value = new Color( val ).convertSRGBToLinear();
        this.highlightMaterial.uniforms.diffuse.value = new Color( val ).convertSRGBToLinear();
      
      });

      // Misc
      const f6 = this.pane.addFolder({
        expanded: true,
        title: 'Misc',
      })
      f6.addInput(this, "castOnHover");

      this.pane.on("change", (val) => this.needsRerender=1 );
    },
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

      this.tiles.setCamera( this.dummyCamera );
      this.tiles.setResolutionFromRenderer( this.dummyCamera, this.renderer );

      this.tiles.onLoadTileSet = () => {
        
        // Ensure the tileset is loaded prior to setting the position form the url parameters (we need the tileset transform to do that)
        let q = this.$router.currentRoute.query;
        if("rdx" in q && "rdy" in q && "ox" in q && "oy" in q && "oz" in q) {
          this.setCameraPosFromRoute(q);
        }

        this.needsRerender = 2

      };
      this.tiles.onLoadModel = ( s ) => {

        s.traverse( ( c ) => {

          if ( c.material ) {

            c.material.dispose();
            c.material = this.material;

            if ( c.geometry ) {

              c.geometry.computeBoundingBox();
              c.position.y = - c.geometry.boundingBox.min.y;

            }

            this.setTileAttributes( s, c );

          }

        } );

        this.needsRerender = 1;

      }
      // this.tiles.onDisposeModel = ( s ) => {
        
      //   scene.traverse( c => {

      //     if ( c.isMesh ) {

      //       c.material.dispose();

      //     }

      //   } );

      // }

      this.offsetParent.add( this.tiles.group );

    },
    setTileAttributes( s, c ) {
      const batch_ids = c.geometry.getAttribute( '_batchid' );
      const attrs = s.batchTable.getData('attrs');
      const new_attr_buffer = new Float32Array(batch_ids.count);
      for(let i = 0; i < batch_ids.count; i++){
        const bid = batch_ids.getX(i);
        new_attr_buffer[i] = JSON.parse(attrs[bid]).rmse;
      }
      c.geometry.setAttribute("rmse", new Float32BufferAttribute(new_attr_buffer, 1));
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
      this.scene.background = new Color( this.fogColor );
      this.fog = new FogExp2( this.fogColor, this.fogDensity );

      this.material = new ShaderMaterial( batchIdHighlightShaderMixin( ShaderLib.lambert ) );
      this.material.uniforms.diffuse.value = new Color( this.meshColor ).convertSRGBToLinear();

      this.highlightMaterial = new ShaderMaterial( batchIdHighlightShaderMixin( ShaderLib.lambert ) );
      this.highlightMaterial.uniforms.diffuse.value = new Color( this.meshColor ).convertSRGBToLinear();

      let canvas = document.getElementById("canvas");

      this.renderer = new WebGLRenderer( { antialias: false } );
      this.renderer.setPixelRatio( window.devicePixelRatio );
      this.renderer.setSize( canvas.clientWidth, canvas.clientHeight );
      this.renderer.setClearColor( 0xd9eefc );
      this.renderer.outputEncoding = sRGBEncoding;

      canvas.appendChild( this.renderer.domElement );

      this.camera = new PerspectiveCamera( 60, canvas.clientWidth / canvas.clientHeight, this.nearPlane, this.farPlane );
      this.camera.position.set( 400, 400, 400 );
      this.cameraTileFocus = JSON.parse(JSON.stringify(this.camera.position));

      this.dummyCamera = new PerspectiveCamera( 60, canvas.clientWidth / canvas.clientHeight, this.nearPlane, this.dummyFarPlane );

      this.offsetParent = new Group();
      this.scene.add( this.offsetParent );

      this.box = new Box3();

      this.raycaster = new Raycaster();

      this.mouse = new Vector2();

      this.reinitTiles();

      this.controls = new OrbitControls( this.camera, this.renderer.domElement );
      this.controls.screenSpacePanning = false;
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.1;
      this.controls.minDistance = 20;
      this.controls.maxDistance = 3000;
      this.controls.maxPolarAngle = 1.5;
      this.controls.mouseButtons = {
        LEFT: MOUSE.PAN,
        MIDDLE: MOUSE.DOLLY,
        RIGHT: MOUSE.ROTATE
      }
      this.controls.addEventListener( "change", () => this.needsRerender = 1 );
      this.controls.addEventListener( "end", this.setRouteFromCameraPos );

      this.renderer.domElement.addEventListener( 'pointermove', this.onPointerMove, false );
      this.renderer.domElement.addEventListener( 'pointerdown', this.onPointerDown, false );
      this.renderer.domElement.addEventListener( 'dblclick', this.onDblClick, false );
      this.renderer.domElement.addEventListener( 'pointerleave', this.onPointerLeave, false );

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
    onPointerMove( e ) {
      if ( this.castOnHover ) {

        this.castRay();

      }
    },
    onPointerDown() {
    },
    onDblClick() {

      this.castRay();

    },
    onPointerLeave() {

    },
    castRay() {

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ( (event.clientX - rect.left) / this.renderer.domElement.clientWidth) * 2 - 1;
      this.mouse.y = -( (event.clientY - rect.top) / this.renderer.domElement.clientHeight) * 2 + 1;
      
      this.raycaster.setFromCamera( this.mouse, this.camera );
      
      const results = this.raycaster.intersectObject( this.tiles.group, true );
      
      if ( results.length ) {

        const { face, object } = results[ 0 ];

        // Get info from batchTable
        const batch_id_table = object.geometry.getAttribute( '_batchid' );
        const batch_id = batch_id_table.getX( face.a );

        const batchTable = object.parent.batchTable;
        const keys = batchTable.getKeys();

        if ( keys.includes( "identificatie" ) ) {

          const identificatie = batchTable.getData( "identificatie" )[ batch_id ];
          this.$emit( 'object-picked', { "batchID": batch_id, "identificatie": identificatie, "rmse": "-" } );

        }
        else if ( keys.includes( "attrs" ) ) {

          const attrs = JSON.parse( batchTable.getData( "attrs" )[ batch_id ] );
          this.$emit( 'object-picked', { "batchID": batch_id, "identificatie": attrs.identificatie, "rmse": attrs.rmse } );

          // eslint-disable-next-line no-console
          console.log( attrs );
        }

        // Set up the highlighted batchid to the material of new object
        if ( this.selectedObject ) {

          this.selectedObject.material = this.material;

        }
        object.material = this.highlightMaterial;
        this.highlightMaterial.uniforms.highlightedBatchId.value = batch_id;
        this.selectedObject = object;

        this.needsRerender = 1;

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

        this.controls.update();

        this.camera.updateMatrixWorld();

        this.dummyCamera.matrixWorld.copy( this.camera.matrixWorld );
        this.dummyCamera.position.copy( this.camera.position );
        this.dummyCamera.quaternion.copy( this.camera.quaternion );
        this.dummyCamera.scale.copy( this.camera.scale );
        this.dummyCamera.far = this.dummyFarPlane;
        this.dummyCamera.updateMatrixWorld();
  
        this.cameraTileFocus = JSON.parse(JSON.stringify(this.camera.position));
        this.tiles.update();  
        if(this.enableWMS && this.wmsTiles != null) this.wmsTiles.update();
      
        if (this.meshShading == "normal"){    
          this.renderer.render( this.scene, this.camera );
        }
        else if (this.meshShading == "ssao"){
          this.composer.render();
        }
      }

    },
  }
}
</script>

<style scoped>
#canvas {
  width: 100%;
  height: 100%;
}
</style>