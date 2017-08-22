import React, { Component } from 'react';
import AddressBoxes from './AddressBoxes.js';
import { geocodeByAddress, getLatLng } from 'react-places-autocomplete';
import {
	withGoogleMap,
	GoogleMap,
	Marker,
	DirectionsRenderer,
	Circle,
	InfoWindow,
	TrafficLayer
} from 'react-google-maps';
const google = window.google;

const GeolocationMap = withGoogleMap( props => (
	<GoogleMap
		defaultZoom={14}
		center={props.center}
		ref={props.ref}
		options={{
			streetViewControl: false,
			mapTypeControl: false
		}}
	>
			{props.markers.map( marker => (
				<Marker
					{...marker}
				/>
			))}
			{props.content && (
				<InfoWindow position={props.center}>
					<div>{props.content}</div>
				</InfoWindow>
			)}
			{props.directions &&
				<DirectionsRenderer 
					directions={props.directions}
					options={{
						suppressMarkers: true
					}}
				/>
			}
			{props.center && (
				<Circle
					center={props.center}
					radius={props.radius}
					options={{
						fillColor: `#2196F3`,
						fillOpacity: .4,
						strokeColor: `#2196F3`,
						strokeOpacity: 1,
						strokeWeight: 1
					}}
				/>
			)}
			<TrafficLayer autoUpdate />
	</GoogleMap>
));

//Thanks to https://codepen.io/aurer/pen/jEGbA
const LoadingIcon = () => {
	return (
		<svg className="c-loading__icon" version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="40px" height="40px" viewBox="0 0 40 40" enableBackground="new 0 0 40 40" xmlSpace="preserve">
			<path opacity="0.2" fill="#000" d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946 s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634 c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z"></path>
			<path fill="#000" d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0 C22.32, 8.481, 24.301, 9.057, 26.013, 10.047z" transform="rotate(23.9999 20 20)">
				<animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="0.6s" repeatCount="indefinite"></animateTransform>
			</path>
		</svg>
	)
}

const LoadingOverlay = () => {
	return (
		<div className="c-loading u-flex-center-all">
			<div className="c-loading__background">
				<LoadingIcon />
			</div>
		</div>
	)
}

const Modal = ( { isOpen, children } ) => (
	<div className={"c-modal" + ( isOpen ? ' c-modal--visible ' : ' ' ) + "u-flex-center-all"}>
		{children}
	</div> 
)

class Map extends Component {
	constructor( props ){
		super( props );
		this.state = {
			addresses: [ '' ],
			center: null,
			content: null,
			directions: null,
			fromCurrentLoc: true,
			home: '',
			homePos: null,
			loading: true,
			markers: [],
			radius: 0,
			optimise: true
		};
	}

	isUnmounted = false;

	componentDidMount() {
		this.getPosition()
			.then( ( position ) => {
				let pos = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				};

				let markers = this.getMarkers( null, null, pos );

				this.setState({
					center: pos,
					content: '',
					loading: false,
					radius: position.coords.accuracy,
					markers: markers
				} );
			} )
			.catch( ( err ) => {
				console.error( err );
				this.setState({
					center: {
						lat: 60,
						lng: 105
					},
					content: `Failed to find your location, please try again!`
				} );
			} );
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	getPosition = ( options ) => {
		return new Promise( function( resolve, reject ) {
			navigator.geolocation.getCurrentPosition( resolve, reject, options );
		} );
	}

