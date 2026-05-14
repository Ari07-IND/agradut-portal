import { useState, useEffect } from 'react';
import { Users, CalendarClock, CalendarDays, LogOut, Globe, Award, Download, Send, Wallet, PlusCircle, IndianRupee, Heart, Activity, Droplet, Search, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { membersApi, pastProgramsApi, futureProgramsApi, paymentsApi, donationsApi, certificatesApi, servicesApi } from '../lib/api';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import emailjs from '@emailjs/browser';

const TRUSTEES = [
  { name: "Rajdeep Bagh", role: "FOUNDER & PRESIDENT", img: "/rajdeepbagh.jpeg" },
  { name: "Satwik Mukherjee", role: "VICE PRESIDENT", img: "/satwik.jpeg" },
  { name: "Dipanjan Ganguly", role: "SECRETARY", img: "/dipanjan.jpeg" },
  { name: "Dripta Chakraborty", role: "CO - SECRETARY", img: "/dripta.jpeg" },
  { name: "Anindita Mondal", role: "PROJECT COORDINATOR", img: "/Anindita.jpeg" },
  { name: "Rangan Paul", role: "CASHIER", img: "/rangan.jpeg" },
  { name: "Aritra Chatterjee", role: "FUND COORDINATOR", img: "/aritra.jpeg" },
  { name: "Rudrarup Dey", role: "MARKETING COORDINATOR", img: "/rudrarup.jpeg" },
  { name: "Rajdeep Mahato", role: "MARKETING COORDINATOR", img: "/rajdeep_mahato.jpeg" }
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('members');
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pastProgramsList, setPastProgramsList] = useState<any[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [futureProgramsList, setFutureProgramsList] = useState<any[]>([]);
  const [loadingFuture, setLoadingFuture] = useState(true);

  // Past & Future Program Form State
  const [showAddPastProgram, setShowAddPastProgram] = useState(false);
  const [showAddFutureProgram, setShowAddFutureProgram] = useState(false);
  
  // Program Edit States
  const [editingProgId, setEditingProgId] = useState<string | null>(null);
  const [editProgData, setEditProgData] = useState<any>({});
  const [pTitle, setPTitle] = useState('');
  const [pDate, setPDate] = useState('');
  const [pPlace, setPPlace] = useState('');
  const [pDetails, setPDetails] = useState('');
  const [_pImage, setPImage] = useState<File | null>(null);

  // Add Member State
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberMode, setAddMemberMode] = useState<'manual' | 'upload'>('manual');
  const [mName, setMName] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mId, setMId] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [parsedMembers, setParsedMembers] = useState<any[]>([]);
  
  // Edit Member State
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  
  // Certificate Request State
  const [certRequests, setCertRequests] = useState<any[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(true);

  // Payments Tab State
  const [paymentsList, setPaymentsList]       = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [payFilterMonth, setPayFilterMonth]   = useState(new Date().getMonth() + 1);
  const [payFilterYear, setPayFilterYear]     = useState(new Date().getFullYear());
  const [showManualPay, setShowManualPay]     = useState(false);
  const [mpName, setMpName]   = useState('');
  const [mpId, setMpId]       = useState('');
  const [mpAmount, setMpAmount] = useState(40);
  const [mpRef, setMpRef]     = useState('');
  const [mpDate, setMpDate]   = useState('');
  const [mpNotes, setMpNotes] = useState('');

  // Donation Tab State
  const [donationsList, setDonationsList]   = useState<any[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [donFilterMonth, setDonFilterMonth] = useState(new Date().getMonth() + 1);
  const [donFilterYear, setDonFilterYear]   = useState(new Date().getFullYear());

  // Service Request Tab State
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  
  const navigate = useNavigate();

  const fetchPayments = async (month: number, year: number) => {
    setLoadingPayments(true);
    try {
      const data = await paymentsApi.get(month, year);
      setPaymentsList(data);
    } catch (err) {
      console.error('fetchPayments error:', err);
    }
    setLoadingPayments(false);
  };

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = new Date(mpDate || Date.now());
    const genId = `AGRF-M${Date.now().toString(36).toUpperCase()}`;
    try {
      await paymentsApi.record({
        receipt_id: genId,
        member_id: mpId.trim(),
        full_name: mpName.trim(),
        amount: mpAmount,
        payment_method: 'manual',
        transaction_ref: mpRef.trim() || genId,
        payment_date: d.toISOString(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        notes: mpNotes.trim(),
      });
      alert('Manual payment entry saved!');
      setMpName(''); setMpId(''); setMpAmount(40); setMpRef(''); setMpDate(''); setMpNotes('');
      setShowManualPay(false);
      fetchPayments(payFilterMonth, payFilterYear);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const fetchDonations = async (month: number, year: number) => {
    setLoadingDonations(true);
    try {
      const data = await donationsApi.get(month, year);
      setDonationsList(data);
    } catch (err) {
      console.error('fetchDonations error:', err);
    }
    setLoadingDonations(false);
  };

  const fetchServiceRequests = async () => {
    setLoadingServices(true);
    try {
      const data = await servicesApi.getAll();
      setServiceRequests(data);
    } catch (err) {
      console.error('fetchServiceRequests error:', err);
    }
    setLoadingServices(false);
  };

  const updateRequestStatus = async (id: string, newStatus: string) => {
    try {
      await servicesApi.updateStatus(id, newStatus);
      fetchServiceRequests();
    } catch (err) {
      console.error('updateRequestStatus error:', err);
    }
  };

  const handleAddProgram = async (e: React.FormEvent, table: 'past_programs' | 'future_programs') => {
    e.preventDefault();
    
    let base64Image = '';
    if (_pImage) {
      base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(_pImage);
      });
    }

    const api = table === 'past_programs' ? pastProgramsApi : futureProgramsApi;
    try {
      const newProg = await api.add({
        title: pTitle, date: pDate, place: pPlace, details: pDetails, image_url: base64Image
      });
      if (table === 'past_programs') setPastProgramsList(prev => [newProg, ...prev]);
      else setFutureProgramsList(prev => [newProg, ...prev]);
      alert("Program details successfully saved to database!");
      table === 'past_programs' ? setShowAddPastProgram(false) : setShowAddFutureProgram(false);
      setPTitle(''); setPDate(''); setPPlace(''); setPDetails(''); setPImage(null);
    } catch (err: any) {
      alert(`Error saving program: ` + err.message);
    }
  };

  const handleDeleteProgram = async (id: string, title: string, table: 'past_programs' | 'future_programs') => {
    if (window.confirm(`Are you absolutely sure you want to delete the program: ${title}?`)) {
      const api = table === 'past_programs' ? pastProgramsApi : futureProgramsApi;
      try {
        await api.delete(id);
        if (table === 'past_programs') setPastProgramsList(prev => prev.filter(p => p.id !== id));
        else setFutureProgramsList(prev => prev.filter(p => p.id !== id));
      } catch (err: any) {
        alert("Failed to delete program: " + err.message);
      }
    }
  };

  const handleEditClickProgram = (prog: any) => {
    setEditingProgId(prog.id);
    setEditProgData({ title: prog.title, date: prog.date, place: prog.place, details: prog.details });
  };

  const handleSaveEditProgram = async (id: string, table: 'past_programs' | 'future_programs') => {
    const api = table === 'past_programs' ? pastProgramsApi : futureProgramsApi;
    try {
      await api.update(id, editProgData);
      if (table === 'past_programs') setPastProgramsList(prev => prev.map(p => p.id === id ? { ...p, ...editProgData } : p));
      else setFutureProgramsList(prev => prev.map(p => p.id === id ? { ...p, ...editProgData } : p));
      setEditingProgId(null);
    } catch (err: any) {
      alert("Failed to update program: " + err.message);
    }
  };

  const handleVerifyFile = async () => {
    if (!uploadedFile) return;
    setIsVerifying(true);
    
    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet) as any[];
      
      const membersToInsert = json.map((row) => {
        const getVal = (possibleKeywords: string[]) => {
          for (const key of Object.keys(row)) {
            const normalizedKey = key.replace(/[\s.-]+/g, '').toUpperCase();
            if (possibleKeywords.some(keyword => normalizedKey.includes(keyword.replace(/[\s.-]+/g, '').toUpperCase()))) {
              return row[key];
            }
          }
          return '';
        };

        const parsedId = getVal(['MEMBER']);
        const parsedName = getVal(['NAME']);
        const parsedEmail = getVal(['MAIL', 'EMAIL']);
        const parsedPhone = getVal(['PHONE', 'MOBILE', 'CONTACT']);

        const parsedDesignation = getVal(['POSITION', 'ROLE', 'DESIGNATION']);

        return {
          full_name: parsedName || 'Unknown',
          member_id: parsedId || `AGR-BLK-${Math.floor(Math.random() * 10000)}`,
          email: parsedEmail || 'N/A',
          phone: parsedPhone ? String(parsedPhone) : 'N/A',
          designation: parsedDesignation || 'Member',
          status: 'Active'
        };
      });
      
      setParsedMembers(membersToInsert);
      setIsVerified(true);
      alert(`Document scanned successfully! Extracted ${membersToInsert.length} valid member records.`);
    } catch (err) {
      alert("Error parsing file. Please ensure it is a valid Excel format.");
    }
    setIsVerifying(false);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addMemberMode === 'upload' && !isVerified) {
      alert("Please verify the uploaded document first!");
      return;
    }
    
    try {
      if (addMemberMode === 'manual') {
        const newMember = await membersApi.add({
          full_name: mName, member_id: mId, email: mEmail, phone: mPhone,
          designation: 'Member', status: 'Active'
        });
        setMembersList(prev => [newMember, ...prev]);
        alert(`Member ${mName} successfully added to database!`);
      } else {
        if (parsedMembers.length === 0) { alert("No valid members found to import."); return; }
        const imported = await membersApi.bulkImport(parsedMembers);
        setMembersList(prev => [...imported, ...prev]);
        alert(`Success! Imported ${imported.length} members to database.`);
      }
      setShowAddMember(false);
      setMName(''); setMEmail(''); setMPhone(''); setMId('');
      setUploadedFile(null); setIsVerified(false);
    } catch (err: any) {
      alert("Error saving member: " + err.message);
    }
  };

  const handleDeleteAllMembers = async () => {
    const confirmDelete = window.confirm("WARNING: Are you absolutely sure you want to delete ALL members? This action cannot be undone.");
    if (!confirmDelete) return;
    const doubleConfirm = window.prompt("Type 'DELETE ALL' to confirm:");
    if (doubleConfirm !== "DELETE ALL") { alert("Action cancelled."); return; }
    try {
      await membersApi.deleteAll();
      setMembersList([]);
      alert("All members have been successfully deleted from the database.");
    } catch (err: any) {
      alert("Failed to delete all members: " + err.message);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (window.confirm(`Are you absolutely sure you want to permanently delete member ${name}?`)) {
      try {
        await membersApi.delete(id);
        setMembersList(prev => prev.filter(m => m.id !== id));
      } catch (err: any) {
        alert("Failed to delete member: " + err.message);
      }
    }
  };

  const handleDismissMember = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to mark member ${name} as DISMISSED?`)) {
      try {
        await membersApi.dismiss(id);
        setMembersList(prev => prev.map(m => m.id === id ? { ...m, status: 'Dismissed' } : m));
      } catch (err: any) {
        alert("Failed to dismiss member: " + err.message);
      }
    }
  };

  const handleEditClick = (member: any) => {
    setEditingMemberId(member.id);
    setEditFormData({ full_name: member.full_name, email: member.email, phone: member.phone, member_id: member.member_id, designation: member.designation || 'Member' });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await membersApi.update(id, editFormData);
      setMembersList(prev => prev.map(m => m.id === id ? { ...m, ...editFormData } : m));
      setEditingMemberId(null);
    } catch (err: any) {
      alert("Failed to update member: " + err.message);
    }
  };

  useEffect(() => {
    const storedName = localStorage.getItem('adminName');
    const storedAdminId = localStorage.getItem('adminId');
    const storedMemberId = localStorage.getItem('memberId');
    
    if (storedName) {
      const found = TRUSTEES.find(t => t.name.toLowerCase().includes(storedName.toLowerCase()));
      if (found) {
        setAdminProfile({ ...found, adminId: storedAdminId, memberId: storedMemberId });
      } else {
        setAdminProfile({ name: storedName, role: "ADMINISTRATOR", img: "https://via.placeholder.com/150", adminId: storedAdminId, memberId: storedMemberId });
      }
    } else {
      setAdminProfile(TRUSTEES[0]); // Default fallback
    }

    const fetchMembersAndPrograms = () => {
      setLoading(true); setLoadingPrograms(true); setLoadingFuture(true); setLoadingCerts(true);
      
      membersApi.getAll()
        .then(m => { setMembersList(m); setLoading(false); })
        .catch(err => { console.error(err); setLoading(false); });
        
      pastProgramsApi.getAll()
        .then(p => { setPastProgramsList(p); setLoadingPrograms(false); })
        .catch(err => { console.error(err); setLoadingPrograms(false); });
        
      futureProgramsApi.getAll()
        .then(f => { setFutureProgramsList(f); setLoadingFuture(false); })
        .catch(err => { console.error(err); setLoadingFuture(false); });
        
      certificatesApi.getAll()
        .then(c => { setCertRequests(c); setLoadingCerts(false); })
        .catch(err => { console.error(err); setLoadingCerts(false); });
    };

    fetchMembersAndPrograms();
  }, []);

  const handleUpdateCertStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await certificatesApi.updateStatus(id, status);
      setCertRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
      alert(`Request ${status} successfully!`);
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: 'var(--primary-red)', fontFamily: 'Playfair Display', fontSize: '1.85rem', marginBottom: '1.5rem', whiteSpace: 'nowrap', letterSpacing: '-0.5px' }}>
          Admin Panel
        </h2>

        {adminProfile && (
          <div className="sidebar-profile">
            <div style={{ display: 'inline-block', padding: '2px', background: 'linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)', borderRadius: '50%', marginBottom: '0.75rem', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
              <img src={adminProfile.img} alt={adminProfile.name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid transparent', display: 'block' }} />
            </div>
            <h3>{adminProfile.name}</h3>
            <p>{adminProfile.role}</p>
            {adminProfile.adminId && adminProfile.memberId && (
              <div className="sidebar-profile-ids">
                <span>{adminProfile.adminId}</span>
                <span>{adminProfile.memberId}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="sidebar-menu">
          <button 
            className={`sidebar-link ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
            style={{ background: activeTab === 'members' ? 'var(--primary-red)' : 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <Users size={18} /> Member Management
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
            style={{ background: activeTab === 'past' ? 'var(--primary-red)' : 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <CalendarClock size={18} /> Past Programs
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'future' ? 'active' : ''}`}
            onClick={() => setActiveTab('future')}
            style={{ background: activeTab === 'future' ? 'var(--primary-red)' : 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <CalendarDays size={18} /> Future Programs
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'certificates' ? 'active' : ''}`}
            onClick={() => setActiveTab('certificates')}
            style={{ background: activeTab === 'certificates' ? 'var(--primary-red)' : 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <Award size={18} /> Certificate Requests
          </button>
          <button
            className={`sidebar-link ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => { setActiveTab('payments'); fetchPayments(payFilterMonth, payFilterYear); }}
            style={{ background: activeTab === 'payments' ? 'var(--primary-red)' : 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <Wallet size={18} /> Monthly Payments
          </button>
          <button
            className={`sidebar-link ${activeTab === 'donations' ? 'active' : ''}`}
            onClick={() => { setActiveTab('donations'); fetchDonations(donFilterMonth, donFilterYear); }}
            style={{ background: activeTab === 'donations' ? 'var(--primary-red)' : 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <Heart size={18} /> General Donations
          </button>
          <button
            className={`sidebar-link ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => { setActiveTab('services'); fetchServiceRequests(); }}
            style={{ background: activeTab === 'services' ? 'var(--primary-red)' : 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <Bell size={18} /> Service Requests
          </button>
        </div>
        
        <div className="sidebar-footer">
          <button 
            className="sidebar-link" 
            onClick={() => navigate('/')}
            style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', marginBottom: '0.5rem' }}
          >
            <Globe size={18} /> View Main Website
          </button>
          <button 
            className="sidebar-link" 
            onClick={() => {
              localStorage.removeItem('adminName');
              localStorage.removeItem('adminId');
              localStorage.removeItem('memberId');
              navigate('/admin/login');
            }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: 'var(--primary-red)' }}
          >
            <LogOut size={18} /> Logout Account
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {activeTab === 'members' && (
          <div>
            <div className="page-header">
              <h2>Member Management</h2>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {!showAddMember && (
                  <button className="btn btn-primary" onClick={() => setShowAddMember(true)}>+ Add New Member</button>
                )}
                {membersList.length > 0 && (
                  <button 
                    onClick={handleDeleteAllMembers}
                    style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', border: '1px solid rgba(255, 59, 48, 0.3)', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)'}
                  >
                    Delete All
                  </button>
                )}
              </div>
            </div>
            
            {showAddMember ? (
              <div className="glass-panel" style={{ animation: 'fadeIn 0.3s ease', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--primary-saffron)', margin: 0 }}>Add New Member</h3>
                  <button onClick={() => setShowAddMember(false)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>Cancel</button>
                </div>
                
                <div className="dash-mode-toggle" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                  <button type="button" onClick={() => setAddMemberMode('manual')} className={`btn ${addMemberMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }}>Manual Entry (Typing)</button>
                  <button type="button" onClick={() => setAddMemberMode('upload')} className={`btn ${addMemberMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }}>Bulk Upload (Excel / PDF)</button>
                </div>

                <form onSubmit={handleSaveMember} style={{ display: 'grid', gap: '1.5rem' }}>
                  {addMemberMode === 'manual' ? (
                    <>
                      <div className="dash-form-grid-2">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Full Name</label>
                          <input type="text" className="input-field" placeholder="E.g. John Doe" value={mName} onChange={(e) => setMName(e.target.value)} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Member ID</label>
                          <input type="text" className="input-field" placeholder="E.g. AGR-2026-005" value={mId} onChange={(e) => setMId(e.target.value)} required />
                        </div>
                      </div>
                      <div className="dash-form-grid-2">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Email Address</label>
                          <input type="email" className="input-field" placeholder="john@example.com" value={mEmail} onChange={(e) => setMEmail(e.target.value)} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Phone Number</label>
                          <input type="tel" className="input-field" placeholder="+91 9876543210" value={mPhone} onChange={(e) => setMPhone(e.target.value)} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '2.5rem', borderRadius: '12px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.1)' }}>
                      <label className="form-label" style={{ display: 'block', marginBottom: '1.5rem', fontSize: '1.1rem', color: '#fff' }}>Upload Member List (Excel .xlsx or PDF)</label>
                      <input type="file" accept=".xlsx, .xls, .pdf" onChange={(e) => { setUploadedFile(e.target.files?.[0] || null); setIsVerified(false); }} style={{ margin: '0 auto 1.5rem auto', display: 'block', color: 'var(--text-light)' }} required />
                      
                      {uploadedFile && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                          <button type="button" onClick={handleVerifyFile} className="btn btn-secondary" disabled={isVerifying || isVerified} style={{ background: isVerified ? 'var(--primary-green)' : '', borderColor: isVerified ? 'var(--primary-green)' : '', color: '#fff' }}>
                            {isVerifying ? 'Scanning & Parsing...' : isVerified ? '✓ Document Verified' : 'Verify Details'}
                          </button>
                          {isVerified && <p style={{ color: 'var(--primary-green)', fontSize: '0.9rem', fontWeight: 'bold' }}>Validation successful! Found and mapped members perfectly.</p>}
                        </div>
                      )}
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start', padding: '0.8rem 2rem', marginTop: '1rem' }}>
                    {addMemberMode === 'manual' ? 'Save Member' : 'Import Verified Members'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
              <div className="table-scroll"><table className="table">
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Designation</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading live data...</td></tr>
                  ) : membersList.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No members found in database.</td></tr>
                  ) : (
                    membersList.map((member, idx) => {
                      const isEditing = editingMemberId === member.id;
                      
                      return (
                      <tr key={idx}>
                        <td>
                          {isEditing ? <input type="text" className="input-field" style={{ padding: '0.3rem', fontSize: '0.85rem' }} value={editFormData.member_id} onChange={(e) => setEditFormData({...editFormData, member_id: e.target.value})} /> : member.member_id}
                        </td>
                        <td>
                          {isEditing ? <input type="text" className="input-field" style={{ padding: '0.3rem', fontSize: '0.85rem' }} value={editFormData.full_name} onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})} /> : member.full_name}
                        </td>
                        <td>
                          {isEditing ? <input type="email" className="input-field" style={{ padding: '0.3rem', fontSize: '0.85rem' }} value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} /> : member.email}
                        </td>
                        <td>
                          {isEditing ? <input type="text" className="input-field" style={{ padding: '0.3rem', fontSize: '0.85rem' }} value={editFormData.designation} onChange={(e) => setEditFormData({...editFormData, designation: e.target.value})} /> : (member.designation || 'Member')}
                        </td>
                        <td>
                          <span className={`badge ${member.status === 'Dismissed' ? 'badge-danger' : 'badge-success'}`}>
                            {member.status || 'Active'}
                          </span>
                        </td>
                        <td>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => handleSaveEdit(member.id)} style={{ background: 'var(--primary-green)', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Save</button>
                              <button onClick={() => setEditingMemberId(null)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                onClick={() => handleEditClick(member)}
                                style={{ background: 'rgba(255, 153, 51, 0.1)', color: '#FF9933', border: '1px solid rgba(255, 153, 51, 0.3)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                              >
                                Edit
                              </button>
                              {member.status !== 'Dismissed' && (
                                <button 
                                  onClick={() => handleDismissMember(member.id, member.full_name)}
                                  style={{ background: 'rgba(128, 128, 128, 0.1)', color: '#666', border: '1px solid rgba(128, 128, 128, 0.3)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                                >
                                  Dismiss
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteMember(member.id, member.full_name)}
                                style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', border: '1px solid rgba(255, 59, 48, 0.3)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table></div>
            </div>
            )}
          </div>
        )}

        {activeTab === 'past' && (
          <div>
            <div className="page-header">
              <h2>Past Programs</h2>
              {!showAddPastProgram && (
                <button className="btn btn-primary" onClick={() => setShowAddPastProgram(true)}>+ Add Past Program</button>
              )}
            </div>
            
            {showAddPastProgram ? (
              <div className="glass-panel" style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--primary-saffron)', margin: 0 }}>Add New Program</h3>
                  <button onClick={() => setShowAddPastProgram(false)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>Cancel</button>
                </div>
                <form onSubmit={(e) => handleAddProgram(e, 'past_programs')} style={{ display: 'grid', gap: '1.5rem' }}>
                  <div className="dash-form-grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Program Title</label>
                      <input type="text" className="input-field" placeholder="E.g. Clean Water Initiative" value={pTitle} onChange={(e) => setPTitle(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Date</label>
                      <input type="date" className="input-field" value={pDate} onChange={(e) => setPDate(e.target.value)} required />
                    </div>
                  </div>
                  
                  <div className="dash-form-grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Location / Place</label>
                      <input type="text" className="input-field" placeholder="E.g. Rural Bengal" value={pPlace} onChange={(e) => setPPlace(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Upload Image</label>
                      <input type="file" className="input-field" accept="image/*" onChange={(e) => setPImage(e.target.files?.[0] || null)} style={{ padding: '0.5rem' }} required />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Program Details</label>
                    <textarea className="input-field" placeholder="Describe the impact and details of the program..." rows={4} value={pDetails} onChange={(e) => setPDetails(e.target.value)} required style={{ resize: 'vertical' }}></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start', padding: '0.8rem 2rem' }}>Save Program</button>
                </form>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="table-scroll"><table className="table">
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                      <th>Title</th>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Details</th>
                      <th>Added On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPrograms ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading programs...</td></tr>
                    ) : pastProgramsList.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No past program data available in the database.</td></tr>
                    ) : (
                      pastProgramsList.map((prog, idx) => {
                        const isEditing = editingProgId === prog.id;
                        return (
                        <tr key={idx}>
                          <td>{isEditing ? <input type="text" className="input-field" style={{ padding: '0.3rem', fontSize: '0.85rem' }} value={editProgData.title} onChange={(e) => setEditProgData({...editProgData, title: e.target.value})} /> : <strong>{prog.title}</strong>}</td>
                          <td>{isEditing ? <input type="date" className="input-field" style={{ padding: '0.3rem', fontSize: '0.85rem' }} value={editProgData.date} onChange={(e) => setEditProgData({...editProgData, date: e.target.value})} /> : new Date(prog.date).toLocaleDateString()}</td>
                          <td>{isEditing ? <input type="text" className="input-field" style={{ padding: '0.3rem', fontSize: '0.85rem' }} value={editProgData.place} onChange={(e) => setEditProgData({...editProgData, place: e.target.value})} /> : prog.place}</td>
                          <td>{isEditing ? <input type="text" className="input-field" style={{ padding: '0.3rem', fontSize: '0.85rem' }} value={editProgData.details} onChange={(e) => setEditProgData({...editProgData, details: e.target.value})} /> : `${prog.details.substring(0, 40)}...`}</td>
                          <td>{new Date(prog.created_at).toLocaleDateString()}</td>
                          <td>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleSaveEditProgram(prog.id, 'past_programs')} style={{ background: 'var(--primary-green)', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Save</button>
                                <button onClick={() => setEditingProgId(null)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleEditClickProgram(prog)} style={{ background: 'rgba(255, 153, 51, 0.1)', color: '#FF9933', border: '1px solid rgba(255, 153, 51, 0.3)', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.2s' }}>Edit</button>
                                <button onClick={() => handleDeleteProgram(prog.id, prog.title, 'past_programs')} style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', border: '1px solid rgba(255, 59, 48, 0.3)', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.2)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)'}>Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )})
                    )}
                  </tbody>
                </table></div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'future' && (
          <div>
            <div className="page-header">
              <h2>Future Programs</h2>
              {!showAddFutureProgram && (
                <button className="btn btn-primary" onClick={() => setShowAddFutureProgram(true)}>+ Draft New Program</button>
              )}
            </div>
            
            {showAddFutureProgram ? (
              <div className="glass-panel" style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--primary-saffron)', margin: 0 }}>Draft Future Program</h3>
                  <button onClick={() => setShowAddFutureProgram(false)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>Cancel</button>
                </div>
                <form onSubmit={(e) => handleAddProgram(e, 'future_programs')} style={{ display: 'grid', gap: '1.5rem' }}>
                  <div className="dash-form-grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Program Title</label>
                      <input type="text" className="input-field" placeholder="E.g. Peace Foundations Workshop" value={pTitle} onChange={(e) => setPTitle(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Target Date</label>
                      <input type="date" className="input-field" value={pDate} onChange={(e) => setPDate(e.target.value)} required />
                    </div>
                  </div>
                  
                  <div className="dash-form-grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Location / Target Area</label>
                      <input type="text" className="input-field" placeholder="E.g. Urban Centers" value={pPlace} onChange={(e) => setPPlace(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Upload Promotional Image</label>
                      <input type="file" className="input-field" accept="image/*" onChange={(e) => setPImage(e.target.files?.[0] || null)} style={{ padding: '0.5rem' }} required />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Program Vision & Details</label>
                    <textarea className="input-field" placeholder="Describe the goals and vision of this future initiative..." rows={4} value={pDetails} onChange={(e) => setPDetails(e.target.value)} required style={{ resize: 'vertical' }}></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start', padding: '0.8rem 2rem' }}>Save Draft Program</button>
                </form>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="table-scroll"><table className="table">
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                      <th>Title</th>
                      <th>Target Date</th>
                      <th>Location</th>
                      <th>Details</th>
                      <th>Drafted On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingFuture ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading programs...</td></tr>
                    ) : futureProgramsList.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No future programs scheduled yet.</td></tr>
                    ) : (
                      futureProgramsList.map((prog, idx) => {
                        const isEditing = editingProgId === prog.id;
                        return (
                        <tr key={idx}>
                          <td>{isEditing ? <input type="text" className="input-field" style={{ padding: '0.3rem', fontSize: '0.85rem' }} value={editProgData.title} onChange={(e) => setEditProgData({...editProgData, title: e.target.value})} /> : <strong>{prog.title}</strong>}</td>
                          <td>{isEditing ? <input type="date" className="input-field" style={{ padding: '0.3rem', fontSize: '0.85rem' }} value={editProgData.date} onChange={(e) => setEditProgData({...editProgData, date: e.target.value})} /> : new Date(prog.date).toLocaleDateString()}</td>
                          <td>{isEditing ? <input type="text" className="input-field" style={{ padding: '0.3rem', fontSize: '0.85rem' }} value={editProgData.place} onChange={(e) => setEditProgData({...editProgData, place: e.target.value})} /> : prog.place}</td>
                          <td>{isEditing ? <input type="text" className="input-field" style={{ padding: '0.3rem', fontSize: '0.85rem' }} value={editProgData.details} onChange={(e) => setEditProgData({...editProgData, details: e.target.value})} /> : `${prog.details.substring(0, 40)}...`}</td>
                          <td>{new Date(prog.created_at).toLocaleDateString()}</td>
                          <td>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleSaveEditProgram(prog.id, 'future_programs')} style={{ background: 'var(--primary-green)', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Save</button>
                                <button onClick={() => setEditingProgId(null)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleEditClickProgram(prog)} style={{ background: 'rgba(255, 153, 51, 0.1)', color: '#FF9933', border: '1px solid rgba(255, 153, 51, 0.3)', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.2s' }}>Edit</button>
                                <button onClick={() => handleDeleteProgram(prog.id, prog.title, 'future_programs')} style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', border: '1px solid rgba(255, 59, 48, 0.3)', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.2)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)'}>Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )})
                    )}
                  </tbody>
                </table></div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'certificates' && (
          <div>
            <div className="page-header">
              <div>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--text-dark)', marginBottom: '0.3rem' }}>Certificate Requests</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Manage and issue official appreciation certificates to members.</p>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '0' }}>
              <div className="table-scroll"><table className="table">
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th>Requested On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCerts ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading requests...</td></tr>
                  ) : certRequests.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No certificate requests found.</td></tr>
                  ) : (
                    certRequests.map((req, idx) => (
                      <tr key={idx}>
                        <td><strong>{req.member_id}</strong></td>
                        <td>{req.full_name}</td>
                        <td>{req.email}</td>
                        <td>{req.year}</td>
                        <td>
                          <span className={`badge ${req.status === 'approved' ? 'badge-success' : req.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                            {req.status.toUpperCase()}
                          </span>
                        </td>
                        <td>{new Date(req.created_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {req.status === 'pending' && (
                              <>
                                <button onClick={() => handleUpdateCertStatus(req.id, 'approved')} style={{ background: 'rgba(30, 142, 62, 0.1)', color: '#1e8e3e', border: '1px solid rgba(30, 142, 62, 0.3)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Approve</button>
                                <button onClick={() => handleUpdateCertStatus(req.id, 'rejected')} style={{ background: 'rgba(217, 48, 37, 0.1)', color: '#d93025', border: '1px solid rgba(217, 48, 37, 0.3)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Reject</button>
                              </>
                            )}
                            {req.status === 'approved' && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => generateCertificate(req)} style={{ background: 'var(--primary-red)', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <Download size={14} /> Download PDF
                                </button>
                                <button onClick={() => sendCertificateEmail(req)} style={{ background: 'rgba(19, 136, 8, 0.1)', color: '#138808', border: '1px solid rgba(19, 136, 8, 0.3)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <Send size={14} /> Send Email
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table></div>
            </div>
          </div>
        )}

        {/* ── Monthly Payments Tab ── */}
        {activeTab === 'payments' && (
          <div>
            <div className="page-header">
              <div>
                <h2>Monthly Payments</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>View and manage member payments by month.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowManualPay(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={16} /> {showManualPay ? 'Cancel' : 'Add Manual Entry'}
              </button>
            </div>

            {/* Manual entry form */}
            {showManualPay && (
              <div className="glass-panel" style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
                <h3 style={{ color: 'var(--primary-saffron)', marginBottom: '1.25rem' }}>Manual Payment Entry</h3>
                <form onSubmit={handleManualPayment} style={{ display: 'grid', gap: '1rem' }}>
                  <div className="dash-form-grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Member Name</label>
                      <input type="text" className="input-field" placeholder="Full Name" value={mpName} onChange={e => setMpName(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Member ID</label>
                      <input type="text" className="input-field" placeholder="aF2023-xx" value={mpId} onChange={e => setMpId(e.target.value)} required />
                    </div>
                  </div>
                  <div className="dash-form-grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Amount (₹)</label>
                      <input type="number" className="input-field" min={1} value={mpAmount} onChange={e => setMpAmount(Number(e.target.value))} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Payment Date</label>
                      <input type="date" className="input-field" value={mpDate} onChange={e => setMpDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="dash-form-grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Reference / UTR (optional)</label>
                      <input type="text" className="input-field" placeholder="Transaction ref" value={mpRef} onChange={e => setMpRef(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Notes (optional)</label>
                      <input type="text" className="input-field" placeholder="e.g. Cash payment" value={mpNotes} onChange={e => setMpNotes(e.target.value)} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start' }}>Save Entry</button>
                </form>
              </div>
            )}

            {/* Filter controls */}
            <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Month:</label>
                <select className="input-field" style={{ padding: '0.4rem 0.75rem', width: 'auto' }} value={payFilterMonth} onChange={e => setPayFilterMonth(Number(e.target.value))}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => (
                    <option key={i} value={i+1}>{m}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Year:</label>
                <select className="input-field" style={{ padding: '0.4rem 0.75rem', width: 'auto' }} value={payFilterYear} onChange={e => setPayFilterYear(Number(e.target.value))}>
                  {[2023,2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button className="btn btn-secondary" onClick={() => fetchPayments(payFilterMonth, payFilterYear)} style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}>
                {loadingPayments ? 'Loading...' : 'Fetch'}
              </button>
              {/* Total card */}
              {paymentsList.length > 0 && (
                <div style={{ marginLeft: 'auto', background: 'rgba(43,97,66,0.08)', border: '1px solid rgba(43,97,66,0.25)', borderRadius: '12px', padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IndianRupee size={16} color="var(--primary-green)" />
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-green)' }}>
                    {paymentsList.reduce((s, p) => s + Number(p.amount), 0).toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>total · {paymentsList.length} payments</span>
                </div>
              )}
            </div>

            {/* Payments table */}
            <div className="glass-panel" style={{ padding: 0 }}>
              <div className="table-scroll"><table className="table">
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <th>Receipt ID</th><th>Member ID</th><th>Name</th>
                    <th>Amount (₹)</th><th>Method</th><th>Txn Ref</th>
                    <th>Date</th><th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPayments ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
                  ) : paymentsList.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No payments found for this period.</td></tr>
                  ) : paymentsList.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{p.receipt_id}</td>
                      <td><strong>{p.member_id}</strong></td>
                      <td>{p.full_name}</td>
                      <td><strong style={{ color: 'var(--primary-green)' }}>₹{Number(p.amount).toLocaleString('en-IN')}</strong></td>
                      <td><span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, background: p.payment_method === 'upi' ? 'rgba(43,97,66,0.1)' : p.payment_method === 'manual' ? 'rgba(255,153,51,0.1)' : 'rgba(100,100,200,0.1)', color: p.payment_method === 'upi' ? 'var(--primary-green)' : p.payment_method === 'manual' ? '#c47a00' : '#5050c0', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{p.payment_method}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{p.transaction_ref}</td>
                      <td>{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </div>
        )}

        {/* ── General Donations Tab ── */}
        {activeTab === 'donations' && (
          <div>
            <div className="page-header">
              <div>
                <h2>General Donations</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Track all public donations received via the website.</p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Month:</label>
                <select className="input-field" style={{ padding: '0.4rem 0.75rem', width: 'auto' }} value={donFilterMonth} onChange={e => setDonFilterMonth(Number(e.target.value))}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => (
                    <option key={i} value={i+1}>{m}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Year:</label>
                <select className="input-field" style={{ padding: '0.4rem 0.75rem', width: 'auto' }} value={donFilterYear} onChange={e => setDonFilterYear(Number(e.target.value))}>
                  {[2023,2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button className="btn btn-secondary" onClick={() => fetchDonations(donFilterMonth, donFilterYear)} style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}>
                {loadingDonations ? 'Loading...' : 'Fetch'}
              </button>
              
              {donationsList.length > 0 && (
                <div style={{ marginLeft: 'auto', background: 'rgba(217,79,56,0.08)', border: '1px solid rgba(217,79,56,0.25)', borderRadius: '12px', padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Heart size={16} color="var(--primary-red)" />
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-red)' }}>
                    ₹{donationsList.reduce((s, p) => s + Number(p.amount), 0).toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>total · {donationsList.length} donations</span>
                </div>
              )}
            </div>

            {/* Donations table */}
            <div className="glass-panel" style={{ padding: 0 }}>
              <div className="table-scroll"><table className="table">
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <th>Receipt ID</th><th>Donor Name</th><th>Email</th>
                    <th>Amount (₹)</th><th>Txn ID</th><th>Date</th><th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDonations ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
                  ) : donationsList.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No donations found for this period.</td></tr>
                  ) : donationsList.map((d, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{d.receipt_id}</td>
                      <td><strong>{d.full_name}</strong></td>
                      <td style={{ fontSize: '0.82rem' }}>{d.email}</td>
                      <td><strong style={{ color: 'var(--primary-green)' }}>₹{Number(d.amount).toLocaleString('en-IN')}</strong></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{d.transaction_id}</td>
                      <td>{new Date(d.donation_date).toLocaleDateString('en-IN')}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-light)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.message}>
                        {d.message || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </div>
        )}

        {/* ── Service Requests Tab ── */}
        {activeTab === 'services' && (
          <div>
            <div className="page-header">
              <div>
                <h2>Service Requests</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Blood donation, blood requests, and organ donation pledges.</p>
              </div>
              <button className="btn btn-secondary" onClick={fetchServiceRequests}>
                Refresh List
              </button>
            </div>

            <div className="glass-panel" style={{ padding: 0 }}>
              <div className="table-scroll"><table className="table">
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <th>Type</th><th>Full Name</th><th>Contact Info</th><th>Details</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingServices ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
                  ) : serviceRequests.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No service requests found.</td></tr>
                  ) : serviceRequests.map((req, i) => (
                    <tr key={i}>
                      <td>
                        <span style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                          background: req.type === 'blood_donate' ? 'rgba(217,79,56,0.1)' : req.type === 'blood_request' ? 'rgba(19,136,8,0.1)' : 'rgba(0,119,182,0.1)',
                          color: req.type === 'blood_donate' ? 'var(--primary-red)' : req.type === 'blood_request' ? 'var(--primary-green)' : '#0077b6'
                        }}>
                          {req.type === 'blood_donate' ? <Droplet size={12} /> : req.type === 'blood_request' ? <Search size={12} /> : <Activity size={12} />}
                          {req.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <strong>{req.full_name}</strong>
                        {req.blood_group && <div style={{ fontSize: '0.75rem', color: 'var(--primary-red)', fontWeight: 800 }}>Group: {req.blood_group}</div>}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        <div>{req.phone}</div>
                        <div style={{ color: 'var(--text-light)' }}>{req.email || '—'}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.details}>
                          {req.details || 'No details provided'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{new Date(req.created_at).toLocaleString()}</div>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '10px',
                          background: req.status === 'Pending' ? 'rgba(255,165,0,0.1)' : 'rgba(43,97,66,0.1)',
                          color: req.status === 'Pending' ? '#cc8400' : 'var(--primary-green)'
                        }}>{req.status}</span>
                      </td>
                      <td>
                        <select 
                          style={{ fontSize: '0.75rem', padding: '0.2rem', borderRadius: '4px', border: '1px solid #ddd' }}
                          value={req.status}
                          onChange={(e) => updateRequestStatus(req.id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const generateCertificateDoc = (req: any) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  return new Promise<jsPDF>((resolve) => {
    const img = new Image();
    img.src = '/certificate_blank.png';
    
    img.onload = () => {
      doc.addImage(img, 'PNG', 0, 0, 297, 210);
      doc.setTextColor(60, 80, 60); 
      doc.setFont("times", "italic");
      doc.setFontSize(48);
      doc.text(req.full_name, 148.5, 118, { align: 'center' });

      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      doc.setFont("times", "normal");
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(today, 66, 166, { align: 'center' });
      resolve(doc);
    };
  });
};

const generateCertificate = async (req: any) => {
  const doc = await generateCertificateDoc(req);
  doc.save(`Agradut_Certificate_${req.full_name.replace(/\s+/g, '_')}.pdf`);
};

const sendCertificateEmail = async (req: any) => {
  try {
    const confirmSend = confirm(`Are you sure you want to send the official certificate to ${req.email}?`);
    if (!confirmSend) return;

    // 1. Generate PDF
    const doc = await generateCertificateDoc(req);

    // 2. Download directly to admin's machine (no cloud storage needed)
    const fileName = `Certificate_${req.member_id}_${req.year}.pdf`;
    doc.save(fileName);

    // 3. Send Email via EmailJS (attach a note to send manually, or use base64)
    const pdfBase64 = doc.output('datauristring');

    const templateParams = {
      to_name: req.full_name,
      to_email: req.email,
      certificate_link: pdfBase64,  // EmailJS template can embed this or just show a note
      year: req.year,
      member_id: req.member_id
    };

    // REPLACE THESE WITH YOUR REAL KEYS FROM EMAILJS DASHBOARD
    const SERVICE_ID = 'YOUR_SERVICE_ID';
    const TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
    const PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

    if (SERVICE_ID === 'YOUR_SERVICE_ID') {
      alert(`✅ Certificate downloaded as "${fileName}".\n\nTo email it, please set up your EmailJS keys in AdminDashboard.tsx and attach the downloaded PDF manually.`);
      return;
    }

    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    alert(`Official certificate downloaded and email sent to ${req.email} successfully!`);
  } catch (error: any) {
    console.error('Certificate send error:', error);
    alert('Error in process: ' + error.message);
  }
};

export default AdminDashboard;
