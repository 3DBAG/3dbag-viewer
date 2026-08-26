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
	BufferAttribute,
	Color,
	CylinderGeometry,
	DirectionalLight,
	FogExp2,
	LinearToneMapping,
	MathUtils,
	Matrix3,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	MeshLambertMaterial,
	PerspectiveCamera,
	PointLight,
	Raycaster,
	Scene,
	Sphere,
	Sprite,
	SpriteMaterial,
	SRGBColorSpace,
	TextureLoader,
	TorusGeometry,
	Vector2,
	Vector3,
	WebGLRenderer
} from 'three';
import { TilesRenderer, WGS84_ELLIPSOID } from '3d-tiles-renderer/three';
import { GLTFExtensionsPlugin } from '3d-tiles-renderer/three/plugins';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { AttributionControl, Map as MapLibreMap, MercatorCoordinate } from 'maplibre-gl';
import { bgLayer } from '@geo-frontend/nlmaps-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import markerSprite from '@/assets/locationmarker.png';
import { appConfig } from '@/config';
import {
	cameraFrameToRoute,
	getSurfacePoint,
	getWorldFrame,
	rdToCartographic,
	routeToCameraFrame,
	setEcefToLocalFrame,
	worldToCartographic
} from '@/utils/globeCoordinates';
import {
	getHeightAboveFeatureBase,
	getPreferredHighlightAttribute,
	getSemanticFeature
} from '@/utils/semanticFeatures';
import { getAttributeStyle } from '@/utils/attributeStyles';
import { SemanticStylingPlugin } from '@/utils/SemanticStylingPlugin';

const Tweakpane = require( 'tweakpane' );
const HIGHLIGHT_COLOR = 0xFFC107;
const STYLED_MESH_COLOR = '#ffffff';
const BUILDING_ERROR_TARGET = 48;
const BUILDING_MIN_ZOOM = 13;
const MAX_MAP_PITCH = 80;
const MAP_NEAR_Z = 1;
const MAP_FAR_Z = 100000;
const BUILDING_TILE_PRIORITY = 2;
const TERRAIN_SOURCE_ID = 'mapterhorn-dem';
const HILLSHADE_SOURCE_ID = 'mapterhorn-hillshade-dem';
const HILLSHADE_LAYER_ID = 'mapterhorn-hillshade';
const THREE_LAYER_ID = '3dbag-buildings';
const PICKER_LOCAL_NORMAL = new Vector3( 0, 0, 1 );
const pickerNormalMatrix = new Matrix3();

class TileRequestPriorityPlugin {

	constructor( name, tilePriority ) {

		this.name = name;
		this.tilePriority = tilePriority;

	}

	preprocessNode( tile ) {

		tile.priority = this.tilePriority;

	}

}

function disposeMaterial( material ) {

	if ( Array.isArray( material ) ) {

		material.forEach( item => item.dispose() );

	} else if ( material ) {

		material.dispose();

	}

}

