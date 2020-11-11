import Vue from 'vue';
import Router from 'vue-router';
import ThreeViewer from '@/pages/Viewer';
import Documentation from '@/pages/Documentation';
import DownloadView from '@/pages/DownloadView';

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
			path: '/download',
			name: 'Download',
			component: DownloadView
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
