import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="app-container">
        <div className="footer-grid">
          <div>
            <h4>Agradut Foundation</h4>
            <p style={{ opacity: 0.8, maxWidth: '300px' }}>
              Fostering harmony through compassionate support and bridging the gap between institutional resources and grassroots needs.
            </p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/member/pay">Member Payment</Link>
              <Link to="/donate">Temporary Donation</Link>
              <Link to="/contact">Volunteer / Contact</Link>
            </div>
          </div>
          <div>
            <h4>Admin Tools</h4>
            <div className="footer-links">
              <Link to="/admin/login">Admin Login</Link>
              <Link to="/admin/dashboard">Dashboard</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Agradut Foundation. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
