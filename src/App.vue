<template>
  <div id="app">
    <aside
      id="main-menu"
      class="menu"
    >
      <p class="menu-label">
        Pages
      </p>
      <ul class="menu-list">
        <li>
          <router-link
            to="/faq"
            active-class="is-active"
          >
            FAQ
          </router-link>
        </li>
        <li>
          <router-link
            to="/viewer"
            active-class="is-active"
          >
            Viewer
          </router-link>
        </li>
      </ul>
    </aside>
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
html, body {
  height: 100%;
  width: 100%;
  margin: 0px;
  overflow: hidden;
}

#app {

  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
  margin: 0px;
  display: flex;

}

#main-menu {
  width: 250px;
  height: 100%;
}
</style>
