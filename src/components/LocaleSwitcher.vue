<template>
  <div class="navbar-item has-dropdown is-hoverable">
    <a class="navbar-link">
      <b-icon icon="translate" />
    </a>
    <div
      class="navbar-dropdown is-right"
    >
      <router-link
        :to="createRoute( $i18n.availableLocales[ 0 ] )"
        class="navbar-item"
      >
        <span>{{ localeName($i18n.availableLocales[ 0 ]) }}</span>
      </router-link>
      <router-link
        :to="createRoute( $i18n.availableLocales[ 1 ] )"
        class="navbar-item"
      >
        <span>{{ localeName($i18n.availableLocales[ 1 ]) }}</span>
      </router-link>
    </div>
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
