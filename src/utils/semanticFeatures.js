import { Triangle, Vector3 } from 'three';

const featureBaseCache = new WeakMap();
const featureVertex = new Vector3();

function getBarycentricCoordinate( intersection ) {

	const { face, object, point } = intersection;
	if ( ! face || ! object.geometry ) return null;

	const position = object.geometry.getAttribute( 'position' );
	if ( ! position ) return null;

	const localPoint = object.worldToLocal( point.clone() );
	const a = new Vector3().fromBufferAttribute( position, face.a );
	const b = new Vector3().fromBufferAttribute( position, face.b );
	const c = new Vector3().fromBufferAttribute( position, face.c );
	return Triangle.getBarycoord( localPoint, a, b, c, new Vector3() );

}

function getCandidate( structuralMetadata, featureInfo, featureId, index ) {

	if ( featureId === null || featureId === undefined ) return null;
	if ( featureInfo.propertyTable === null || featureInfo.propertyTable === undefined ) return null;

	const tableIndex = featureInfo.propertyTable;
	const tableInfo = structuralMetadata.getPropertyTableInfo( tableIndex );
	return {
		featureId,
		featureClass: tableInfo.className || null,
		attributes: structuralMetadata.getPropertyTableData( tableIndex, featureId ),
		featureInfo,
		featureSetIndex: index,
		highlightAttribute: featureInfo.attribute === undefined ? null : `_feature_id_${ featureInfo.attribute }`
	};

}

export async function getSemanticFeature( intersection ) {

	const object = intersection.object;
	const meshFeatures = object.userData && object.userData.meshFeatures;
	const structuralMetadata = object.userData && object.userData.structuralMetadata;
	if ( ! meshFeatures || ! structuralMetadata ) return null;

	const barycentric = getBarycentricCoordinate( intersection );
	if ( ! barycentric ) return null;

	const featureInfo = meshFeatures.getFeatureInfo();
	const hasTextureFeature = featureInfo.some( info => info.texture );
	const featureIds = hasTextureFeature ?
		await meshFeatures.getFeaturesAsync( intersection.faceIndex, barycentric ) :
		meshFeatures.getFeatures( intersection.faceIndex, barycentric );
	const candidates = featureInfo
		.map( ( info, index ) => getCandidate( structuralMetadata, info, featureIds[ index ], index ) )
		.filter( Boolean );

	return candidates.find( candidate => candidate.featureClass === 'building' ) || candidates[ 0 ] || null;

}

export function getPreferredHighlightAttribute( object ) {

	const meshFeatures = object.userData && object.userData.meshFeatures;
	const structuralMetadata = object.userData && object.userData.structuralMetadata;
	if ( ! meshFeatures || ! structuralMetadata ) return null;

	const candidates = meshFeatures.getFeatureInfo()
		.map( info => {

			if ( info.attribute === undefined || info.propertyTable === null || info.propertyTable === undefined ) return null;
			const table = structuralMetadata.getPropertyTableInfo( info.propertyTable );
			return { attribute: `_feature_id_${ info.attribute }`, className: table.className };

		} )
		.filter( Boolean );

	const preferred = candidates.find( candidate => candidate.className === 'building' ) || candidates[ 0 ];
	return preferred ? preferred.attribute : null;

}

function getFeatureBaseCacheKey( semanticFeature ) {

	return [
		semanticFeature.highlightAttribute,
		semanticFeature.featureInfo.propertyTable,
		semanticFeature.featureId
	].join( ':' );

}

function getFeatureAttributeName( object, semanticFeature ) {

	const meshFeatures = object.userData && object.userData.meshFeatures;
	if ( ! meshFeatures ) return null;

	const featureInfo = meshFeatures.getFeatureInfo().find( info => {

		return info.attribute !== undefined && info.propertyTable === semanticFeature.featureInfo.propertyTable;

	} );
	return featureInfo ? `_feature_id_${ featureInfo.attribute }` : null;

}

export function getHeightAboveFeatureBase( modelRoot, semanticFeature, worldPoint, worldUp ) {

	if ( ! modelRoot || ! semanticFeature || ! semanticFeature.highlightAttribute ) return null;

	let modelCache = featureBaseCache.get( modelRoot );
	if ( ! modelCache ) {

		modelCache = new Map();
		featureBaseCache.set( modelRoot, modelCache );

	}

	const cacheKey = getFeatureBaseCacheKey( semanticFeature );
	let base = modelCache.get( cacheKey );
	if ( ! base ) {

		let minimumProjection = Infinity;
		modelRoot.traverse( object => {

			if ( ! object.geometry ) return;
			const featureAttributeName = getFeatureAttributeName( object, semanticFeature );
			if ( ! featureAttributeName ) return;
			const position = object.geometry.getAttribute( 'position' );
			const featureId = object.geometry.getAttribute( featureAttributeName );
			if ( ! position || ! featureId ) return;

			for ( let index = 0; index < position.count; index ++ ) {

				if ( featureId.getX( index ) !== semanticFeature.featureId ) continue;
				featureVertex.fromBufferAttribute( position, index ).applyMatrix4( object.matrixWorld );
				minimumProjection = Math.min( minimumProjection, featureVertex.dot( worldUp ) );

			}

		} );
		if ( ! Number.isFinite( minimumProjection ) ) return null;
		base = { minimumProjection, worldUp: worldUp.clone() };
		modelCache.set( cacheKey, base );

	}

	return Math.max( 0, worldPoint.dot( base.worldUp ) - base.minimumProjection );

}
