import { useState } from 'react';
import { membersApi, certificatesApi } from '../lib/api';
import { Award, Send, CheckCircle, Loader, ShieldAlert, ShieldCheck } from 'lucide-react';

type VerifyState = 'idle' | 'verifying' | 'verified' | 'failed';

const CertificateRequest = () => {
  const [memberId, setMemberId]     = useState('');
  const [email, setEmail]           = useState('');
  const [name, setName]             = useState('');
  const [year, setYear]             = useState(String(new Date().getFullYear()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  // Verification state
  const [verifyState, setVerifyState]     = useState<VerifyState>('idle');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifiedMember, setVerifiedMember] = useState<any>(null);

  // -----------------------------------------------------------------
  // Step 1 — Verify Member ID exists via API
  // -----------------------------------------------------------------
  const handleVerifyMemberId = async () => {
    const trimmed = memberId.trim();
    if (!trimmed) return;

    setVerifyState('verifying');
    setVerifyMessage('');
    setVerifiedMember(null);

    try {
      const data = await membersApi.verify(trimmed);
      if (data.status === 'Dismissed') {
        setVerifyState('failed');
        setVerifyMessage('⚠️ This member account has been dismissed. Certificates cannot be issued.');
        return;
      }
      setVerifiedMember(data);
      setName(data.full_name || '');
      setEmail(data.email || '');
      setVerifyState('verified');
      setVerifyMessage(`✅ Member verified: ${data.full_name}`);
    } catch (err: any) {
      setVerifyState('failed');
      setVerifyMessage(
        err.message === 'Member not found'
          ? '❌ Member ID not found. Please check and try again.'
          : `Lookup error: ${err.message}`
      );
    }
  };

  // Reset verification when Member ID field changes
  const handleMemberIdChange = (val: string) => {
    setMemberId(val);
    if (verifyState !== 'idle') {
      setVerifyState('idle');
      setVerifyMessage('');
      setVerifiedMember(null);
      setName('');
      setEmail('');
    }
  };

  // -----------------------------------------------------------------
  // Step 2 — Submit: check duplicate then insert
  // -----------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verifyState !== 'verified') {
      alert('Please verify your Member ID before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for existing request for this member + year
      const existing = await certificatesApi.check(memberId.trim(), year);

      if (existing && existing.length > 0) {
        if (existing.length >= 3) {
          alert(`You have reached the maximum of 3 certificate requests for the year ${year}. Please contact the admin directly.`);
          setIsSubmitting(false);
          return;
        }

        const latest = existing[0]; // Ordered by created_at DESC from backend
        if (latest.status === 'pending') {
          alert(`Your certificate request for ${year} is currently pending admin review. Please wait for an update.`);
          setIsSubmitting(false);
          return;
        }
        if (latest.status === 'approved') {
          alert(`Your certificate request for ${year} has already been approved.`);
          setIsSubmitting(false);
          return;
        }
        // If it's 'rejected', and length < 3, the code naturally continues and lets them reapply!
      }

      // All clear — submit
      await certificatesApi.submit({
        member_id: memberId.trim(),
        full_name: name,
        email,
        year,
      });
      setSubmitted(true);
    } catch (err: any) {
      alert('Failed to send request: ' + err.message);
    }
    setIsSubmitting(false);
  };

  // -----------------------------------------------------------------
  // Success screen
  // -----------------------------------------------------------------
  if (submitted) {
    return (
      <div className="app-container section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '3rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '1.5rem', borderRadius: '50%', background: 'rgba(30, 142, 62, 0.1)', marginBottom: '1.5rem' }}>
            <CheckCircle size={64} color="#1e8e3e" />
          </div>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem', color: 'var(--text-dark)' }}>Request Sent!</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '1rem', marginBottom: '0.75rem', lineHeight: 1.6 }}>
            Your request for the <strong>{year} Appreciation Certificate</strong> has been submitted successfully.
          </p>
          <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', marginBottom: '2rem' }}>
            Once approved by the admin team, it will be generated and sent to <strong>{email}</strong>.
          </p>
          <button onClick={() => window.location.href = '/'} className="btn btn-primary">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // Main form
  // -----------------------------------------------------------------
  return (
    <div className="app-container section" style={{ minHeight: '80vh' }}>
      <div className="cert-layout">

        {/* Left — info panel */}
        <div style={{ textAlign: 'left' }}>
          <div style={{ display: 'inline-block', padding: '1rem', background: 'rgba(217, 79, 56, 0.1)', borderRadius: '12px', marginBottom: '1.5rem' }}>
            <Award size={40} color="var(--primary-red)" />
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '1.5rem', lineHeight: 1.1 }}>
            Get Your Official <span style={{ color: 'var(--primary-red)' }}>Appreciation</span> Certificate
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-light)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Agradut Foundation honors the dedication of our members. Request your digital certificate for your contributions in {year}.
            Our admin team will verify your details and issue your official document shortly.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              'Member ID verified against database',
              'One certificate request per year',
              'High-Quality PDF Format',
              'Official Organization Seal',
              'Instant Digital Delivery',
            ].map((feature, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.95rem' }}>
                <CheckCircle size={18} color="var(--primary-green)" style={{ flexShrink: 0 }} /> {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form panel */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h2 style={{ marginBottom: '1.75rem', fontSize: '1.7rem', color: 'var(--text-dark)' }}>Request Form</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Member ID + Verify ── */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Member ID <span style={{ color: 'var(--primary-red)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. aF2023-xx"
                  value={memberId}
                  onChange={(e) => handleMemberIdChange(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    borderColor: verifyState === 'verified' ? 'var(--primary-green)'
                               : verifyState === 'failed'   ? 'var(--primary-red)'
                               : undefined,
                    boxShadow: verifyState === 'verified' ? '0 0 0 3px rgba(43,97,66,0.15)'
                             : verifyState === 'failed'   ? '0 0 0 3px rgba(217,79,56,0.15)'
                             : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={handleVerifyMemberId}
                  disabled={!memberId.trim() || verifyState === 'verifying' || verifyState === 'verified'}
                  className="btn btn-secondary"
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '0 1.2rem',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    background: verifyState === 'verified' ? 'var(--primary-green)' : undefined,
                    color:      verifyState === 'verified' ? '#fff' : undefined,
                    borderColor: verifyState === 'verified' ? 'var(--primary-green)' : undefined,
                  }}
                >
                  {verifyState === 'verifying' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Checking...
                    </span>
                  ) : verifyState === 'verified' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ShieldCheck size={15} /> Verified
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ShieldAlert size={15} /> Verify ID
                    </span>
                  )}
                </button>
              </div>

              {/* Verification status message */}
              {verifyMessage && (
                <p style={{
                  marginTop: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: verifyState === 'verified' ? 'var(--primary-green)' : 'var(--primary-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}>
                  {verifyMessage}
                </p>
              )}
            </div>

            {/* ── Year (always visible) ── */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Contribution Year <span style={{ color: 'var(--primary-red)' }}>*</span>
              </label>
              <select
                className="input-field"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                style={{ appearance: 'none' }}
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>

            {/* ── Fields shown only after verification ── */}
            {verifyState === 'verified' && verifiedMember && (
              <>
                {/* Verified member card */}
                <div style={{
                  background: 'rgba(43, 97, 66, 0.07)',
                  border: '1px solid rgba(43, 97, 66, 0.25)',
                  borderRadius: '12px',
                  padding: '1rem 1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <ShieldCheck size={22} color="var(--primary-green)" style={{ flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.95rem', margin: 0 }}>
                      {verifiedMember.full_name}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: 0 }}>
                      {verifiedMember.member_id} · {verifiedMember.email}
                    </p>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name (as on Certificate)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '0.35rem' }}>
                    Auto-filled from database. Edit if needed.
                  </p>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address (for delivery)</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '0.35rem' }}>
                    Auto-filled from database. Edit if needed.
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '1rem', fontSize: '1.05rem', marginTop: '0.25rem' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Send size={18} /> Submit Request
                    </span>
                  )}
                </button>
              </>
            )}

            {/* Prompt to verify first */}
            {verifyState !== 'verified' && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', textAlign: 'center', padding: '0.5rem 0' }}>
                ☝️ Enter your Member ID above and click <strong>Verify ID</strong> to continue.
              </p>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};

export default CertificateRequest;
