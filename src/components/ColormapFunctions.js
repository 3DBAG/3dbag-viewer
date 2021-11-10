import {
	Color,
	RGBFormat,
	UniformsUtils,
	Float32BufferAttribute,
	DataTexture
} from 'three';
import { evaluate_cmap, cmap_data } from '@/assets/matplotlib_colormaps.js';

function createDataTexture( cmName, n ) {

	if ( ! cmName )
		return [];
	const cm_data = new Uint8Array( 3 * n );
	for ( let i = 0; i < n; i ++ ) {

		const rgb = evaluate_cmap( i / n, cmName, false );
		const stride = i * 3;
		cm_data[ stride ] = Math.floor( rgb[ 0 ] * 255 );
		cm_data[ stride + 1 ] = Math.floor( rgb[ 1 ] * 255 );
		cm_data[ stride + 2 ] = Math.floor( rgb[ 2 ] * 255 );

	}

	const cm = new DataTexture( cm_data, n, 1, RGBFormat );
	return cm;

}

// Adjusts the three.js standard shader to include batchid highlight
function batchIdHighlightShaderMixin( shader, colorAttrSettings ) {

	const cm = createDataTexture( colorAttrSettings[ 'cmName' ] );
	const newShader = { ...shader };
	var attrTypeInt = 0;
	if ( colorAttrSettings[ 'attrType' ] == "string" )
		attrTypeInt = 1;
	else if ( colorAttrSettings[ 'attrType' ] == "boolean" )
		attrTypeInt = 2;
	else if ( colorAttrSettings[ 'attrType' ] == "object" )
		attrTypeInt = 3;
	newShader.uniforms = {
		valMin: { value: colorAttrSettings[ 'minVal' ] },
		valMax: { value: colorAttrSettings[ 'maxVal' ] },
		enableAttributeColoring: { value: colorAttrSettings[ 'enable' ] },
		attributeType: { value: attrTypeInt },
		colormap: { type: "t", value: cm },
		highlightedBatchId: { value: - 1 },
		highlightColor: { value: new Color( 0xFFC107 ).convertSRGBToLinear() },
		...UniformsUtils.clone( shader.uniforms ),
	};
	newShader.extensions = {
		derivatives: true,
	};
	newShader.lights = true;
	newShader.fog = true;
	newShader.vertexShader =
		`
			attribute float _batchid;
			attribute float attrValue;
			uniform float valMin;
			uniform float valMax;
			uniform float opacity;
			uniform vec3 diffuse;
			uniform int enableAttributeColoring;
			uniform int attributeType;
			uniform float highlightedBatchId;
			uniform vec3 highlightColor;
			uniform sampler2D colormap;
			varying vec4 diffuseColor_;
		` +
		newShader.vertexShader.replace(
			/#include <uv_vertex>/,
			`
			#include <uv_vertex>
			vec3 diffuse_;
			float opacity_ = opacity;
			if ( enableAttributeColoring != 0 ) {
				if ( attributeType == 0 && attrValue >= valMin && attrValue <= valMax ) {
					float texCoord = (attrValue - valMin)/(valMax - valMin);
					diffuse_ = texture2D( colormap, vec2(texCoord,0) ).xyz;
				} else if ( attributeType != 0 && attrValue >= 0.0 ) {
					float texCoord = attrValue / valMax;
					diffuse_ = texture2D( colormap, vec2(texCoord,0) ).xyz;
				} else {
					diffuse_ = diffuse;
					opacity_ = 0.0;
				}
			} else {
				diffuse_ = diffuse;
			}
			diffuseColor_ =
				_batchid == highlightedBatchId ?
				vec4( highlightColor, opacity ) :
				vec4( diffuse_, opacity_ );
			`
		);
	newShader.fragmentShader =
		`
			varying vec4 diffuseColor_;
			
		` +
		newShader.fragmentShader.replace(
			/vec4 diffuseColor = vec4\( diffuse, opacity \);/,
			`
			vec4 diffuseColor = diffuseColor_;
			`
		);
	return newShader;

}

