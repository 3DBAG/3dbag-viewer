import Vue from 'vue';
import App from './App.vue';
import router from './router';
import i18n from "./locale/i18n";
import '@mdi/font/css/materialdesignicons.css';
import Buefy from 'buefy';
import '@/styles/bulma.scss';
import { InlineSvgPlugin } from 'vue-inline-svg';

import BAG3D from '@/assets/3dbag_versions.json';
import landmarkLocations from '@/assets/landmark_locations.json';

Vue.use( InlineSvgPlugin );
Vue.use( Buefy );

Vue.config.productionTip = false;

new Vue( {
	data: { version_data: BAG3D[ "versions" ][ BAG3D[ "latest" ] ], version_number: BAG3D[ "latest" ], landmarkLocations: landmarkLocations },
	render: h => h( App ),
	router,
	i18n,
	template: '<App/>',
} ).$mount( '#app' );
