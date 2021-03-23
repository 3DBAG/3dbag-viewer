<template>
  <div id="app">
    <nav
      class="navbar is-fixed-top is-white has-shadow"
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
            <span class="tag">{{ $root.$data['latest'] }}</span>
            <a
              class="tag is-danger"
              @click="showAbout=true"
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
          <a
            href="https://docs.3dbag.nl"
            class="navbar-item"
          >
            {{ $t("nav.docs") }}
          </a>
          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link">
              More
            </a>

            <div class="navbar-dropdown is-right">
              <a
                class="navbar-item"
                @click="showAbout=true"
              >
                About
              </a>
              <hr class="navbar-divider">
              <a
                class="navbar-item"
                href="https://docs.google.com/forms/d/e/1FAIpQLSe2XLCYNmoFVHrgt_uRXeLLwfzDK7gS2kE7mGH8rnk6ltE0LQ/viewform?"
              >
                Give feedback
              </a>
            </div>
          </div>
          <LocaleSwitcher />
        </div>
      </div>
    </nav>
    <div
      class="modal"
      :class="{ 'is-active' : showAbout }"
    >
      <div class="modal-background" />
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">
            About 3D BAG
          </p>
          <button
            class="delete"
            aria-label="close"
            @click="showAbout = false"
          />
        </header>
        <section class="modal-card-body">
          <div class="content">
            <p>This is a beta release of the renewed version of the 3D BAG service.</p>
            <ul>
              <li>Everything is still under development. Expect broken things.</li>
              <li>If you find another issue you can use one of the red feedback buttons to report it.</li>
              <li>You can see the attributes of a building by clicking on it.</li>
            </ul>

            <h2 class="title is-4">
              Copyright and licensing
            </h2>
            <ul>
              <li>Please do not publicly share or promote this website at this time.</li>
              <li>See xx docs page for all the information on this.</li>
            </ul>

            <h2 class="title is-4">
              Attribution
            </h2>
            <ul>
              <li>3D BAG by the 3D geoinformation group @ TU Delft</li>
              <li>Baselayers from PDOK</li>
              <li>See yy docs page for full attribution</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
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
