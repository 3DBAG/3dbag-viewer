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
import { MapTilesViewer } from '3dtoml';
import { bgLayer } from '@geo-frontend/nlmaps-maplibre';
import { appConfig } from '@/config';

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

		return { tilesError: null };

	},
	computed: {
		viewerAttribution() {

			const label = '© 3DBAG by tudelft3d and 3DGI';
			return this.documentationEnabled ?
				`<a href="${ appConfig.docsUrl }/${ this.$route.params.locale }/copyright">${ label }</a>` : label;

		}
	},
	watch: {
		tilesUrl( value ) {

			this.viewer.setTilesUrl( value );

		},
		basemapPreset( value ) {

			this.viewer.setBasemapPreset( value );

		},
		colormap( value ) {

			this.viewer.setColormap( value );

		},
		locations( value ) {

			this.viewer.setLocations( value );

		},
		viewerAttribution( value ) {

			if ( this.viewer ) this.viewer.setAttribution( value );

		},
		$route( to, from ) {

			const cameraChanged = [ 'rdx', 'rdy', 'ox', 'oy', 'oz', 'placeMarker' ]
				.some( key => to.query[ key ] !== from.query[ key ] );
			if ( cameraChanged && ! this.ignoreRouteCameraUpdate ) this.viewer.setCameraPosition( to.query );
			if ( to.params.locale !== from.params.locale ) this.viewer.setLocale( to.params.locale );

		}
	},
	beforeCreate() {

		this.viewer = null;
		this.ignoreRouteCameraUpdate = false;

	},
	mounted() {

		this.viewer = new MapTilesViewer( this.$el, {
			tilesUrl: this.tilesUrl,
			basemapPreset: this.basemapPreset,
			basemapStyles: {
				standaard: () => bgLayer( 'standaard' ),
				grijs: () => bgLayer( 'grijs' ),
				luchtfoto: () => bgLayer( 'luchtfoto' ),
				openfreemap: appConfig.mapStyleUrl
			},
			colormap: this.colormap,
			locations: this.locations,
			attribution: this.viewerAttribution,
			locale: this.$route.params.locale,
			initialCamera: this.$route.query,
			debugContainer: process.env.NODE_ENV === 'development' ? document.getElementById( 'debug-panel' ) : null,
			config: appConfig
		} );
		this.viewer.on( 'tiles-error', error => this.tilesError = error );
		this.viewer.on( 'object-picked', value => this.$emit( 'object-picked', value ) );
		this.viewer.on( 'cam-offset', value => this.$emit( 'cam-offset', value ) );
		this.viewer.on( 'cam-rotation-z', value => this.$emit( 'cam-rotation-z', value ) );
		this.viewer.on( 'camera-change', this.updateRouteFromCamera );
		this.viewer.on( 'notice', notice => this.$emit( 'notice', notice ) );

	},
	beforeDestroy() {

		if ( this.viewer ) this.viewer.destroy();
		this.viewer = null;

	},
	methods: {
		pointCameraToNorth() {

			if ( this.viewer ) this.viewer.pointCameraToNorth();

		},
		updateRouteFromCamera( camera ) {

			const route = this.$router.currentRoute;
			const query = { ...route.query, ...camera };
			delete query.placeMarker;
			this.ignoreRouteCameraUpdate = true;
			this.$router.push( { path: route.path, hash: route.hash, query } )
				.catch( () => {} )
				.finally( () => {

					this.$nextTick( () => this.ignoreRouteCameraUpdate = false );

				} );

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
