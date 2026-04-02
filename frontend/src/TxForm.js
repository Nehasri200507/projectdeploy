import { useState } from 'react';
import { Btn, Input, CATEGORIES, CAT_MAP } from './components';

async function askClaude(messages, system='') {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, system, messages }),
  });
  const data = await res.json();
  return data.content?.map(b=>b.text||'').join('') || '';
}

export default function TxForm({ onSave, onClose, editTx }) {
  const [type, setType]     = useState(editTx?.type || 'EXPENSE');
  const [desc, setDesc]     = useState(editTx?.description || '');
  const [amount, setAmount] = useState(editTx?.amount || '');
  const [date, setDate]     = useState(editTx?.date || new Date().toISOString().slice(0,10));
  const [cat, setCat]       = useState(editTx?.category || 'food');
  const [note, setNote]     = useState(editTx?.note || '');
  const [aiLoading, setAiLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const incomeCats  = CATEGORIES.filter(c => ['salary','freelance','investment','other'].includes(c.id));
  const expenseCats = CATEGORIES.filter(c => !['salary','freelance'].includes(c.id));
  const availCats   = type === 'INCOME' ? incomeCats : expenseCats;

  const suggestCategory = async () => {
    if (!desc.trim()) return;
    setAiLoading(true);
    try {
      const result = await askClaude(
        [{ role:'user', content:`For a transaction called "${desc}", which category fits best? Reply ONLY with the category id from: ${availCats.map(c=>c.id).join(', ')}` }],
        'You are a finance categorization assistant. Reply with ONLY the exact category id, nothing else.'
      );
      const suggested = result.trim().toLowerCase();
      if (availCats.find(c=>c.id===suggested)) setCat(suggested);
    } catch {}
    setAiLoading(false);
  };

  const validate = () => {
    const e = {};
    if (!desc.trim()) e.desc = 'Description is required';
    if (!amount || parseFloat(amount) <= 0) e.amount = 'Enter a valid positive amount';
    if (!date) e.date = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    onSave({
      ...(editTx ? { id: editTx.id } : {}),
      description: desc.trim(),
      amount: parseFloat(amount),
      date,
      category: cat,
      type,
      note: note.trim(),
    });
  };

  return (
    <div>
      {/* Type toggle */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', background:'var(--s2)', borderRadius:'var(--r-sm)', padding:4, gap:4, marginBottom:20 }}>
        {['EXPENSE','INCOME'].map(t => (
          <button key={t} onClick={() => { setType(t); setCat(t==='INCOME'?'salary':'food'); setErrors({}); }} style={{
            fontFamily:'Cabinet Grotesk', fontWeight:700, fontSize:14, padding:10, borderRadius:7, border:'none', cursor:'pointer', transition:'all 0.2s',
            background:type===t?'var(--s4)':'transparent',
            color:type===t?(t==='EXPENSE'?'var(--rose)':'var(--emerald)'):'var(--muted2)',
            boxShadow:type===t?'0 2px 8px rgba(0,0,0,0.3)':'none',
          }}>{t==='EXPENSE'?'⬇ Expense':'⬆ Income'}</button>
        ))}
      </div>

      {/* Description + AI tag */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'flex-end' }}>
        <Input label="Description" value={desc} onChange={e=>setDesc(e.target.value)}
          placeholder="e.g. Swiggy lunch" error={errors.desc} />
        <Btn variant="ai" size="sm" onClick={suggestCategory} disabled={aiLoading||!desc.trim()} style={{ marginBottom:errors.desc?28:14, height:42, whiteSpace:'nowrap' }}>
          {aiLoading ? '…' : '✨ Auto-tag'}
        </Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Input label="Amount (₹)" type="number" value={amount} onChange={e=>setAmount(e.target.value)}
          placeholder="0.00" min="0" step="0.01" error={errors.amount} />
        <Input label="Date" type="date" value={date} onChange={e=>setDate(e.target.value)} error={errors.date} />
      </div>

      {/* Category chips */}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--muted2)', display:'block', marginBottom:8 }}>Category</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {availCats.map(c => (
            <button key={c.id} onClick={()=>setCat(c.id)} style={{
              fontFamily:'Cabinet Grotesk', fontSize:12, fontWeight:700, padding:'5px 12px',
              borderRadius:99, cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', gap:4,
              border:`1px solid ${cat===c.id?'transparent':'var(--border2)'}`,
              background:cat===c.id?c.color:'var(--s2)',
              color:cat===c.id?'#fff':'var(--muted2)',
              boxShadow:cat===c.id?`0 0 12px ${c.color}50`:'none',
            }}>{c.emoji} {c.label}</button>
          ))}
        </div>
      </div>

      <Input label="Note (optional)" value={note} onChange={e=>setNote(e.target.value)} placeholder="Any details…" />

      <div style={{ display:'flex', gap:10, marginTop:8 }}>
        <Btn variant="ghost" onClick={onClose} style={{ flex:1 }}>Cancel</Btn>
        <Btn variant="primary" onClick={save} style={{ flex:2 }}>
          {editTx ? 'Update Transaction' : 'Add Transaction'}
        </Btn>
      </div>
    </div>
  );
}
