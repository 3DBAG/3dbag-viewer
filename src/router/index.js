import Vue from 'vue';
import Router from 'vue-router';
import ThreeViewer from '@/pages/Viewer';
import Documentation from '@/pages/Documentation';
import DownloadView from '@/pages/DownloadView';
import i18n from "@/locale/i18n";

Vue.use( Router );

const router = new Router( {
	routes: [
		{
			path: '/',
			redirect: `/${i18n.fallbackLocale}/viewer`,
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

	// Check if locale is valid or otherwise if the route directs to an existing page
	if ( ! i18n.availableLocales.includes( to.params.locale ) ) {

		const routeNamesLower = routeNames.map( a => a.toLowerCase() );
		const routeIndex = routeNamesLower.indexOf( to.params.locale.toLowerCase() );

		if ( routeIndex != - 1 && i18n.availableLocales.includes( from.params.locale ) ) {

			i18n.locale = from.params.locale;

			next( { name: routeNames[ routeIndex ], hash: to.hash, params: { locale: from.params.locale } } );

		} else if ( routeIndex != - 1 ) {

			i18n.locale = i18n.fallbackLocale;

			next( { name: routeNames[ routeIndex ], hash: to.hash, params: { locale: i18n.fallbackLocale } } );

		} else next( "/" );


	} else {

		i18n.locale = to.params.locale;

		next();

	}

} );

export default router;