function colorByAttribute( colorAttrSettings, tiles, material, highlightMaterial ) {

	if ( colorAttrSettings[ "transparent" ] ) {

		material.transparent = true;
		highlightMaterial.transparent = true;

	} else {

		material.transparent = false;
		highlightMaterial.transparent = false;

	}
	material.uniforms.enableAttributeColoring.value = true;
	highlightMaterial.uniforms.enableAttributeColoring.value = true;

	updateShader( colorAttrSettings, tiles, material, highlightMaterial );

}

function toggleColoring( material, highlightMaterial ) {

	material.uniforms.enableAttributeColoring.value = ! material.uniforms.enableAttributeColoring.value;
	highlightMaterial.uniforms.enableAttributeColoring.value = ! highlightMaterial.uniforms.enableAttributeColoring.value;

}

function getAvailableAttributes( tiles ) {

	if ( ! tiles )
		return null;

	var tile = tiles.activeTiles.values().next().value;
	var attributes = JSON.parse( tile.cached.scene.batchTable.getData( 'attributes' )[ 0 ] );
	for ( const [ key, value ] of Object.entries( attributes ) )
		attributes[ key ] = typeof value;

	const cmNames = Object.keys( cmap_data );

	return { "attributes": attributes, "colormaps": cmNames };

}

function getMinMax( attrName, tiles ) {

	var minVal = Number.MAX_VALUE;
	var maxVal = - Number.MAX_VALUE;
	var attrType = null;
	var attrValues = {};
	var attrKeys = [];

	tiles.activeTiles.forEach( obj => {

		const s = obj.cached.scene;

		s.traverse( c => {

			if ( c.geometry ) {

				const batch_ids = c.geometry.getAttribute( '_batchid' );
				const attrs = s.batchTable.getData( 'attributes' );
				if ( ! attrType )
					attrType = typeof JSON.parse( attrs[ 0 ] )[ attrName ];

				for ( let i = 0; i < batch_ids.count; i ++ ) {

					const bid = batch_ids.getX( i );
					const attrValue = JSON.parse( attrs[ bid ] )[ attrName ];

					if ( attrType == "number" ) {

						if ( attrValue > maxVal )
							maxVal = attrValue;
						else if ( attrValue < minVal )
							minVal = attrValue;

					} else {

						if ( attrType == "object" )
							attrValue = attrValue.toString();

						if ( attrValues[ attrValue ] )
							attrValues[ attrValue ] += 1;
						else {

							attrValues[ attrValue ] = 1;
							attrKeys.push( attrValue );
							maxVal = attrKeys.length;

						}

					}

				}

			}

		} );

	} );

	return { "attrName": attrName, "minVal": minVal, "maxVal": maxVal, "values": attrValues, "keys": attrKeys };

}


