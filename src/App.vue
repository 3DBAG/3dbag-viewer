<template>
  <div id="app">
    <nav
      class="navbar is-fixed-top is-white"
      role="navigation"
      aria-label="dropdown navigation"
    >
      <div class="navbar-brand">
        <div
          class="navbar-item"
        >
          <router-link
            to="/"
            class="logo-text"
            style="margin-right:0.4em; color: #000"
          >
            3D BAG
          </router-link>
          <span
            class="logo-text"
            style="color:#ccc; font-weight:300; margin-right:0.2em"
          >by</span>
          <img
            src="@/assets/logo.svg"
            width="28"
            height="28"
          >
          <a
            href="https://3d.bk.tudelft.nl"
            class="logo-text"
            style="color: #333"
          >tudelft3d</a>
          <span
            class="logo-text"
            style="color:#ccc; font-weight:300; margin:0 0.3em"
          > + </span>
          <img
            src="@/assets/logo-3dgi.svg"
            width="28"
            height="28"
          >
          <a
            href="https://3dgi.xyz"
            class="logo-text"
            style="color: #333"
          >3DGI</a>
        </div>
        <a
          role="button"
          class="navbar-burger"
          :class="{ 'is-active': showBurgerMenu }"
          aria-label="menu"
          aria-expanded="false"
          data-target="navMenu"
          @click="showBurgerMenu=!showBurgerMenu"
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </a>
      </div>
      <div
        class="navbar-menu"
        :class="{ 'is-active': showBurgerMenu }"
      >
        <div class="navbar-start">
          <div class="navbar-item tags has-addons">
            <a
              class="tag"
              :href="'https://docs.3dbag.nl/' + currentLocale + '/overview/release_notes/#20230809-beta'"
            >{{ $root.$data['version_number'] }}
            </a>
            <span class="tag is-danger">{{ $root.$data['version_data']['release-type'] }}</span>
          </div>
        </div>
        <div class="navbar-end">
          <router-link
            to="/viewer"
            :class="{'is-active': currentRouteName=='Viewer'}"
            class="navbar-item"
          >
            {{ $t("nav.3dmap") }}
          </router-link>
          <router-link
            to="/download"
            :class="{'is-active': currentRouteName=='Download'}"
            class="navbar-item"
          >
            {{ $t("nav.download") }}
          </router-link>
          <a
            :href="'https://docs.3dbag.nl/' + currentLocale"
            class="navbar-item docs-link"
          >
            {{ $t("nav.docs") }}
          </a>
          <a
            class="navbar-item"
            :href="currentLocale == 'en' ? 'https://forms.gle/NZg83heXM75pAmfVA' : 'https://forms.gle/N1FPRp3RG45EaBjUA'"
          >
            {{ $t("nav.feedback") }}
          </a>
          <LocaleSwitcher />
        </div>
      </div>
    </nav>
    <router-view
      @show-about="showAbout=true"
    />
  </div>
</template>

<script>

import LocaleSwitcher from './components/LocaleSwitcher';

export default {

	name: 'App',
  	components: {
		LocaleSwitcher,
	},

	data() {

		return {

			showBurgerMenu: false,
			showAbout: false,

		};

	},

	computed: {
		currentLocale() {

			return this.$route.params.locale;

		},
		currentRouteName() {

			return this.$route.name;

		}
	},

};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter&family=Roboto+Mono&display=swap');


html, body {
  height: 100%;
  width: 100%;
  margin: 0px;
}

#app {

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 3.25rem 0 0 0;

}

nav.navbar {
  box-shadow: 0 0.5em 1em -0.125em rgb(10 10 10 / 10%), 0 0px 0 1px rgb(10 10 10 / 2%);
}

.logo-text {
  font-family: 'Barlow', sans-serif;
  font-weight: bold;
}

.docs-link {
  background-color: rgb(250 250 250 / 1);
}
</style>