	calculateRoute = () => {
		if( this.state.addresses[ 0 ] === '' && this.state.home === '' )
		{
			return;
		}

		this.setState( { 
			loading: true
		} );

		const promises = [];

		if( this.state.fromCurrentLoc )
		{
			const positionPromise = this.getPosition()
				.then( ( position ) => {
					return position;
				} )
				.catch( ( err ) => {
					console.error( err );
					this.setState({
						center: {
							lat: 60,
							lng: 105
						},
						content: `Failed to find your location, please try again!`,
						loading: false
					} );
				} );
			promises.push( positionPromise );
		}

		for( let i = 0; i < this.state.addresses.length; i++ )
		{
			let address = this.state.addresses[ i ].trim();
			if( address !== '' )
			{
				const promise = geocodeByAddress( address )
								.then( results => getLatLng( results[ 0 ] ) );
				promises.push( promise );
			}
		}

		if( this.state.home !== '' ) {
			const homePromise = geocodeByAddress( this.state.home )
								.then( results => getLatLng( results[ 0 ] ) );
			promises.push( homePromise );
		}

		Promise.all( promises )
			.then( values => {
				let center = this.state.center;
				if( this.state.fromCurrentLoc )
				{
					let position = values.shift();
					center = { lat: position.coords.latitude, lng: position.coords.longitude };
					let radius = position.coords.accuracy;
					this.setState( { center, radius, content: '' } );
				}

				let waypoints = [];
				const destination = values.pop();
				for( let i = 0; i < values.length; i++ )
				{
					waypoints.push( { location: values[ i ] } );
				}
				const origin = ( this.state.fromCurrentLoc && center ) || waypoints.shift();

				const DirectionsService = new google.maps.DirectionsService();
				DirectionsService.route( {
					origin: origin,
					destination: destination,
					travelMode: google.maps.TravelMode.DRIVING,
					waypoints: waypoints,
					optimizeWaypoints: this.state.optimise
				}, ( result, status ) => {
					if( status === google.maps.DirectionsStatus.OK ) {
						this.updateDirections( result, waypoints, destination, origin );
					} else {
						console.error( 'Error fetching directions', result );
						this.setState( {
							content: this.getErrorMessage( status ),
							loading: false
						} );
					}
				});
			})
	}

	getErrorMessage = ( error ) => {
		if( error === google.maps.DirectionsStatus.NOT_FOUND ) {
			return 'Error, an address could not be located!';
		} else if( error === google.maps.DirectionsStatus.ZERO_RESULTS ) {
			return 'Error, no route could be found!';
		} else if( error === google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED ) {
			return 'Error, too many addresses entered!';
		} else {
			return 'Error retrieving directions, please try again later!';
		}
	}

	getMarkers = ( directions, homePos, currentPos, waypoints ) => {
		homePos = homePos || this.state.homePos;
		currentPos = currentPos || this.state.center;
		let markers = [];

		if( this.state.fromCurrentLoc ) {
			markers.push( {
				position: currentPos,
				key: 'current',
				defaultAnimation: 2,
				icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
			} );
		}

		if( this.state.home !== '' ) {
			markers.push( {
				position: homePos,
				key: 'home' + homePos.toString(),
				defaultAnimation: 2,
				icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
			} );
		}

		if( waypoints ) {
			for( let i = 0; i < waypoints.length; i++ ) {
				let pos = waypoints[ i ].location;
				let num = i + 1;
				markers.push( { 
					position: pos,
					key: i + pos,
					defaultAnimation: 2,
					icon: { 
						url: 'http://maps.google.com/mapfiles/ms/icons/red.png',
						scaledSize: new google.maps.Size( 41, 41 ),
						origin: new google.maps.Point( 0, 0 ),
						anchor: new google.maps.Point( 15, 32 ),
						labelOrigin: new google.maps.Point( 20, 13 )
					},
					label: {
						text: num.toString(),
						fontSize: num < 10 ? '18px' : '14px',
						fontWeight: 'bold'
					}
				} );
			}
		}

		return markers;
	}

	updateDirections = ( directions, waypoints, destination, origin ) => {
		if( this.state.optimise ) {
			let newOrder = directions.routes[0].waypoint_order;
			let addresses = [];
			let reorderedWaypoints = [];

			//Resort addresses in to order from directions
			if( !this.state.fromCurrentLoc )
			{
				addresses.push( this.state.addresses[ 0 ] );
				reorderedWaypoints.push( origin );
				for ( let i = 0; i < newOrder.length; i++ ) {
					addresses[ i+1 ] = this.state.addresses[ newOrder[ i ]+1 ];
					reorderedWaypoints.push( waypoints[ newOrder[ i ] ] );
				}
			} else {
				for ( let i = 0; i < newOrder.length; i++ ) {
					addresses[ i ] = this.state.addresses[ newOrder[ i ] ];
					reorderedWaypoints[ i ] = waypoints[ newOrder[ i ] ];
				}
			}			

			//Add destination to end if no home address entered
			if( this.state.home === '' ) {
				console.log( destination );
				addresses.push( this.state.addresses.slice( -1 )[0] );
				reorderedWaypoints.push( { location: destination } );
			}

			let markers = this.getMarkers( directions, null, null, reorderedWaypoints );
			this.setState( { addresses, directions, loading: false, markers } );
		} else {
			let markers = this.getMarkers( directions, null, null, waypoints );
			this.setState( { directions, loading: false, markers } );
		}
	}

