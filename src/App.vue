<template>
  <div id="app">
    <nav
      class="navbar is-fixed-top is-white has-shadow"
      role="navigation"
      aria-label="dropdown navigation"
    >
      <div class="navbar-brand">
        <router-link
          to="/viewer"
          class="navbar-item"
        >
          <img
            src="@/assets/logo.svg"
            width="28"
            height="28"
          >
          <span class="logo-text">3D BAG </span>
        </router-link>
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
            <span class="tag">v21.02.3</span>
            <a
              class="tag is-danger"
              @click="showWelcome=true"
            >beta</a>
          </div>
        </div>
        <div class="navbar-end">
          <router-link
            to="/viewer"
            active-class="is-active"
            class="navbar-item"
          >
            {{ $t("nav.3dmap") }}
          </router-link>
          <router-link
            to="/download"
            active-class="is-active"
            class="navbar-item"
          >
            {{ $t("nav.download") }}
          </router-link>
          <div
            class="navbar-item has-dropdown is-hoverable"
          >
            <router-link
              to="/docs"
              active-class="is-active"
              class="navbar-link"
            >
              {{ $t("nav.docs") }}
            </router-link>
            <div class="navbar-dropdown">
              <router-link
                to="/docs#features"
                class="navbar-item"
              >
                {{ $t("nav.features") }}
              </router-link>
              <router-link
                to="/docs#attributes"
                class="navbar-item"
              >
                {{ $t("nav.attributes") }}
              </router-link>
              <router-link
                to="/docs#changelog"
                class="navbar-item"
              >
                {{ $t("nav.changelog") }}
              </router-link>
            </div>
          </div>
          <LocaleSwitcher />
        </div>
      </div>
    </nav>
    <div
      class="modal"
      :class="{ 'is-active' : showWelcome }"
    >
      <div class="modal-background" />
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">
            Welcome to 3D BAG v2
          </p>
          <button
            class="delete"
            aria-label="close"
            @click="showWelcome = false"
          />
        </header>
        <section class="modal-card-body">
          <div class="content">
            <p>This is a beta release of the renewed version of the 3D BAG service.</p>
            <ul>
              <li>Everything is still under development. Expect broken things.</li>
              <li>We'll release an improved version of 3DBAG once a month.</li>
              <li>
                Check the <router-link to="/docs#changelog">
                  changelog
                </router-link> for what is new.
              </li>
              <li>
                Check the <router-link to="/docs#faq">
                  FAQ
                </router-link> for a list of known issues.
              </li>
              <li>If you find another issue you can use one of the red feedback buttons to report it.</li>
              <li>You can see the attributes of a building by clicking on it.</li>
              <li>
                You can download the data by clicking on a tile on the <router-link to="/download">
                  download page
                </router-link>.
              </li>
            </ul>

            <h2 class="title is-5">
              Terms of use
            </h2>
            <ul>
              <li>Please do not publicly share or promote this website at this time.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
    <router-view />
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
			showWelcome: true,

		};

	},

	computed: {
		currentLocale() {

			return this.$route.params.locale;

		},
	},

};
</script>

<style>
@import 'https://fonts.googleapis.com/css?family=Barlow';

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

.logo-text {
  font-family: 'Barlow', sans-serif;
  font-weight: bold;
}
</style>
