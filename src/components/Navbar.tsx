import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsAdminLoggedIn(!!localStorage.getItem('adminName'));
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        <Link to="/" className="logo">
          <div className="logo-img-wrapper">
            <img src="/logo.png" alt="Agradut" className="navbar-logo-img" />
          </div>
          Agradut <span>Foundation</span>
        </Link>

        {/* Desktop nav links */}
        <div className="nav-links nav-links-desktop">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/member/pay" className="nav-link">Member Payment</Link>
          <Link to="/donate" className="nav-link">Donation</Link>
          <Link to="/certificate/request" className="nav-link">Get Certificate</Link>
          {isAdminLoggedIn ? (
            <Link to="/admin/dashboard" className="nav-link nav-link-admin">Admin Access</Link>
          ) : (
            <Link to="/admin/login" className="nav-link">Admin Login</Link>
          )}
          <Link to="/contact" className="btn btn-primary btn-nav">Become a Volunteer</Link>
        </div>

        {/* Hamburger toggle */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      <div className={`nav-mobile-menu ${menuOpen ? 'nav-mobile-menu--open' : ''}`}>
        <Link to="/" className="nav-mobile-link">Home</Link>
        <Link to="/member/pay" className="nav-mobile-link">Member Payment</Link>
        <Link to="/donate" className="nav-mobile-link">Donation</Link>
        <Link to="/certificate/request" className="nav-mobile-link">Get Certificate</Link>
        {isAdminLoggedIn ? (
          <Link to="/admin/dashboard" className="nav-mobile-link nav-link-admin">Admin Access</Link>
        ) : (
          <Link to="/admin/login" className="nav-mobile-link">Admin Login</Link>
        )}
        <Link to="/contact" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
          Become a Volunteer
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
