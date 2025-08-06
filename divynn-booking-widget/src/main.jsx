import React from 'react';
import ReactDOM from 'react-dom/client';
import BookingWidget from './widget';
import './index.css';

const mount = document.getElementById('divynn-booking-widget');
if (mount) {
  const root = ReactDOM.createRoot(mount);
  root.render(<BookingWidget />);
}
