import Vue from 'vue';
import App from './App.vue';
import router from './router';
import i18n from "./locale/i18n";
import '@mdi/font/css/materialdesignicons.css';
import Buefy from 'buefy';
import '@/styles/bulma.scss';
import { InlineSvgPlugin } from 'vue-inline-svg';

import manifest from '@manifest';
import landmarkLocations from '@/assets/landmark_locations.json';
import { appConfig, resolveVersionManifest } from '@/config';
import { normalizeMenu } from '@/utils/manifest';

const configuredManifest = resolveVersionManifest( manifest );
const configuredVersions = configuredManifest.versions || {};
const configuredVersionData = configuredVersions[ configuredManifest.latest ] || {};

Vue.use( InlineSvgPlugin );
Vue.use( Buefy );

Vue.config.productionTip = false;

new Vue( {
	data: {
		config: appConfig,
		menu: normalizeMenu( configuredManifest ),
		version_data: configuredVersionData,
		version_number: configuredManifest[ "latest" ],
		versions_data_archived: Object.entries( configuredVersions ).reduce( ( acc, [ key, value ] ) => {

			if ( value[ "archive_public" ] ) {

				acc[ key ] = value;

			}
			return acc;

		}, {} ),
		landmarkLocations: landmarkLocations },
	render: h => h( App ),
	router,
	i18n,
	template: '<App/>',
} ).$mount( '#app' );
