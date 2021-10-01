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
	SpriteMaterial,
	MeshBasicMaterial,
	Mesh,
	CylinderBufferGeometry,
	TorusBufferGeometry
} from 'three';
import {
	TilesRenderer
} from '3d-tiles-renderer';
import {
	WMSTilesRenderer,
	WMTSTilesRenderer
} from '../terrain-tiles';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import TWEEN from '@tweenjs/tween.js';
import markerSprite from '@/assets/locationmarker.png';

const Tweakpane = require( 'tweakpane' );
const TWEEN = require( '@tweenjs/tween.js' );

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
						url: 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0?',
						layer: 'standaard',
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
		this.lruCacheMinSize = 85;
		this.lruCacheMaxSize = 115;

		this.pointIntensity = 0.4;
		this.directionalIntensity = 0.8;
		this.ambientIntensity = 0.5;

		this.dirX = 0.63;
		this.dirY = 1;
		this.dirZ = 0;

		this.meshShading = "normal";
		this.meshColor = "#c4c8cf";

		this.nearPlane = 2;
		this.farPlane = 300000;
		this.dummyFarPlane = 3500;

		this.maxDistShowTiles = 1750 * 1750;
		this.show3DTiles = true;

		this.fog = null;
		this.enableFog = false;
		this.fogDensity = 0.0004;
		this.fogColor = '#eeeeee';

		this.errorTarget = 0;
		this.errorThreshold = 60;

		this.castOnHover = false;
		this.overrideCast = false; // Defines if we should override the original TilesRenderer raycasting

		this.showTerrain = true;
		this.pane = null;

		this.selectedObject = null;

		this.sceneTransform = null;

		this.rayIntersect = null;

	},
	mounted() {

		this.initScene();
		if ( process.env.NODE_ENV === 'development' ) {

			this.initTweakPane();

		}

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

			f4.addInput( this, "meshColor" ).on( 'change', ( val ) => {

				this.material.uniforms.diffuse.value = new Color( val ).convertSRGBToLinear();
				this.highlightMaterial.uniforms.diffuse.value = new Color( val ).convertSRGBToLinear();

			} );

			// Misc
			const f6 = this.pane.addFolder( {
				expanded: false,
				title: 'Misc',
			} );
			f6.addInput( this, "showTerrain" )
				.on( 'change', ( val ) => {

					if ( val ) {

						this.offsetParent.add( this.terrainTiles.group );

					} else {

						this.offsetParent.remove( this.terrainTiles.group );

					}

				} );
			f6.addInput( this, "castOnHover" );
			f6.addInput( this, "overrideCast" );

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

			if ( ! this.tiles.root ) {

				return;

			}

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
				delete q.placeMarker;

			}

		},
		setRouteFromCameraPos() {

			if ( ! this.tiles.root ) {

				return;

			}

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
			let q = Object.assign( {}, this.$router.currentRoute.query );
			q.rdx = RdX;
			q.rdy = RdY;
			q.ox = cam_offset.x;
			q.oy = cam_offset.y;
			q.oz = cam_offset.z;

			this.$router.push(
				{ url: '/', query: q }
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

			this.needsRerender = 1;

		},
		pointCameraToNorth() {

			// Position camera to the south of the point it's focusing on
			const centre = new Vector2( this.controls.target.x, this.controls.target.z );
			const pos = new Vector2( this.camera.position.x, this.camera.position.z );
			const radius = centre.distanceTo( pos );
			const x = radius * Math.cos( Math.PI / 2 ) + centre.x;
			const z = radius * Math.sin( Math.PI / 2 ) + centre.y;

			const oldPos = { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z };
			const newPos = { x: x, y: this.camera.position.y, z: z };

			function animate( time ) {

				requestAnimationFrame( animate );
				TWEEN.update( time );

			}

			requestAnimationFrame( animate );

			new TWEEN.Tween( oldPos )
				.to( newPos, 500 )
				.easing( TWEEN.Easing.Quadratic.Out )
				.onUpdate( () => {

					this.camera.position.x = oldPos.x;
					this.camera.position.z = oldPos.z;
					this.camera.lookAt( this.controls.target );

					this.needsRerender = 1;

				} )
				.start();

		},
		reinitTiles( init ) {

			if ( this.tiles ) {

				this.offsetParent.remove( this.tiles.group );

			}

			this.tiles = new TilesRenderer( this.tilesUrl );
			this.tiles.displayBoxBounds = true;
			this.tiles.colorMode = 7;
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

				if ( init ) {

					// Ensure the tileset is loaded prior to setting the position from the url parameters (we need the tileset transform to do that)
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

				}

				const transform = this.tiles.root.cached.transform;
				this.sceneTransform = new Vector3( transform.elements[ 12 ], transform.elements[ 13 ], transform.elements[ 14 ] );

				this.needsRerender = 2;

			};

			this.tiles.onLoadModel = ( s ) => {

				// const offset_z = this.tiles.root.cached.transform.elements[ 14 ];
				s.traverse( c => {

					if ( c.material ) {

						c.material.dispose();
						c.material = this.material;

						if ( c.geometry ) {

							c.geometry.computeBoundingBox();
							// c.position.y = offset_z;

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
			this.scene.background = new Color( "#000000" );
			this.fog = new FogExp2( this.fogColor, this.fogDensity );

			this.material = new ShaderMaterial( batchIdHighlightShaderMixin( ShaderLib.lambert ) );
			this.material.uniforms.diffuse.value = new Color( this.meshColor ).convertSRGBToLinear();

			this.highlightMaterial = new ShaderMaterial( batchIdHighlightShaderMixin( ShaderLib.lambert ) );
			this.highlightMaterial.uniforms.diffuse.value = new Color( this.meshColor ).convertSRGBToLinear();

			let canvas = document.getElementById( "canvas" );

			// enable AA only for non high DPI screens
			this.renderer = new WebGLRenderer( { antialias: window.devicePixelRatio > 1 ? false : true } );
			// this.renderer = new WebGLRenderer( { antialias: false } );
			this.renderer.setPixelRatio( window.devicePixelRatio );
			this.renderer.setSize( canvas.clientWidth, canvas.clientHeight );
			this.renderer.setClearColor( 0xd9eefc );
			this.renderer.outputEncoding = sRGBEncoding;
			this.renderer.autoClear = false;

			canvas.appendChild( this.renderer.domElement );

			this.camera = new PerspectiveCamera( 50, canvas.clientWidth / canvas.clientHeight, this.nearPlane, this.farPlane );
			this.camera.position.set( 400, 400, 400 );

			this.dummyCamera = new PerspectiveCamera( 30, canvas.clientWidth / canvas.clientHeight, this.nearPlane, this.dummyFarPlane );

			this.offsetParent = new Group();
			this.scene.add( this.offsetParent );

			this.box = new Box3();

			this.raycaster = new Raycaster();

			this.mouse = new Vector2();

			this.reinitTiles( true );
			this.show3DTiles = true;

			this.controls = new OrbitControls( this.camera, this.renderer.domElement );
			this.controls.screenSpacePanning = false;
			this.controls.enableDamping = true;
			this.controls.dampingFactor = 0.15;
			this.controls.minDistance = 20;
			this.controls.maxDistance = 150000;
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
			this.controls.addEventListener( "change", () => this.$emit( 'cam-rotation-z', this.camera.rotation.z ) );
			this.controls.addEventListener( "end", this.setRouteFromCameraPos );

			this.renderer.domElement.addEventListener( 'pointermove', this.onPointerMove, false );
			this.renderer.domElement.addEventListener( 'pointerdown', this.onPointerDown, false );
			this.renderer.domElement.addEventListener( 'pointerup', this.onPointerUp, false );
			this.renderer.domElement.addEventListener( 'pointerleave', this.onPointerLeave, false );

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

			this.rayIntersect = new Group();

			const rayIntersectMat = new MeshBasicMaterial( { color: 0xe91e63 } );
			const rayMesh = new Mesh( new CylinderBufferGeometry( 0.25, 0.25, 6 ), rayIntersectMat );
			rayMesh.rotation.x = Math.PI / 2;
			rayMesh.position.z += 3;
			this.rayIntersect.add( rayMesh );

			const rayRing = new Mesh( new TorusBufferGeometry( 1.5, 0.2, 16, 100 ), rayIntersectMat );
			this.rayIntersect.add( rayRing );
			this.scene.add( this.rayIntersect );
			this.rayIntersect.visible = false;


			this.offsetParent.rotation.x = - Math.PI / 2;

			this.reinitBasemap();

			this.needsRerender = 1;
			this.renderScene();

			window.addEventListener( 'resize', this.onWindowResize, false );

		},
		onWindowResize() {

			let canvas = document.getElementById( "canvas" );

			const width = canvas.clientWidth;
			const height = canvas.clientHeight;

			this.camera.aspect = width / height;
			this.renderer.setSize( width, height );

			this.camera.updateProjectionMatrix();
			this.renderer.setPixelRatio( window.devicePixelRatio );

			this.needsRerender = 1;

		},
		onPointerMove( evt ) {

			if ( this.castOnHover || evt.ctrlKey ) {

				let snapTolerance = 0;
				if ( evt.altKey ) {

					snapTolerance = 5;

				}

				this.castRay( evt.clientX, evt.clientY, snapTolerance );

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
		castRay( clientX, clientY, snapTolerance = 0 ) {

			const rect = this.renderer.domElement.getBoundingClientRect();
			this.mouse.x = ( ( clientX - rect.left ) / this.renderer.domElement.clientWidth ) * 2 - 1;
			this.mouse.y = - ( ( clientY - rect.top ) / this.renderer.domElement.clientHeight ) * 2 + 1;

			this.raycaster.setFromCamera( this.mouse, this.camera );

			// check if we are hitting the geocoding marker. Eearly return if that was the case.
			const marker = this.scene.getObjectByName( this.markerName );

			if ( marker != undefined ) {

				const results = this.raycaster.intersectObject( marker, true );

				if ( results.length && results[ 0 ].uv.y >= 0.5 ) {

					this.scene.remove( marker );
					this.needsRerender = 1;
					return;

				}

			}

			// check if we are hitting a building
			let results = [];

			if ( this.overrideCast ) {

				for ( let i = 0; i < this.tiles.group.children.length; i ++ ) {

					const c = this.tiles.group.children[ i ].children[ 0 ];
					Object.getPrototypeOf( c ).raycast.call( c, this.raycaster, results );

				}

				results.sort( ( a, b ) => a.distance - b.distance );

			} else {

				results = this.raycaster.intersectObject( this.tiles.group, true );

			}

			// Set up the highlighted batchid to the material of new object
			if ( this.selectedObject ) {

				this.selectedObject.material = this.material;
				this.selectedObject = undefined;

			}

			if ( results.length ) {

				const { face, point, object } = results[ 0 ];

				let closestPoint = null;

				if ( snapTolerance > 0 ) {

					// Snap to closest point
					const position = object.geometry.getAttribute( 'position' );
					const m = object.matrixWorld;
					const points = [
						new Vector3( position.getX( face.a ), position.getY( face.a ), position.getZ( face.a ) ).applyMatrix4( m ),
						new Vector3( position.getX( face.b ), position.getY( face.b ), position.getZ( face.b ) ).applyMatrix4( m ),
						new Vector3( position.getX( face.c ), position.getY( face.c ), position.getZ( face.c ) ).applyMatrix4( m )
					];
					let dist = snapTolerance;
					for ( let i = 0; i < 3; i ++ ) {

						const newDist = point.distanceTo( points[ i ] );
						if ( newDist < dist ) {

							closestPoint = points[ i ];
							dist = newDist;

						}

					}

					if ( closestPoint === null ) {

						closestPoint = point;

					}

				} else {

					closestPoint = point;

				}

				// Compute and show a marker at the intersection point
				this.rayIntersect.position.copy( closestPoint );
				const normal = face.normal;
				normal.transformDirection( object.matrixWorld );
				this.rayIntersect.lookAt(
					closestPoint.x + normal.x,
					closestPoint.y + normal.y,
					closestPoint.z + normal.z
				);

				const azimuthAngle = normal.angleTo( new Vector3( 0, 1, 0 ) ) * 180 / Math.PI;

				this.rayIntersect.visible = true;

				// Get the active tile
				const info = this.getTileInformationFromActiveObject( object );

				// Get info from batchTable
				const batch_id_table = object.geometry.getAttribute( '_batchid' );
				const batch_id = batch_id_table.getX( face.a );

				const batchTable = object.parent.batchTable;
				const keys = batchTable.getKeys();

				if ( keys.includes( "attributes" ) ) {

					const attributes = JSON.parse( batchTable.getData( "attributes" )[ batch_id ] );
					const tileID = info.id.replace( /^.*[\\\/]/, '' ).replace( '.b3dm', '' );
					const pz = closestPoint.y;
					this.$emit( 'object-picked', {
						"batchID": batch_id,
						tileID,
						pz,
						azimuthAngle,
						attributes
					} );

				}

				object.material = this.highlightMaterial;
				this.highlightMaterial.uniforms.highlightedBatchId.value = batch_id;
				this.selectedObject = object;

			} else {

				this.$emit( 'object-picked', undefined );
				this.rayIntersect.visible = false;

			}

			this.needsRerender = 1;

		},
		getTileInformationFromActiveObject( object ) {

			// Find which tile this scene is associated with. This is slow and
			// intended for debug purposes only.
			let targetTile = null;
			const activeTiles = this.tiles.activeTiles;
			activeTiles.forEach( tile => {

				if ( targetTile ) {

					return true;

				}

				const scene = tile.cached.scene;
				if ( scene ) {

					scene.traverse( c => {

						if ( c === object ) {

							targetTile = tile;

						}

					} );

				}

			} );

			if ( targetTile ) {

				return {

					distanceToCamera: targetTile.cached.distance,
					geometricError: targetTile.geometricError,
					screenSpaceError: targetTile.__error,
					depth: targetTile.__depth,
					isLeaf: targetTile.__isLeaf,
					id: targetTile.content.uri

				};

			} else {

				return null;

			}

		},
		renderScene( ) {

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

				const camdist = this.camera.position.distanceToSquared( this.controls.target );

				if ( camdist < 1750 * 1750 ) {

					this.tiles.update();

					if ( ! this.show3DTiles ) {

						this.offsetParent.add( this.tiles.group );
						this.show3DTiles = true;

					}

				} else {

					if ( this.show3DTiles ) {

						this.offsetParent.remove( this.tiles.group );
						this.show3DTiles = false;

					}

				}

				if ( this.sceneTransform ) {

					if ( this.showTerrain ) {

						this.terrainTiles.update( this.sceneTransform, this.camera );

					}

				}

				// this.offsetParent.remove( this.terrainTiles.group );

				// this.renderer.autoClear is set to false, so we need to clear manually. Because don't want to clear when second scene is rendered.
				this.renderer.clear();
				this.renderer.render( this.scene, this.camera );

				// this.offsetParent.add( this.terrainTiles.group );

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
