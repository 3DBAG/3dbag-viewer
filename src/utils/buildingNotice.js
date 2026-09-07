function hasVisibleMesh( object ) {

	if ( ! object || object.visible === false ) return false;
	if ( object.isMesh ) {

		const geometry = object.geometry;
		const attribute = geometry && ( geometry.index || geometry.attributes.position );
		if ( attribute && attribute.count >= 3 && geometry.drawRange.count >= 3 ) return true;

	}
	return ( object.children || [] ).some( hasVisibleMesh );

}

export function getBuildingNotice( tiles, enabled, error ) {

	if ( ! tiles || error ) return null;
	if ( ! enabled ) return 'viewer.zoomInForBuildings';
	// Selected hierarchy nodes (and even loaded, empty glTF scenes) do not
	// imply that any building geometry is available to draw.
	for ( const tile of tiles.visibleTiles ) {

		if ( hasVisibleMesh( tile.engineData && tile.engineData.scene ) ) return null;

	}
	if ( ! tiles.root || tiles.stats.downloading > 0 || tiles.stats.parsing > 0 ) {

		return 'viewer.loadingBuildings';

	}
	return 'viewer.zoomInForBuildings';

}
