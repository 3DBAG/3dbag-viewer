import { B3DMLoader } from '../../3DTilesRendererJS/src/three/B3DMLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const Benchmark = require( 'benchmark' );

export class benchmarker {

	constructor() {

	}

	async fetchTile( uri ) {

		const res = await fetch( uri );
		const buf = await res.arrayBuffer();

		return buf;

	}

	async parseTile( loader, buffer ) {

		const res = await loader.parse( buffer );

		return res;

	}

	async benchmark() {

		const compressionTypes = [ "original", "draco", "gzip", "gzip-pre" ];
		const tileIDs = [ '39862', '26118', '54290', '47253', '26474', '59880', '55103', '35044', '26441', '48910', '45791', '56056',
			'40916', '31132', '25220', '76721', '44837', '27019', '22172', '21253', '23708', '21237', '31930', '19102', '66653',
			'28580', '50812', '39952', '43555', '24914', '55797', '33197', '28907', '36303', '31731', '43306', '66527', '37743',
			'61326', '23113', '39580', '31730', '45708', '54794', '56934', '44448', '35976', '28652', '74829', '23397', '19118',
			'49104', '57846', '44028', '23386', '36812', '55243', '40235', '56048', '74830', '27721', '11407', '24943', '67596',
			'55525', '59227', '23650', '32615', '21867', '33227', '51988', '45363', '32616', '27723', '51680', '67595', '24638',
			'67290', '32617', '20041', '20650', '20038', '20651', '27722', '27416', '20039', '32922', '21561', '30997', '32923' ];

		let average = ( array ) => array.reduce( ( a, b ) => a + b ) / array.length;

		const b3dmloader = new B3DMLoader( );

		b3dmloader.manager.addHandler( /\.gltf$/, {

			parse( ...args ) {

				// Note the DRACO compression files need to be supplied via an explicit source.
				// We use unpkg here but in practice should be provided by the application.
				const dracoLoader = new DRACOLoader();
				dracoLoader.setDecoderPath( 'https://unpkg.com/three@0.121.1/examples/js/libs/draco/gltf/' );

				const loader = new GLTFLoader( b3dmloader.manager );
				loader.setDRACOLoader( dracoLoader );
				return loader.parse( ...args );

			}

		} );

		var results = { "original": { "id": [], "mean": [], "size": [] },
			"draco": { "id": [], "mean": [], "size": [], "comparison": { "absolute": [], "relative": [], "parse_absolute": [], "parse_relative": [] } },
			"gzip": { "id": [], "mean": [], "size": [], "comparison": { "absolute": [], "relative": [] } },
			"gzip-pre": { "id": [], "mean": [], "size": [], "comparison": { "absolute": [], "relative": [] } },
			"draco-gzip": { "id": [], "mean": [], "size": [], "comparison": { "absolute": [], "relative": [] } } };

		for ( var compressionType of compressionTypes ) {

			const baseURI = "http://0.0.0.0/" + compressionType + "/";

			var tile_n = 0;

			for ( const tileID of tileIDs ) {

				var tileURI = baseURI + tileID + ".b3dm";

				console.log( "Initiate benchmark for " + tileID + ", " + compressionType );

				var times = { "original": [], "draco": [], "gzip": [], "gzip-pre": [], "draco-gzip": [] };

				var buf = await this.fetchTile( tileURI );
				var tile = await this.parseTile( b3dmloader, buf );

				for ( var i = 0; i < 20; i ++ ) {

					var d = new Date();
					var start = d.getTime();

					var buf = await this.fetchTile( tileURI );
					var tile = await this.parseTile( b3dmloader, buf );

					var d = new Date();
					var end = d.getTime();
					times.original.push( end - start );

				}

				var mb = buf.byteLength / 1000000;
				var avg = average( times.original ) / 1000;

				results[ compressionType ].id.push( tileID );
				results[ compressionType ].mean.push( avg );
				results[ compressionType ].size.push( mb );

				if ( compressionType != "original" ) {

					const originalTime = results.original.mean[ tile_n ];
					results[ compressionType ].comparison.relative.push( avg / originalTime );
					results[ compressionType ].comparison.absolute.push( avg - originalTime );

				}

				tile_n += 1;

			}

			console.log( results );

		}

		console.log( results );

	}

}
