import React, { Component } from 'react';
import PlacesAutocomplete from 'react-places-autocomplete';

class AddressBox extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			search: props.text
		};
	}
	
	nextInput = () => this.props.nextInput( this.props.id + 1 );

	selectText = ( e ) => e.target.select();

	enterKey = ( address ) => {
		this.props.updateAddress( this.props.id, address );
		if( address !== '' ) {
			this.nextInput();
		}
	}

	onChange = ( search ) => this.setState( { search } );

	onSelect = ( address, placeId ) => {
		this.setState( {
			search: address
		} );
		this.props.updateAddress( this.props.id, address );
		
		//Hacky, I know!
		setTimeout( 
			() => this.props.nextInput( this.props.id + 1 )
		, 0 );
	}

	render() {
		const inputProps = {
			onChange: this.onChange,
			onFocus: this.selectText,
			placeholder: 'Enter an address',
			ref: 'addressInput' + this.props.id,
			type: 'search',
			value: this.state.search
		}

		const cssClasses = {
			root: 'c-search__root',
			input: 'c-search__input',
			autocompleteContainer: 'c-autocomplete',
			autocompleteItem: 'c-autocomplete__item',
			autocompleteItemActive: 'c-autocomplete__item--active',
			googleLogoContainer: 'c-autocomplete__logo-container',
			googleLogoImage: 'c-autocomplete__logo-image'
		}

		return (
			<div className="c-search__box u-flex-center-all">
				<div className="c-search__number u-flex-center-all">
					{this.props.id+1}
				</div>
				<PlacesAutocomplete
					ref="placesAutocomplete"
					classNames={cssClasses}
					highlightFirstSuggestion={true}
					inputProps={inputProps}
					options={this.props.options}
					onSelect={this.onSelect}
					onEnterKeyDown={this.enterKey}
				/>
			</div>
		);
	}
}

export default AddressBox;