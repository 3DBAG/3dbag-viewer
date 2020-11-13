import Vue from 'vue';
import Router from 'vue-router';
import ThreeViewer from '@/pages/Viewer';
import Documentation from '@/pages/Documentation';
import DownloadView from '@/pages/DownloadView';
import { defaultLocale } from '../locale/i18n';

Vue.use( Router );

export default new Router( {
	routes: [
		{
			path: '/',
			redirect: `/${defaultLocale}/viewer`,
		},
		{
			path: '/:locale',
			component: {
				template: '<router-view />',
			},
			children: [
				{
					path: 'viewer',
					name: 'Viewer',
					component: ThreeViewer
				},
				{
					path: 'download',
					name: 'Download',
					component: DownloadView
				},
				{
					path: 'docs',
					name: 'Docs',
					component: Documentation
				}
			],
		},
	],

	scrollBehavior: function ( to ) {

		if ( to.hash ) {

			return {

				selector: to.hash

			};

		}

	},
} );
