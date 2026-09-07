export function getViewerSelection( query, basemaps, lods, defaultBasemap, defaultLod ) {

	const valid = ( options, value ) => typeof value === 'string' && Object.prototype.hasOwnProperty.call( options, value );
	return {
		basemap: valid( basemaps, query.basemap ) ? query.basemap : defaultBasemap,
		lod: valid( lods, query.lod ) ? query.lod : defaultLod
	};

}

export function getViewerQuery( query, selection ) {

	const result = { ...query, basemap: selection.basemap };
	if ( selection.lod ) result.lod = selection.lod;
	else delete result.lod;
	return result;

}
