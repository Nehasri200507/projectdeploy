import { useEffect } from 'react';

// ── Constants ─────────────────────────────────────────────────
export const CATEGORIES = [
  { id:'food',          emoji:'🍔', label:'Food & Dining',    color:'#ff4d77', bg:'rgba(255,77,119,0.12)'  },
  { id:'transport',     emoji:'🚗', label:'Transport',        color:'#38bdf8', bg:'rgba(56,189,248,0.12)'  },
  { id:'shopping',      emoji:'🛍', label:'Shopping',         color:'#ffb340', bg:'rgba(255,179,64,0.12)'  },
  { id:'health',        emoji:'💊', label:'Health',           color:'#00e5a0', bg:'rgba(0,229,160,0.12)'   },
  { id:'entertainment', emoji:'🎬', label:'Entertainment',    color:'#a855f7', bg:'rgba(168,85,247,0.12)'  },
  { id:'bills',         emoji:'⚡', label:'Bills & Utilities', color:'#6c63ff', bg:'rgba(108,99,255,0.12)' },
  { id:'education',     emoji:'📚', label:'Education',        color:'#fcd34d', bg:'rgba(252,211,77,0.12)'  },
  { id:'travel',        emoji:'✈️', label:'Travel',           color:'#fb923c', bg:'rgba(251,146,60,0.12)'  },
  { id:'salary',        emoji:'💼', label:'Salary',           color:'#00e5a0', bg:'rgba(0,229,160,0.12)'   },
  { id:'freelance',     emoji:'💻', label:'Freelance',        color:'#38bdf8', bg:'rgba(56,189,248,0.12)'  },
  { id:'investment',    emoji:'📈', label:'Investment',       color:'#6c63ff', bg:'rgba(108,99,255,0.12)'  },
  { id:'other',         emoji:'📦', label:'Other',            color:'#5c5f7a', bg:'rgba(92,95,122,0.12)'   },
];
export const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export const fmt = (n, compact = false) => {
  const abs = Math.abs(Number(n) || 0);
  if (compact && abs >= 100000) return '₹' + (abs/100000).toFixed(1) + 'L';
  if (compact && abs >= 1000)   return '₹' + (abs/1000).toFixed(1) + 'K';
  return '₹' + abs.toLocaleString('en-IN', { minimumFractionDigits:0, maximumFractionDigits:0 });
};
export const fmtFull = n => '₹' + Math.abs(Number(n)||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 });

// ── Btn ───────────────────────────────────────────────────────
const VARIANTS = {
  primary: { background:'var(--indigo)', color:'#fff', border:'none' },
  ghost:   { background:'var(--s2)', color:'var(--muted2)', border:'1px solid var(--border2)' },
  danger:  { background:'rgba(255,77,119,0.12)', color:'var(--rose)', border:'1px solid rgba(255,77,119,0.2)' },
  success: { background:'rgba(0,229,160,0.12)', color:'var(--emerald)', border:'1px solid rgba(0,229,160,0.2)' },
  ai:      { background:'linear-gradient(135deg,#6c63ff,#a855f7)', color:'#fff', border:'none' },
};
const SIZES = {
  sm: { padding:'7px 14px', fontSize:12 },
  md: { padding:'10px 20px', fontSize:14 },
  lg: { padding:'13px 26px', fontSize:15 },
};
export const Btn = ({ children, variant='primary', size='md', style:s, ...p }) => (
  <button {...p} className="btn-hover" style={{
    fontFamily:'Cabinet Grotesk', fontWeight:700, borderRadius:'var(--r-sm)', cursor:'pointer',
    transition:'all 0.18s', letterSpacing:'0.2px', display:'inline-flex', alignItems:'center',
    justifyContent:'center', gap:6, opacity: p.disabled ? 0.6 : 1,
    ...VARIANTS[variant], ...SIZES[size], ...s,
  }}>{children}</button>
);

