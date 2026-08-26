import { CesiumStylingPlugin } from '@bertt/3dtilesrenderer-styling-plugin';

function getFeatureIdAttribute( geometry, featureInfo ) {

	const suffix = featureInfo.attribute;
	return geometry.getAttribute( `_feature_id_${ suffix }` ) ||
		geometry.getAttribute( `_FEATURE_ID_${ suffix }` );

}

export function getFeatureInfoForAttribute( meshFeatures, structuralMetadata, attribute ) {

	if ( ! meshFeatures || ! structuralMetadata || ! attribute ) return null;
	return meshFeatures.getFeatureInfo().find( info => {

		if ( info.attribute === undefined || info.propertyTable === null || info.propertyTable === undefined ) {

			return false;

		}
		const table = structuralMetadata.getPropertyTableInfo( info.propertyTable );
		const featureClass = structuralMetadata.schema && structuralMetadata.schema.classes &&
			structuralMetadata.schema.classes[ table.className ];
		return Boolean( featureClass && featureClass.properties &&
			Object.prototype.hasOwnProperty.call( featureClass.properties, attribute ) );

	} ) || null;

}

export class SemanticStylingPlugin extends CesiumStylingPlugin {

	constructor( options = {} ) {

		super( options );
		this.attribute = options.attribute;

	}

	_substituteProperties( expression, props ) {

		const preserveMissingValue = ( token, property ) => {

			const value = props && props[ property ];
			return value === null || value === undefined ? 'null' : token;

		};
		const expressionWithNulls = expression
			.replace( /\$\{feature\['([^']+)'\]\}/g, preserveMissingValue )
			.replace( /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, preserveMissingValue );
		return super._substituteProperties( expressionWithNulls, props );

	}

	_styleMesh( mesh ) {

		const THREE = this._THREE;
		if ( ! THREE ) return;

		const { meshFeatures, structuralMetadata } = mesh.userData || {};
		if ( ! meshFeatures || ! structuralMetadata ) return;

		const featureInfo = getFeatureInfoForAttribute( meshFeatures, structuralMetadata, this.attribute );
		if ( ! featureInfo ) return;
		const featureIdAttribute = getFeatureIdAttribute( mesh.geometry, featureInfo );
		if ( ! featureIdAttribute ) return;

		const uniqueIds = new Set();
		for ( let index = 0; index < featureIdAttribute.count; index ++ ) {

			uniqueIds.add( Math.round( featureIdAttribute.getX( index ) ) );

		}

		const colorLookup = new Map();
		uniqueIds.forEach( featureId => {

			const properties = featureId === featureInfo.nullFeatureId ? null :
				structuralMetadata.getPropertyTableData( featureInfo.propertyTable, featureId );
			colorLookup.set( featureId, this._resolveColor( properties ) );

		} );

		const colors = new Float32Array( featureIdAttribute.count * 3 );
		for ( let index = 0; index < featureIdAttribute.count; index ++ ) {

			const color = colorLookup.get( Math.round( featureIdAttribute.getX( index ) ) );
			colors[ index * 3 ] = color.r;
			colors[ index * 3 + 1 ] = color.g;
			colors[ index * 3 + 2 ] = color.b;

		}
		mesh.geometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

		const materials = Array.isArray( mesh.material ) ? mesh.material : [ mesh.material ];
		materials.filter( Boolean ).forEach( material => {

			material.vertexColors = true;
			material.needsUpdate = true;

		} );

	}

}
