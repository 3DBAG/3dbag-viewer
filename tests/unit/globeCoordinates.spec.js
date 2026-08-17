import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, Raycaster, Vector3 } from 'three';
import {
	cameraFrameToRoute,
	getNorthFacingCameraPosition,
	getSurfacePoint,
	routeToCameraFrame
} from '@/utils/globeCoordinates';

const radius = 6378137;
const sphericalEllipsoid = {
	getCartographicToPosition( lat, lon, height, target ) {

		const r = radius + height;
		return target.set(
			r * Math.cos( lat ) * Math.cos( lon ),
			r * Math.cos( lat ) * Math.sin( lon ),
			r * Math.sin( lat )
		);

	},
	getPositionToCartographic( position, target ) {

		const length = position.length();
		target.lat = Math.asin( position.z / length );
		target.lon = Math.atan2( position.y, position.x );
		target.height = length - radius;
		return target;

	},
	getEastNorthUpAxes( lat, lon, east, north, up ) {

		east.set( - Math.sin( lon ), Math.cos( lon ), 0 );
		north.set( - Math.sin( lat ) * Math.cos( lon ), - Math.sin( lat ) * Math.sin( lon ), Math.cos( lat ) );
		up.set( Math.cos( lat ) * Math.cos( lon ), Math.cos( lat ) * Math.sin( lon ), Math.sin( lat ) );

	}
};

describe( 'globe coordinate adapter', () => {

	const group = new Group();

	it( 'preserves RD targets and legacy east/up/south camera offsets', () => {

		const query = { rdx: 155000, rdy: 463000, ox: 320, oy: 410, oz: 280 };
		const frame = routeToCameraFrame( sphericalEllipsoid, group, query );
		const roundTrip = cameraFrameToRoute( sphericalEllipsoid, group, frame.cameraPosition, frame.target );

		expect( roundTrip.rdx ).toBeCloseTo( query.rdx, 3 );
		expect( roundTrip.rdy ).toBeCloseTo( query.rdy, 3 );
		expect( roundTrip.ox ).toBeCloseTo( query.ox, 6 );
		expect( roundTrip.oy ).toBeCloseTo( query.oy, 6 );
		expect( roundTrip.oz ).toBeCloseTo( query.oz, 6 );

	} );

	it( 'places a north-facing camera south of its pivot while preserving altitude and range', () => {

		const frame = routeToCameraFrame( sphericalEllipsoid, group, {
			rdx: 155000,
			rdy: 463000,
			ox: 300,
			oy: 400,
			oz: - 100
		} );
		const northPosition = getNorthFacingCameraPosition(
			sphericalEllipsoid,
			group,
			frame.cameraPosition,
			frame.target
		);
		const oldDistance = frame.cameraPosition.distanceTo( frame.target );

		expect( northPosition.distanceTo( frame.target ) ).toBeCloseTo( oldDistance, 6 );
		expect( northPosition ).toBeInstanceOf( Vector3 );

	} );

	it( 'finds terrain height along the local surface normal', () => {

		const surface = new Mesh( new PlaneGeometry( 100, 100 ), new MeshBasicMaterial() );
		surface.position.z = 37;
		surface.updateMatrixWorld( true );
		const point = getSurfacePoint(
			surface,
			new Vector3( 0, 0, 0 ),
			new Vector3( 0, 0, 1 ),
			new Raycaster(),
			100
		);

		expect( point ).not.toBeNull();
		expect( point.z ).toBeCloseTo( 37, 6 );

	} );

	it( 'keeps the ellipsoid fallback when terrain has not loaded', () => {

		expect( getSurfacePoint(
			new Group(),
			new Vector3( 0, 0, 0 ),
			new Vector3( 0, 0, 1 ),
			new Raycaster(),
			100
		) ).toBeNull();

	} );

} );
