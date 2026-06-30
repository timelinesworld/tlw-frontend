'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark",
  "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji",
  "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece",
  "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia",
  "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi",
  "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia",
  "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore",
  "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea",
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo",
  "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe"
];

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');

    // Validations
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!country) { setError('Please select your country.'); return; }
    if (!password) { setError('Please enter a password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);

    // Create auth user
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          country: country,
          role: 'user',
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Insert into users table
    if (data.user) {
      const { error: insertError } = await supabase.from('users').insert([{
        id: data.user.id,
        full_name: fullName,
        email: email,
        country: country,
        role: 'user',
      }]);
      if (insertError) console.error('User insert error:', insertError);
    }

    window.location.href = '/';
  };

  const inputStyle = {
    width: '100%',
    fontFamily: 'Arial,sans-serif',
    fontSize: '13px',
    padding: '9px 12px',
    border: '1px solid #DEDAD3',
    borderRadius: '4px',
    background: '#F5F4F0',
    color: '#1C1C1E',
    outline: 'none',
  };

  const labelStyle = {
    fontFamily: 'Arial,sans-serif',
    fontSize: '11px',
    fontWeight: 700,
    color: '#555',
    display: 'block',
    marginBottom: '5px',
  } as React.CSSProperties;

  return (
    <main style={{ background: '#F5F4F0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
      <div style={{ background: '#fff', border: '1px solid #DEDAD3', borderRadius: '8px', padding: '36px 32px', width: '100%', maxWidth: '420px', margin: '0 20px' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '20px', fontWeight: 700 }}>
              <span style={{ color: '#1A7A4A' }}>Time</span>
              <span style={{ color: '#B83232' }}>lines</span>
              <span style={{ color: '#1C1C1E' }}> World</span>
            </span>
          </a>
          <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#888', marginTop: '6px' }}>Create your account</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FDF0F0', border: '1px solid #F0D4D4', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#B83232' }}>
            {error}
          </div>
        )}

        {/* Full Name */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your full name"
            style={inputStyle}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={inputStyle}
          />
        </div>

        {/* Country */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Country</label>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">Select your country…</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Password */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            style={inputStyle}
          />
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            style={inputStyle}
          />
          {confirmPassword && password !== confirmPassword && (
            <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#B83232', marginTop: '4px' }}>Passwords do not match</p>
          )}
          {confirmPassword && password === confirmPassword && (
            <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#1A7A4A', marginTop: '4px' }}>✓ Passwords match</p>
          )}
        </div>

        {/* Register Button */}
        <button
          onClick={handleRegister}
          disabled={loading}
          style={{ width: '100%', fontFamily: 'Arial,sans-serif', fontSize: '13px', fontWeight: 600, padding: '10px', borderRadius: '4px', background: loading ? '#aaa' : '#2A5298', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px' }}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        {/* Divider */}
        <div style={{ height: '1px', background: '#DEDAD3', marginBottom: '16px' }} />

        {/* Login link */}
        <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#888', textAlign: 'center' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#2A5298', fontWeight: 600, textDecoration: 'none' }}>Sign in</a>
        </p>

      </div>
    </main>
  );
}