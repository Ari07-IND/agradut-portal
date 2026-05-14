import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../lib/api';

const AdminLogin = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [memberId, setMemberId] = useState('');
  const [adminId, setAdminId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem('adminName')) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleSendOTP = async () => {
    if (!email) {
      setOtpError("Please enter an email address first.");
      return;
    }
    setOtpError('');
    setIsLoading(true);
    try {
      await authApi.sendOtp(email);
      setOtpSent(true);
      alert("OTP sent successfully to your email!");
    } catch (err: any) {
      setOtpError(err.message || "Failed to send OTP.");
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setIsLoading(true);
    
    try {
      if (mode === 'login') {
        // Login with email + password
        const { token, user } = await authApi.login(loginEmail, password);
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminName', user.full_name || loginEmail);
        localStorage.setItem('adminId', user.admin_id || 'ADM-01');
        localStorage.setItem('memberId', user.member_id || '');
        navigate('/admin/dashboard');
      } else if (mode === 'register') {
        // Registration flow
        if (!otpSent) {
          setOtpError("Please click 'Send OTP' and verify your email first.");
          setIsLoading(false);
          return;
        }
        if (!otp) {
          setOtpError("Please enter the 6-digit OTP.");
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setOtpError("Passwords do not match.");
          setIsLoading(false);
          return;
        }

        // 1. Verify OTP
        await authApi.verifyOtp(email, otp);

        // 2. Register admin
        const { token, user } = await authApi.register({
          full_name: registerName,
          email,
          password,
          member_id: memberId,
          admin_id: adminId,
        });
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminName', user.full_name || registerName);
        localStorage.setItem('adminId', user.admin_id || adminId);
        localStorage.setItem('memberId', user.member_id || memberId);
        navigate('/admin/dashboard');
      } else if (mode === 'forgot') {
        // Forgot password flow
        if (!otpSent) {
          setOtpError("Please click 'Send OTP' and check your email first.");
          setIsLoading(false);
          return;
        }
        if (!otp || !password) {
          setOtpError("Please enter the OTP and your new password.");
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setOtpError("Passwords do not match.");
          setIsLoading(false);
          return;
        }

        await authApi.resetPassword(email, otp, password);
        alert("Password reset successfully! You can now login with your new password.");
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setOtp('');
        setOtpSent(false);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setOtpError(err.message || "An unexpected error occurred.");
    }
    setIsLoading(false);
  };

  return (
    <div className="app-container section">
      <div className="glass-panel admin-card-full" style={{ position: 'relative', maxWidth: mode === 'register' ? '850px' : '450px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', transition: 'max-width 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Lock size={48} color="var(--primary-red)" style={{ marginBottom: '1rem' }} />
          <h2 className="section-title">Admin Access</h2>
          <p className="section-subtitle">
            {mode === 'login' ? 'Login to manage members and programs.' : mode === 'register' ? 'Create a new administrative account.' : 'Reset your admin password.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'login' ? (
            <>
              <div className="form-group">
                <label className="form-label">Admin Email</label>
                <input type="email" className="input-field" placeholder="admin@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Password</label>
                  <button type="button" onClick={() => { setMode('forgot'); setOtpError(''); setOtpSent(false); }} style={{ background: 'none', border: 'none', color: 'var(--primary-red)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>Forgot Password?</button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', paddingRight: '40px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </>
          ) : mode === 'forgot' ? (
            <>
              <div className="form-group">
                <label className="form-label">Admin Email Address</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="email" className="input-field" placeholder="admin@agradut.org" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ flexGrow: 1 }} />
                  <button type="button" onClick={handleSendOTP} className="btn btn-secondary" style={{ padding: '0 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap', borderRadius: '8px' }} disabled={isLoading}>
                    {otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                </div>
              </div>
              
              {otpSent && (
                <>
                  <div className="form-group" style={{ animation: 'fadeIn 0.4s ease', padding: '1rem', background: 'rgba(19, 136, 8, 0.05)', borderRadius: '12px', border: '1px dashed var(--primary-green)' }}>
                    <label className="form-label" style={{ color: 'var(--primary-green)', fontWeight: 'bold' }}>Enter 6-Digit OTP</label>
                    <input type="text" className="input-field" placeholder="Check your email for the code" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPassword ? 'text' : 'password'} className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', paddingRight: '40px' }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showConfirmPassword ? 'text' : 'password'} className="input-field" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: '100%', paddingRight: '40px' }} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="admin-register-grid">
              <div>
                <div className="form-group">
                  <label className="form-label">Admin Full Name</label>
                  <input type="text" className="input-field" placeholder="E.g. Rajdeep Bagh" value={registerName} onChange={(e) => setRegisterName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Email Address</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="email" className="input-field" placeholder="admin@agradut.org" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ flexGrow: 1 }} />
                    <button type="button" onClick={handleSendOTP} className="btn btn-secondary" style={{ padding: '0 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap', borderRadius: '8px' }} disabled={isLoading}>
                      {otpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  </div>
                  {otpError && <p style={{ color: 'var(--primary-red)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{otpError}</p>}
                </div>
                {otpSent && (
                  <div className="form-group" style={{ animation: 'fadeIn 0.4s ease', padding: '1rem', background: 'rgba(19, 136, 8, 0.05)', borderRadius: '12px', border: '1px dashed var(--primary-green)' }}>
                    <label className="form-label" style={{ color: 'var(--primary-green)', fontWeight: 'bold' }}>Enter 6-Digit OTP</label>
                    <input type="text" className="input-field" placeholder="Check your email for the code" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Member ID</label>
                    <input type="text" className="input-field" placeholder="aF2023-XX" value={memberId} onChange={(e) => setMemberId(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Admin ID</label>
                    <input type="text" className="input-field" placeholder="E.g. ADM-01" value={adminId} onChange={(e) => setAdminId(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', paddingRight: '40px' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirmPassword ? 'text' : 'password'} className="input-field" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: '100%', paddingRight: '40px' }} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {otpError && <p style={{ color: 'var(--primary-red)', fontSize: '0.85rem', marginBottom: '0.5rem', textAlign: 'center' }}>{otpError}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem', marginTop: '1rem' }} disabled={isLoading}>
            {isLoading ? 'Please wait...' : mode === 'login' ? 'Login to Dashboard' : mode === 'register' ? 'Create Admin Account' : 'Reset Password'}
          </button>
        </form>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setOtpError(''); setOtpSent(false); }} 
            style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {mode === 'login' ? 'Need an account? Create one' : 'Back to Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