function updateShader( colorAttrSettings, tiles, material, highlightMaterial ) {

	colorAttrSettings[ 'minVal' ] = Number.MAX_VALUE;
	colorAttrSettings[ 'maxVal' ] = - Number.MAX_VALUE;

	tiles.activeTiles.forEach( obj => {

		obj.cached.scene.traverse( c => {

			if ( c.material )
				setTileAttributes( obj.cached.scene, c, colorAttrSettings );

		} );

	} );

	const n_classes = colorAttrSettings[ 'attrType' ] == "number" ? 100 : Math.min( Object.keys( colorAttrSettings[ 'attrValues' ] ).length, 100 );
	const dataTexture = createDataTexture( colorAttrSettings[ 'cmName' ], n_classes );

	if ( colorAttrSettings[ 'attrType' ] == "number" ) {

		material.uniforms.attributeType.value = 0;
		highlightMaterial.uniforms.attributeType.value = 0;
		material.uniforms.colormap.value = dataTexture;
		highlightMaterial.uniforms.colormap.value = dataTexture;

		if ( colorAttrSettings[ 'minValSelected' ] ) {

			material.uniforms.valMin.value = colorAttrSettings[ 'minValSelected' ];
			highlightMaterial.uniforms.valMin.value = colorAttrSettings[ 'minValSelected' ];

		} else {

			material.uniforms.valMin.value = colorAttrSettings[ 'minVal' ];
			highlightMaterial.uniforms.valMin.value = colorAttrSettings[ 'minVal' ];

		}

		if ( colorAttrSettings[ 'maxValSelected' ] ) {

			material.uniforms.valMax.value = colorAttrSettings[ 'maxValSelected' ];
			highlightMaterial.uniforms.valMax.value = colorAttrSettings[ 'maxValSelected' ];

		} else {

			material.uniforms.valMax.value = colorAttrSettings[ 'maxVal' ];
			highlightMaterial.uniforms.valMax.value = colorAttrSettings[ 'maxVal' ];

		}

	} else if ( colorAttrSettings[ 'attrType' ] == "string" ) {

		material.uniforms.colormap.value = dataTexture;
		material.uniforms.attributeType.value = 1;
		material.uniforms.valMax.value = dataTexture.image.width - 1;

		highlightMaterial.uniforms.colormap.value = dataTexture;
		highlightMaterial.uniforms.attributeType.value = 1;
		highlightMaterial.uniforms.valMax.value = dataTexture.image.width - 1;

	} else if ( colorAttrSettings[ 'attrType' ] == "boolean" ) {

		material.uniforms.colormap.value = dataTexture;
		material.uniforms.attributeType.value = 2;
		material.uniforms.valMax.value = 1;

		highlightMaterial.uniforms.colormap.value = dataTexture;
		highlightMaterial.uniforms.attributeType.value = 2;
		highlightMaterial.uniforms.valMax.value = 1;

	} else if ( colorAttrSettings[ 'attrType' ] == "object" ) {

		material.uniforms.colormap.value = dataTexture;
		material.uniforms.attributeType.value = 3;
		material.uniforms.valMax.value = dataTexture.image.width - 1;

		highlightMaterial.uniforms.colormap.value = dataTexture;
		highlightMaterial.uniforms.attributeType.value = 3;
		highlightMaterial.uniforms.valMax.value = dataTexture.image.width - 1;

	}

}

function setTileAttributes( s, c, colorAttrSettings ) {

	const batch_ids = c.geometry.getAttribute( '_batchid' );
	const attrs = s.batchTable.getData( 'attributes' );
	const new_attr_buffer = new Float32Array( batch_ids.count );
	colorAttrSettings[ 'attrType' ] = typeof JSON.parse( attrs[ 0 ] )[ colorAttrSettings[ 'attrName' ] ];

	for ( let i = 0; i < batch_ids.count; i ++ ) {

		const bid = batch_ids.getX( i );
		const attrValue = JSON.parse( attrs[ bid ] )[ colorAttrSettings[ 'attrName' ] ];

		if ( colorAttrSettings[ 'attrType' ] == "number" ) {

			if ( attrValue > colorAttrSettings[ 'maxVal' ] )
				colorAttrSettings[ 'maxVal' ] = attrValue;
			else if ( attrValue < colorAttrSettings[ 'minVal' ] )
				colorAttrSettings[ 'minVal' ] = attrValue;

			new_attr_buffer[ i ] = attrValue;

		} else {

			if ( colorAttrSettings[ 'attrType' ] == "object" )
				attrValue = attrValue.toString();

			if ( colorAttrSettings[ 'attrValues' ][ attrValue ] )
				colorAttrSettings[ 'attrValues' ][ attrValue ] += 1;
			else {

				colorAttrSettings[ 'attrValues' ][ attrValue ] = 1;
				colorAttrSettings[ 'attrKeys' ].push( attrValue );

			}

			if ( ! colorAttrSettings[ 'exclude' ].includes( attrValue ) ) {

				if ( colorAttrSettings[ 'attrType' ] == "string" || colorAttrSettings[ 'attrType' ] == "object" )
					new_attr_buffer[ i ] = colorAttrSettings[ 'attrKeys' ].indexOf( attrValue );
				else // boolean
					new_attr_buffer[ i ] = attrValue ? 1 : 0;

			} else {

				new_attr_buffer[ i ] = - 1;

			}

		}

	}
	c.geometry.setAttribute( "attrValue", new Float32BufferAttribute( new_attr_buffer, 1 ) );

}

export { createDataTexture, batchIdHighlightShaderMixin, colorByAttribute, getAvailableAttributes, getMinMax, updateShader, setTileAttributes, toggleColoring };
