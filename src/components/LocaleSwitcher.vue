<template>
  <div class="buttons">
    <b-button
      tag="router-link"
      :to="createRoute( otherLocale )"
      type="is-link"
    >
      <span>{{ localeName( otherLocale ) }}</span>
    </b-button>
  </div>
</template>

<script>

export default {

	name: "LocaleSwitcher",

	data() {

		return {
		};

	},

	computed: {
		otherLocale() {

			for ( var i = 0; i < this.$i18n.availableLocales.length; i ++ ) {

				if ( this.$i18n.availableLocales[ i ] != this.$i18n.locale ) {

					return this.$i18n.availableLocales[ i ];

				}

			}

			return this.$i18n.fallbackLocale;

		},
	},
	methods: {

		createRoute( localeCode ) {

			var routeParams = this.$route.path.split( "/" );
			const hash = this.$route.hash;

			routeParams[ 1 ] = localeCode;

			return routeParams.join( "/" ) + hash;

		},
		localeName( locale ) {

			const localeNames = { "en": "English", "nl": "Nederlands" };

			return localeNames[ locale ];

		},

	}
};
</script>
