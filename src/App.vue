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
            <span class="tag">v20.10.0</span>
            <span class="tag is-danger">beta</span>
          </div>
        </div>
        <div class="navbar-end">
          <router-link
            to="/viewer"
            active-class="is-active"
            class="navbar-item"
          >
            Map
          </router-link>
          <div
            class="navbar-item has-dropdown is-hoverable"
          >
            <router-link
              to="/docs"
              active-class="is-active"
              class="navbar-link"
            >
              Docs
            </router-link>
            <div class="navbar-dropdown">
              <router-link
                to="/docs#schema"
                class="navbar-item"
              >
                Schema
              </router-link>
              <router-link
                to="/docs#attributes"
                class="navbar-item"
              >
                Attributes
              </router-link>
              <router-link
                to="/docs#faq"
                class="navbar-item"
              >
                FAQ
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script>

export default {

	name: 'App',

	data() {

		return {

			showBurgerMenu: false,

		};

	}

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
