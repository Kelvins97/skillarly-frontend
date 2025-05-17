import React, { useEffect } from 'react';
import { getUser } from '../../utils/auth';

function MinimalDashboard() {
  // Simple component with minimal functionality to debug
  useEffect(() => {
    console.log('Minimal Dashboard mounted');
    console.log('Current user:', getUser());
    
    // Check if any scripts are trying to add event listeners
    console.log('Document body:', document.body ? 'exists' : 'does not exist');
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Dashboard</h1>
      <p>If you can see this, basic rendering is working!</p>
      <p className="mt-4 text-gray-600">Check the console for debugging information.</p>
    </div>
  );
}

export default MinimalDashboard;
