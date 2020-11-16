<template>
  <div
    class="navbar-item has-dropdown is-hoverable"
  >
    <a class="navbar-link">
      Language
    </a>
    <div class="navbar-dropdown">
      <router-link
        v-for="locale in locales"
        :key="locale.code"
        :to="createRoute( locale.code )"
        class="dropdown-item"
      >
        <span class="locale-name">{{ locale.name }}</span>
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
			routeParams[ 1 ] = localeCode;
			return routeParams.join( "/" );

		}

	}
};
</script>

<style scoped>
    .country-icon {
        width: 20px;
        height: auto;
        display: inline-block;
        vertical-align: baseline;
        border: 1px solid #dee2e6;
        box-shadow: 0px 1px 3px rgba(24, 29, 38, 0.1);
    }

    .country-icon.as-toggle {
        margin-top: 5px;
    }

    .locale-name {
        display: inline-block;
        vertical-align: baseline;
    }
</style>