// ── Input ─────────────────────────────────────────────────────
export const Input = ({ label, error, ...p }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
    {label && <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--muted2)' }}>{label}</label>}
    <input {...p} style={{
      background:'var(--s2)', border:`1px solid ${error ? 'var(--rose)' : 'var(--border2)'}`,
      borderRadius:'var(--r-sm)', color:'var(--text)', padding:'11px 14px', fontSize:14, outline:'none', width:'100%',
      transition:'border-color .2s, box-shadow .2s', fontFamily:'Cabinet Grotesk', ...p.style,
    }}
      onFocus={e => { e.target.style.borderColor='rgba(108,99,255,0.6)'; e.target.style.boxShadow='0 0 0 3px rgba(108,99,255,0.1)'; }}
      onBlur={e => { e.target.style.borderColor=error?'var(--rose)':'var(--border2)'; e.target.style.boxShadow='none'; }}
    />
    {error && <span style={{ fontSize:11, color:'var(--rose)' }}>{error}</span>}
  </div>
);

// ── Select ────────────────────────────────────────────────────
export const Select = ({ label, children, ...p }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
    {label && <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--muted2)' }}>{label}</label>}
    <select {...p} style={{
      background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)',
      color:'var(--text)', padding:'11px 14px', fontSize:14, outline:'none', width:'100%',
      fontFamily:'Cabinet Grotesk', cursor:'pointer', ...p.style,
    }}>{children}</select>
  </div>
);

// ── Modal ─────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, width=500 }) => {
  useEffect(() => {
    const handler = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position:'fixed', inset:0, background:'rgba(0,0,8,0.82)', backdropFilter:'blur(8px)',
      zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16,
      animation:'fadeIn 0.2s ease',
    }}>
      <div style={{
        background:'var(--s1)', border:'1px solid var(--border2)', borderRadius:'var(--r-lg)',
        padding:28, width:'100%', maxWidth:width, maxHeight:'90vh', overflowY:'auto',
        animation:'fadeUp 0.3s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:'var(--shadow-lg)',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:800 }}>{title}</div>
          <button onClick={onClose} style={{
            width:32, height:32, borderRadius:'50%', border:'none', background:'var(--s3)',
            color:'var(--muted2)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center',
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────
export const Toast = ({ toasts }) => (
  <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:8 }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        background:'var(--s2)',
        border:`1px solid ${t.type==='success'?'rgba(0,229,160,0.3)':t.type==='error'?'rgba(255,77,119,0.3)':'var(--border2)'}`,
        borderRadius:'var(--r)', padding:'12px 18px', display:'flex', alignItems:'center', gap:10,
        fontSize:13, fontWeight:600, boxShadow:'var(--shadow)', animation:'toastIn 0.3s ease', color:'var(--text)',
      }}>
        <span>{t.type==='success'?'✅':t.type==='error'?'❌':'💡'}</span>{t.msg}
      </div>
    ))}
  </div>
);

// ── StatCard ──────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, color='#6c63ff', icon, style:s }) => (
  <div style={{
    background:'var(--s1)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)',
    padding:'22px 24px', position:'relative', overflow:'hidden',
    animation:'fadeUp 0.4s ease both', ...s,
  }}>
    <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at top left, ${color}18, transparent 60%)`, pointerEvents:'none' }} />
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
      <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', color:'var(--muted2)' }}>{label}</span>
      <span style={{ fontSize:18 }}>{icon}</span>
    </div>
    <div style={{ fontSize:28, fontWeight:900, lineHeight:1, fontFamily:'JetBrains Mono, monospace', marginBottom:6 }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:'var(--muted2)' }}>{sub}</div>}
  </div>
);

// ── ProgressBar ───────────────────────────────────────────────
export const ProgressBar = ({ pct, color }) => (
  <div style={{ height:6, background:'var(--s4)', borderRadius:99, overflow:'hidden' }}>
    <div style={{
      height:'100%', width:`${Math.min(pct||0,100)}%`, borderRadius:99,
      background: pct>=90 ? 'linear-gradient(90deg,#ff4d77,#ff1744)' : pct>=70 ? 'linear-gradient(90deg,#ffb340,#ff8c00)' : `linear-gradient(90deg,${color||'#6c63ff'},#8b84ff)`,
      transition:'width 0.6s cubic-bezier(0.34,1.56,0.64,1)', animation:'slideRight 0.6s ease',
    }} />
  </div>
);

