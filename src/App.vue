<template>
  <div
    id="app"
    :style="appStyle"
  >
    <header class="site-header">
      <div
        v-if="serviceNoticeVisible"
        ref="serviceNotice"
        class="service-notice"
        role="status"
        aria-live="polite"
      >
        <b-icon
          class="service-notice-icon"
          icon="alert"
          aria-hidden="true"
        />
        <span class="is-sr-only">{{ $t("serviceNotice.title") }}:</span>
        <span>{{ $t("serviceNotice.body") }}</span>
        <button
          class="delete service-notice-close"
          type="button"
          :aria-label="$t('serviceNotice.dismiss')"
          @click="dismissServiceNotice"
        />
      </div>
      <nav
        class="navbar is-white"
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
              3DBAG
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
              :href="config.geoinfoUrl"
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
              :href="config.threeDgiUrl"
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
                :href="config.docsUrl + '/' + currentLocale + '/overview/release_notes/#20250903-beta'"
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
            <router-link
              to="/dashboard"
              :class="{'is-active': currentRouteName=='Dashboard'}"
              class="navbar-item"
            >
              {{ $t("nav.dashboard") }}
            </router-link>
            <a
              :href="config.docsUrl + '/' + currentLocale"
              class="navbar-item docs-link"
            >
              {{ $t("nav.docs") }}
            </a>
            <a
              class="navbar-item"
              :href="currentLocale == 'en' ? config.feedbackUrlEn : config.feedbackUrlNl"
            >
              {{ $t("nav.feedback") }}
            </a>
            <LocaleSwitcher />
          </div>
        </div>
      </nav>
    </header>
    <router-view
      @show-about="showAbout=true"
    />
  </div>
</template>

<script>

import LocaleSwitcher from './components/LocaleSwitcher';
import { appConfig } from '@/config';

export default {

	name: 'App',
  	components: {
		LocaleSwitcher,
	},

	data() {

		return {

			config: appConfig,
			showBurgerMenu: false,
			showAbout: false,
			serviceNoticeVisible: true,
			serviceNoticeHeight: null,
			serviceNoticeObserver: null,

		};

	},

	computed: {
		appStyle() {

			return this.serviceNoticeHeight === null ? {} : {
				'--service-notice-height': `${ this.serviceNoticeHeight }px`
			};

		},
		currentLocale() {

			return this.$route.params.locale;

		},
		currentRouteName() {

			return this.$route.name;

		}
	},

	mounted() {

		this.$nextTick( () => {

			this.updateServiceNoticeHeight();
			window.addEventListener( 'resize', this.updateServiceNoticeHeight );

			if ( typeof ResizeObserver !== 'undefined' ) {

				this.serviceNoticeObserver = new ResizeObserver( this.updateServiceNoticeHeight );
				this.serviceNoticeObserver.observe( this.$refs.serviceNotice );

			}

		} );

	},

	beforeDestroy() {

		window.removeEventListener( 'resize', this.updateServiceNoticeHeight );

		if ( this.serviceNoticeObserver ) this.serviceNoticeObserver.disconnect();

	},

	methods: {
		dismissServiceNotice() {

			this.serviceNoticeVisible = false;
			this.serviceNoticeHeight = 0;

			if ( this.serviceNoticeObserver ) {

				this.serviceNoticeObserver.disconnect();
				this.serviceNoticeObserver = null;

			}

		},
		updateServiceNoticeHeight() {

			if ( this.$refs.serviceNotice ) {

				this.serviceNoticeHeight = this.$refs.serviceNotice.offsetHeight;

			}

		},
	}

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

  --service-notice-height: 3rem;

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: calc(3.25rem + var(--service-notice-height)) 0 0 0;

}

.site-header {
  position: fixed;
  z-index: 30;
  top: 0;
  right: 0;
  left: 0;
}

.service-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  min-height: 3rem;
  padding: 0.65rem 1rem;
  color: white;
  font-size: 0.875rem;
  line-height: 1.25rem;
  text-align: center;
  background-color: #da2a2a;
}

.service-notice-icon {
  flex: 0 0 auto;
}

.service-notice-close {
  flex: 0 0 auto;
  margin-left: 0.25rem;
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

@media screen and (max-width: 768px) {
  #app {
    --service-notice-height: 5.5rem;
  }

}
</style>
