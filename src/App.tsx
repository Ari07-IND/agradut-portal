import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Donate from './pages/Donate';
import MemberPay from './pages/MemberPay';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import CertificateRequest from './pages/CertificateRequest';
import ServiceRequest from './pages/ServiceRequest';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={
          <>
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/donate" element={<Donate />} />
                <Route path="/member/pay" element={<MemberPay />} />
                <Route path="/certificate/request" element={<CertificateRequest />} />
                <Route path="/service-request" element={<ServiceRequest />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                {/* Contact/Volunteer maps to Donate/Contact for simplicity, or we just render Home */}
                <Route path="/contact" element={<div className="app-container section text-center"><h2 className="section-title">Contact & Volunteer</h2><p>Please email us at volunteer@agradut.org to join our force.</p></div>} />
              </Routes>
            </main>
            <Footer />
          </>
        } />
      </Routes>
    </Router>
  );
}

export default App;
