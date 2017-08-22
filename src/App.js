import React, { Component } from 'react';
import Map from './Map.js';
import './App.scss';

class App extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			infoOpen: false
		};
	}

	toggleInfo = ( e ) => {
		this.setState( { infoOpen: !this.state.infoOpen } );
	}

	render() {
		return (
			<div className="c-app u-flex-columns">
				<header className="c-header u-flex">
					<a className="c-header__link" href="/">
						<i className="icon-steering-wheel c-header__icon" />
						Route Finder
					</a>
					<div className="c-header__button u-flex-center-all" onClick={this.toggleInfo}>
						<i className="icon-help-circled c-header__button-icon" />
					</div>
				</header>
				<Map infoOpen={this.state.infoOpen} toggleInfo={this.toggleInfo} />
			</div>
		)
	}
}

export default App;
