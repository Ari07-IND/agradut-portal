import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, ArrowRight, Mail, Phone, Camera, Droplet, Activity } from 'lucide-react';
import { pastProgramsApi } from '../lib/api';

const Facebook = ({ size = 24 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
const Twitter = ({ size = 24 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>;
const Instagram = ({ size = 24 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
const Youtube = ({ size = 24 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>;
const Linkedin = ({ size = 24 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>;

const slogans = [
  "Come to Lend a Helping Hand",
  "Fostering Harmony Through Support",
  "Empowering Vulnerable Communities",
  "Driving Measurable Global Change"
];

const Home = () => {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [missions, _setMissions] = useState<any[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const fetchProgramsForGallery = async () => {
      try {
        const data = await pastProgramsApi.getAll();
        const mappedGalleryData = data.map((prog: any) => ({
          id: prog.id,
          title: prog.title,
          text: prog.details && prog.details.length > 120 ? prog.details.substring(0, 120) + '...' : (prog.details || ''),
          date: new Date(prog.date).toLocaleDateString(),
          image: prog.image_url || `https://picsum.photos/seed/${prog.id}/800/600`
        }));
        setGallery(mappedGalleryData);
      } catch (err) {
        // Gallery will just stay empty if backend isn't running yet
        console.warn('Could not load gallery:', err);
      }
    };
    fetchProgramsForGallery();
  }, []);

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % slogans.length;
      const fullText = slogans[i];

      setText(isDeleting 
        ? fullText.substring(0, text.length - 1) 
        : fullText.substring(0, text.length + 1)
      );

      setTypingSpeed(isDeleting ? 40 : 100);

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 2500); // Pause at end of word
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(500); // Pause before starting new word
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed]);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero app-container">
        <div className="hero-tag">
          <ShieldCheck size={16} /> COMMITTED TO GLOBAL PEACE
        </div>
        <h1 className="hero-title type-wrap">
          <span>{text}</span><span className="cursor"></span>
        </h1>
        <p className="hero-desc">
          Agradut Foundation serves as a beacon of stability for vulnerable communities, providing essential resources and institutional advocacy for a more transparent world.
        </p>
        <div className="hero-buttons" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/donate" className="btn btn-primary" style={{ boxShadow: '0 4px 15px rgba(217, 79, 56, 0.4)' }}>Temporary Donation</Link>
          <Link to="/contact" className="btn btn-green">Become a Volunteer</Link>
          <Link to="/service-request?type=blood_donate" className="btn btn-blood-donate">
            <Droplet size={18} /> Donate Blood
          </Link>
          <Link to="/service-request?type=blood_request" className="btn btn-blood-request">
            <Activity size={18} /> Need Blood
          </Link>
          <Link to="/service-request?type=organ_donate" className="btn btn-organ-donor">
            <Heart size={18} /> Organ Donor
          </Link>
        </div>
      </section>

      {/* Programs & Gallery Section */}
      <section className="section app-container" style={{ paddingBottom: '2rem' }}>
        <div className="grid-2">
          {/* Our Mission */}
          <div className="tricolour-glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <h2 className="section-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Our Missions</h2>
            <p className="section-subtitle" style={{ marginBottom: '2rem' }}>Key initiatives and programs driven by Agradut Foundation.</p>
            <button onClick={() => setShowMissions(true)} className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>
              View Our Missions
            </button>
          </div>

          {/* Our Gallery */}
          <div className="tricolour-glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <h2 className="section-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Our Gallery</h2>
            <p className="section-subtitle" style={{ marginBottom: '2rem' }}>Moments and memories captured during our foundation's journey.</p>
            <button 
              onClick={() => setShowGallery(true)} 
              className="btn" 
              style={{ 
                padding: '0.8rem 2rem', 
                fontSize: '1.1rem', 
                backgroundColor: 'var(--primary-green)', 
                color: 'white',
                boxShadow: '0 4px 15px rgba(19, 136, 8, 0.4)'
              }}>
              View Our Gallery
            </button>
          </div>
        </div>

        {/* Missions Modal */}
        {showMissions && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="glass-panel" style={{ backgroundColor: 'white', width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '3rem 2rem' }}>
              <button onClick={() => setShowMissions(false)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: 'var(--text-light)', lineHeight: 1 }}>&times;</button>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: 'var(--text-dark)', textAlign: 'center', fontFamily: "'Playfair Display', serif" }}>Our Missions</h2>
              {missions.length > 0 ? (
                <div className="grid-3" style={{ textAlign: 'left' }}>
                  {missions.map((mission: any) => (
                    <div key={mission.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', height: '200px', overflow: 'hidden', background: '#f8f9fa' }}>
                        <img src={mission.image} alt={mission.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--primary-red)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>{mission.date}</div>
                      </div>
                      <div style={{ padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>{mission.title}</h3>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', margin: 0 }}>{mission.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                  <div style={{ display: 'inline-block', padding: '1.5rem', borderRadius: '50%', background: 'rgba(217, 79, 56, 0.1)', marginBottom: '1.5rem' }}><ShieldCheck size={64} color="var(--primary-red)" /></div>
                  <h3 style={{ fontSize: '2.5rem', color: 'var(--text-dark)', marginBottom: '1rem', fontFamily: "'Playfair Display', serif" }}>Coming Soon</h3>
                  <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Our foundation is actively documenting our initiatives. The detailed mission logs will appear here very soon!</p>
                  <button onClick={() => setShowMissions(false)} className="btn btn-secondary" style={{ marginTop: '2.5rem' }}>Close Window</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gallery Modal */}
        {showGallery && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="glass-panel" style={{ backgroundColor: 'white', width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '3rem 2rem' }}>
              <button onClick={() => setShowGallery(false)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: 'var(--text-light)', lineHeight: 1 }}>&times;</button>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: 'var(--text-dark)', textAlign: 'center', fontFamily: "'Playfair Display', serif" }}>Our Gallery</h2>
              {gallery.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', textAlign: 'left' }}>
                  {gallery.map((item: any) => (
                    <div key={item.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ position: 'relative', height: '380px', overflow: 'hidden', background: '#f8f9fa' }}>
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="gallery-img" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} 
                        />
                        <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--primary-red)', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{item.date}</div>
                      </div>
                      <div style={{ padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>{item.title}</h3>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', margin: 0 }}>{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                  <div style={{ display: 'inline-block', padding: '1.5rem', borderRadius: '50%', background: 'rgba(217, 79, 56, 0.1)', marginBottom: '1.5rem' }}><Camera size={64} color="var(--primary-red)" /></div>
                  <h3 style={{ fontSize: '2.5rem', color: 'var(--text-dark)', marginBottom: '1rem', fontFamily: "'Playfair Display', serif" }}>Coming Soon</h3>
                  <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>We are currently curating our photo gallery. Beautiful memories from our initiatives will appear here very soon!</p>
                  <button onClick={() => setShowGallery(false)} className="btn btn-secondary" style={{ marginTop: '2.5rem' }}>Close Window</button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Social Media Section */}
      <section className="section app-container" style={{ textAlign: 'center', paddingBottom: '0' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--text-dark)' }}>Contact & Connect</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <a href="mailto:agradutkolkata@gmail.com" className="social-icon" aria-label="Email"><Mail size={26} /></a>
          <a href="tel:+919433645604" className="social-icon" aria-label="Phone"><Phone size={26} /></a>
          <a href="#" className="social-icon" aria-label="Facebook"><Facebook size={26} /></a>
          <a href="#" className="social-icon" aria-label="Twitter"><Twitter size={26} /></a>
          <a href="#" className="social-icon" aria-label="Instagram"><Instagram size={26} /></a>
          <a href="#" className="social-icon" aria-label="Youtube"><Youtube size={26} /></a>
          <a href="#" className="social-icon" aria-label="LinkedIn"><Linkedin size={26} /></a>
        </div>
      </section>

      {/* Admin Showcasing */}
      <section className="section app-container" style={{ display: 'block' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="pdf-trustee-title" style={{ color: '#4a332a', fontSize: '3.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px', margin: 0 }}>Our Trustees</h2>
        </div>
        
        <div className="horizontal-scroll-wrapper" style={{ overflow: 'hidden', position: 'relative', padding: '1rem 0', margin: '0 -1rem' }}>
          <div className="horizontal-scroll-track" style={{ display: 'flex', gap: '2rem', width: 'max-content' }}>
            {[1, 2].map((set) => (
              <div key={set} style={{ display: 'flex', gap: '2rem' }}>
                {[
                  { name: "Rajdeep Bagh", role: "FOUNDER & PRESIDENT", img: "/rajdeepbagh.jpeg" },
                  { name: "Satwik Mukherjee", role: "VICE PRESIDENT", img: "/satwik.jpeg" },
                  { name: "Dipanjan Ganguly", role: "SECRETARY", img: "/dipanjan.jpeg" },
                  { name: "Dripta Chakraborty", role: "CO - SECRETARY", img: "/dripta.jpeg" },
                  { name: "Anindita Mondal", role: "PROJECT COORDINATOR", img: "/Anindita.jpeg" },
                  { name: "Rangan Paul", role: "CASHIER", img: "/rangan.jpeg" },
                  { name: "Aritra Chatterjee", role: "FUND COORDINATOR", img: "/aritra.jpeg" },
                  { name: "Rudrarup Dey", role: "MARKETING COORDINATOR", img: "/rudrarup.jpeg" },
                  { name: "Rajdeep Mahato", role: "MARKETING COORDINATOR", img: "/rajdeep_mahato.jpeg" }
                ].map((admin, idx) => (
                  <div key={`${set}-${idx}`} className="admin-card-full" style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', flexShrink: 0, width: '260px', backgroundColor: 'rgba(255, 255, 255, 0.4)', boxShadow: '0 15px 35px rgba(0,0,0,0.15)', transition: 'transform 0.3s ease' }}>
                    <img src={admin.img} alt={admin.name} style={{ width: '100%', height: 'auto', display: 'block', transition: 'transform 0.5s ease' }} className="admin-img-full" />
                    <div className="admin-overlay" style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '0.8rem', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                      <h3 style={{ fontSize: '1.05rem', marginBottom: '0.1rem', color: 'var(--text-dark)' }}>{admin.name}</h3>
                      <p style={{ color: 'var(--primary-red)', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.5px', margin: 0 }}>{admin.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Volunteers Section */}
      <section className="section app-container" style={{ display: 'block', paddingTop: '0' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="pdf-trustee-title" style={{ color: '#4a332a', fontSize: '3rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px', margin: 0 }}>Our Volunteers</h2>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          {[
            { name: "Dhruv Kumar Singh", role: "VOLUNTEER", img: "/Dhruv Kumar Singh.jpeg" },
            { name: "Utparna Paul", role: "VOLUNTEER", img: "/utparna paul.jpeg" },
            { name: "Rupam Singh", role: "VOLUNTEER", img: "/Rupam Singh.jpeg" }
          ].map((volunteer, idx) => (
            <div key={idx} className="admin-card-full" style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', flexShrink: 0, width: '260px', backgroundColor: 'rgba(255, 255, 255, 0.4)', boxShadow: '0 15px 35px rgba(0,0,0,0.15)', transition: 'transform 0.3s ease' }}>
              <img src={volunteer.img} alt={volunteer.name} style={{ width: '100%', height: 'auto', display: 'block', transition: 'transform 0.5s ease' }} className="admin-img-full" />
              <div className="admin-overlay" style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '0.8rem', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.1rem', color: 'var(--text-dark)' }}>{volunteer.name}</h3>
                <p style={{ color: 'var(--primary-red)', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.5px', margin: 0 }}>{volunteer.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Temporary Donation Section */}
      <section className="section app-container">
        <div className="glass-panel" style={{ background: 'var(--primary-green)', color: 'white' }}>
          <div className="grid-2" style={{ alignItems: 'center' }}>
            <div>
              <h2 className="section-title" style={{ color: 'white', marginBottom: '1rem' }}>Urgent Relief Fund</h2>
              <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
                Support our temporary donation drive for immediate community relief. Your contribution ensures we can respond swiftly to crises and urgent societal needs.
              </p>
              <Link to="/donate" className="btn btn-primary" style={{ background: 'white', color: 'var(--primary-green)' }}>
                Donate Now <Heart size={18} />
              </Link>
            </div>
            <div className="donation-stats">
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>₹3,50,000+</div>
              <p style={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.85rem' }}>Raised for Current Initiative</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="section app-container" style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '4rem' }}>
          <h3 style={{ 
            fontSize: '1.8rem', 
            textTransform: 'uppercase', 
            letterSpacing: '8px',
            fontWeight: '900',
            margin: 0,
            background: 'linear-gradient(180deg, #4A332A 0%, #1a1a1a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
            textShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            Our Trusted Partners
          </h3>
          <div style={{ 
            width: '60px', 
            height: '2px', 
            margin: '0.8rem auto 0',
            background: 'linear-gradient(90deg, #FF9933, #138808)',
            borderRadius: '1px',
            opacity: 0.5
          }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="partner-card-special" style={{ 
            position: 'relative', 
            borderRadius: '16px', 
            overflow: 'hidden', 
            width: '220px', 
            height: '220px',
            backgroundColor: '#fff', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
            transition: 'all 0.4s ease',
            margin: '0 auto',
            border: '2px solid rgba(217, 79, 56, 0.2)', // Subtle red tint border
          }}>
            {/* Animated Glow Border */}
            <div style={{
              position: 'absolute',
              inset: 0,
              padding: '2px',
              background: 'linear-gradient(45deg, var(--primary-red), #FFD700, var(--primary-green))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              opacity: 0.6,
              borderRadius: '16px',
              pointerEvents: 'none'
            }}></div>

            {/* Social Icons Overlay */}
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              display: 'flex',
              gap: '8px',
              zIndex: 30
            }}>
              <a href="https://www.instagram.com/_kolkata_captured?igsh=eTBpbnpoYmJjZmY2" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '50%', display: 'flex', backdropFilter: 'blur(4px)' }}><Instagram size={14} /></a>
            </div>

            <img 
              src="/kolkata captured.png" 
              alt="Kolkata Captured" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                display: 'block'
              }} 
            />
            <div className="admin-overlay" style={{ 
              position: 'absolute', 
              bottom: '6px', 
              left: '6px', 
              right: '6px', 
              background: 'rgba(255, 255, 255, 0.2)', 
              backdropFilter: 'blur(20px) saturate(180%)', 
              WebkitBackdropFilter: 'blur(20px) saturate(180%)', 
              padding: '0.4rem', 
              borderRadius: '8px', 
              textAlign: 'center', 
              border: '1px solid rgba(255, 255, 255, 0.4)', 
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' 
            }}>
              <div style={{ 
                fontFamily: "'Playfair Display', serif", 
                fontSize: '0.85rem', 
                fontWeight: '900', 
                color: '#1a1a1a',
                letterSpacing: '0.5px',
                lineHeight: '1'
              }}>
                কলকাতা CAPTURED
              </div>
              <p style={{ 
                color: 'var(--primary-red)', 
                fontSize: '0.5rem', 
                fontWeight: 'bold', 
                letterSpacing: '0.5px', 
                margin: '2px 0 0',
                textTransform: 'uppercase'
              }}>OFFICIAL PHOTOGRAPHIC PARTNER</p>
            </div>
          </div>

          <div className="partner-card-special" style={{ 
            position: 'relative', 
            borderRadius: '16px', 
            overflow: 'hidden', 
            width: '220px', 
            height: '220px',
            backgroundColor: '#000', // Black background for visibility
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
            transition: 'all 0.4s ease',
            margin: '0 auto',
            border: '2px solid rgba(217, 79, 56, 0.2)', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2.2rem'
          }}>
            {/* Animated Glow Border */}
            <div style={{
              position: 'absolute',
              inset: 0,
              padding: '2px',
              background: 'linear-gradient(45deg, var(--primary-red), #FFD700, var(--primary-green))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              opacity: 0.6,
              borderRadius: '16px',
              pointerEvents: 'none'
            }}></div>

            {/* Social Icons Overlay */}
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              display: 'flex',
              gap: '8px',
              zIndex: 30
            }}>
              <a href="https://www.instagram.com/aestix.visions?igsh=enA3bXJiMGxodjdt" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '50%', display: 'flex', backdropFilter: 'blur(4px)' }}><Instagram size={14} /></a>
              <a href="#" style={{ color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '50%', display: 'flex', backdropFilter: 'blur(4px)' }}><Linkedin size={14} /></a>
            </div>

            <img 
              src="/aestix.jpeg" 
              alt="AESTIX VISIONS & TECHNOLOGY" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain', 
                display: 'block',
                transform: 'translateY(-10px)' // Shifted up
              }} 
            />
            <div className="admin-overlay" style={{ 
              position: 'absolute', 
              bottom: '6px', 
              left: '6px', 
              right: '6px', 
              background: 'rgba(255, 255, 255, 0.2)', 
              backdropFilter: 'blur(20px) saturate(180%)', 
              WebkitBackdropFilter: 'blur(20px) saturate(180%)', 
              padding: '0.4rem', 
              borderRadius: '8px', 
              textAlign: 'center', 
              border: '1px solid rgba(255, 255, 255, 0.4)', 
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' 
            }}>
              <div style={{ 
                fontFamily: "'Playfair Display', serif", 
                fontSize: '0.65rem', 
                fontWeight: '900', 
                color: '#ffffff',
                letterSpacing: '0.5px',
                lineHeight: '1.2',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                whiteSpace: 'nowrap'
              }}>
                AESTIX VISIONS & TECHNOLOGY
              </div>
              <p style={{ 
                color: '#FFF8E7', // Light cream color
                fontSize: '0.45rem', 
                fontWeight: 'bold', 
                letterSpacing: '0.5px', 
                margin: '2px 0 0',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}>OFFICIAL DIGITAL DEVELOPMENT PARTNER</p>
            </div>
          </div>
        </div>
      </section>

      {/* Volunteer / New Member Section */}
      <section className="app-container">
        <div className="volunteer-banner">
          <div>
            <h2>Join Our Volunteer Force</h2>
            <p style={{ opacity: 0.9 }}>Become a member or volunteer today. Together, we can drive measurable change.</p>
          </div>
          <Link to="/contact" className="btn">
            Get Involved <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
