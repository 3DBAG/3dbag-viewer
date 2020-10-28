import Vue from 'vue';
import Router from 'vue-router';
import ThreeViewer from '@/pages/Viewer';
import FAQ from '@/pages/FAQ';

Vue.use( Router );

export default new Router( {
	routes: [
		{
			path: '/viewer',
			name: 'Viewer',
			component: ThreeViewer
		},
		{
			path: '/faq',
			name: 'FAQ',
			component: FAQ
		}
	]
} );
