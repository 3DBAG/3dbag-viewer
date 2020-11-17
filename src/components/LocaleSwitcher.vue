<template>
  <div
    class="navbar-item has-dropdown is-hoverable"
  >
    <a class="navbar-link">
      Language
    </a>
    <div class="navbar-dropdown">
      <router-link
        v-for="locale in $i18n.availableLocales"
        :key="locale"
        :to="createRoute( locale )"
        class="dropdown-item"
      >
        <span class="locale-name">{{ locale }}</span>
      </router-link>
    </div>
  </div>
</template>

<script>

import { locales } from '../locale/i18n';

export default {

	name: "LocaleSwitcher",

	data() {

		return {
			locales,
		};

	},

	computed: {
		currentLocale() {

			return this.$route.params.locale;

		},
	},
	methods: {

		createRoute( localeCode ) {

			var routeParams = this.$route.path.split( "/" );
			const hash = this.$route.hash;

			routeParams[ 1 ] = localeCode;

			return routeParams.join( "/" ) + hash;

		}

	}
};
</script>

<style scoped>
    .locale-name {
        display: inline-block;
        vertical-align: baseline;
    }
</style>