// ── DonutChart ────────────────────────────────────────────────
export const DonutChart = ({ segments=[], total=0 }) => {
  const R=52, CX=60, CY=60, circ=2*Math.PI*R;
  let cum=0;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--s3)" strokeWidth="16"/>
      {segments.map((seg,i)=>{
        const pct=seg.value/total, dash=pct*circ, gap=circ-dash, offset=circ*0.25-cum*circ;
        cum+=pct;
        return <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={seg.color} strokeWidth="16"
          strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset}
          style={{ transition:'stroke-dasharray 0.5s ease', transform:'rotate(-90deg)', transformOrigin:`${CX}px ${CY}px` }}/>;
      })}
      <text x={CX} y={CY-6} textAnchor="middle" fill="var(--text)" fontSize="12" fontFamily="JetBrains Mono" fontWeight="700">{fmt(total,true)}</text>
      <text x={CX} y={CY+10} textAnchor="middle" fill="var(--muted2)" fontSize="8" fontFamily="Cabinet Grotesk">spent</text>
    </svg>
  );
};

// ── BarChart ──────────────────────────────────────────────────
export const BarChart = ({ data=[] }) => {
  const maxVal = Math.max(...data.map(d=>d.value),1);
  const colors = ['#6c63ff','#ff4d77','#00e5a0','#ffb340','#38bdf8','#a855f7','#fb923c','#f472b6','#34d399','#60a5fa','#fbbf24'];
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:140, padding:'0 4px' }}>
      {data.map((d,i)=>{
        const pct=(d.value/maxVal)*100;
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5, height:'100%' }}>
            <div style={{ flex:1, width:'100%', display:'flex', alignItems:'flex-end', position:'relative' }}>
              <div style={{
                width:'100%', borderRadius:'5px 5px 0 0',
                background: d.isToday ? `linear-gradient(180deg,${colors[i%colors.length]},${colors[(i+2)%colors.length]})` : colors[i%colors.length],
                height:`${pct}%`, minHeight:d.value>0?4:0, opacity:d.value>0?1:0.18,
                transition:'height 0.7s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow:d.isToday?`0 0 12px ${colors[i%colors.length]}60`:'none', position:'relative',
              }}>
                {d.value>0 && (
                  <div style={{ position:'absolute', bottom:'calc(100% + 4px)', left:'50%', transform:'translateX(-50%)',
                    fontSize:9, fontFamily:'JetBrains Mono', color:'var(--muted2)', whiteSpace:'nowrap' }}>
                    {fmt(d.value,true)}
                  </div>
                )}
              </div>
            </div>
            <div style={{ fontSize:10, color:d.isToday?'var(--indigo2)':'var(--muted)', fontWeight:d.isToday?700:500, letterSpacing:'0.3px' }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
};

// ── Spinner ───────────────────────────────────────────────────
export const Spinner = ({ size=24 }) => (
  <div style={{ width:size, height:size, border:`2px solid var(--s4)`, borderTop:`2px solid var(--indigo)`,
    borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 }} />
);

// ── AmbientOrbs ───────────────────────────────────────────────
export const AmbientOrbs = () => (
  <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
    <div style={{ position:'absolute', top:'-20%', left:'-5%', width:'50vw', height:'50vw', background:'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 65%)', borderRadius:'50%' }}/>
    <div style={{ position:'absolute', bottom:'-15%', right:'-5%', width:'45vw', height:'45vw', background:'radial-gradient(circle, rgba(255,77,119,0.06) 0%, transparent 65%)', borderRadius:'50%' }}/>
    <div style={{ position:'absolute', top:'40%', right:'20%', width:'30vw', height:'30vw', background:'radial-gradient(circle, rgba(0,229,160,0.04) 0%, transparent 65%)', borderRadius:'50%' }}/>
  </div>
);
