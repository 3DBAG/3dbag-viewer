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

		const tileIDs = [ "32616", "28580", "39862" ];

		const baseURI = "https://godzilla.bk.tudelft.nl/3dtiles/lod22_allattrs/tiles/";
		const dracoURI = baseURI + "draco/tiles/";

		var results = { "original": { "id": [], "mean": [], "size": [] },
			"draco": { "id": [], "mean": [], "size": [], "comparison": { "absolute": [], "relative": [], "parse_absolute": [], "parse_relative": [] } } };

		const networkSpeed = 5; // MB/s

		for ( const tileID of tileIDs ) {

			var originalTileURI = baseURI + tileID + ".b3dm";
			var dracoTileURI = dracoURI + tileID + ".b3dm";

			var originalBuf = await this.fetchTile( originalTileURI );
			var originalMB = originalBuf.byteLength / 1000000;
			var originalTile = await this.parseTile( b3dmloader, originalBuf );

			var dracoBuf = await this.fetchTile( dracoTileURI );
			var dracoMB = dracoBuf.byteLength / 1000000;
			var dracoTile = await this.parseTile( b3dmloader, dracoBuf );

			console.log( originalTile );
			console.log( dracoTile );

			var that = this;

			console.log( "Initiate benchmark" );

			const suite = new Benchmark.Suite( this );
			suite
				.add( "Parse original", function () {

					that.parseTile( b3dmloader, originalBuf );

				} )
				.add( "Parse Draco", function () {

					that.parseTile( b3dmloader, dracoBuf );

				} )
				.on( "cycle", function ( event ) {

					console.log( String( event.target ) );

				} )
				.on( "complete", function () {

					results.original.id.push( tileID );
					results.original.mean.push( this[ 0 ].stats.mean );
					results.original.size.push( originalMB );
					const originalTime = this[ 0 ].stats.mean + originalMB / networkSpeed;


					results.draco.id.push( tileID );
					results.draco.mean.push( this[ 1 ].stats.mean );
					results.draco.size.push( dracoMB );
					const dracoTime = this[ 0 ].stats.mean + dracoMB / networkSpeed;
					results.draco.comparison.relative.push( dracoTime / originalTime );
					results.draco.comparison.absolute.push( dracoTime - originalTime );
					results.draco.comparison.parse_absolute.push( this[ 1 ].stats.mean - this[ 0 ].stats.mean );
					results.draco.comparison.parse_relative.push( this[ 1 ].stats.mean / this[ 0 ].stats.mean );

				} )
				.run( { async: false } );

		   }

		   console.log( results );

		   for ( var i = 0; i < results.original.id.length; i ++ ) {

			console.log( { "file size": results.original.size[ i ], "relative": results.draco.comparison.relative[ i ], "absolute": results.draco.comparison.absolute[ i ],
			 "parse_relative:": results.draco.comparison.parse_relative, "parse_absolute": results.draco.comparison.parse_absolute } );

		   }

	}

}
