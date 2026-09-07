import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial } from 'three';
import { getBuildingNotice } from '@/utils/buildingNotice';

function building() {

	const geometry = new BufferGeometry();
	geometry.setAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0, 1, 0, 0, 0, 1, 0 ], 3 ) );
	return new Mesh( geometry, new MeshBasicMaterial() );

}

function renderer( ...scenes ) {

	return {
		root: {},
		stats: { downloading: 0, parsing: 0 },
		visibleTiles: new Set( scenes.map( scene => ( { engineData: { scene } } ) ) )
	};

}

describe( 'building visibility notice', () => {

	it( 'keeps the zoom notice for empty intermediate nodes and empty model scenes', () => {

		expect( getBuildingNotice( renderer( undefined, new Group(), new Mesh( new BufferGeometry() ) ), true ) )
			.toBe( 'viewer.zoomInForBuildings' );

	} );

	it( 'hides the notice once a selected leaf contains building triangles', () => {

		const scene = new Group();
		scene.add( building() );
		expect( getBuildingNotice( renderer( new Group(), scene ), true ) ).toBeNull();

	} );

	it( 'does not count hidden geometry or geometry with an empty draw range', () => {

		const hidden = new Group();
		hidden.add( building() );
		hidden.visible = false;
		const empty = building();
		empty.geometry.setDrawRange( 0, 0 );
		expect( getBuildingNotice( renderer( hidden, empty ), true ) ).toBe( 'viewer.zoomInForBuildings' );

	} );

	it( 'shows loading until content arrives, then zoom guidance if only empty nodes remain', () => {

		const tiles = renderer( new Group() );
		tiles.stats.downloading = 1;
		expect( getBuildingNotice( tiles, true ) ).toBe( 'viewer.loadingBuildings' );
		tiles.stats.downloading = 0;
		tiles.stats.parsing = 1;
		expect( getBuildingNotice( tiles, true ) ).toBe( 'viewer.loadingBuildings' );
		tiles.stats.parsing = 0;
		expect( getBuildingNotice( tiles, true ) ).toBe( 'viewer.zoomInForBuildings' );
		tiles.visibleTiles.add( { engineData: { scene: building() } } );
		tiles.stats.downloading = 1;
		expect( getBuildingNotice( tiles, true ) ).toBeNull();

	} );

	it( 'ignores cached visible tiles when building rendering is disabled by zoom', () => {

		expect( getBuildingNotice( renderer( building() ), false ) ).toBe( 'viewer.zoomInForBuildings' );

	} );

	it( 'handles initial loading and avoids zoom advice for a failed tileset', () => {

		const tiles = renderer();
		tiles.root = null;
		expect( getBuildingNotice( tiles, true ) ).toBe( 'viewer.loadingBuildings' );
		expect( getBuildingNotice( tiles, true, new Error( 'Failed to load' ) ) ).toBeNull();

	} );

} );
