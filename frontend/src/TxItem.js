import { CAT_MAP, fmtFull } from './components';

export default function TxItem({ tx, onEdit, onDelete }) {
  const cat    = CAT_MAP[tx.category] || CAT_MAP.other;
  const dateStr = new Date(tx.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
  const isIncome = tx.type === 'INCOME';

  return (
    <div className="tx-item" style={{
      display:'flex', alignItems:'center', gap:14, padding:'12px 16px',
      borderRadius:'var(--r)', background:'var(--s2)', border:'1px solid transparent',
      transition:'all 0.15s', animation:'fadeUp 0.3s ease both',
    }}>
      <div style={{
        width:40, height:40, borderRadius:10, background:cat.bg,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0,
      }}>{cat.emoji}</div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {tx.description}
        </div>
        <div style={{ fontSize:11, color:'var(--muted2)', marginTop:2, display:'flex', gap:8, alignItems:'center', fontFamily:'JetBrains Mono' }}>
          <span>{dateStr}</span>
          <span style={{ background:cat.bg, color:cat.color, padding:'1px 7px', borderRadius:99, fontSize:10, fontWeight:700, fontFamily:'Cabinet Grotesk', letterSpacing:'0.3px' }}>
            {cat.label}
          </span>
          {tx.note && <span style={{ color:'var(--muted)', fontFamily:'Cabinet Grotesk' }}>· {tx.note}</span>}
        </div>
      </div>

      <div style={{ fontFamily:'JetBrains Mono', fontSize:15, fontWeight:600, flexShrink:0, color:isIncome?'var(--emerald)':'var(--rose)' }}>
        {isIncome ? '+' : '−'}{fmtFull(tx.amount)}
      </div>

      <div className="tx-actions" style={{ display:'flex', gap:4, opacity:0, transition:'opacity 0.15s' }}>
        <button onClick={() => onEdit(tx)} style={{ width:30, height:30, borderRadius:'50%', border:'none', background:'var(--s3)', color:'var(--muted2)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}>✏️</button>
        <button onClick={() => onDelete(tx.id)} style={{ width:30, height:30, borderRadius:'50%', border:'none', background:'rgba(255,77,119,0.1)', color:'var(--rose)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}>🗑</button>
      </div>
    </div>
  );
}
