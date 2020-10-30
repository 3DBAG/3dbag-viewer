import Vue from 'vue';
import Router from 'vue-router';
import ThreeViewer from '@/pages/Viewer';
import Documentation from '@/pages/Documentation';

Vue.use( Router );

export default new Router( {
	routes: [
		{
			path: '/viewer',
			name: 'Viewer',
			component: ThreeViewer
		},
		{
			path: '/',
			redirect: '/viewer'
		},
		{
			path: '/docs',
			name: 'Docs',
			component: Documentation
		}
	],
	scrollBehavior: function ( to ) {

		if ( to.hash ) {

			return {

				selector: to.hash

			};

		}

	},
} );
