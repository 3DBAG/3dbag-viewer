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
            <a class="tag is-danger" @click="showWelcome=true">beta</a>
          </div>
        </div>
        <div class="navbar-end">
          <router-link
            to="/viewer"
            active-class="is-active"
            class="navbar-item"
          >
            3D Map
          </router-link>
          <router-link
            to="/download"
            active-class="is-active"
            class="navbar-item"
          >
            Download
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
                to="/docs#features"
                class="navbar-item"
              >
                Features
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
          <p class="modal-card-title">
            Welcome to the new 3D BAG beta
          </p>
          <button
            class="delete"
            aria-label="close"
            @click="showWelcome = false"
          />
        </header>
        <section class="modal-card-body">
          <div class="content">
            <p>This is the first beta release of the completely renewed 3DBAG service.</p>
            <ul>
              <li>Everything is still under development. Expect broken things.</li>
              <li>We'll release an improved version of 3DBAG at least once every month.</li>
              <li>
                Check the <router-link to="/docs#faq">
                  FAQ
                </router-link> for a list of known issues.
              </li>
              <li>If you find another issue you can use the feedback button to report it.</li>
              <li>See the attributes of a building by clicking on it.</li>
            </ul>

            <h2 class="title is-5">
              Terms of use
            </h2>
            <ul>
              <li>Please do not publicly share or promote this website at this time.</li>
              <li>Otherwise feel free to do with the data whatever you want.</li>
            </ul>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button
            class="button is-primary"
            @click="showWelcome = false"
          >
            Okay
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
