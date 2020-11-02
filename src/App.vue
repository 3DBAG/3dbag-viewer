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
          <a
            class="navbar-item"
            href="http://godzilla.bk.tudelft.nl/3dbag_lod2/"
          >
            Download
          </a>
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
    <div
      class="modal"
      :class="{ 'is-active' : showWelcome }"
    >
      <div class="modal-background" />
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Welcome to 3D BAG beta</p>
          <button
            class="delete"
            aria-label="close"
            @click="showWelcome"
          />
        </header>
        <section class="modal-card-body">
          <div class="content">
            <h2>How to use</h2>
            <ul>
              <li>See the attributes of a building by clicking on it.</li>
              <li>This is a Beta version and we are improving on it every month. Come back often to see the updates! The version number is in the top left corner, besides the logo.</li>
            </ul>

            <h2>Terms of use</h2>
            <ul>
              <p>The first rule about 3D BAG, is that you do not talk about 3D BAG. </p>
              <p>
                But jokes aside, what you currently see on this website and the data that you can download is meant
                for internal use within the 3D geoinformation group only. Please look around,
                check the data but don't share it just yet. Neither the files nor the link to the
                website. We still need some time to iron things out and we would like it to be a surprise when it goes public.
              </p>
            </ul>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button
            class="button is-success"
            @click="showWelcome = false"
          >
            Gotcha!
          </button>
        </footer>
      </div>
    </div>
    <router-view />
  </div>
</template>

<script>

export default {

	name: 'App',

	data() {

		return {

			showBurgerMenu: false,
			showWelcome: true

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
