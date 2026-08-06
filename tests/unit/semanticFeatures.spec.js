import { BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { getPreferredHighlightAttribute, getSemanticFeature } from '@/utils/semanticFeatures';

function createIntersection( featureIds = [ 7 ] ) {

	const geometry = new BufferGeometry();
	geometry.setAttribute( 'position', new Float32BufferAttribute( [
		0, 0, 0,
		1, 0, 0,
		0, 1, 0
	], 3 ) );
	geometry.setAttribute( '_feature_id_0', new Float32BufferAttribute( [ 7, 7, 7 ], 1 ) );
	const object = new Mesh( geometry, new MeshBasicMaterial() );
	object.userData.meshFeatures = {
		getFeatureInfo: () => [ { attribute: 0, propertyTable: 0 } ],
		getFeatures: () => featureIds,
		getFeaturesAsync: jest.fn()
	};
	object.userData.structuralMetadata = {
		getPropertyTableInfo: () => ( { className: 'building', name: 'buildings' } ),
		getPropertyTableData: ( table, featureId ) => ( { identificatie: `building-${ featureId }` } )
	};
	object.updateMatrixWorld();

	return {
		object,
		face: { a: 0, b: 1, c: 2 },
		faceIndex: 0,
		point: new Vector3( 0.25, 0.25, 0 )
	};

}

describe( 'semantic feature adapter', () => {

	it( 'resolves a building feature and its structural metadata', async () => {

		const intersection = createIntersection();
		const result = await getSemanticFeature( intersection );

		expect( result ).toMatchObject( {
			featureId: 7,
			featureClass: 'building',
			highlightAttribute: '_feature_id_0',
			attributes: { identificatie: 'building-7' }
		} );
		expect( getPreferredHighlightAttribute( intersection.object ) ).toBe( '_feature_id_0' );

	} );

	it( 'does not invent a selection for a null feature id', async () => {

		expect( await getSemanticFeature( createIntersection( [ null ] ) ) ).toBeNull();

	} );

	it( 'returns null when the mesh has no semantic extensions', async () => {

		const intersection = createIntersection();
		delete intersection.object.userData.meshFeatures;
		expect( await getSemanticFeature( intersection ) ).toBeNull();

	} );

} );
