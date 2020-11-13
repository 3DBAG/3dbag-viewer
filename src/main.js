import Vue from 'vue';
// import VueI18n from 'vue-i18n';
import App from './App.vue';
import router from './router';
import '@mdi/font/css/materialdesignicons.css';
import Buefy from 'buefy';
import '@/styles/bulma.scss';

Vue.use( Buefy );

Vue.config.productionTip = false;

new Vue( {
	render: h => h( App ),
	router,
	template: '<App/>',
} ).$mount( '#app' );
