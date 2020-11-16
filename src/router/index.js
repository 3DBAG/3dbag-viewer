import Vue from 'vue';
import Router from 'vue-router';
import ThreeViewer from '@/pages/Viewer';
import Documentation from '@/pages/Documentation';
import DownloadView from '@/pages/DownloadView';
import { defaultLocale } from '../locale/i18n';
import { locales } from '../locale/i18n';

Vue.use( Router );

const router = new Router( {
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
			name: 'pages',
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

const routes = router.options.routes;
var routeNames = [];
for ( var i = 0; i < routes.length; i ++ ) {

	if ( routes[ i ].name == 'pages' ) {

		for ( var j = 0; j < routes[ i ].children.length; j ++ ) {

			routeNames.push( routes[ i ].children[ j ].name );

		}

	}

}

router.beforeEach( ( to, from, next )=> {

	const localeCodes = [];
	for ( var i = 0; i < locales.length; i ++ ) {

		localeCodes.push( locales[ i ].code );

	}

	// Check if locale is valid or otherwise if the route directs to an existing page
	if ( ! localeCodes.includes( to.params.locale ) ) {

		const routeNamesLower = routeNames.map( a => a.toLowerCase() );
		const routeIndex = routeNamesLower.indexOf( to.params.locale.toLowerCase() );

		if ( routeIndex != - 1 && localeCodes.includes( from.params.locale ) ) {

			next( { name: routeNames[ routeIndex ], hash: to.hash, params: { locale: from.params.locale } } );

		} else if ( routeIndex != - 1 ) {

			next( { name: routeNames[ routeIndex ], hash: to.hash, params: { locale: defaultLocale } } );

		} else next( "/" );


	} else next();

} );

export default router;
