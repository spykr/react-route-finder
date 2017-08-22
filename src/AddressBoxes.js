import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import AddressBox from './AddressBox';
import PlacesAutocomplete from 'react-places-autocomplete';
const google = window.google;

const Button = ( { addClass, text, click } ) => {
	return (
		<button className={ "c-button " + ( addClass ? 'c-button--' + addClass : '' ) } onClick={click}>
			{text}
		</button>
	)
}

const Buttons = ( { directionsOpen, calculate, openMaps, reset } ) => {
	if( directionsOpen )
	{
		return (
			<div className="c-search__buttons u-flex-center">
				<Button text="Get Directions" click={calculate} />
				<Button text="Open in Maps" addClass="blue" click={openMaps} />
				<Button text="Reset" addClass="red" click={reset} />
			</div>
		)
	} else {
		return (
			<div className="c-search__buttons u-flex-center">
				<Button text="Get Directions" addClass="fill" click={calculate} />
			</div>
		)
	}
}

class AddressBoxes extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			lat: props.center.lat,
			lng: props.center.lng,
			home: props.home,
			minimised: false
		};
	}

	nextInput = ( id ) => {
		var child = this.refs[ 'addressBox' + id ];
		if( !child ) return;
		var form = child.refs[ 'placesAutocomplete' ];
		var input = form.refs[ 'addressInput' + id ];
		ReactDOM.findDOMNode( input ).focus();
	}

	selectHomeText = ( e ) => e.target.select();

	toggleMinimised = ( e ) => this.setState( { minimised: !this.state.minimised } );

	updateHome = ( home ) => this.setState( { home } );

	selectHome = ( home ) => {
		this.setState( { home } );
		this.props.updateHome( home );
	}

	render() {
		const options = {
			location: new google.maps.LatLng( this.state.lat, this.state.lng ),
			radius: 6000,
			types: [ 'geocode', 'establishment' ]
		}
		const inputProps = {
			ref: 'homeInput',
			value: this.state.home,
			onChange: this.updateHome,
			onFocus: this.selectHomeText,
			type: 'search',
			placeholder: 'No return address selected, click to type'
		}
		const cssClasses = {
			root: 'c-search__root',
			input: 'c-options__home-label u-truncate',
			autocompleteContainer: 'c-autocomplete',
			autocompleteItem: 'c-autocomplete__item',
			autocompleteItemActive: 'c-autocomplete__item--active',
			googleLogoContainer: 'c-autocomplete__logo-container',
			googleLogoImage: 'c-autocomplete__logo-image'
		}
		return (
			<div className={"c-search u-flex-columns" + ( this.state.minimised ? ' c-search--minimised' : '' )} >
				<div className="c-search-header u-flex-center" onClick={this.toggleMinimised}>
					<i className="icon-location c-search-header__icon" />
					<span className="c-search-header__name">
						Calculate Your Route
					</span>
					<i className={"fa c-search-header__hide " + ( this.state.minimised ? 'icon-angle-circled-down' : 'icon-angle-circled-up' )} />
				</div>
				<div className="c-search-wrapper u-flex-columns">
					<div className="c-search__boxes u-flex">
						{ this.props.addresses &&
							this.props.addresses.map( ( add, i ) => {
								return <AddressBox key={add+i} id={i} text={add} options={options} updateAddress={this.props.updateAddress} nextInput={this.nextInput} ref={'addressBox' + i} />
							} )
						}
						{ !this.state.minimised &&
							<AddressBox key={this.props.addresses.length} id={this.props.addresses.length} text='' options={options} updateAddress={this.props.updateAddress} nextInput={this.nextInput} ref={'addressBox' + this.props.addresses.length} />
						}
					</div>
					<div className="c-options u-flex-center-all">
						<i className="icon-home c-options__home-icon" />
						<PlacesAutocomplete
							ref="placesAutocomplete"
							classNames={cssClasses}
							highlightFirstSuggestion={true}
							inputProps={inputProps}
							options={options}
							onSelect={this.selectHome}
							onEnterKeyDown={this.selectHome}
						/>
					</div>
					<div className="c-search__checkboxes u-flex">
						<label className="c-options__optimise-label u-flex-center-all">
							<input className="c-options__optimise-checkbox" type="checkbox" defaultChecked={this.props.fromCurrentLoc} onChange={this.props.checkboxChange( 'fromCurrentLoc' )} />
							Start from current location
						</label>
						<label className="c-options__optimise-label u-flex-center-all">
							<input className="c-options__optimise-checkbox" type="checkbox" defaultChecked={this.props.optimise} onChange={this.props.checkboxChange( 'optimise' )} />
							Find fastest route
						</label>
					</div>
					<Buttons directionsOpen={this.props.directionsOpen} calculate={this.props.calculate} openMaps={this.props.openInMaps} reset={this.props.resetDirections} />
				</div>
		</div>
		)
	}
}

export default AddressBoxes;