export default {
	name: 'ThreeViewer',
	props: {
		tilesUrl: {
			type: String,
			default: appConfig.dataUrl + '/v20250903/cesium3dtiles/lod22/tileset.json'
		},
		basemapPreset: {
			type: String,
			default: 'standaard',
			validator: value => [ 'openfreemap', 'standaard', 'grijs', 'luchtfoto' ].includes( value )
		},
		colormap: {
			type: Object,
			default: null
		},
		locations: {
			type: Array,
			default: () => []
		},
		documentationEnabled: {
			type: Boolean,
			default: false
		}
	},
	data() {

		return {
			tilesError: null
		};

	},
	watch: {
		tilesUrl() {

			if ( this.scene ) this.reinitTiles();

		},
		basemapPreset() {

			this.reinitBasemap();

		},
		$route( to, from ) {

			if ( ! this.ignoreRouteCameraUpdate ) this.setCameraPosFromRoute( to.query );
			if ( to.params.locale !== from.params.locale ) this.refreshAttributionControl();

		},
		colormap() {

			this.applyColormapState();

		},
		documentationEnabled() {

			this.refreshAttributionControl();

		}
	},
	beforeCreate() {

		this.map = null;
		this.attributionControl = null;
		this.customLayer = null;
		this.renderer = null;
		this.scene = null;
		this.camera = null;
		this.tiles = null;
		this.localTransform = new Matrix4();
		this.projectionMatrix = new Matrix4();
		this.viewMatrix = new Matrix4();
		this.cameraLightDirection = new Vector3();
		this.mouse = new Vector2();
		this.raycaster = new Raycaster();
		this.markerHeightRaycaster = new Raycaster();
		this.rayIntersect = null;
		this.pickerData = null;
		this.selectedObject = null;
		this.modelRoots = new WeakMap();
		this.buildingsVisible = true;
		this.cameraReady = false;
		this.initialCameraSet = false;
		this.markerHeightNeedsUpdate = false;
		this.markerName = 'geocoding-marker';
		this.selectionGeneration = 0;
		this.locationTimer = null;
		this.routeUpdateTimer = null;
		this.ignoreRouteCameraUpdate = false;
		this.applyingRouteCamera = false;
		this.resizeObserver = null;
		this.pointerCaster = { startClientX: 0, startClientY: 0 };
		this.viewportWidth = 0;
		this.viewportHeight = 0;
		this.basemapGeneration = 0;
		this.destroying = false;

		this.pointIntensity = 0.4;
		this.directionalIntensity = 2;
		this.ambientIntensity = 0.9;
		this.exposure = 1.1;
		this.meshColor = '#c4c8cf';
		this.enableFog = false;
		this.fogDensity = 0.0000004;
		this.fogColor = '#eeeeee';
		this.castOnHover = false;
		this.showTerrain = true;
		this.pane = null;
		this.lruCacheSize = 0;
		this.stylingPlugin = null;

	},
	mounted() {

		this.initMap();

	},
	beforeDestroy() {

		this.disposeScene();

	},
	methods: {
		createAttributionControl() {

			const label = '© 3DBAG by tudelft3d and 3DGI';
			const attribution = this.documentationEnabled ?
				`<a href="${ appConfig.docsUrl }/${ this.$route.params.locale }/copyright">${ label }</a>` :
				label;
			return new AttributionControl( { customAttribution: attribution } );

		},
		refreshAttributionControl() {

			if ( ! this.map ) return;
			if ( this.attributionControl ) this.map.removeControl( this.attributionControl );
			this.attributionControl = this.createAttributionControl();
			this.map.addControl( this.attributionControl );

		},
		getBasemapStyle() {

			if ( this.basemapPreset === 'openfreemap' ) return appConfig.mapStyleUrl;
			return bgLayer( this.basemapPreset );

		},
		initMap() {

			this.customLayer = {
				id: THREE_LAYER_ID,
				type: 'custom',
				renderingMode: '3d',
				onAdd: ( map, gl ) => this.onThreeLayerAdd( map, gl ),
				render: ( gl, args ) => this.renderThreeLayer( gl, args ),
				onRemove: () => {}
			};
			this.map = new MapLibreMap( {
				container: this.$el,
				style: this.getBasemapStyle(),
				center: [ 5.3876389, 52.1561606 ],
				zoom: 7,
				pitch: 45,
				aroundCenter: false,
				doubleClickZoom: false,
				reduceMotion: true,
				maxPitch: MAX_MAP_PITCH,
				attributionControl: false,
				canvasContextAttributes: { antialias: true }
			} );
			// The automatically fitted MapLibre far plane is too tight for the
			// rebased nationwide 3D Tiles scene. Override it at the map level so the
			// basemap, Three.js, and TilesRenderer all receive the same projection.
			this.map.transform.overrideNearFarZ( MAP_NEAR_Z, MAP_FAR_Z );
			this.refreshAttributionControl();
			this.map.on( 'style.load', this.onStyleLoad );
			this.map.on( 'move', this.onMapMove );
			this.map.on( 'moveend', this.onMapMoveEnd );
			this.map.on( 'sourcedata', this.onSourceData );
			this.map.on( 'error', this.onMapError );

			const canvas = this.map.getCanvas();
			canvas.addEventListener( 'pointermove', this.onPointerMove, false );
			canvas.addEventListener( 'pointerdown', this.onPointerDown, false );
			canvas.addEventListener( 'pointerup', this.onPointerUp, false );
			if ( window.ResizeObserver ) {

				this.resizeObserver = new window.ResizeObserver( () => this.map && this.map.resize() );
				this.resizeObserver.observe( this.$el );

			}

		},
		onStyleLoad() {

			if ( ! this.map || this.destroying ) return;
			const layers = this.map.getStyle().layers || [];
			layers.filter( layer => {

				return layer.type === 'fill-extrusion' || layer.id.toLowerCase().includes( 'building' );

			} ).forEach( layer => this.map.setLayoutProperty( layer.id, 'visibility', 'none' ) );

			if ( ! this.map.getSource( TERRAIN_SOURCE_ID ) ) {

				this.map.addSource( TERRAIN_SOURCE_ID, {
					type: 'raster-dem',
					url: appConfig.terrainTileJsonUrl
				} );

			}
			if ( ! this.map.getSource( HILLSHADE_SOURCE_ID ) ) {

				this.map.addSource( HILLSHADE_SOURCE_ID, {
					type: 'raster-dem',
					url: appConfig.terrainTileJsonUrl
				} );

			}
			const labelLayer = layers.find( layer => layer.type === 'symbol' );
			const beforeId = labelLayer && labelLayer.id;
			if ( ! this.map.getLayer( HILLSHADE_LAYER_ID ) ) {

				this.map.addLayer( {
					id: HILLSHADE_LAYER_ID,
					type: 'hillshade',
					source: HILLSHADE_SOURCE_ID,
					paint: {
						'hillshade-shadow-color': '#473B24',
						'hillshade-exaggeration': 0.5
					}
				}, beforeId );

			}
			this.setTerrainVisibility( this.showTerrain );
			if ( ! this.map.getLayer( THREE_LAYER_ID ) ) this.map.addLayer( this.customLayer, beforeId );
			if ( this.basemapPreset === 'openfreemap' ) {

				layers.filter( layer => {

					return layer.type === 'symbol' && layer[ 'source-layer' ] === 'transportation_name';

				} ).forEach( layer => this.map.moveLayer( layer.id, THREE_LAYER_ID ) );

			}
			this.queueMarkerHeightCorrection();
			this.requestRender();

		},
		transformBasemapStyle( previousStyle, nextStyle ) {

			const previousSources = previousStyle && previousStyle.sources || {};
			const terrainSource = previousSources[ TERRAIN_SOURCE_ID ] || {
				type: 'raster-dem',
				url: appConfig.terrainTileJsonUrl
			};
			const hillshadeSource = previousSources[ HILLSHADE_SOURCE_ID ] || terrainSource;
			const previousLayers = previousStyle && previousStyle.layers || [];
			const hillshadeLayer = previousLayers.find( layer => layer.id === HILLSHADE_LAYER_ID ) || {
				id: HILLSHADE_LAYER_ID,
				type: 'hillshade',
				source: HILLSHADE_SOURCE_ID,
				paint: {
					'hillshade-shadow-color': '#473B24',
					'hillshade-exaggeration': 0.5
				}
			};
			const layers = ( nextStyle.layers || [] ).filter( layer => layer.id !== HILLSHADE_LAYER_ID );
			const labelIndex = layers.findIndex( layer => layer.type === 'symbol' );
			layers.splice( labelIndex === - 1 ? layers.length : labelIndex, 0, hillshadeLayer );
			const style = Object.assign( {}, nextStyle, {
				sources: Object.assign( {}, nextStyle.sources, {
					[ TERRAIN_SOURCE_ID ]: terrainSource,
					[ HILLSHADE_SOURCE_ID ]: hillshadeSource
				} ),
				layers
			} );
			if ( this.showTerrain ) {

				style.terrain = previousStyle && previousStyle.terrain || {
					source: TERRAIN_SOURCE_ID,
					exaggeration: 1
				};

			} else {

				delete style.terrain;

			}
			return style;

		},
		reinitBasemap() {

			if ( ! this.map ) return;
			const generation = ++ this.basemapGeneration;
			if ( ! this.map.getStyle() ) {

				this.map.once( 'style.load', () => {

					if ( this.map && ! this.destroying && generation === this.basemapGeneration ) this.reinitBasemap();

				} );
				return;

			}
			// A custom layer cannot safely survive a style's projection teardown. Remove it
			// synchronously and let onStyleLoad attach it to the replacement style.
			if ( this.map.getLayer( THREE_LAYER_ID ) ) this.map.removeLayer( THREE_LAYER_ID );
			this.map.setCenterClampedToGround( true );
			this.map.setStyle( this.getBasemapStyle(), {
				transformStyle: ( previousStyle, nextStyle ) => this.transformBasemapStyle( previousStyle, nextStyle )
			} );

		},
		onMapError( event ) {

			if ( event && event.error ) console.warn( 'MapLibre source or rendering error.', event.error );

		},
		onSourceData( event ) {

			if ( event.sourceId === TERRAIN_SOURCE_ID && event.isSourceLoaded ) this.queueMarkerHeightCorrection();

		},
		onMapMove() {

			this.emitCompassRotation();
			this.requestRender();

		},
		onMapMoveEnd() {

			if ( this.initialCameraSet && ! this.applyingRouteCamera ) this.scheduleRouteUpdate();

		},
		onThreeLayerAdd( map, gl ) {

			if ( this.renderer ) return;
			this.renderer = new WebGLRenderer( {
				canvas: map.getCanvas(),
				context: gl,
				antialias: true
			} );
			this.renderer.autoClear = false;
			this.renderer.outputColorSpace = SRGBColorSpace;
			this.renderer.toneMapping = LinearToneMapping;
			this.renderer.toneMappingExposure = this.exposure;

			this.scene = new Scene();
			this.fog = new FogExp2( this.fogColor, this.fogDensity );
			this.camera = new PerspectiveCamera();
			this.camera.matrixAutoUpdate = false;
			this.camera.matrixWorldAutoUpdate = false;

			this.pLight = new PointLight( 0xffffff, this.pointIntensity, 0, 1 );
			this.scene.add( this.pLight );
			this.dirLight = new DirectionalLight( 0xffffff, this.directionalIntensity );
			this.scene.add( this.dirLight );
			this.scene.add( this.dirLight.target );
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
			if ( process.env.NODE_ENV === 'development' ) this.initTweakPane();

		},
		updateLocalFrame( lngLat = null ) {

			if ( ! this.map || ! this.tiles ) return false;
			lngLat = lngLat || this.map.getCenter();
			const lng = Number( lngLat.lng );
			const lat = Number( lngLat.lat );
			if ( ! Number.isFinite( lng ) || ! Number.isFinite( lat ) ) return false;
			setEcefToLocalFrame(
				this.tiles.ellipsoid || WGS84_ELLIPSOID,
				this.tiles.group,
				MathUtils.degToRad( lat ),
				MathUtils.degToRad( lng )
			);
			const mercator = MercatorCoordinate.fromLngLat( [ lng, lat ], 0 );
			const scale = mercator.meterInMercatorCoordinateUnits();
			this.localTransform.makeTranslation( mercator.x, mercator.y, mercator.z )
				.scale( new Vector3( scale, - scale, scale ) )
				.multiply( new Matrix4().makeRotationX( Math.PI / 2 ) );
			this.updateMarkerPosition();
			return true;

		},
		renderThreeLayer( gl, args ) {

			if ( ! this.renderer || ! this.scene || ! this.camera || ! this.tiles ) return;
			if ( ! this.updateLocalFrame() ) return;
			const modelViewProjection = new Matrix4()
				.fromArray( args.defaultProjectionData.mainMatrix )
				.multiply( this.localTransform );
			this.projectionMatrix.fromArray( args.projectionMatrix );
			this.viewMatrix.copy( this.projectionMatrix ).invert().multiply( modelViewProjection );
			this.camera.projectionMatrix.copy( this.projectionMatrix );
			this.camera.projectionMatrixInverse.copy( this.projectionMatrix ).invert();
			this.camera.matrixWorldInverse.copy( this.viewMatrix );
			this.camera.matrixWorld.copy( this.viewMatrix ).invert();
			this.camera.position.setFromMatrixPosition( this.camera.matrixWorld );
			this.pLight.position.copy( this.camera.position );
			// Use a camera-mounted key light so visible facades retain shape at every bearing.
			this.camera.getWorldDirection( this.cameraLightDirection );
			this.dirLight.position.copy( this.camera.position );
			this.dirLight.target.position.copy( this.camera.position ).add( this.cameraLightDirection );
			this.dirLight.target.updateMatrixWorld();
			this.cameraReady = true;
			this.syncTileResolution();

			const buildingsVisible = this.updateBuildingVisibility();
			if ( buildingsVisible && ! this.tilesError ) this.tiles.update();
			if ( this.markerHeightNeedsUpdate ) {

				this.markerHeightNeedsUpdate = false;
				this.correctMarkerHeight();

			}
			this.updatePickerPosition();
			if ( this.tiles.lruCache && this.tiles.lruCache.itemSet ) {

				this.lruCacheSize = this.tiles.lruCache.itemSet.size;

			}
			this.scene.fog = this.enableFog ? this.fog : null;
			this.renderer.resetState();
			// MapLibre renders terrain into the shared depth buffer before custom 3D
			// layers. Do not let that surface mask the independently georeferenced
			// building tiles; the Three.js render immediately repopulates depth for
			// correct building-to-building occlusion.
			this.renderer.clearDepth();
			this.renderer.render( this.scene, this.camera );
			this.renderer.resetState();

		},
		syncTileResolution() {

			if ( ! this.tiles || ! this.map ) return;
			const canvas = this.map.getCanvas();
			if ( canvas.width === this.viewportWidth && canvas.height === this.viewportHeight ) return;
			this.viewportWidth = canvas.width;
			this.viewportHeight = canvas.height;
			this.tiles.setResolution( this.camera, canvas.width, canvas.height );

		},
		requestRender() {

			if ( this.map ) this.map.triggerRepaint();

		},
		initTweakPane() {

			const el = document.getElementById( 'debug-panel' );
			if ( ! el || ! this.tiles || this.pane ) return;
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

			this.meshColor = color;
			if ( this.usesColormap() ) return;
			this.setLoadedMeshAppearance( false, color );

		},
		usesColormap() {

			return Boolean( this.colormap );

		},
		getActiveColormapStyle() {

			return this.usesColormap() ? getAttributeStyle( this.colormap ) : {};

		},
		setLoadedMeshAppearance( vertexColors, color ) {

			if ( ! this.tiles ) return;
			this.tiles.forEachLoadedModel( scene => {

				scene.traverse( child => {

					const materials = Array.isArray( child.material ) ? child.material : [ child.material ];
					materials.filter( Boolean ).forEach( material => {

						if ( material.color ) material.color.set( color );
						if ( material.vertexColors !== vertexColors ) {

							material.vertexColors = vertexColors;
							material.needsUpdate = true;

						}

					} );

				} );

			} );
			this.requestRender();

		},
		applyColormapState() {

			if ( ! this.tiles || ! this.stylingPlugin ) return;
			if ( this.usesColormap() ) {

				this.stylingPlugin.attribute = this.colormap.attribute;
				this.stylingPlugin.style = this.getActiveColormapStyle();
				this.stylingPlugin.applyToTiles();
				this.setLoadedMeshAppearance( true, STYLED_MESH_COLOR );

			} else {

				this.stylingPlugin.attribute = null;
				this.stylingPlugin.style = {};
				this.setLoadedMeshAppearance( false, this.meshColor );

			}

		},
		setTerrainVisibility( visible ) {

			if ( ! this.map || ! this.map.getSource( TERRAIN_SOURCE_ID ) ) return;
			this.showTerrain = visible;
			const terrain = this.map.getTerrain();
			if ( visible ) {

				if ( ! terrain || terrain.source !== TERRAIN_SOURCE_ID || terrain.exaggeration !== 1 ) {

					this.map.setTerrain( { source: TERRAIN_SOURCE_ID, exaggeration: 1 } );

				}

			} else if ( terrain ) {

				this.map.setTerrain( null );

			}
			if ( this.map.getLayer( HILLSHADE_LAYER_ID ) ) {

				this.map.setLayoutProperty( HILLSHADE_LAYER_ID, 'visibility', visible ? 'visible' : 'none' );

			}
			this.queueMarkerHeightCorrection();
			this.requestRender();

		},
		getTilesFrame() {

			if ( ! this.tiles ) return null;
			return {
				ellipsoid: this.tiles.ellipsoid || WGS84_ELLIPSOID,
				group: this.tiles.group
			};

		},
		getTerrainElevation( lng, lat ) {

			if ( ! this.map || ! this.showTerrain ) return 0;
			return this.map.queryTerrainElevation( [ lng, lat ] ) || 0;

		},
		getViewPivot() {

			const tilesFrame = this.getTilesFrame();
			if ( ! tilesFrame || ! this.map ) return null;
			const center = this.map.getCenter();
			const elevation = this.getTerrainElevation( center.lng, center.lat );
			return getWorldFrame(
				tilesFrame.ellipsoid,
				tilesFrame.group,
				MathUtils.degToRad( center.lat ),
				MathUtils.degToRad( center.lng ),
				elevation
			).position;

		},
		setCameraPosFromRoute( query ) {

			if ( this.routeUpdateTimer !== null ) {

				window.clearTimeout( this.routeUpdateTimer );
				this.routeUpdateTimer = null;

			}
			const tilesFrame = this.getTilesFrame();
			if ( ! tilesFrame || ! this.map ) return;
			const rdx = Number.parseFloat( query.rdx );
			const rdy = Number.parseFloat( query.rdy );
			if ( ! Number.isFinite( rdx ) || ! Number.isFinite( rdy ) ) return;
			const targetCartographic = rdToCartographic( rdx, rdy );
			this.updateLocalFrame( {
				lng: MathUtils.radToDeg( targetCartographic.lon ),
				lat: MathUtils.radToDeg( targetCartographic.lat )
			} );
			const frame = routeToCameraFrame( tilesFrame.ellipsoid, tilesFrame.group, query );
			if ( ! frame ) return;
			const cameraCartographic = worldToCartographic(
				tilesFrame.ellipsoid,
				tilesFrame.group,
				frame.cameraPosition
			);
			const targetLng = MathUtils.radToDeg( frame.lon );
			const targetLat = MathUtils.radToDeg( frame.lat );
			const targetElevation = this.getTerrainElevation( targetLng, targetLat );
			const options = this.map.calculateCameraOptionsFromTo(
				[ MathUtils.radToDeg( cameraCartographic.lon ), MathUtils.radToDeg( cameraCartographic.lat ) ],
				cameraCartographic.height + targetElevation,
				[ targetLng, targetLat ],
				targetElevation
			);
			this.applyingRouteCamera = true;
			this.map.jumpTo( options );
			window.setTimeout( () => {

				this.applyingRouteCamera = false;
				this.scheduleRouteUpdate();

			}, 0 );
			if ( query.placeMarker === 'true' ) this.placeMarkerAtCartographic( frame.lat, frame.lon );
			this.emitCompassRotation();
			this.requestRender();

		},
		setRouteFromCameraPos() {

			const tilesFrame = this.getTilesFrame();
			if ( ! tilesFrame || ! this.map || ! this.cameraReady || ! this.initialCameraSet ) return;
			const target = this.getViewPivot();
			if ( ! target ) return;
			const cameraPosition = new Vector3().setFromMatrixPosition( this.camera.matrixWorld );
			const route = cameraFrameToRoute(
				tilesFrame.ellipsoid,
				tilesFrame.group,
				cameraPosition,
				target
			);
			this.$emit( 'cam-offset', { x: route.ox, y: route.oy, z: route.oz } );

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
		setCameraFromTilesBounds() {

			const tilesFrame = this.getTilesFrame();
			if ( ! tilesFrame || ! this.map ) return false;
			const sphere = new Sphere();
			if ( ! this.tiles.getBoundingSphere( sphere ) || ! Number.isFinite( sphere.radius ) ) return false;
			this.tiles.group.updateWorldMatrix( true, false );
			const center = sphere.center.clone().applyMatrix4( this.tiles.group.matrixWorld );
			const cartographic = worldToCartographic( tilesFrame.ellipsoid, tilesFrame.group, center );
			if ( ! Number.isFinite( cartographic.lat ) || ! Number.isFinite( cartographic.lon ) ) return false;

			const lng = MathUtils.radToDeg( cartographic.lon );
			const lat = MathUtils.radToDeg( cartographic.lat );
			this.updateLocalFrame( { lng, lat } );
			const elevation = this.getTerrainElevation( lng, lat );
			const frame = getWorldFrame( tilesFrame.ellipsoid, tilesFrame.group, cartographic.lat, cartographic.lon, elevation );
			const distance = MathUtils.clamp( sphere.radius * 0.5, 100, 500 );
			const cameraPosition = frame.position.clone()
				.addScaledVector( frame.east, distance * 0.5 )
				.addScaledVector( frame.up, distance * 0.7 )
				.addScaledVector( frame.north, - distance * 0.8 );
			const cameraCartographic = worldToCartographic( tilesFrame.ellipsoid, tilesFrame.group, cameraPosition );
			const options = this.map.calculateCameraOptionsFromTo(
				[ MathUtils.radToDeg( cameraCartographic.lon ), MathUtils.radToDeg( cameraCartographic.lat ) ],
				cameraCartographic.height,
				[ lng, lat ],
				elevation
			);
			this.applyingRouteCamera = true;
			this.map.jumpTo( options );
			window.setTimeout( () => {

				this.applyingRouteCamera = false;
				this.scheduleRouteUpdate();

			}, 0 );
			this.requestRender();
			return true;

		},
		initializeCameraPosition() {

			if ( this.initialCameraSet ) return;
			const query = this.$router.currentRoute.query;
			if ( [ 'rdx', 'rdy', 'ox', 'oy', 'oz' ].every( key => key in query ) ) {

				this.initialCameraSet = true;
				this.setCameraPosFromRoute( query );
				return;

			}

			this.initialCameraSet = true;
			if ( this.locations.length === 0 ) {

				this.setCameraFromTilesBounds();
				return;

			}

			const location = this.locations[ this.locations.length * Math.random() << 0 ];
			if ( typeof location.name === 'string' && location.name ) {

				this.$parent.$data.locationBoxText = location.name;
				this.$parent.$data.showLocationBox = true;

			}
			this.setCameraPosFromRoute( location );

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
		placeMarkerAtCartographic( lat, lon ) {

			this.removeMarker();
			const map = new TextureLoader().load( markerSprite, () => this.requestRender() );
			const material = new SpriteMaterial( {
				map,
				depthWrite: false,
				depthTest: false,
				sizeAttenuation: false
			} );
			const sprite = new Sprite( material );
			sprite.userData.lat = lat;
			sprite.userData.lon = lon;
			sprite.userData.height = 0;
			sprite.scale.set( 0.04, 0.10, 1 );
			sprite.name = this.markerName;
			this.scene.add( sprite );
			this.updateMarkerPosition();
			this.queueMarkerHeightCorrection();
			this.requestRender();

		},
		updateMarkerPosition() {

			const marker = this.scene && this.scene.getObjectByName( this.markerName );
			const tilesFrame = this.getTilesFrame();
			if ( ! marker || ! tilesFrame ) return;
			marker.position.copy( getWorldFrame(
				tilesFrame.ellipsoid,
				tilesFrame.group,
				marker.userData.lat,
				marker.userData.lon,
				marker.userData.height
			).position );

		},
		queueMarkerHeightCorrection() {

			if ( ! this.scene || ! this.scene.getObjectByName( this.markerName ) ) return;
			this.markerHeightNeedsUpdate = true;
			this.requestRender();

		},
		correctMarkerHeight() {

			const marker = this.scene && this.scene.getObjectByName( this.markerName );
			const tilesFrame = this.getTilesFrame();
			if ( ! marker || ! tilesFrame ) return false;
			const { lat, lon } = marker.userData;
			const frame = getWorldFrame( tilesFrame.ellipsoid, tilesFrame.group, lat, lon );
			let surfacePoint = null;
			if ( this.tiles && ! this.tilesError && this.buildingsVisible ) {

				surfacePoint = getSurfacePoint(
					this.tiles.group,
					frame.position,
					frame.up,
					this.markerHeightRaycaster
				);

			}
			if ( surfacePoint ) {

				marker.userData.height = worldToCartographic(
					tilesFrame.ellipsoid,
					tilesFrame.group,
					surfacePoint
				).height;

			} else {

				marker.userData.height = this.getTerrainElevation(
					MathUtils.radToDeg( lon ),
					MathUtils.radToDeg( lat )
				);

			}
			this.updateMarkerPosition();
			this.requestRender();
			return true;

		},
		removeMarker() {

			this.markerHeightNeedsUpdate = false;
			if ( ! this.scene ) return;
			const marker = this.scene.getObjectByName( this.markerName );
			if ( ! marker ) return;
			this.scene.remove( marker );
			if ( marker.material.map ) marker.material.map.dispose();
			marker.material.dispose();

		},
		updatePickerPosition() {

			if ( ! this.pickerData || ! this.rayIntersect || ! this.rayIntersect.visible ) return;
			const tilesFrame = this.getTilesFrame();
			if ( ! tilesFrame ) return;
			const { lat, lon, height, east, north, up } = this.pickerData;
			const frame = getWorldFrame( tilesFrame.ellipsoid, tilesFrame.group, lat, lon, height );
			this.rayIntersect.position.copy( frame.position );
			const normal = frame.east.multiplyScalar( east )
				.addScaledVector( frame.north, north )
				.addScaledVector( frame.up, up )
				.normalize();
			this.rayIntersect.quaternion.setFromUnitVectors( PICKER_LOCAL_NORMAL, normal );

		},
		pointCameraToNorth() {

			if ( this.map ) this.map.easeTo( { bearing: 0, duration: 600 } );

		},
		emitCompassRotation() {

			if ( this.map ) this.$emit( 'cam-rotation-z', - MathUtils.degToRad( this.map.getBearing() ) );

		},
		createFeatureMaterial( object ) {

			let highlightAttribute = null;
			try {

				highlightAttribute = getPreferredHighlightAttribute( object );

			} catch ( error ) {

				console.warn( 'Unable to prepare semantic highlighting.', error );

			}
			const hasVertexColors = Boolean( object.geometry.getAttribute( 'color' ) );
			const material = new MeshLambertMaterial( {
				color: this.usesColormap() || hasVertexColors ? STYLED_MESH_COLOR : this.meshColor,
				vertexColors: hasVertexColors
			} );
			if ( ! highlightAttribute || ! object.geometry.getAttribute( highlightAttribute ) ) return material;

			material.userData.highlightedFeatureId = { value: - 1 };
			material.userData.highlightAttribute = highlightAttribute;
			material.onBeforeCompile = function ( shader ) {

				shader.uniforms.highlightedFeatureId = this.userData.highlightedFeatureId;
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
				).replace(
					'#include <color_fragment>',
					`if ( abs( semanticFeatureId - highlightedFeatureId ) >= 0.5 ) {
						#include <color_fragment>
					}`
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
			this.queueMarkerHeightCorrection();
			this.requestRender();

		},
		clearSelection() {

			if ( ! this.selectedObject ) return;
			const materials = Array.isArray( this.selectedObject.material ) ?
				this.selectedObject.material : [ this.selectedObject.material ];
			materials.filter( Boolean ).forEach( material => {

				if ( material.userData.highlightedFeatureId ) material.userData.highlightedFeatureId.value = - 1;

			} );
			this.selectedObject = null;
			this.pickerData = null;
			if ( this.rayIntersect ) this.rayIntersect.visible = false;

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

			if ( ! this.scene || ! this.camera ) return;
			this.clearSelection();
			this.selectionGeneration ++;
			if ( this.tiles ) {

				this.scene.remove( this.tiles.group );
				this.tiles.dispose();

			}

			this.tilesError = null;
			this.buildingsVisible = true;
			const tiles = new TilesRenderer( this.tilesUrl );
			this.tiles = tiles;
			this.viewportWidth = 0;
			this.viewportHeight = 0;
			tiles.errorTarget = BUILDING_ERROR_TARGET;
			tiles.loadAncestors = false;
			tiles.loadSiblings = false;
			tiles.registerPlugin( new TileRequestPriorityPlugin(
				'BUILDING_TILE_REQUEST_PRIORITY',
				BUILDING_TILE_PRIORITY
			) );
			tiles.registerPlugin( new GLTFExtensionsPlugin( {
				metadata: true,
				meshoptDecoder: MeshoptDecoder
			} ) );
			this.stylingPlugin = new SemanticStylingPlugin( {
				THREE: { Color, BufferAttribute },
				attribute: this.colormap ? this.colormap.attribute : null,
				style: this.getActiveColormapStyle()
			} );
			tiles.registerPlugin( this.stylingPlugin );
			tiles.setCamera( this.camera );
			const invalidate = () => this.requestRender();
			tiles.addEventListener( 'needs-update', invalidate );
			tiles.addEventListener( 'needs-render', invalidate );
			tiles.addEventListener( 'load-model', event => {

				// Styling runs asynchronously. Wait until the color attribute exists before
				// creating the viewer-owned materials that consume it.
				Promise.resolve().then( () => {

					if ( this.tiles === tiles ) this.handleLoadModel( event );

				} );

			} );
			tiles.addEventListener( 'dispose-model', event => {

				if ( this.tiles !== tiles ) return;
				if ( this.selectedObject && event.scene.getObjectById( this.selectedObject.id ) ) this.clearSelection();
				this.queueMarkerHeightCorrection();

			} );
			tiles.addEventListener( 'load-error', event => {

				if ( this.tiles !== tiles ) return;
				if ( event.tile === null ) {

					this.tilesError = event.error;
					this.$emit( 'object-picked', undefined );

				} else {

					console.warn( `Failed to load 3D Tiles content: ${ event.url }`, event.error );

				}
				this.queueMarkerHeightCorrection();
				this.requestRender();

			} );
			tiles.addEventListener( 'load-root-tileset', () => {

				if ( this.tiles !== tiles ) return;
				this.updateLocalFrame();
				if ( initializeCamera ) this.initializeCameraPosition();
				this.requestRender();

			} );
			tiles.group.matrixAutoUpdate = false;
			this.scene.add( tiles.group );
			this.syncTileResolution();
			this.queueMarkerHeightCorrection();
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
			) this.castRay( event.clientX, event.clientY );

		},
		async castRay( clientX, clientY, snapTolerance = 0 ) {

			if ( ! this.cameraReady || ! this.tiles ) return;
			const generation = ++ this.selectionGeneration;
			const rect = this.map.getCanvas().getBoundingClientRect();
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
			const tilesFrame = this.getTilesFrame();
			const cartographic = worldToCartographic( tilesFrame.ellipsoid, tilesFrame.group, closestPoint );
			const surfaceFrame = getWorldFrame(
				tilesFrame.ellipsoid,
				tilesFrame.group,
				cartographic.lat,
				cartographic.lon,
				cartographic.height
			);
			// Store the pick in cartographic coordinates plus the surface normal
			// projected onto the local east/north/up axes, so the picker can be
			// re-anchored every frame as the map's local frame moves.
			this.pickerData = {
				lat: cartographic.lat,
				lon: cartographic.lon,
				height: cartographic.height,
				east: normal.dot( surfaceFrame.east ),
				north: normal.dot( surfaceFrame.north ),
				up: normal.dot( surfaceFrame.up )
			};
			this.updatePickerPosition();
			this.rayIntersect.visible = true;
			const surfaceUp = surfaceFrame.up;
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
		updateBuildingVisibility() {

			if ( ! this.tiles || ! this.map || ! this.cameraReady ) return this.buildingsVisible;
			if ( ! this.tiles.root ) return true;
			// Zoom is stable across pitch changes. Camera-to-center distance is not, and
			// caused the tiles to blink out when moving into an exact top-down view.
			const shouldShow = this.map.getZoom() >= BUILDING_MIN_ZOOM;
			if ( shouldShow !== this.buildingsVisible ) {

				this.buildingsVisible = shouldShow;
				this.tiles.group.visible = shouldShow;
				if ( ! shouldShow ) {

					this.clearSelection();
					this.rayIntersect.visible = false;
					this.$emit( 'object-picked', undefined );

				}
				this.queueMarkerHeightCorrection();

			}
			return shouldShow;

		},
		disposeScene() {

			this.destroying = true;
			if ( this.locationTimer !== null ) window.clearInterval( this.locationTimer );
			if ( this.routeUpdateTimer !== null ) window.clearTimeout( this.routeUpdateTimer );
			if ( this.resizeObserver ) this.resizeObserver.disconnect();
			if ( this.map ) {

				const canvas = this.map.getCanvas();
				canvas.removeEventListener( 'pointermove', this.onPointerMove, false );
				canvas.removeEventListener( 'pointerdown', this.onPointerDown, false );
				canvas.removeEventListener( 'pointerup', this.onPointerUp, false );

			}
			this.removeMarker();
			this.clearSelection();
			if ( this.tiles ) this.tiles.dispose();
			if ( this.rayIntersect ) {

				this.rayIntersect.traverse( child => {

					if ( child.geometry ) child.geometry.dispose();
					disposeMaterial( child.material );

				} );

			}
			if ( this.pane ) this.pane.dispose();
			if ( this.renderer ) this.renderer.dispose();
			if ( this.map ) this.map.remove();
			this.map = null;
			this.renderer = null;
			this.scene = null;
			this.tiles = null;

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
  z-index: 2;
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
