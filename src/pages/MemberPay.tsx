import { useState } from 'react';
import { membersApi, paymentsApi } from '../lib/api';
import { jsPDF } from 'jspdf';
import {
  CheckCircle, Loader, ShieldCheck, ShieldAlert,
  IndianRupee, User, Phone, Mail, BadgeCheck,
  FileText, CreditCard
} from 'lucide-react';

// ── 🔑 Replace with your Razorpay Key ID from https://dashboard.razorpay.com ──
const RAZORPAY_KEY = 'rzp_test_XXXXXXXXXXXXXXXX';
// ──────────────────────────────────────────────────────────────────────────────

type VerifyState = 'idle' | 'verifying' | 'verified' | 'failed';
type Step = 1 | 2 | 3;

declare const Razorpay: any;

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise(resolve => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const MemberPay = () => {
  const [step, setStep]               = useState<Step>(1);
  const [memberId, setMemberId]       = useState('');
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [verifyMsg, setVerifyMsg]     = useState('');
  const [member, setMember]           = useState<any>(null);
  const [amount, setAmount]           = useState<number>(40);
  const [amountError, setAmountError] = useState('');
  const [isPaying, setIsPaying]       = useState(false);
  const [receiptId, setReceiptId]     = useState('');
  const [txnId, setTxnId]             = useState('');

  // ── Helpers ────────────────────────────────────────────────────────
  const genReceiptId = () =>
    `AGRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;

  const savePayment = async (txnRef: string, rId: string) => {
    const now = new Date();
    try {
      await paymentsApi.record({
        receipt_id:      rId,
        member_id:       member!.member_id,
        full_name:       member!.full_name,
        amount,
        payment_method:  'razorpay',
        transaction_ref: txnRef,
        payment_date:    now.toISOString(),
        month:           now.getMonth() + 1,
        year:            now.getFullYear(),
      });
    } catch (err) {
      console.error('DB save error:', err);
    }
  };

  const downloadReceipt = (rId: string, txnRef: string) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
    const now = new Date();
    // Saffron header
    doc.setFillColor(255, 153, 51);
    doc.rect(0, 0, 148, 24, 'F');
    // Green footer
    doc.setFillColor(19, 136, 8);
    doc.rect(0, 186, 148, 24, 'F');
    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('AGRADUT FOUNDATION', 74, 11, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Payment Receipt', 74, 19, { align: 'center' });
    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 30, 134, 30);
    // Body rows
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9.5);
    const row = (label: string, val: string, y: number) => {
      doc.setFont('helvetica', 'bold');   doc.setTextColor(100,100,100); doc.text(label, 14, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(30,30,30);   doc.text(val,   74, y);
    };
    row('Receipt No.', rId, 40);
    row('Date & Time', now.toLocaleString('en-IN'), 50);
    row('Member Name', member!.full_name, 60);
    row('Member ID',   member!.member_id, 70);
    row('Email',       member!.email || '—', 80);
    // Amount
    doc.setFillColor(240, 248, 240);
    doc.roundedRect(14, 88, 120, 18, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(19, 136, 8);
    doc.text(`\u20B9 ${amount.toLocaleString('en-IN')}`, 74, 100, { align: 'center' });
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    row('Payment Method', 'Razorpay (UPI / Card / Netbanking)', 114);
    row('Transaction ID', txnRef, 124);
    row('Status', 'PAID', 134);
    // Footer text
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('Thank you for your valued contribution to Agradut Foundation.', 74, 195, { align: 'center' });
    doc.save(`Receipt_${rId}.pdf`);
  };

  // ── Step 1: Verify Member ID ────────────────────────────────────────
  const handleVerify = async () => {
    const trimmed = memberId.trim();
    if (!trimmed) return;
    setVerifyState('verifying'); setVerifyMsg(''); setMember(null);
    try {
      const data = await membersApi.verify(trimmed);
      if (data.status === 'Dismissed') {
        setVerifyState('failed');
        setVerifyMsg('This member account has been dismissed.');
        return;
      }
      setMember(data);
      setVerifyState('verified');
      setVerifyMsg(`Verified: ${data.full_name}`);
    } catch (err: any) {
      setVerifyState('failed');
      setVerifyMsg(err.message === 'Member not found'
        ? 'Member ID not found. Please check and try again.'
        : `Error: ${err.message}`);
    }
  };

  const handleMemberIdChange = (val: string) => {
    setMemberId(val);
    if (verifyState !== 'idle') { setVerifyState('idle'); setVerifyMsg(''); setMember(null); }
  };

  // ── Step 2: Open Razorpay checkout ─────────────────────────────────
  const handlePayNow = async () => {
    if (amount < 40) { setAmountError('Minimum payment amount is ₹40'); return; }
    setIsPaying(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) { alert('Payment gateway failed to load. Please check your internet connection.'); setIsPaying(false); return; }

    const options = {
      key:         RAZORPAY_KEY,
      amount:      amount * 100,   // paise
      currency:    'INR',
      name:        'Agradut Foundation',
      description: 'Monthly Membership Payment',
      image:       '/logo.png',
      prefill: {
        name:    member!.full_name,
        email:   member!.email   || '',
        contact: member!.phone   || '',
      },
      notes: { member_id: member!.member_id },
      theme: { color: '#d94f38' },
      handler: async (response: any) => {
        const paymentId = response.razorpay_payment_id;
        const rId = genReceiptId();
        setReceiptId(rId);
        setTxnId(paymentId);
        await savePayment(paymentId, rId);
        downloadReceipt(rId, paymentId);
        setStep(3);
        setIsPaying(false);
      },
      modal: {
        ondismiss: () => { setIsPaying(false); },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', (resp: any) => {
      alert(`Payment failed: ${resp.error.description}`);
      setIsPaying(false);
    });
    rzp.open();
  };

  // ── Step 3: Success ─────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="app-container section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1.25rem', borderRadius: '50%', background: 'rgba(43,97,66,0.12)', marginBottom: '1.5rem' }}>
            <CheckCircle size={60} color="var(--primary-green)" />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Payment Successful!</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
            Thank you, <strong>{member?.full_name}</strong>. Your payment of{' '}
            <strong style={{ color: 'var(--primary-green)' }}>₹{amount.toLocaleString('en-IN')}</strong> has been confirmed.
          </p>

          {/* Receipt card */}
          <div style={{ background: 'rgba(43,97,66,0.06)', border: '1px solid rgba(43,97,66,0.2)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.75rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', margin: 0 }}>Receipt No.</p>
                <p style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.88rem', margin: '0.1rem 0 0', color: 'var(--text-dark)' }}>{receiptId}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', margin: 0 }}>Amount Paid</p>
                <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-green)', margin: '0.1rem 0 0' }}>₹{amount.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div style={{ borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '0.75rem' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', margin: 0 }}>Transaction ID</p>
              <p style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.82rem', margin: '0.15rem 0 0', color: 'var(--text-dark)', wordBreak: 'break-all' }}>{txnId}</p>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', margin: 0 }}>Member</p>
              <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: '0.1rem 0 0', color: 'var(--text-dark)' }}>{member?.full_name} · {member?.member_id}</p>
            </div>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
            Your receipt was downloaded automatically. You can re-download it below.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => downloadReceipt(receiptId, txnId)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FileText size={16} /> Download Receipt
            </button>
            <button
              onClick={() => { setStep(1); setMemberId(''); setVerifyState('idle'); setMember(null); setAmount(40); setReceiptId(''); setTxnId(''); }}
              className="btn btn-secondary"
            >New Payment</button>
            <button onClick={() => window.location.href = '/'} className="btn btn-primary">Return Home</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Amount selection + Pay ─────────────────────────────────
  if (step === 2 && member) {
    return (
      <div className="app-container section" style={{ minHeight: '80vh' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>

          {/* Member strip */}
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(43,97,66,0.08)', padding: '0.35rem 0.75rem', borderRadius: '30px', border: '1px solid rgba(43,97,66,0.2)' }}>
              <BadgeCheck size={15} color="var(--primary-green)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-green)' }}>{member.member_id}</span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{member.full_name}</span>
            {member.email && <span style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>{member.email}</span>}
            <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}>Change</button>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Monthly Payment</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.75rem' }}>
              Pay securely via UPI, Card, Netbanking or Wallet through Razorpay.
            </p>

            {/* Amount */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">
                Amount <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(min. ₹40)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontWeight: 700, fontSize: '1rem' }}>₹</span>
                <input
                  type="number" className="input-field" min={40} step={10}
                  value={amount}
                  onChange={e => { const n = Number(e.target.value); setAmount(n); setAmountError(n < 40 ? 'Minimum is ₹40' : ''); }}
                  style={{ paddingLeft: '2.2rem', fontWeight: 700, fontSize: '1.1rem', borderColor: amountError ? 'var(--primary-red)' : undefined }}
                />
              </div>
              {amountError && <p style={{ color: 'var(--primary-red)', fontSize: '0.82rem', marginTop: '0.35rem', fontWeight: 600 }}>{amountError}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                {[40, 100, 200, 500].map(p => (
                  <button key={p} type="button" onClick={() => { setAmount(p); setAmountError(''); }}
                    style={{ background: amount === p ? 'var(--primary-green)' : 'rgba(255,255,255,0.6)', color: amount === p ? '#fff' : 'var(--text-dark)', border: `1px solid ${amount === p ? 'var(--primary-green)' : 'rgba(0,0,0,0.12)'}`, borderRadius: '20px', padding: '0.3rem 0.9rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                    ₹{p}
                  </button>
                ))}
              </div>
            </div>

            {/* Pay button */}
            <button
              onClick={handlePayNow}
              disabled={isPaying || amount < 40}
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
            >
              {isPaying
                ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Opening Payment Gateway...</>
                : <><CreditCard size={18} /> Pay ₹{amount.toLocaleString('en-IN')} Securely</>}
            </button>

            {/* Gateway logos hint */}
            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '1rem' }}>
              🔒 Powered by <strong>Razorpay</strong> · Supports UPI · Cards · Netbanking · Wallets
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Verify Member ID ────────────────────────────────────────
  return (
    <div className="app-container section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1.2rem', borderRadius: '50%', background: 'rgba(43,97,66,0.1)', marginBottom: '1rem' }}>
            <IndianRupee size={40} color="var(--primary-green)" />
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>Member Payment</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Enter your Member ID to verify and proceed to pay.</p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="form-group">
            <label className="form-label">Member ID <span style={{ color: 'var(--primary-red)' }}>*</span></label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text" className="input-field"
                placeholder="e.g. aF2023-xx"
                value={memberId}
                onChange={e => handleMemberIdChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verifyState !== 'verified' && handleVerify()}
                style={{
                  flex: 1,
                  borderColor: verifyState === 'verified' ? 'var(--primary-green)' : verifyState === 'failed' ? 'var(--primary-red)' : undefined,
                  boxShadow: verifyState === 'verified' ? '0 0 0 3px rgba(43,97,66,0.15)' : verifyState === 'failed' ? '0 0 0 3px rgba(217,79,56,0.15)' : undefined,
                }}
              />
              <button type="button" onClick={handleVerify}
                disabled={!memberId.trim() || verifyState === 'verifying' || verifyState === 'verified'}
                className="btn btn-secondary"
                style={{ whiteSpace: 'nowrap', padding: '0 1.1rem', borderRadius: '12px', background: verifyState === 'verified' ? 'var(--primary-green)' : undefined, color: verifyState === 'verified' ? '#fff' : undefined, borderColor: verifyState === 'verified' ? 'var(--primary-green)' : undefined }}
              >
                {verifyState === 'verifying' ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />Checking</span>
                  : verifyState === 'verified' ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ShieldCheck size={14} />Verified</span>
                  : <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ShieldAlert size={14} />Verify</span>}
              </button>
            </div>
            {verifyMsg && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.84rem', fontWeight: 600, color: verifyState === 'verified' ? 'var(--primary-green)' : 'var(--primary-red)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {verifyState === 'verified' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />} {verifyMsg}
              </p>
            )}
          </div>

          {/* Member detail card after verification */}
          {verifyState === 'verified' && member && (
            <div style={{ background: 'rgba(43,97,66,0.06)', border: '1px solid rgba(43,97,66,0.2)', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <User size={15} color="var(--primary-green)" />
                <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{member.full_name}</span>
                <span style={{ marginLeft: 'auto', background: '#e6f4ea', color: '#1e8e3e', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '20px' }}>{member.status || 'Active'}</span>
              </div>
              {member.designation && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><BadgeCheck size={13} color="var(--text-light)" /><span style={{ fontSize: '0.83rem', color: 'var(--text-light)' }}>{member.designation}</span></div>}
              {member.email && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Mail size={13} color="var(--text-light)" /><span style={{ fontSize: '0.83rem', color: 'var(--text-light)' }}>{member.email}</span></div>}
              {member.phone && member.phone !== 'N/A' && <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Phone size={13} color="var(--text-light)" /><span style={{ fontSize: '0.83rem', color: 'var(--text-light)' }}>{member.phone}</span></div>}
            </div>
          )}

          <button onClick={() => { if (verifyState === 'verified') setStep(2); }}
            className="btn btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
            disabled={verifyState !== 'verified'}
          >
            Proceed to Payment →
          </button>
          {verifyState !== 'verified' && (
            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-light)', marginTop: '0.75rem' }}>
              Verify your Member ID to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberPay;
