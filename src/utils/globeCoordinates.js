import Proj4 from 'proj4';
import { MathUtils, Vector3 } from 'three';

const RD_CRS = 'EPSG:28992';
const WGS84_CRS = 'EPSG:4326';

Proj4.defs( [
	[
		RD_CRS,
		'+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs'
	],
	[
		WGS84_CRS,
		'+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'
	]
] );

export function rdToCartographic( x, y ) {

	const [ lon, lat ] = Proj4( RD_CRS, WGS84_CRS, [ x, y ] );
	return {
		lat: MathUtils.degToRad( lat ),
		lon: MathUtils.degToRad( lon )
	};

}

export function cartographicToRd( lat, lon ) {

	return Proj4( WGS84_CRS, RD_CRS, [ MathUtils.radToDeg( lon ), MathUtils.radToDeg( lat ) ] );

}

export function getWorldFrame( ellipsoid, ellipsoidGroup, lat, lon, height = 0 ) {

	ellipsoidGroup.updateWorldMatrix( true, false );
	const position = ellipsoid.getCartographicToPosition( lat, lon, height, new Vector3() )
		.applyMatrix4( ellipsoidGroup.matrixWorld );
	const east = new Vector3();
	const north = new Vector3();
	const up = new Vector3();
	ellipsoid.getEastNorthUpAxes( lat, lon, east, north, up );
	east.transformDirection( ellipsoidGroup.matrixWorld );
	north.transformDirection( ellipsoidGroup.matrixWorld );
	up.transformDirection( ellipsoidGroup.matrixWorld );

	return { position, east, north, up };

}

export function worldToCartographic( ellipsoid, ellipsoidGroup, worldPosition ) {

	ellipsoidGroup.updateWorldMatrix( true, false );
	const localPosition = ellipsoidGroup.worldToLocal( worldPosition.clone() );
	return ellipsoid.getPositionToCartographic( localPosition, {} );

}

export function routeToCameraFrame( ellipsoid, ellipsoidGroup, query ) {

	const rdx = Number.parseFloat( query.rdx );
	const rdy = Number.parseFloat( query.rdy );
	const ox = Number.parseFloat( query.ox );
	const oy = Number.parseFloat( query.oy );
	const oz = Number.parseFloat( query.oz );
	if ( [ rdx, rdy, ox, oy, oz ].some( value => ! Number.isFinite( value ) ) ) return null;

	const { lat, lon } = rdToCartographic( rdx, rdy );
	const frame = getWorldFrame( ellipsoid, ellipsoidGroup, lat, lon );
	const cameraPosition = frame.position.clone()
		.addScaledVector( frame.east, ox )
		.addScaledVector( frame.up, oy )
		.addScaledVector( frame.north, - oz );

	return {
		target: frame.position,
		cameraPosition,
		up: frame.up,
		lat,
		lon
	};

}

export function cameraFrameToRoute( ellipsoid, ellipsoidGroup, cameraPosition, target ) {

	const { lat, lon } = worldToCartographic( ellipsoid, ellipsoidGroup, target );
	const [ rdx, rdy ] = cartographicToRd( lat, lon );
	const frame = getWorldFrame( ellipsoid, ellipsoidGroup, lat, lon );
	const offset = cameraPosition.clone().sub( target );

	return {
		rdx,
		rdy,
		ox: offset.dot( frame.east ),
		oy: offset.dot( frame.up ),
		oz: - offset.dot( frame.north )
	};

}

export function getCompassRotation( ellipsoid, ellipsoidGroup, camera, target ) {

	const { lat, lon } = worldToCartographic( ellipsoid, ellipsoidGroup, target );
	const { east, north, up } = getWorldFrame( ellipsoid, ellipsoidGroup, lat, lon );
	const direction = camera.getWorldDirection( new Vector3() );
	direction.addScaledVector( up, - direction.dot( up ) );
	if ( direction.lengthSq() === 0 ) return 0;
	direction.normalize();
	return - Math.atan2( direction.dot( east ), direction.dot( north ) );

}

export function getNorthFacingCameraPosition( ellipsoid, ellipsoidGroup, cameraPosition, target ) {

	const { lat, lon } = worldToCartographic( ellipsoid, ellipsoidGroup, target );
	const { north, up } = getWorldFrame( ellipsoid, ellipsoidGroup, lat, lon );
	const offset = cameraPosition.clone().sub( target );
	const verticalDistance = offset.dot( up );
	const horizontal = offset.clone().addScaledVector( up, - verticalDistance );
	const horizontalDistance = horizontal.length();

	return target.clone()
		.addScaledVector( north, - horizontalDistance )
		.addScaledVector( up, verticalDistance );

}
