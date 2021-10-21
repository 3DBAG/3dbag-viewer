<template>
  <div class="control">
    <b-button
      icon-left="magnify"
      class="is-primary"
      @click="isModalActive = true"
    >
      <span class="is-hidden-mobile">{{ $t("SearchBar.search") }}</span>
    </b-button>


    <b-modal
      v-model="isModalActive"
      has-modal-card
      trap-focus
      @after-enter="focusSearchBar"
    >
      <b-autocomplete
        id="search-input"
        field="display_name"
        :autofocus="true"
        :data="geocodeResult"
        :loading="isGeocoding"
        :placeholder="$t('SearchBar.search')"
        icon-right="magnify"
        @typing="doGeocode"
        @select="selectPlace"
      >
        <template slot="empty">
          {{ $t("SearchBar.empty") }}
        </template>
        <template slot-scope="props">
          <div class="media">
            <div class="media-left">
              <b-icon
                icon="map-marker"
                size="is-small"
              />
            </div>
            <div class="media-content">
              <p class="has-text-left">
                {{ props.option.display_name }} <br>
                <small>
                  {{ props.option.type }} ({{ props.option.class }})
                </small>
              </p>
            </div>
          </div>
        </template>
      </b-autocomplete>
    </b-modal>
  </div>
</template>

<script>
import debounce from 'debounce';
import Proj4 from 'proj4';


Proj4.defs( [
	[
		"EPSG:28992",
		"+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs"
	],
	[
		'EPSG:4326',
		'+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'
	]
] );

/**
 * A search bar that conduct geocoding to PDOK service.
 *
 * @author 3D geoinformation group
 */
export default {
	name: 'SearchBar',
	data: function () {

		return {
			/**
			* The result of the geocoding request
			*/
			geocodeResult: [],
			// Flag to indicate that geocoding is underway
	  	isGeocoding: false,
			isModalActive: false
	  };

	},
	methods: {
		focusSearchBar: function () {

			document.getElementById( 'search-input' ).focus();

		},
		/**
		 * Select the specified location.
		 *
		 * @argument {object} res - An object containing the location information.
		 */
		selectPlace: function ( res ) {

			/**
       * Emitted when a location is selected.
			 *
			 * @argument {object} res - An object containing the location information.
       */

			this.$emit( 'select-place', res );
			this.isModalActive = false;

		},
		/**
		 * Make the geocoding request to the server.
		 *
		 * @argument {string} name - The search term to look for.
		 * @returns {void}
		 */
		doGeocode: debounce( function ( name ) {

			if ( ! name.length ) {

				this.geocodeResult = [];
				return;

			}

			this.isGeocoding = true;
			fetch( 'https://nominatim.openstreetmap.org/search?q=' + name + '&format=json&countrycodes=nl&accept-language=nl' )
				.then( res => {

					const contentType = res.headers.get( "content-type" );
					if ( res.ok && contentType && contentType.indexOf( "application/json" ) !== - 1 ) {

						return res.json();

					}

				} )
				.catch( ( error ) => {

					this.geocodeResult = [];
					throw error;

				} )
				.then( json => {

					this.geocodeResult = json.map( a => {

						let rd_coords = Proj4( "EPSG:4326", "EPSG:28992", [ parseFloat( a.lon ), parseFloat( a.lat ) ] );
						a.rd_x = rd_coords[ 0 ];
						a.rd_y = rd_coords[ 1 ];
						return a;

					} );

				} )
				.catch( ( error ) => {

					this.geocodeResult = [];
					throw error;

				} )
				.finally( () => {

					this.isGeocoding = false;

				} );


		}, 300 )
	}
};
</script>

<style>
	#map-options .animation-content {
		width: 80%;
		margin-top: 10%;
	}
	#map-options .modal {
		justify-content: unset;
	}
	#map-options .dropdown-content {
		max-height: 100%;
	}
</style>
