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
                <br>
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

export default {
	name: 'SearchBar',
	data: function () {

		return {
			geocodeResult: [],
	  		isGeocoding: false
	  	};

	},
	methods: {
		selectPlace: function ( res ) {

			console.log( res );
			this.$emit( 'select-place', res );

		},
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
