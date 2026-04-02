import { useState, useRef, useEffect } from 'react';
import { Btn, CATEGORIES, CAT_MAP, fmt, ProgressBar } from './components';

async function askClaude(messages, system='') {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, system, messages }),
  });
  const data = await res.json();
  return data.content?.map(b=>b.text||'').join('') || '';
}

const SUGGESTIONS = [
  'Where am I overspending this month?',
  'How can I increase my savings rate?',
  'What is my biggest expense category?',
  'Give me a savings plan for next month.',
];

export default function AIAdvisor({ transactions=[], budget=0, month, year, summary }) {
  const [messages, setMessages]             = useState([]);
  const [input, setInput]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysis, setAnalysis]             = useState('');
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const buildContext = () => {
    const txInMonth = transactions.filter(t=>{
      const d=new Date(t.date); return d.getMonth()+1===month && d.getFullYear()===year;
    });
    const expenses = txInMonth.filter(t=>t.type==='EXPENSE');
    const income   = txInMonth.filter(t=>t.type==='INCOME');
    const totalExp = expenses.reduce((s,t)=>s+Number(t.amount),0);
    const totalInc = income.reduce((s,t)=>s+Number(t.amount),0);
    const bycat = {};
    expenses.forEach(t=>{ bycat[t.category]=(bycat[t.category]||0)+Number(t.amount); });
    const catBreakdown = Object.entries(bycat).map(([k,v])=>`${CAT_MAP[k]?.label}: ₹${Math.round(v).toLocaleString('en-IN')}`).join(', ');
    return `User financial data for ${month}/${year}:
- Total Income: ₹${Math.round(totalInc).toLocaleString('en-IN')}
- Total Expenses: ₹${Math.round(totalExp).toLocaleString('en-IN')}
- Net Savings: ₹${Math.round(totalInc-totalExp).toLocaleString('en-IN')}
- Monthly Budget: ${budget ? '₹'+Math.round(budget).toLocaleString('en-IN') : 'Not set'}
- Savings Rate: ${totalInc>0?Math.round(((totalInc-totalExp)/totalInc)*100):0}%
- Expense Breakdown: ${catBreakdown || 'None'}
- Transactions: ${txInMonth.length}
- Top 5 expenses: ${expenses.sort((a,b)=>b.amount-a.amount).slice(0,5).map(t=>`${t.description} (₹${Math.round(t.amount)})`).join(', ')}`;
  };

  const runAnalysis = async () => {
    setAnalysisLoading(true); setAnalysis('');
    try {
      const ctx = buildContext();
      const result = await askClaude(
        [{ role:'user', content:`Analyze my spending for this month and give me 4 specific, actionable insights. Use bullet points with emojis. Mention exact numbers. Context:\n${ctx}` }],
        'You are Spendly AI, a sharp personal finance advisor for Indian users. Give specific data-driven insights in 4-5 bullet points. Use ₹ symbol. Be brief, concrete, and honest — no generic advice.'
      );
      setAnalysis(result);
    } catch { setAnalysis('⚠️ Unable to connect to AI. Please check your network.'); }
    setAnalysisLoading(false);
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    const userMsg = { role:'user', content:msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages); setInput(''); setLoading(true);
    try {
      const ctx = buildContext();
      const result = await askClaude(newMessages,
        `You are Spendly AI, a friendly and sharp personal finance assistant for Indian users. Financial context:\n${ctx}\n\nBe conversational, specific, and concise (2–4 sentences). Use ₹. Don't repeat context back — just answer directly.`
      );
      setMessages(prev=>[...prev,{ role:'assistant', content:result }]);
    } catch {
      setMessages(prev=>[...prev,{ role:'assistant', content:'Sorry, I could not connect right now. Please try again.' }]);
    }
    setLoading(false);
  };

  // Category bars for right panel
  const txInMonth = transactions.filter(t=>{ const d=new Date(t.date); return d.getMonth()+1===month && d.getFullYear()===year; });
  const expenses  = txInMonth.filter(t=>t.type==='EXPENSE');
  const totalExp  = expenses.reduce((s,t)=>s+Number(t.amount),0);
  const bycat     = {};
  expenses.forEach(t=>{ bycat[t.category]=(bycat[t.category]||0)+Number(t.amount); });
  const catData   = Object.entries(bycat).sort((a,b)=>b[1]-a[1]).slice(0,6);

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, height:'calc(100vh - 120px)', minHeight:500 }}>
      {/* Left: Chat + Analysis */}
      <div style={{ display:'flex', flexDirection:'column', gap:16, overflow:'hidden' }}>
        {/* AI Snapshot */}
        <div style={{ background:'var(--s1)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:20, flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:analysis?14:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#6c63ff,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, animation:'glow 2s ease infinite' }}>✨</div>
              <div>
                <div style={{ fontSize:14, fontWeight:800 }}>AI Monthly Snapshot</div>
                <div style={{ fontSize:11, color:'var(--muted2)' }}>Powered by Claude</div>
              </div>
            </div>
            <Btn variant="ai" size="sm" onClick={runAnalysis} disabled={analysisLoading} style={{ opacity:analysisLoading?0.7:1 }}>
              {analysisLoading ? <span style={{ animation:'pulse 1s infinite' }}>Analyzing…</span> : '✨ Analyze'}
            </Btn>
          </div>
          {analysisLoading && (
            <div style={{ display:'flex', flexDirection:'column', gap:6, paddingTop:10 }}>
              {[1,0.7,0.5].map((op,i)=>(
                <div key={i} style={{ height:8, borderRadius:99, background:'linear-gradient(90deg,var(--s3),var(--s4),var(--s3))', backgroundSize:'200% 100%', opacity:op, animation:`shimmer 1.5s ${i*0.15}s infinite` }}/>
              ))}
            </div>
          )}
          {analysis && (
            <div style={{ fontSize:13, lineHeight:1.75, color:'var(--em)', whiteSpace:'pre-wrap', animation:'fadeUp 0.4s ease', borderTop:'1px solid var(--border)', paddingTop:14, marginTop:4 }}>
              {analysis}
            </div>
          )}
        </div>

        {/* Chat */}
        <div style={{ background:'var(--s1)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:20, flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
          <div style={{ fontSize:14, fontWeight:800, marginBottom:12, display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <span>💬</span> Chat with Spendly AI
          </div>
          <div ref={chatRef} style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, minHeight:0, paddingRight:4 }}>
            {messages.length === 0 && (
              <div style={{ color:'var(--muted2)', fontSize:13 }}>
                <div style={{ marginBottom:10 }}>Ask me anything about your finances:</div>
                {SUGGESTIONS.map((q,i)=>(
                  <div key={i} onClick={()=>sendMessage(q)} style={{ padding:'7px 12px', background:'var(--s2)', borderRadius:'var(--r-sm)', marginBottom:6, cursor:'pointer', fontSize:12, color:'var(--muted2)', border:'1px solid var(--border)', transition:'all 0.15s' }}>
                    💡 {q}
                  </div>
                ))}
              </div>
            )}
            {messages.map((m,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', animation:'fadeUp 0.3s ease' }}>
                <div style={{
                  maxWidth:'82%', padding:'10px 14px',
                  borderRadius:m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',
                  background:m.role==='user'?'linear-gradient(135deg,#6c63ff,#8b84ff)':'var(--s2)',
                  border:m.role==='user'?'none':'1px solid var(--border)',
                  fontSize:13, lineHeight:1.65, color:m.role==='user'?'#fff':'var(--em)', whiteSpace:'pre-wrap',
                }}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display:'flex', gap:5, padding:'10px 14px', background:'var(--s2)', borderRadius:'14px 14px 14px 4px', width:'fit-content', border:'1px solid var(--border)' }}>
                {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--indigo)', animation:`pulse 1s ${i*0.2}s infinite` }}/>)}
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:8, marginTop:12, borderTop:'1px solid var(--border)', paddingTop:12, flexShrink:0 }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} placeholder="Ask about your spending…" style={{
              flex:1, background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)',
              color:'var(--text)', padding:'10px 14px', fontSize:13, outline:'none', fontFamily:'Cabinet Grotesk',
            }}/>
            <Btn variant="ai" size="sm" onClick={()=>sendMessage()} disabled={loading||!input.trim()}>Send</Btn>
          </div>
        </div>
      </div>

      {/* Right: Summary & Breakdown */}
      <div style={{ background:'var(--s1)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:24, overflowY:'auto' }}>
        <div style={{ fontSize:16, fontWeight:800, marginBottom:20 }}>📊 Spending Breakdown</div>

        {catData.length > 0 ? (
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--muted2)', marginBottom:14 }}>By Category</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {catData.map(([catId,val])=>{
                const c = CAT_MAP[catId];
                const pct = totalExp>0?(val/totalExp)*100:0;
                return (
                  <div key={catId}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>{c?.emoji} {c?.label}</span>
                      <span style={{ fontSize:12, fontFamily:'JetBrains Mono', color:'var(--muted2)' }}>{fmt(val)} · {Math.round(pct)}%</span>
                    </div>
                    <ProgressBar pct={pct} color={c?.color}/>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ color:'var(--muted2)', fontSize:13, marginBottom:28, textAlign:'center', padding:'20px 0' }}>No expenses this month yet</div>
        )}

        {/* Month stats grid */}
        {summary && (
          <>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--muted2)', marginBottom:14 }}>Month at a Glance</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { label:'Income',       val:fmt(summary.totalIncome),                               color:'var(--emerald)' },
                { label:'Expenses',     val:fmt(summary.totalExpense),                              color:'var(--rose)'    },
                { label:'Net Savings',  val:fmt(Math.max(summary.netBalance,0)),                    color:'var(--sky)'     },
                { label:'Savings %',    val:(summary.savingsRate||0).toFixed(1)+'%',                color:summary.savingsRate>=20?'var(--emerald)':summary.savingsRate>=0?'var(--amber)':'var(--rose)' },
                { label:'Avg / Day',    val:fmt(summary.avgDailyExpense,true)                                              },
                { label:'Transactions', val:summary.transactionCount                                                       },
              ].map((s,i)=>(
                <div key={i} style={{ background:'var(--s2)', borderRadius:'var(--r-sm)', padding:'12px 14px', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:10, color:'var(--muted2)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:17, fontWeight:800, fontFamily:'JetBrains Mono', color:s.color||'var(--text)' }}>{s.val}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
