import React, { useState } from 'react';
import { donationsApi } from '../lib/api';
import { jsPDF } from 'jspdf';
import {
  Heart, IndianRupee, User, Mail
} from 'lucide-react';

// ── 🔑 Replace with your Razorpay Key ID ──
const RAZORPAY_KEY = 'rzp_test_XXXXXXXXXXXXXXXX';
// ──────────────────────────────────────────

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

const Donate = () => {
  const [step, setStep]           = useState<number>(1);
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [phone]           = useState('');
  const [amount, setAmount]       = useState<number>(500);
  const [message]         = useState('');
  const [isPaying, setIsPaying]   = useState(false);
  const [receiptId, setReceiptId] = useState('');
  const [txnId, setTxnId]         = useState('');

  const genReceiptId = () =>
    `DON-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;

  const saveDonation = async (tId: string, rId: string) => {
    const now = new Date();
    try {
      await donationsApi.record({
        receipt_id:     rId,
        full_name:      name,
        email,
        phone,
        amount,
        transaction_id: tId,
        message,
        donation_date:  now.toISOString(),
        month:          now.getMonth() + 1,
        year:           now.getFullYear(),
      });
    } catch (err) {
      console.error('Donation save error:', err);
    }
  };

  const downloadReceipt = (rId: string, tId: string) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
    const now = new Date();

    doc.setFillColor(255, 153, 51);
    doc.rect(0, 0, 148, 25, 'F');
    doc.setFillColor(19, 136, 8);
    doc.rect(0, 185, 148, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('AGRADUT FOUNDATION', 74, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Donation Receipt', 74, 20, { align: 'center' });

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.text(`Receipt ID: ${rId}`, 15, 45);
    doc.text(`Date: ${now.toLocaleDateString('en-IN')}`, 15, 55);
    doc.text(`Donor: ${name}`, 15, 65);
    doc.text(`Amount: \u20B9${amount.toLocaleString('en-IN')}`, 15, 75);
    doc.text(`Transaction ID: ${tId}`, 15, 85);

    doc.setTextColor(19, 136, 8);
    doc.text('Thank you for your generous contribution!', 74, 120, { align: 'center' });
    doc.save(`Donation_Receipt_${rId}.pdf`);
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 1) return;
    setIsPaying(true);

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert('Razorpay failed to load.');
      setIsPaying(false);
      return;
    }

    const options = {
      key: RAZORPAY_KEY,
      amount: amount * 100,
      currency: 'INR',
      name: 'Agradut Foundation',
      description: 'General Donation',
      handler: async (response: any) => {
        const paymentId = response.razorpay_payment_id;
        const rId = genReceiptId();
        setReceiptId(rId);
        setTxnId(paymentId);
        await saveDonation(paymentId, rId);
        downloadReceipt(rId, paymentId);
        setStep(2);
        setIsPaying(false);
      },
      prefill: { name, email, contact: phone },
      theme: { color: '#d94f38' },
      modal: { ondismiss: () => setIsPaying(false) }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  if (step === 2) {
    return (
      <div className="app-container section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <Heart size={60} color="var(--primary-red)" style={{ marginBottom: '1.5rem' }} />
          <h2>Thank You!</h2>
          <p style={{ marginBottom: '2rem' }}>
            Dear <strong>{name}</strong>, your donation of <strong>₹{amount}</strong> has been received.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => downloadReceipt(receiptId, txnId)} className="btn btn-secondary">Download Receipt</button>
            <button onClick={() => window.location.href = '/'} className="btn btn-primary">Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container section">
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>
        
        <div style={{ flex: '1 1 320px' }}>
          <Heart size={48} color="var(--primary-red)" style={{ marginBottom: '1.5rem' }} />
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Support Our Cause</h1>
          <p style={{ lineHeight: 1.7, marginBottom: '2rem' }}>
            Your contribution helps us provide education, healthcare, and essential support to those in need.
          </p>
        </div>

        <div className="glass-panel" style={{ flex: '1 1 400px', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Make a Donation</h3>
          <form onSubmit={handleDonate}>
            <div className="form-group">
              <label className="form-label"><User size={14} /> Name</label>
              <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label"><Mail size={14} /> Email</label>
              <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label"><IndianRupee size={14} /> Amount (₹)</label>
              <input type="number" className="input-field" value={amount} onChange={e => setAmount(Number(e.target.value))} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isPaying}>
              {isPaying ? 'Processing...' : `Donate ₹${amount}`}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Donate;
