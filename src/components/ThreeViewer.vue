<template>
  <div id="canvas">
    <div
      v-if="tilesError"
      class="tiles-error"
      role="status"
    >
      <strong>{{ $t( 'viewer.threeDUnavailable' ) }}</strong>
      <span>{{ $t( 'viewer.threeDUnavailableDescription' ) }}</span>
    </div>
  </div>
</template>

<script>
import {
	AmbientLight,
	Clock,
	Color,
	CylinderGeometry,
	DirectionalLight,
	FogExp2,
	Group,
	LinearToneMapping,
	Matrix3,
	Mesh,
	MeshBasicMaterial,
	MeshLambertMaterial,
	PerspectiveCamera,
	PointLight,
	Raycaster,
	Scene,
	Sprite,
	SpriteMaterial,
	SRGBColorSpace,
	TextureLoader,
	TorusGeometry,
	Vector2,
	Vector3,
	WebGLRenderer
} from 'three';
import {
	GlobeControls,
	TilesRenderer,
	WGS84_ELLIPSOID
} from '3d-tiles-renderer/three';
import {
	GLTFExtensionsPlugin,
	ImageOverlayPlugin,
	QuantizedMeshPlugin,
	WMTSCapabilitiesLoader,
	WMTSTilesOverlay
} from '3d-tiles-renderer/three/plugins';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import markerSprite from '@/assets/locationmarker.png';
import { appConfig } from '@/config';
import {
	cameraFrameToRoute,
	getCompassRotation,
	getNorthFacingCameraPosition,
	getWorldFrame,
	routeToCameraFrame,
	worldToCartographic
} from '@/utils/globeCoordinates';
import {
	getHeightAboveFeatureBase,
	getPreferredHighlightAttribute,
	getSemanticFeature
} from '@/utils/semanticFeatures';

const Tweakpane = require( 'tweakpane' );
const TWEEN = require( '@tweenjs/tween.js' );
const HIGHLIGHT_COLOR = 0xFFC107;
const BUILDING_ERROR_TARGET = 48;
const BUILDING_MAX_VIEW_DISTANCE = 1750;
const TERRAIN_ERROR_TARGET = 8;
const WMTS_TEXTURE_RESOLUTION = 768;
const WMTS_MAX_ZOOM_LEVEL = 18;
const PICKER_LOCAL_NORMAL = new Vector3( 0, 0, 1 );
const pickerNormalMatrix = new Matrix3();

function disposeMaterial( material ) {

	if ( Array.isArray( material ) ) {

		material.forEach( item => item.dispose() );

	} else if ( material ) {

		material.dispose();

	}

}

function getCapabilitiesUrl( url ) {

	const serviceUrl = url.replace( /[?&]+$/, '' );
	const separator = serviceUrl.includes( '?' ) ? '&' : '?';
	return `${ serviceUrl }${ separator }service=WMTS&request=GetCapabilities&version=1.0.0`;

}

