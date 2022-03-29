import React from 'react';
import ReactDOM from 'react-dom';

class SiteMap extends React.Component {
    
  render () {
      return (
				
					<h3><a href="./reflect-community.html">Home</a></h3>
				
      )
  }
}

ReactDOM.render(
  <SiteMap />,
  document.querySelector('.site-location')
);