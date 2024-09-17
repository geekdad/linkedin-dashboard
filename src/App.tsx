import React from 'react';
import './App.css';
import LinkedInDashboard from './LinkedInDashboard'; // Remove the .tsx extension

function App() {
  console.log('App component rendering');
  return (
    <div className="App">
      <LinkedInDashboard />
    </div>
  );
}

export default App;
