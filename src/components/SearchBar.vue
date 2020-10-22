<template>
  <section id="search">
    <div class="field has-addons">
      <div class="control">
        <b-button
          icon-right="menu"
          @click="$emit( 'menu-clicked' );"
        />
      </div>
      <b-autocomplete
        id="search-input"
        class="control"
        field="weergavenaam"
        :data="geocodeResult"
        :loading="isGeocoding"
        placeholder="Search"
        icon-right="magnify"
        @typing="doGeocode"
        @select="selectPlace"
      >
        <template slot="empty">
          No results found
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
                {{ props.option.weergavenaam }}
                <small>
                  {{ props.option.type }} ({{ props.option.bron }})
                </small>
              </p>
            </div>
          </div>
        </template>
      </b-autocomplete>
    </div>
  </section>
</template>

<script>
import debounce from 'debounce';

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
	  	isGeocoding: false
	  };

	},
	methods: {
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
			fetch( 'https://geodata.nationaalgeoregister.nl/locatieserver/v3/free?q=' + name + '&fl=weergavenaam,bron,type,bron,id,centroide_rd&rows=10' )
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

					var re = /\d+\.?\d*/g;
					this.geocodeResult = json.response.docs.map( a => {

						let m = a.centroide_rd.match( re );
						a.rd_x = parseFloat( m[ 0 ] );
						a.rd_y = parseFloat( m[ 1 ] );
						return a;

					} );

				} )
				.finally( () => {

					this.isGeocoding = false;

				} );


		} )
	}
};
</script>
