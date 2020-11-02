<template>
  <div id="canvas" />
</template>

<script>
import {
	Scene,
	Color,
	FogExp2,
	WebGLRenderer,
	sRGBEncoding,
	PerspectiveCamera,
	Group,
	Box3,
	DirectionalLight,
	PointLight,
	AmbientLight,
	Vector2,
	Vector3,
	Raycaster,
	MOUSE,
	TOUCH,
	ShaderMaterial,
	ShaderLib,
	UniformsUtils,
	TextureLoader,
	Sprite,
	SpriteMaterial
} from 'three';
import {
	TilesRenderer
} from '../../3DTilesRendererJS/src/index.js';
import {
	WMSTilesRenderer,
	WMTSTilesRenderer
} from '../terrain-tiles';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import throttle from 'lodash/throttle';
// Image from https://uxwing.com/maps-pin-black-icon/
import markerSprite from '@/assets/locationmarker.png';

const Tweakpane = require( 'tweakpane' );

// Adjusts the three.js standard shader to include batchid highlight
function batchIdHighlightShaderMixin( shader ) {

	const newShader = { ...shader };
	newShader.uniforms = {
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
			varying float batchid;
		` +
		newShader.vertexShader.replace(
			/#include <uv_vertex>/,
			`
			#include <uv_vertex>
			batchid = _batchid;
			`
		);
	newShader.fragmentShader =
		`
			varying float batchid;
			uniform float highlightedBatchId;
			uniform vec3 highlightColor;
		` +
		newShader.fragmentShader.replace(
			/vec4 diffuseColor = vec4\( diffuse, opacity \);/,
			`
			vec4 diffuseColor =
				abs( batchid - highlightedBatchId ) < 0.5 ?
				vec4( highlightColor, opacity ) :
				vec4( diffuse, opacity );
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
		basemapOptions: {
			type: Object,
			default: () => {

				return {
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
				};

			}
		}
	},
	watch: {
		tilesUrl: function ( val ) {

			this.reinitTiles();
			this.needsRerender = 1;

		},
		basemapOptions: function ( val ) {

			this.reinitBasemap();
			this.needsRerender = 1;

		},
		$route( to, from ) {

			this.setCameraPosFromRoute( to.query );

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

		this.needsRerender = 0;

		this.pointerCaster = {
			startClientX: 0,
			startClientY: 0
		};

		// debug
		this.lruCacheSize = 0;
		this.lruCacheMinSize = 175;
		this.lruCacheMaxSize = 250;

		this.pointIntensity = 0.4;
		this.directionalIntensity = 0.8;
		this.ambientIntensity = 0.5;

		this.dirX = 0.63;
		this.dirY = 1;
		this.dirZ = 0;

		this.meshShading = "normal";
		this.meshColor = "#7b8f9f";

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
		this.pane = null;

		this.markerName = "locationMarker";

		this.selectedObject = null;

	},
	mounted() {

		this.initScene();
		this.initTweakPane();

	},
	methods: {
		initTweakPane() {

			var el = document.getElementById( "debug-panel" );
			el.setAttribute( "style", "position: absolute; top: 3.75rem;right: 0.5rem;" );
			el.setAttribute( "class", "is-hidden-mobile" );
			this.pane = new Tweakpane( { title: 'debug', expanded: false, container: el } );

			// Camera
			const f3 = this.pane.addFolder( {
				expanded: false,
				title: 'Camera',
			} );
			f3.addInput( this, "nearPlane", { min: 1, max: 1000 } ).on( 'change', ( val ) => {

				this.camera.near = val; this.camera.updateProjectionMatrix();

			} );
			f3.addInput( this, "farPlane", { min: 100, max: 20000 } ).on( 'change', ( val ) => {

				this.camera.far = val; this.camera.updateProjectionMatrix();

			} );
			f3.addInput( this, "dummyFarPlane", { min: 100, max: 5000 } ).on( 'change', ( val ) => {

				this.dummyCamera.far = val; this.dummyCamera.updateProjectionMatrix();

			} );

			f3.addInput( this, "enableFog" ).on( 'change', ( val ) => val ? this.scene.fog = this.fog : this.scene.fog = null );
			f3.addInput( this, "fogDensity", { min: 0.0001, max: 0.01 } ).on( 'change', ( val ) => this.fog.density = val );
			f3.addInput( this, "fogColor" ).on( 'change', ( val ) => {

				this.fog.color.set( val ); this.scene.background.set( val );

			} );

			// Appearance
			const f4 = this.pane.addFolder( {
				expanded: false,
				title: 'Appearance',
			} );
			f4.addInput( this, "ambientIntensity", { min: 0, max: 2, step: 0.1 } ).on( 'change', ( val ) => {

				this.ambLight.intensity = val;

			} );
			f4.addInput( this, "directionalIntensity", { min: 0, max: 2, step: 0.1 } ).on( 'change', ( val ) => {

				this.dirLight.intensity = val;

			} );
			f4.addInput( this, "pointIntensity", { min: 0, max: 2, step: 0.1 } ).on( 'change', ( val ) => {

				this.pLight.intensity = val;

			} );
			const f5 = f4.addFolder( {
				expanded: false,
				title: 'PointLight dir',
			} ).on( 'change', ( val ) => this.dirLight.position.set( this.dirX, this.dirY, this.dirZ ) );
			f5.addInput( this, "dirX", { min: 0, max: 1, step: 0.01 } );
			f5.addInput( this, "dirY", { min: 0, max: 1, step: 0.01 } );
			f5.addInput( this, "dirZ", { min: 0, max: 1, step: 0.01 } );

			f4.addInput( this, "meshShading", { options: { normal: "normal", SSAO: "ssao" } } );
			f4.addInput( this, "meshColor" ).on( 'change', ( val ) => {

				this.material.uniforms.diffuse.value = new Color( val ).convertSRGBToLinear();
				this.highlightMaterial.uniforms.diffuse.value = new Color( val ).convertSRGBToLinear();

			} );

			// Misc
			const f6 = this.pane.addFolder( {
				expanded: false,
				title: 'Misc',
			} );
			f6.addInput( this, "castOnHover" );

			// stats
			const f7 = this.pane.addFolder( {
				expanded: true,
				title: 'Stats',
			} );
			f7.addMonitor( this.tiles.stats, "parsing" );
			f7.addMonitor( this.tiles.stats, "downloading" );
			f7.addMonitor( this.tiles.stats, "failed" );
			f7.addMonitor( this.tiles.stats, "inFrustum" );
			f7.addMonitor( this.tiles.stats, "used" );
			f7.addMonitor( this.tiles.stats, "active" );
			f7.addMonitor( this.tiles.stats, "visible" );
			f7.addMonitor( this, "lruCacheSize" );
			f7.addInput( this, "lruCacheMinSize", { min: 10, max: 500, step: 1 } )
				.on( 'change', ( val ) => {

					this.tiles.lruCache.minSize = val;

				} );
			f7.addInput( this, "lruCacheMaxSize", { min: 10, max: 500, step: 1 } )
				.on( 'change', ( val ) => {

					this.tiles.lruCache.maxSize = val;

				} );

			this.pane.on( "change", ( val ) => this.needsRerender = 1 );

		},
		setCameraPosFromRoute( q ) {

			let rd_x = parseFloat( q.rdx );
			let rd_y = parseFloat( q.rdy );
			let ox = parseFloat( q.ox );
			let oy = parseFloat( q.oy );
			let oz = parseFloat( q.oz );
			// compute local tileset coordinates

			if ( isNaN( rd_x ) ) {

				return;

			}
			let tileset_offset_x = this.tiles.root.cached.transform.elements[ 12 ];
			let tileset_offset_y = this.tiles.root.cached.transform.elements[ 13 ];
			let local_x = rd_x - tileset_offset_x;
			let local_y = 0;
			let local_z = - ( rd_y - tileset_offset_y );

			// move target and maintain the relative camera position
			this.controls.target.x = local_x;
			this.controls.target.z = local_z;
			this.camera.position.x = local_x + ox;
			this.camera.position.y = local_y + oy;
			this.camera.position.z = local_z + oz;

			this.controls.update();

			if ( q.placeMarker == "true" ) {

				this.placeMarkerOnPoint( new Vector3( local_x, local_y, local_z ) );

			}

		},
		setRouteFromCameraPos() {

			// compute current camera position relative to target
			let local_x = this.controls.target.x;
			let local_z = this.controls.target.z;
			let tileset_offset_x = this.tiles.root.cached.transform.elements[ 12 ];
			let tileset_offset_y = this.tiles.root.cached.transform.elements[ 13 ];

			// compute RD coordinates
			let RdX = local_x + tileset_offset_x;
			let RdY = ( - local_z ) + tileset_offset_y;

			let cam_offset = {
				x: this.camera.position.x - this.controls.target.x,
				y: this.camera.position.y - this.controls.target.y,
				z: this.camera.position.z - this.controls.target.z };

			// emit camera offset for url generation in the parent app
			this.$emit( 'cam-offset', cam_offset );
			// push values to url, catch errors (ie NavigationDuplicated, when pushin a route that is equal to the current route)
			this.$router.push(
				{ url: '/', query: { rdx: RdX, rdy: RdY, ox: cam_offset.x, oy: cam_offset.y, oz: cam_offset.z } }
			).catch( err => {} );

			// console.log( {rdx: RdX, rdy: RdY, cam_offset: cam_offset} );

		},
		placeMarkerOnPoint( position ) {

			var marker = this.scene.getObjectByName( this.markerName );

			if ( marker != "undefined" ) {

				this.scene.remove( marker );

			}

			var textureLoader = new TextureLoader();
			var map = textureLoader.load( markerSprite );
			var material = new SpriteMaterial( { map: map } );
			var sprite = new Sprite( material );

			// Render sprite on top of other objects & fixed size regardless of zoom
			material.depthWrite = false;
			material.depthTest = false;
			material.sizeAttenuation = false;

			sprite.position.set( position.x, position.y, position.z );
			sprite.scale.set( 0.04, 0.10, 1 );
			sprite.name = this.markerName;

			this.scene.add( sprite );

		},
		reinitTiles() {

			if ( this.tiles ) {

				this.offsetParent.remove( this.tiles.group );

			}

			this.tiles = new TilesRenderer( this.tilesUrl );
			this.tiles.lruCache.minSize = this.lruCacheMinSize;
			this.tiles.lruCache.maxSize = this.lruCacheMaxSize;

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
				if ( "rdx" in q && "rdy" in q && "ox" in q && "oy" in q && "oz" in q ) {

					this.setCameraPosFromRoute( q );

				} else {

					// default viewport
					this.setCameraPosFromRoute( {
						rdx: "85181.55571255696",
						rdy: "446859.38171179296",
						ox: "-223.36609616703936",
						oy: "281.19798302772574",
						oz: "-184.218705413541"
					} );

				}

				this.needsRerender = 2;

			};
			this.tiles.onLoadModel = ( s ) => {

				const offset_z = this.tiles.root.cached.transform.elements[ 14 ];
				s.traverse( c => {

					if ( c.material ) {

						c.material.dispose();
						c.material = this.material;

						if ( c.geometry ) {

							c.geometry.computeBoundingBox();
							c.position.y = offset_z;

						}

					}

				} );

				this.needsRerender = 1;

			};

			this.offsetParent.add( this.tiles.group );

		},
		reinitBasemap() {

			if ( this.terrainTiles ) {

				this.offsetParent.remove( this.terrainTiles.group );

			}

			if ( this.basemapOptions.type == "wms" ) {

				this.terrainTiles = new WMSTilesRenderer(
					this.basemapOptions.options.url,
					this.basemapOptions.options.layer,
					this.basemapOptions.options.style
				);

				// this.terrainTiles.imageFormat = this.basemapOptions.imageFormat;

			} else {

				this.terrainTiles = new WMTSTilesRenderer( this.basemapOptions.options, () => this.needsRerender = 1 );

			}

			this.offsetParent.add( this.terrainTiles.group );

			this.terrainTiles.onLoadTile = () => this.needsRerender = 1;

		},
		initScene() {

			this.scene = new Scene();
			this.scene.background = new Color( this.fogColor );
			this.fog = new FogExp2( this.fogColor, this.fogDensity );

			this.material = new ShaderMaterial( batchIdHighlightShaderMixin( ShaderLib.lambert ) );
			this.material.uniforms.diffuse.value = new Color( this.meshColor ).convertSRGBToLinear();

			this.highlightMaterial = new ShaderMaterial( batchIdHighlightShaderMixin( ShaderLib.lambert ) );
			this.highlightMaterial.uniforms.diffuse.value = new Color( this.meshColor ).convertSRGBToLinear();

			let canvas = document.getElementById( "canvas" );

			this.renderer = new WebGLRenderer( { antialias: false } );
			this.renderer.setPixelRatio( window.devicePixelRatio );
			this.renderer.setSize( canvas.clientWidth, canvas.clientHeight );
			this.renderer.setClearColor( 0xd9eefc );
			this.renderer.outputEncoding = sRGBEncoding;

			canvas.appendChild( this.renderer.domElement );

			this.camera = new PerspectiveCamera( 60, canvas.clientWidth / canvas.clientHeight, this.nearPlane, this.farPlane );
			this.camera.position.set( 400, 400, 400 );

			this.dummyCamera = new PerspectiveCamera( 30, canvas.clientWidth / canvas.clientHeight, this.nearPlane, this.dummyFarPlane );

			this.offsetParent = new Group();
			this.scene.add( this.offsetParent );

			this.box = new Box3();

			this.raycaster = new Raycaster();

			this.mouse = new Vector2();

			this.reinitTiles();

			this.controls = new OrbitControls( this.camera, this.renderer.domElement );
			this.controls.screenSpacePanning = false;
			this.controls.enableDamping = true;
			this.controls.dampingFactor = 0.15;
			this.controls.minDistance = 20;
			this.controls.maxDistance = 2500;
			this.controls.maxPolarAngle = 0.8;
			this.controls.mouseButtons = {
				LEFT: MOUSE.PAN,
				MIDDLE: MOUSE.DOLLY,
				RIGHT: MOUSE.ROTATE
			};
			this.controls.touches = {
				ONE: TOUCH.ROTATE,
				TWO: TOUCH.DOLLY_PAN
			};
			this.controls.addEventListener( "change", () => this.needsRerender = 1 );
			this.controls.addEventListener( "end", this.setRouteFromCameraPos );

			this.renderer.domElement.addEventListener( 'pointermove', this.onPointerMove, false );
			this.renderer.domElement.addEventListener( 'pointerdown', this.onPointerDown, false );
			this.renderer.domElement.addEventListener( 'pointerup', this.onPointerUp, false );
			this.renderer.domElement.addEventListener( 'pointerleave', this.onPointerLeave, false );

			this.composer = new EffectComposer( this.renderer );
			var ssaoPass = new SSAOPass( this.scene, this.camera, canvas.cliendWidth, canvas.clientHeight );
			ssaoPass.kernelRadius = 16;
			this.composer.addPass( ssaoPass );

			// lights
			this.pLight = new PointLight( 0xffffff, this.pointIntensity, 0, 1 );
			this.camera.add( this.pLight );
			this.scene.add( this.camera );

			this.dirLight = new DirectionalLight( 0xffffff, this.directionalIntensity );
			this.dirLight.position.set( this.dirX, this.dirY, this.dirZ );
			this.scene.add( this.dirLight );

			this.ambLight = new AmbientLight( 0xffffff, this.ambientIntensity );
			this.scene.add( this.ambLight );

			//this.hemLight = new HemisphereLight( 0xffffbb, 0x080820, 1 );
			//this.scene.add(this.hemLight);

			this.offsetParent.rotation.x = - Math.PI / 2;

			// this.reinitWms();

			this.reinitBasemap();

			this.needsRerender = 1;
			this.renderScene();

			window.addEventListener( 'resize', this.onWindowResize, false );

		},
		onWindowResize() {

			let canvas = document.getElementById( "canvas" );
			this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
			this.renderer.setSize( canvas.clientWidth, canvas.clientHeight );

			this.camera.updateProjectionMatrix();
			this.renderer.setPixelRatio( window.devicePixelRatio );

			this.needsRerender = 1;

		},
		onPointerMove( evt ) {

			if ( this.castOnHover ) {

				this.castRay( evt.clientX, evt.clientY );

			}

		},
		onPointerDown( evt ) {

			this.pointerCaster.startClientX = evt.clientX;
			this.pointerCaster.startClientY = evt.clientY;

		},
		onPointerUp( evt ) {

			if (
				this.pointerCaster.startClientX == evt.clientX &&
				this.pointerCaster.startClientY == evt.clientY
			) {

				this.castRay( evt.clientX, evt.clientY );

			}

		},
		castRay( clientX, clientY ) {

			const rect = this.renderer.domElement.getBoundingClientRect();
			this.mouse.x = ( ( clientX - rect.left ) / this.renderer.domElement.clientWidth ) * 2 - 1;
			this.mouse.y = - ( ( clientY - rect.top ) / this.renderer.domElement.clientHeight ) * 2 + 1;

			this.raycaster.setFromCamera( this.mouse, this.camera );

			// check if we are hitting the geocoding marker. Eearly return if that was the case.
			var marker = this.scene.getObjectByName( this.markerName );

			if ( marker != undefined ) {

				const results = this.raycaster.intersectObject( marker, true );

				if ( results.length && results[ 0 ].uv.y >= 0.5 ) {

					this.scene.remove( marker );
					this.needsRerender = 1;
					return;

				}

			}

			// check if we are hitting a building
			const results = this.raycaster.intersectObject( this.tiles.group, true );

			// Set up the highlighted batchid to the material of new object
			if ( this.selectedObject ) {

				this.selectedObject.material = this.material;
				this.selectedObject = undefined;

			}

			if ( results.length ) {

				const { face, object } = results[ 0 ];

				// Get info from batchTable
				const batch_id_table = object.geometry.getAttribute( '_batchid' );
				const batch_id = batch_id_table.getX( face.a );

				const batchTable = object.parent.batchTable;
				const keys = batchTable.getKeys();

				if ( keys.includes( "attributes" ) ) {

					const attributes = JSON.parse( batchTable.getData( "attributes" )[ batch_id ] );
					// eslint-disable-next-line no-console
					// console.log( attributes );
					this.$emit( 'object-picked', { "batchID": batch_id, "attributes": attributes } );

				}

				object.material = this.highlightMaterial;
				this.highlightMaterial.uniforms.highlightedBatchId.value = batch_id;
				this.selectedObject = object;

			} else {

				this.$emit( 'object-picked', undefined );

			}

			this.needsRerender = 1;

		},
		updateTerrain: throttle( function () {

			const transform = this.tiles.root.cached.transform;
			const sceneTransform = new Vector2( transform.elements[ 12 ], transform.elements[ 13 ] );

			this.terrainTiles.update( sceneTransform, this.camera );

		}, 200 ),
		renderScene() {

			requestAnimationFrame( this.renderScene );

			if ( this.needsRerender > 0 ) {

				this.needsRerender --;

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

				this.lruCacheSize = this.tiles.lruCache.itemSet.size;
				this.tiles.update();

				if ( this.tiles.root ) {

					this.updateTerrain();

				}

				if ( this.meshShading == "normal" ) {

					this.renderer.render( this.scene, this.camera );

				} else if ( this.meshShading == "ssao" ) {

					this.composer.render();

				}

			}

		},
	}
};
</script>

<style scoped>
#canvas {
  width: 100%;
  height: 100%;
}
</style>
