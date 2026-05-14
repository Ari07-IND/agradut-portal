import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { servicesApi } from '../lib/api';
import { 
  Droplet, 
  Search, 
  Activity, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

type RequestType = 'blood_donate' | 'blood_request' | 'organ_donate';

const ServiceRequest = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialType = (searchParams.get('type') as RequestType) || 'blood_donate';
  
  const [type, setType] = useState<RequestType>(initialType);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = searchParams.get('type') as RequestType;
    if (t) setType(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await servicesApi.submit({
        type,
        full_name: fullName,
        email,
        phone,
        blood_group: (type === 'blood_donate' || type === 'blood_request') ? bloodGroup : null,
        details,
      });
      setIsSuccess(true);
      setTimeout(() => navigate('/'), 4000);
    } catch (err: any) {
      setError('Something went wrong. Please try again later.');
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const getTitle = () => {
    switch (type) {
      case 'blood_donate': return 'Donate Blood';
      case 'blood_request': return 'Need a Blood Donor';
      case 'organ_donate': return 'Organ Donation Pledge';
      default: return 'Service Request';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'blood_donate': return <Droplet size={48} color="var(--primary-red)" />;
      case 'blood_request': return <Search size={48} color="var(--primary-green)" />;
      case 'organ_donate': return <Activity size={48} color="#0077b6" />;
      default: return <FileText size={48} />;
    }
  };

  if (isSuccess) {
    return (
      <div className="app-container section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <CheckCircle size={64} color="var(--primary-green)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ marginBottom: '1rem' }}>Request Submitted!</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
            Thank you for reaching out. Our team will contact you shortly on <strong>{phone}</strong> to proceed further.
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary">Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container section">
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        {/* Type Selector */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            onClick={() => setType('blood_donate')}
            className={`btn ${type === 'blood_donate' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Droplet size={18} /> Donate Blood
          </button>
          <button 
            onClick={() => setType('blood_request')}
            className={`btn ${type === 'blood_request' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Search size={18} /> Need Blood
          </button>
          <button 
            onClick={() => setType('organ_donate')}
            className={`btn ${type === 'organ_donate' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Activity size={18} /> Organ Donor
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-block', padding: '1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '50%', marginBottom: '1rem' }}>
              {getIcon()}
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{getTitle()}</h2>
            <p style={{ color: 'var(--text-light)' }}>Please fill in the details below. All fields marked with * are required.</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(217,79,56,0.1)', color: 'var(--primary-red)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label"><User size={14} /> Full Name <span style={{ color: 'var(--primary-red)' }}>*</span></label>
              <input 
                type="text" className="input-field" placeholder="John Doe" 
                value={fullName} onChange={e => setFullName(e.target.value)} required 
              />
            </div>

            <div className="dash-form-grid-2">
              <div className="form-group">
                <label className="form-label"><Phone size={14} /> Phone Number <span style={{ color: 'var(--primary-red)' }}>*</span></label>
                <input 
                  type="tel" className="input-field" placeholder="+91 0000000000" 
                  value={phone} onChange={e => setPhone(e.target.value)} required 
                />
              </div>
              <div className="form-group">
                <label className="form-label"><Mail size={14} /> Email Address</label>
                <input 
                  type="email" className="input-field" placeholder="john@example.com" 
                  value={email} onChange={e => setEmail(e.target.value)} 
                />
              </div>
            </div>

            {(type === 'blood_donate' || type === 'blood_request') && (
              <div className="form-group">
                <label className="form-label"><Droplet size={14} /> Blood Group <span style={{ color: 'var(--primary-red)' }}>*</span></label>
                <select 
                  className="input-field" value={bloodGroup} 
                  onChange={e => setBloodGroup(e.target.value)} required
                >
                  <option value="">Select Blood Group</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label"><FileText size={14} /> Additional Details / Message</label>
              <textarea 
                className="input-field" rows={4} 
                placeholder={type === 'blood_request' ? "Specify hospital name, patient details, and urgency..." : "Any specific medical history or availability..."}
                value={details} onChange={e => setDetails(e.target.value)}
              ></textarea>
            </div>

            <button 
              type="submit" className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting Request...' : 'Submit Request'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ServiceRequest;