export default {
	name: 'ThreeViewer',
	props: {
		tilesUrl: {
			type: String,
			default: appConfig.dataUrl + '/v20250903/cesium3dtiles/lod22/tileset.json'
		},
		basemapOptions: {
			type: Object,
			default: () => {

				return {
					type: 'wmts',
					options: {
						url: appConfig.brtUrl,
						layer: 'standaard',
						style: 'default',
						tileMatrixSet: 'EPSG:3857',
						format: 'image/png'
					}
				};

			}
		}
	},
	data() {

		return {
			tilesError: null
		};

	},
	watch: {
		tilesUrl() {

			this.reinitTiles();

		},
		basemapOptions() {

			this.reinitBasemap();

		},
		$route( to ) {

			if ( ! this.ignoreRouteCameraUpdate ) this.setCameraPosFromRoute( to.query );

		}
	},
	beforeCreate() {

		this.renderer = null;
		this.scene = null;
		this.contentGroup = null;
		this.controlsSurface = null;
		this.camera = null;
		this.controls = null;
		this.tiles = null;
		this.terrainTiles = null;
		this.raycaster = null;
		this.mouse = null;
		this.rayIntersect = null;
		this.selectedObject = null;
		this.modelRoots = new WeakMap();
		this.viewPivot = new Vector3();
		this.viewPivotValid = false;
		this.viewPivotDirty = true;
		this.compassNeedsUpdate = true;
		this.buildingsVisible = true;
		this.needsRerender = 0;
		this.animationFrame = null;
		this.clock = new Clock();
		this.basemapGeneration = 0;
		this.selectionGeneration = 0;
		this.locationTimer = null;
		this.routeUpdateTimer = null;
		this.ignoreRouteCameraUpdate = false;
		this.markerName = 'geocoding-marker';
		this.pointerCaster = { startClientX: 0, startClientY: 0 };

		this.pointIntensity = 0.6;
		this.directionalIntensity = 1.15;
		this.ambientIntensity = 1.5;
		this.exposure = 1.15;
		this.dirX = 1;
		this.dirY = - 0.5;
		this.dirZ = 1.5;
		this.meshColor = '#c4c8cf';
		this.enableFog = false;
		this.fogDensity = 0.0000004;
		this.fogColor = '#eeeeee';
		this.castOnHover = false;
		this.showTerrain = true;
		this.pane = null;
		this.lruCacheSize = 0;

	},
	mounted() {

		this.initScene();
		if ( process.env.NODE_ENV === 'development' ) this.initTweakPane();

	},
	beforeDestroy() {

		this.disposeScene();

	},
	methods: {
		initTweakPane() {

			const el = document.getElementById( 'debug-panel' );
			if ( ! el || ! this.tiles ) return;
			el.setAttribute( 'style', 'position: absolute; top: 0.5rem;right: 0.5rem;' );
			el.setAttribute( 'class', 'is-hidden-mobile' );
			this.pane = new Tweakpane( { title: 'debug', expanded: false, container: el } );

			const appearance = this.pane.addFolder( { expanded: false, title: 'Appearance' } );
			appearance.addInput( this, 'ambientIntensity', { min: 0, max: 2, step: 0.1 } )
				.on( 'change', value => this.ambLight.intensity = value );
			appearance.addInput( this, 'directionalIntensity', { min: 0, max: 2, step: 0.1 } )
				.on( 'change', value => this.dirLight.intensity = value );
			appearance.addInput( this, 'pointIntensity', { min: 0, max: 2, step: 0.1 } )
				.on( 'change', value => this.pLight.intensity = value );
			appearance.addInput( this, 'exposure', { min: 0.5, max: 2, step: 0.05 } )
				.on( 'change', value => this.renderer.toneMappingExposure = value );
			appearance.addInput( this, 'meshColor' ).on( 'change', value => this.setMeshColor( value ) );

			const misc = this.pane.addFolder( { expanded: false, title: 'Misc' } );
			misc.addInput( this, 'showTerrain' ).on( 'change', value => this.setTerrainVisibility( value ) );
			misc.addInput( this, 'castOnHover' );

			const stats = this.pane.addFolder( { expanded: true, title: 'Stats' } );
			[ 'parsing', 'downloading', 'failed', 'inFrustum', 'used', 'active', 'visible' ]
				.forEach( key => stats.addMonitor( this.tiles.stats, key ) );
			stats.addMonitor( this, 'lruCacheSize' );
			this.pane.on( 'change', () => this.requestRender() );

		},
		setMeshColor( color ) {

			if ( ! this.tiles ) return;
			this.tiles.forEachLoadedModel( scene => {

				scene.traverse( child => {

					const materials = Array.isArray( child.material ) ? child.material : [ child.material ];
					materials.filter( Boolean ).forEach( material => {

						if ( material.color ) material.color.set( color );

					} );

				} );

			} );
			this.requestRender();

		},
		setTerrainVisibility( visible ) {

			if ( ! this.terrainTiles ) return;
			if ( visible ) {

				this.contentGroup.add( this.terrainTiles.group );
				this.setNavigationSurface( this.terrainTiles.group );

			} else {

				this.contentGroup.remove( this.terrainTiles.group );
				this.setNavigationSurface();

			}
			this.requestRender();

		},
		setNavigationSurface( surface = null ) {

			if ( ! this.controls ) return;
			this.controls.setScene( surface || this.controlsSurface );
			this.viewPivotDirty = true;
			this.compassNeedsUpdate = true;

		},
		requestRender() {

			this.needsRerender = Math.max( this.needsRerender, 2 );

		},
		getTilesFrame() {

			if ( ! this.tiles || ! this.tiles.root ) return null;
			return {
				ellipsoid: this.tiles.ellipsoid,
				group: this.tiles.group
			};

		},
		updateViewPivot() {

			if ( ! this.controls ) return null;
			const pivot = this.controls.getPivotPoint( this.viewPivot );
			this.viewPivotValid = pivot !== null;
			this.viewPivotDirty = false;
			return pivot;

		},
		getViewPivot() {

			if ( this.viewPivotDirty || ! this.viewPivotValid ) return this.updateViewPivot();
			return this.viewPivot;

		},
		setViewPivot( pivot ) {

			this.viewPivot.copy( pivot );
			this.viewPivotValid = true;
			this.viewPivotDirty = false;

		},
		setCameraPosFromRoute( query ) {

			if ( this.routeUpdateTimer !== null ) {

				window.clearTimeout( this.routeUpdateTimer );
				this.routeUpdateTimer = null;

			}
			const tilesFrame = this.getTilesFrame();
			if ( ! tilesFrame || ! this.controls ) return;
			const frame = routeToCameraFrame( tilesFrame.ellipsoid, tilesFrame.group, query );
			if ( ! frame ) return;

			this.camera.position.copy( frame.cameraPosition );
			this.camera.up.copy( frame.up );
			this.camera.lookAt( frame.target );
			this.camera.updateMatrixWorld();
			this.controls.resetState();
			this.controls.update( 0 );
			this.setViewPivot( frame.target );
			this.compassNeedsUpdate = false;

			if ( query.placeMarker === 'true' ) this.placeMarkerOnPoint( frame.target );
			this.emitCompassRotation( frame.target );
			this.requestRender();

		},
		setRouteFromCameraPos() {

			const tilesFrame = this.getTilesFrame();
			if ( ! tilesFrame || ! this.controls ) return;
			const target = this.getViewPivot();
			if ( ! target ) return;
			const route = cameraFrameToRoute(
				tilesFrame.ellipsoid,
				tilesFrame.group,
				this.camera.position,
				target
			);
			const cameraOffset = { x: route.ox, y: route.oy, z: route.oz };
			this.$emit( 'cam-offset', cameraOffset );

			const query = Object.assign( {}, this.$router.currentRoute.query, route );
			delete query.placeMarker;
			this.ignoreRouteCameraUpdate = true;
			this.$router.push( { url: '/', query } )
				.catch( () => {} )
				.finally( () => {

					this.$nextTick( () => {

						this.ignoreRouteCameraUpdate = false;

					} );

				} );

		},
		scheduleRouteUpdate() {

			if ( this.routeUpdateTimer !== null ) window.clearTimeout( this.routeUpdateTimer );
			this.routeUpdateTimer = window.setTimeout( () => {

				this.routeUpdateTimer = null;
				this.setRouteFromCameraPos();

			}, 250 );

		},
		placeMarkerOnPoint( position ) {

			this.removeMarker();
			const map = new TextureLoader().load( markerSprite, () => this.requestRender() );
			const material = new SpriteMaterial( {
				map,
				depthWrite: false,
				depthTest: false,
				sizeAttenuation: false
			} );
			const sprite = new Sprite( material );
			sprite.position.copy( position );
			sprite.scale.set( 0.04, 0.10, 1 );
			sprite.name = this.markerName;
			this.scene.add( sprite );
			this.requestRender();

		},
		removeMarker() {

			if ( ! this.scene ) return;
			const marker = this.scene.getObjectByName( this.markerName );
			if ( ! marker ) return;
			this.scene.remove( marker );
			if ( marker.material.map ) marker.material.map.dispose();
			marker.material.dispose();

		},
		pointCameraToNorth() {

			const tilesFrame = this.getTilesFrame();
			if ( ! tilesFrame || ! this.controls ) return;
			const target = this.getViewPivot();
			if ( ! target ) return;
			const newPosition = getNorthFacingCameraPosition(
				tilesFrame.ellipsoid,
				tilesFrame.group,
				this.camera.position,
				target
			);
			const cartographic = worldToCartographic( tilesFrame.ellipsoid, tilesFrame.group, target );
			const up = getWorldFrame(
				tilesFrame.ellipsoid,
				tilesFrame.group,
				cartographic.lat,
				cartographic.lon
			).up;
			const tweenPosition = this.camera.position.clone();
			this.controls.enabled = false;
			new TWEEN.Tween( tweenPosition )
				.to( newPosition, 600 )
				.easing( TWEEN.Easing.Quadratic.Out )
				.onUpdate( () => {

					this.camera.position.copy( tweenPosition );
					this.camera.up.copy( up );
					this.camera.lookAt( target );
					this.requestRender();

				} )
				.onComplete( () => {

					this.controls.enabled = true;
					this.controls.resetState();
					this.emitCompassRotation( target );
					this.setRouteFromCameraPos();

				} )
				.start();

		},
		emitCompassRotation( target = null ) {

			const tilesFrame = this.getTilesFrame();
			if ( ! tilesFrame || ! this.controls ) return;
			target = target || this.getViewPivot();
			if ( ! target ) return;
			const rotation = getCompassRotation(
				tilesFrame.ellipsoid,
				tilesFrame.group,
				this.camera,
				target
			);
			this.$emit( 'cam-rotation-z', rotation );

		},
		createFeatureMaterial( object ) {

			let highlightAttribute = null;
			try {

				highlightAttribute = getPreferredHighlightAttribute( object );

			} catch ( error ) {

				console.warn( 'Unable to prepare semantic highlighting.', error );

			}
			const material = new MeshLambertMaterial( { color: this.meshColor } );
			if ( ! highlightAttribute || ! object.geometry.getAttribute( highlightAttribute ) ) return material;

			const highlightedFeatureId = { value: - 1 };
			material.userData.highlightedFeatureId = highlightedFeatureId;
			material.userData.highlightAttribute = highlightAttribute;
			material.onBeforeCompile = shader => {

				shader.uniforms.highlightedFeatureId = highlightedFeatureId;
				shader.uniforms.highlightColor = { value: new Color( HIGHLIGHT_COLOR ) };
				shader.vertexShader = `
					attribute float ${ highlightAttribute };
					varying float semanticFeatureId;
				` + shader.vertexShader.replace(
					'#include <begin_vertex>',
					`#include <begin_vertex>
					semanticFeatureId = ${ highlightAttribute };`
				);
				shader.fragmentShader = `
					varying float semanticFeatureId;
					uniform float highlightedFeatureId;
					uniform vec3 highlightColor;
				` + shader.fragmentShader.replace(
					'vec4 diffuseColor = vec4( diffuse, opacity );',
					`vec4 diffuseColor =
						abs( semanticFeatureId - highlightedFeatureId ) < 0.5 ?
						vec4( highlightColor, opacity ) : vec4( diffuse, opacity );`
				);

			};
			material.customProgramCacheKey = () => `semantic-highlight-${ highlightAttribute }`;
			return material;

		},
		handleLoadModel( event ) {

			event.scene.traverse( child => {

				this.modelRoots.set( child, event.scene );
				if ( ! child.isMesh || ! child.material ) return;
				const originalMaterial = child.material;
				child.material = Array.isArray( originalMaterial ) ?
					originalMaterial.map( () => this.createFeatureMaterial( child ) ) :
					this.createFeatureMaterial( child );
				disposeMaterial( originalMaterial );

			} );
			this.requestRender();

		},
		clearSelection() {

			if ( ! this.selectedObject ) return;
			const materials = Array.isArray( this.selectedObject.material ) ?
				this.selectedObject.material : [ this.selectedObject.material ];
			materials.filter( Boolean ).forEach( material => {

				if ( material.userData.highlightedFeatureId ) {

					material.userData.highlightedFeatureId.value = - 1;

				}

			} );
			this.selectedObject = null;

		},
		highlightFeature( object, semanticFeature ) {

			const materials = Array.isArray( object.material ) ? object.material : [ object.material ];
			let highlighted = false;
			materials.filter( Boolean ).forEach( material => {

				if (
					material.userData.highlightedFeatureId &&
					material.userData.highlightAttribute === semanticFeature.highlightAttribute
				) {

					material.userData.highlightedFeatureId.value = semanticFeature.featureId;
					highlighted = true;

				}

			} );
			if ( highlighted ) this.selectedObject = object;

		},
		reinitTiles( initializeCamera = false ) {

			this.clearSelection();
			this.selectionGeneration ++;
			if ( this.tiles ) {

				this.contentGroup.remove( this.tiles.group );
				this.tiles.dispose();

			}

			this.tilesError = null;
			this.viewPivotValid = false;
			this.viewPivotDirty = true;
			this.compassNeedsUpdate = true;
			this.buildingsVisible = true;
			const tiles = new TilesRenderer( this.tilesUrl );
			this.tiles = tiles;
			tiles.errorTarget = BUILDING_ERROR_TARGET;
			tiles.loadAncestors = false;
			tiles.loadSiblings = false;
			tiles.registerPlugin( new GLTFExtensionsPlugin( {
				metadata: true,
				meshoptDecoder: MeshoptDecoder
			} ) );
			tiles.setCamera( this.camera );
			tiles.setResolutionFromRenderer( this.camera, this.renderer );
			tiles.addEventListener( 'needs-update', () => this.requestRender() );
			tiles.addEventListener( 'load-model', event => {

				if ( this.tiles === tiles ) this.handleLoadModel( event );

			} );
			tiles.addEventListener( 'dispose-model', event => {

				if ( this.selectedObject && event.scene.getObjectById( this.selectedObject.id ) ) {

					this.clearSelection();

				}

			} );
			tiles.addEventListener( 'load-error', event => {

				if ( this.tiles !== tiles ) return;
				if ( event.tile === null ) {

					this.tilesError = event.error;
					this.$emit( 'object-picked', undefined );

				} else {

					console.warn( `Failed to load 3D Tiles content: ${ event.url }`, event.error );

				}
				this.requestRender();

			} );
			tiles.addEventListener( 'load-root-tileset', () => {

				if ( this.tiles !== tiles ) return;
				this.controls.setEllipsoid( tiles.ellipsoid, tiles.group );
				this.viewPivotDirty = true;
				this.compassNeedsUpdate = true;
				if ( initializeCamera ) this.initializeCameraPosition();
				this.requestRender();

			} );
			this.contentGroup.add( tiles.group );
			this.requestRender();

		},
		initializeCameraPosition() {

			const query = this.$router.currentRoute.query;
			if ( [ 'rdx', 'rdy', 'ox', 'oy', 'oz' ].every( key => key in query ) ) {

				this.setCameraPosFromRoute( query );
				return;

			}

			const landmarks = this.$root.$data.landmarkLocations;
			const keys = Object.keys( landmarks );
			const landmark = landmarks[ keys[ keys.length * Math.random() << 0 ] ];
			this.$parent.$data.locationBoxText = landmark.name;
			this.$parent.$data.showLocationBox = true;
			this.setCameraPosFromRoute( landmark );

			const started = Date.now();
			this.locationTimer = window.setInterval( () => {

				const elapsed = Date.now() - started;
				const stop = ( this.tiles.stats.downloading <= 2 && elapsed >= 10000 ) || elapsed > 25000;
				if ( stop ) {

					this.$parent.$data.showLocationBox = false;
					window.clearInterval( this.locationTimer );
					this.locationTimer = null;

				}

			}, 2000 );

		},
		async createBasemapOverlay() {

			if ( this.basemapOptions.type !== 'wmts' ) return null;
			const options = this.basemapOptions.options;
			const capabilities = await new WMTSCapabilitiesLoader().loadAsync( getCapabilitiesUrl( options.url ) );
			const layer = capabilities.layers.find( item => item.identifier === options.layer );
			if ( ! layer ) throw new Error( `WMTS layer "${ options.layer }" was not found.` );
			const tileMatrixSet = layer.tileMatrixSets.find( item => {

				return item && ( item.identifier === options.tileMatrixSet || /:3857$/i.test( item.supportedCRS ) );

			} );
			if ( ! tileMatrixSet ) throw new Error( `WMTS layer "${ options.layer }" has no EPSG:3857 matrix set.` );

			return new WMTSTilesOverlay( {
				url: options.url.replace( /[?&]+$/, '' ),
				layer: options.layer,
				tileMatrixSet: tileMatrixSet.identifier,
				style: options.style || 'default',
				format: options.format || layer.format,
				tileMatrices: tileMatrixSet.tileMatrices.slice( 0, WMTS_MAX_ZOOM_LEVEL + 1 ),
				projection: 'EPSG:3857',
				contentBoundingBox: layer.boundingBox && layer.boundingBox.bounds
			} );

		},
		async reinitBasemap() {

			const generation = ++ this.basemapGeneration;
			if ( this.terrainTiles ) {

				this.setNavigationSurface();
				this.contentGroup.remove( this.terrainTiles.group );
				this.terrainTiles.dispose();
				this.terrainTiles = null;

			}

			let overlay = null;
			try {

				overlay = await this.createBasemapOverlay();

			} catch ( error ) {

				console.warn( 'Unable to load the selected basemap; using untextured terrain.', error );

			}
			if ( generation !== this.basemapGeneration ) return;
			this.installTerrainRenderer( overlay );

		},
		installTerrainRenderer( overlay ) {

			if ( this.terrainTiles ) {

				this.setNavigationSurface();
				this.contentGroup.remove( this.terrainTiles.group );
				this.terrainTiles.dispose();

			}
			const terrainTiles = new TilesRenderer( `${ appConfig.terrainUrl }/` );
			terrainTiles.errorTarget = TERRAIN_ERROR_TARGET;
			terrainTiles.registerPlugin( new QuantizedMeshPlugin( {
				useRecommendedSettings: false
			} ) );
			if ( overlay ) {

				terrainTiles.registerPlugin( new ImageOverlayPlugin( {
					overlays: [ overlay ],
					resolution: WMTS_TEXTURE_RESOLUTION,
					enableTileSplitting: false
				} ) );

			}
			terrainTiles.setCamera( this.camera );
			terrainTiles.setResolutionFromRenderer( this.camera, this.renderer );
			terrainTiles.addEventListener( 'needs-update', () => this.requestRender() );
			terrainTiles.addEventListener( 'load-error', event => {

				if ( this.terrainTiles !== terrainTiles ) return;
				const source = event.overlay ? 'basemap imagery' : 'quantized-mesh terrain';
				console.warn( `Failed to load ${ source }: ${ event.url || appConfig.terrainUrl }`, event.error );

			} );
			this.terrainTiles = terrainTiles;
			if ( this.showTerrain ) {

				this.contentGroup.add( terrainTiles.group );
				this.setNavigationSurface( terrainTiles.group );

			}
			this.requestRender();

		},
		initScene() {

			this.scene = new Scene();
			this.scene.background = new Color( '#d9eefc' );
			this.fog = new FogExp2( this.fogColor, this.fogDensity );
			this.contentGroup = new Group();
			this.scene.add( this.contentGroup );
			// Start with an empty navigation surface so controls can fall back to the
			// ellipsoid. Once terrain is installed this is replaced by the terrain-only
			// tiles group, keeping dense building meshes out of navigation raycasts.
			this.controlsSurface = new Group();
			const canvas = this.$el;
			this.renderer = new WebGLRenderer( { antialias: window.devicePixelRatio <= 1 } );
			this.renderer.setPixelRatio( window.devicePixelRatio );
			this.renderer.setSize( canvas.clientWidth, canvas.clientHeight );
			this.renderer.outputColorSpace = SRGBColorSpace;
			this.renderer.toneMapping = LinearToneMapping;
			this.renderer.toneMappingExposure = this.exposure;
			this.renderer.domElement.style.display = 'block';
			canvas.appendChild( this.renderer.domElement );

			this.camera = new PerspectiveCamera( 50, canvas.clientWidth / canvas.clientHeight, 1, 30000000 );
			const initial = WGS84_ELLIPSOID.getCartographicToPosition( 0.91, 0.09, 250000, new Vector3() );
			this.camera.position.copy( initial );
			this.camera.lookAt( new Vector3() );
			this.camera.updateMatrixWorld();

			this.controls = new GlobeControls( this.controlsSurface, this.camera, this.renderer.domElement );
			this.controls.setEllipsoid( WGS84_ELLIPSOID, this.contentGroup );
			this.controls.enableDamping = true;
			this.controls.dampingFactor = 0.15;
			this.controls.minDistance = 10;
			this.controls.maxDistance = 1000000;
			this.controls.adjustHeight = false;
			this.onControlsChange = () => {

				this.viewPivotDirty = true;
				this.compassNeedsUpdate = true;
				this.scheduleRouteUpdate();
				this.requestRender();

			};
			this.controls.addEventListener( 'change', this.onControlsChange );

			this.raycaster = new Raycaster();
			this.mouse = new Vector2();
			this.renderer.domElement.addEventListener( 'pointermove', this.onPointerMove, false );
			this.renderer.domElement.addEventListener( 'pointerdown', this.onPointerDown, false );
			this.renderer.domElement.addEventListener( 'pointerup', this.onPointerUp, false );
			this.renderer.domElement.addEventListener( 'pointerleave', this.onPointerLeave, false );

			this.pLight = new PointLight( 0xffffff, this.pointIntensity, 0, 1 );
			this.camera.add( this.pLight );
			this.scene.add( this.camera );
			this.dirLight = new DirectionalLight( 0xffffff, this.directionalIntensity );
			this.dirLight.position.set( this.dirX, this.dirY, this.dirZ );
			this.scene.add( this.dirLight );
			this.ambLight = new AmbientLight( 0xffffff, this.ambientIntensity );
			this.scene.add( this.ambLight );

			this.rayIntersect = new Mesh();
			const rayIntersectMaterial = new MeshBasicMaterial( { color: 0xe91e63 } );
			const rayMesh = new Mesh( new CylinderGeometry( 0.25, 0.25, 6 ), rayIntersectMaterial );
			rayMesh.rotation.x = Math.PI / 2;
			rayMesh.position.z += 3;
			this.rayIntersect.add( rayMesh );
			const rayRing = new Mesh( new TorusGeometry( 1.5, 0.2, 16, 100 ), rayIntersectMaterial );
			rayRing.position.z = 0.05;
			this.rayIntersect.add( rayRing );
			this.rayIntersect.visible = false;
			this.scene.add( this.rayIntersect );

			this.reinitTiles( true );
			this.reinitBasemap();
			this.requestRender();
			this.renderScene();
			window.addEventListener( 'resize', this.onWindowResize, false );

		},
		onWindowResize() {

			const width = this.$el.clientWidth;
			const height = this.$el.clientHeight;
			this.camera.aspect = width / height;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize( width, height );
			this.renderer.setPixelRatio( window.devicePixelRatio );
			if ( this.tiles ) this.tiles.setResolutionFromRenderer( this.camera, this.renderer );
			if ( this.terrainTiles ) this.terrainTiles.setResolutionFromRenderer( this.camera, this.renderer );
			this.requestRender();

		},
		onPointerMove( event ) {

			if ( this.tilesError || ! this.buildingsVisible ) return;
			if ( this.castOnHover || event.ctrlKey ) this.castRay( event.clientX, event.clientY, event.altKey ? 5 : 0 );

		},
		onPointerDown( event ) {

			if ( this.tilesError || ! this.buildingsVisible ) return;
			this.pointerCaster.startClientX = event.clientX;
			this.pointerCaster.startClientY = event.clientY;

		},
		onPointerUp( event ) {

			if ( this.tilesError || ! this.buildingsVisible ) return;
			if (
				this.pointerCaster.startClientX === event.clientX &&
				this.pointerCaster.startClientY === event.clientY
			) {

				this.castRay( event.clientX, event.clientY );

			}

		},
		onPointerLeave() {

			this.rayIntersect.visible = false;
			this.requestRender();

		},
		async castRay( clientX, clientY, snapTolerance = 0 ) {

			const generation = ++ this.selectionGeneration;
			const rect = this.renderer.domElement.getBoundingClientRect();
			this.mouse.x = ( ( clientX - rect.left ) / rect.width ) * 2 - 1;
			this.mouse.y = - ( ( clientY - rect.top ) / rect.height ) * 2 + 1;
			this.raycaster.setFromCamera( this.mouse, this.camera );

			const marker = this.scene.getObjectByName( this.markerName );
			if ( marker ) {

				const markerResults = this.raycaster.intersectObject( marker, true );
				if ( markerResults.length && markerResults[ 0 ].uv && markerResults[ 0 ].uv.y >= 0.5 ) {

					this.removeMarker();
					this.requestRender();
					return;

				}

			}

			this.clearSelection();
			const intersection = this.raycaster.intersectObject( this.tiles.group, true )
				.find( result => result.face && result.object.userData.meshFeatures );
			if ( ! intersection ) {

				this.$emit( 'object-picked', undefined );
				this.rayIntersect.visible = false;
				this.requestRender();
				return;

			}

			const { face, object, point } = intersection;
			let closestPoint = point;
			if ( snapTolerance > 0 ) {

				const position = object.geometry.getAttribute( 'position' );
				const vertices = [ face.a, face.b, face.c ].map( index => {

					return new Vector3().fromBufferAttribute( position, index ).applyMatrix4( object.matrixWorld );

				} );
				closestPoint = vertices.reduce( ( closest, vertex ) => {

					return point.distanceTo( vertex ) < point.distanceTo( closest ) ? vertex : closest;

				}, point );
				if ( point.distanceTo( closestPoint ) > snapTolerance ) closestPoint = point;

			}

			let semanticFeature = null;
			try {

				semanticFeature = await getSemanticFeature( intersection );

			} catch ( error ) {

				console.warn( 'Unable to read structural metadata for the selected feature.', error );

			}
			if ( generation !== this.selectionGeneration ) return;
			if ( ! semanticFeature ) {

				this.$emit( 'object-picked', undefined );
				this.rayIntersect.visible = false;
				this.requestRender();
				return;

			}

			const normal = face.normal.clone().applyNormalMatrix(
				pickerNormalMatrix.getNormalMatrix( object.matrixWorld )
			);
			this.rayIntersect.position.copy( closestPoint );
			this.rayIntersect.quaternion.setFromUnitVectors( PICKER_LOCAL_NORMAL, normal );
			this.rayIntersect.visible = true;
			const tilesFrame = this.getTilesFrame();
			const cartographic = worldToCartographic( tilesFrame.ellipsoid, tilesFrame.group, closestPoint );
			const surfaceUp = getWorldFrame(
				tilesFrame.ellipsoid,
				tilesFrame.group,
				cartographic.lat,
				cartographic.lon,
				cartographic.height
			).up;
			const azimuthAngle = Math.acos( Math.min( 1, Math.max( - 1, normal.dot( surfaceUp ) ) ) ) * 180 / Math.PI;
			const featureHeight = getHeightAboveFeatureBase(
				this.modelRoots.get( object ) || object,
				semanticFeature,
				closestPoint,
				surfaceUp
			);
			const displayedHeight = featureHeight === null ? cartographic.height : featureHeight;
			this.highlightFeature( object, semanticFeature );
			this.$emit( 'object-picked', {
				featureId: semanticFeature.featureId,
				featureClass: semanticFeature.featureClass,
				attributes: semanticFeature.attributes,
				height: displayedHeight,
				heightReference: featureHeight === null ? 'WGS84_ELLIPSOID' : 'OBJECT_MIN_VERTEX',
				ellipsoidalHeight: cartographic.height,
				azimuthAngle,
				tileID: null,
				batchID: semanticFeature.featureId,
				pz: displayedHeight
			} );
			this.requestRender();

		},
		updateBuildingVisibility( pivot ) {

			if ( ! this.tiles || ! this.controls ) return false;
			if ( ! this.tiles.root ) return true;
			if ( ! pivot ) return this.buildingsVisible;
			const shouldShow = this.camera.position.distanceTo( pivot ) <= BUILDING_MAX_VIEW_DISTANCE;
			if ( shouldShow !== this.buildingsVisible ) {

				this.buildingsVisible = shouldShow;
				if ( shouldShow ) {

					this.contentGroup.add( this.tiles.group );

				} else {

					this.contentGroup.remove( this.tiles.group );
					this.clearSelection();
					this.rayIntersect.visible = false;
					this.$emit( 'object-picked', undefined );

				}
				this.requestRender();

			}
			return shouldShow;

		},
		renderScene( time = 0 ) {

			this.animationFrame = requestAnimationFrame( this.renderScene );
			const delta = Math.min( this.clock.getDelta(), 0.1 );
			TWEEN.update( time );
			if ( this.controls ) this.controls.update( delta );

			if ( this.needsRerender > 0 ) {

				this.needsRerender --;
				const pivot = this.getViewPivot();
				if ( this.compassNeedsUpdate ) {

					this.emitCompassRotation( pivot );
					this.compassNeedsUpdate = false;

				}
				const buildingsVisible = this.updateBuildingVisibility( pivot );
				if ( buildingsVisible && ! this.tilesError ) this.tiles.update();
				if ( this.terrainTiles && this.showTerrain ) this.terrainTiles.update();
				if ( this.tiles && this.tiles.lruCache && this.tiles.lruCache.itemSet ) {

					this.lruCacheSize = this.tiles.lruCache.itemSet.size;

				}
				this.renderer.render( this.scene, this.camera );

			}

		},
		disposeScene() {

			if ( this.animationFrame !== null ) cancelAnimationFrame( this.animationFrame );
			if ( this.locationTimer !== null ) window.clearInterval( this.locationTimer );
			if ( this.routeUpdateTimer !== null ) window.clearTimeout( this.routeUpdateTimer );
			window.removeEventListener( 'resize', this.onWindowResize, false );
			if ( this.renderer ) {

				const element = this.renderer.domElement;
				element.removeEventListener( 'pointermove', this.onPointerMove, false );
				element.removeEventListener( 'pointerdown', this.onPointerDown, false );
				element.removeEventListener( 'pointerup', this.onPointerUp, false );
				element.removeEventListener( 'pointerleave', this.onPointerLeave, false );

			}
			this.removeMarker();
			this.clearSelection();
			if ( this.controls ) {

				this.controls.removeEventListener( 'change', this.onControlsChange );
				this.controls.dispose();

			}
			if ( this.tiles ) this.tiles.dispose();
			if ( this.terrainTiles ) this.terrainTiles.dispose();
			if ( this.rayIntersect ) {

				this.rayIntersect.traverse( child => {

					if ( child.geometry ) child.geometry.dispose();
					disposeMaterial( child.material );

				} );

			}
			if ( this.pane ) this.pane.dispose();
			if ( this.renderer ) {

				this.renderer.dispose();
				if ( this.renderer.domElement.parentNode ) this.renderer.domElement.parentNode.removeChild( this.renderer.domElement );

			}

		}
	}
};
</script>

<style scoped>
#canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.tiles-error {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: 28rem;
  padding: 1rem 1.25rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0.25rem;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
</style>
