export default function Navbar() {
  return (
    <nav style={{
      background: '#ffffff',
      borderBottom: '1px solid #DEDAD3',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand */}
      <a href="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontSize: '15px',
          fontWeight: 700,
          fontFamily: 'Georgia, serif',
          letterSpacing: '-0.02em',
        }}>
          <span style={{ color: '#1A7A4A' }}>Time</span>
          <span style={{ color: '#B83232' }}>lines</span>
          <span style={{ color: '#1C1C1E' }}> World</span>
        </span>
      </a>

      {/* Links */}
      <div style={{
        display: 'flex',
        gap: '18px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
      }}>
        <a href="/browse" style={{ color: '#555555', textDecoration: 'none' }}>Browse</a>
        <a href="/about" style={{ color: '#555555', textDecoration: 'none' }}>About</a>
      </div>

      {/* Login */}
      <button style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
        padding: '5px 14px',
        borderRadius: '4px',
        border: '1px solid #2A5298',
        color: '#2A5298',
        background: '#ffffff',
        cursor: 'pointer',
      }}>
        Login
      </button>
    </nav>
  );
}