	resetDirections = () => {
		let markers = this.getMarkers();
		this.setState( {
			addresses: [ '' ],
			content: '',
			directions: null,
			markers
		} );
	}

	//Formulate and open a Google Maps link for the current route
	openInMaps = () => {
		let url = 'https://www.google.com/maps/dir';

		if( this.state.fromCurrentLoc ) {
			url += '/Current+Location';
		}

		for( let i = 0; i < this.state.addresses.length; i++ )
		{
			let addr = this.state.addresses[ i ].trim().replace( / /g, '+' );
			addr = encodeURIComponent( addr );
			url += ( '/' + addr );
		}

		if( this.state.home )
		{
			let home = this.state.home.trim();
			home = encodeURIComponent( home );
			url += ( '/' + home );
		}

		window.open( url, '_blank' );
	}

	updateAddress = ( id, add ) => {
		var changedAddresses = this.state.addresses;
		if( add === '' ) {
			changedAddresses.splice( id, 1 );
		} else {
			changedAddresses[ id ] = add;
		}
		this.setState( {
			addresses: changedAddresses
		} );
	}

	checkboxChange = ( field ) => {
		return( e ) => {
			this.setState( {
				[ field ]: e.target.checked
			} );
		}
	}

	updateHome = ( home ) => {
		this.setState( { home } );

		const promise = geocodeByAddress( home )
			.then( results => getLatLng( results[0] ) );
			
		Promise.all( [ promise ] )
		.then( results => {
			let homePos = results[0];
			if ( this.state.directions !== null ) {
				this.setState( { homePos } );
			} else {
				let markers = this.getMarkers( null, homePos );
				this.setState( { markers, homePos } );
			}
		} );
	}

	render() {
		return (
			<div className="c-wrapper u-flex-columns">
				<Modal isOpen={this.props.infoOpen}>
					<div className="c-info u-flex-columns">
						<p className="c-info__header u-flex">
							<span>Route Finder</span>
							<i className="c-info__close icon-cancel-circled" onClick={this.props.toggleInfo} />
						</p>
						<div className="c-info__category u-flex-columns u-flex-center-all">
							<p className="c-info__text">This tool was developed with React to help delivery drivers and others calculate routes using the Google Maps API.</p>
							<p className="c-info__text c-info__text--sub">Disclaimer: The "Find fastest route" option will not rearrange the origin or destination addresses.</p>
						</div>
						<p className="c-info__heading">GitHub Link</p>
						<div className="c-info__category u-flex-center-all">
							<a className="c-info__link u-link" href="https://github.com/spykr/react-route-finder">react-route-finder</a>
						</div>
						<p className="c-info__heading">Resources Used</p>
						<div className="c-info__category c-info__category--wrap u-flex-center-all">
							<a className="c-info__link u-link" href="https://github.com/tomchentw/react-google-maps">react-google-maps</a>
							<a className="c-info__link u-link" href="https://github.com/kenny-hibino/react-places-autocomplete">react-places-autocomplete</a>
							<a className="c-info__link u-link" href="https://codepen.io/aurer/pen/jEGbA">loading icon by aurer</a>
							<a className="c-info__link u-link" href="http://fontello.com/">fontello</a>
						</div>
						<p className="c-info__footer">Created by <a className="u-link" href="https://www.darcyglennen.com/">Darcy Glennen</a></p>
					</div>
				</Modal>
				{ this.state.loading && <LoadingOverlay /> }
				{ this.state.center && <AddressBoxes
					addresses={this.state.addresses}
					center={this.state.center}
					calculate={this.calculateRoute}
					optimise={this.state.optimise}
					fromCurrentLoc={this.state.fromCurrentLoc}
					home={this.state.home}
					updateAddress={this.updateAddress}
					updateHome={this.updateHome}
					checkboxChange={this.checkboxChange}
					resetDirections={this.resetDirections}
					openInMaps={this.openInMaps}
					directionsOpen={this.state.directions !== null}
				/> }
				<GeolocationMap
					containerElement={
						<div className="c-map-container" />
					}
					mapElement={
						<div className="c-map" />
					}
					center={this.state.center}
					content={this.state.content}
					directions={this.state.directions}
					markers={this.state.markers}
					radius={this.state.radius}
					ref="map"
				/>
			</div>
		);
	}
}

export default Map;
