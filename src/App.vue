<template>
  <div id="app">
    <nav
      class="navbar is-fixed-top is-white"
      role="navigation"
      aria-label="dropdown navigation"
    >
      <div class="navbar-brand navbar-start">
        <router-link
          to="/"
          class="navbar-item"
        >
          <img
            src="@/assets/logo.svg"
            width="28"
            height="28"
          >
          <span class="logo-text">3D BAG </span>
        </router-link>
        <span class="navbar-item has-text-grey-light">v20.10.0 beta</span>
      </div>
      <div class="navbar-end">
        <router-link
          to="/viewer"
          active-class="is-active"
          class="navbar-item is-tab"
        >
          Map
        </router-link>
        <router-link
          to="/faq"
          active-class="is-active"
          class="navbar-item is-tab"
        >
          Docs
        </router-link>
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

			showSidebar: true,

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
  overflow: hidden;
}

#app {

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 3.25rem 0 0 0;

}

.logo {
  font-family: 'Barlow', sans-serif;
  font-weight: bold;
}
</style>
