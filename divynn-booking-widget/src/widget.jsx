import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Configure your Supabase client
const supabase = createClient(
  'https://omwmybidzjuxfnlclqoo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);

function BookingWidget() {
  const [date, setDate] = useState(new Date());
  const [artists, setArtists] = useState([]);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [subservices, setSubservices] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    supabase.from('artists').select('*')
      .then(({ data }) => setArtists(data || []));
    supabase.from('services').select('*')
      .then(({ data }) => setServices(data || []));
  }, []);

  useEffect(() => {
    if (selectedArtist) {
      setFilteredServices(services.filter(s => s.artist_id === selectedArtist));
    }
  }, [selectedArtist, services]);

  useEffect(() => {
    if (selectedService) {
      setSubservices(services.filter(s => s.parent_id === selectedService));
    }
  }, [selectedService, services]);

  useEffect(() => {
    async function getSlots() {
      if (!selectedArtist || !date || !selectedService) return;
      const svc = services.find(s => s.id === selectedService);
      const artist = artists.find(a => a.id === selectedArtist);
      if (!svc || !artist) return;

      // Get working hours and bookings
      const day = date.toISOString().slice(0,10);
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('artist_id', selectedArtist)
        .eq('date', day);

      // Compute slots
      const wh = artist.working_hours;
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
      const [startH, endH] = wh[weekday] || [];
      if (!startH) return setTimeSlots([]);

      const interval = svc.duration_min;
      const slots = [];
      for (let h = startH; h < endH; h++) {
        for (let m = 0; m < 60; m += interval) {
          const slot = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`;
          const overlaps = bookings.some(b => {
            const bookedStart = b.start_time && b.start_time < slot
              ? b.start_time
              : slot;
            // simplistic overlap check
            return bookedStart === slot;
          });
          if (!overlaps) slots.push(slot);
        }
      }
      setTimeSlots(slots);
    }
    getSlots();
  }, [date, selectedArtist, selectedService]);

  async function handleSubmit(e) {
    e.preventDefault();
    await supabase.from('bookings').insert({
      date: date.toISOString().slice(0,10),
      start_time: selectedTime,
      artist_id: selectedArtist,
      service_id: selectedService,
      duration_min: services.find(s => s.id === selectedService)?.duration_min,
      customer_name: customerName,
      customer_email: customerEmail
    });
    alert('Booking confirmed!');
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
      <label>Date:</label><br />
      <DatePicker selected={date} onChange={d => setDate(d)} dateFormat="yyyy-MM-dd" /><br />

      <label>Artist:</label><br />
      <select onChange={e => setSelectedArtist(e.target.value)} required>
        <option value="">Choose artist</option>
        {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select><br />

      <label>Service:</label><br />
      <select onChange={e => setSelectedService(e.target.value)} required>
        <option value="">Choose service</option>
        {filteredServices.map(s => !s.parent_id && (
          <option key={s.id} value={s.id}>{s.name} ({s.duration_min} min)</option>
        ))}
      </select><br />

      {subservices.length > 0 && (
        <>
          <label>Subservice:</label><br />
          <select onChange={e => setSelectedService(e.target.value)} required>
            <option value="">Choose subservice</option>
            {subservices.map(ss => (
              <option key={ss.id} value={ss.id}>{ss.name} ({ss.duration_min} min)</option>
            ))}
          </select><br />
        </>
      )}

      <label>Time Slot:</label><br />
      <select onChange={e => setSelectedTime(e.target.value)} required>
        <option value="">Choose time</option>
        {timeSlots.map(ts => <option key={ts} value={ts}>{ts.slice(0,5)}</option>)}
      </select><br />

      <label>Name:</label><br />
      <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required /><br />

      <label>Email:</label><br />
      <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required /><br />

      <button type="submit" style={{ marginTop: '1em', background: '#667eea', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
        Book Now
      </button>
    </form>
  );
}

export default BookingWidget;
