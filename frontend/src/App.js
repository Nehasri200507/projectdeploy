import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { txApi, budgetApi, analyticsApi } from './api';
import {
  Btn, Input, Select, Modal, Toast, StatCard, ProgressBar,
  DonutChart, BarChart, Spinner, AmbientOrbs,
  CATEGORIES, CAT_MAP, MONTHS, fmt, fmtFull,
} from './components';
import TxItem   from './TxItem';
import TxForm   from './TxForm';
import AIAdvisor from './AIAdvisor';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export default function App() {
  const { user, logout } = useAuth();

  // ── View state ─────────────────────────────────────────────
  const [activeTab,   setActiveTab]   = useState('dashboard');
  const [viewMonth,   setViewMonth]   = useState(new Date().getMonth() + 1); // 1-12
  const [viewYear,    setViewYear]    = useState(new Date().getFullYear());

  // ── Data state ─────────────────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [budget,        setBudget]       = useState(null);
  const [summary,       setSummary]      = useState(null);
  const [loading,       setLoading]      = useState(true);

  // ── UI state ───────────────────────────────────────────────
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [editTx,          setEditTx]          = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput,     setBudgetInput]     = useState('');
  const [search,          setSearch]          = useState('');
  const [filterCat,       setFilterCat]       = useState('');
  const [filterType,      setFilterType]      = useState('');
  const [sortBy,          setSortBy]          = useState('date-desc');
  const [chartView,       setChartView]       = useState('week');
  const [toasts,          setToasts]          = useState([]);
  const [savingBudget,    setSavingBudget]     = useState(false);

  // ── Toast helper ───────────────────────────────────────────
  const showToast = useCallback((msg, type = 'success') => {
    const id = genId();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  // ── Fetch data for current month/year ──────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, summaryRes] = await Promise.all([
        txApi.getByMonth(viewMonth, viewYear),
        analyticsApi.summary(viewMonth, viewYear),
      ]);
      setTransactions(txRes.data.data || []);
      setSummary(summaryRes.data.data || null);

      // Fetch budget (may 404 if not set — that's fine)
      try {
        const bRes = await budgetApi.getMonth(viewMonth, viewYear);
        setBudget(bRes.data.data || null);
      } catch {
        setBudget(null);
      }
    } catch (err) {
      showToast('Failed to load data', 'error');
    }
    setLoading(false);
  }, [viewMonth, viewYear, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Keyboard shortcut: Ctrl+N → add transaction
  useEffect(() => {
    const h = e => { if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); setEditTx(null); setShowAddModal(true); } };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  // ── Month navigation ───────────────────────────────────────
  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // ── CRUD ───────────────────────────────────────────────────
  const handleSaveTx = async (data) => {
    try {
      if (data.id) {
        await txApi.update(data.id, data);
        showToast('Transaction updated!');
      } else {
        await txApi.create(data);
        showToast('Transaction added!');
      }
      setShowAddModal(false);
      setEditTx(null);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save transaction', 'error');
    }
  };

  const handleDeleteTx = async (id) => {
    try {
      await txApi.delete(id);
      showToast('Deleted', 'error');
      fetchAll();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleClearMonth = async () => {
    if (!transactions.length) return;
    if (!window.confirm(`Delete all ${transactions.length} transactions for ${MONTHS[viewMonth - 1]} ${viewYear}?`)) return;
    try {
      await txApi.deleteMonth(viewMonth, viewYear);
      showToast('Month cleared');
      fetchAll();
    } catch {
      showToast('Failed to clear', 'error');
    }
  };

  const handleSaveBudget = async () => {
    const v = parseFloat(budgetInput);
    if (!v || v <= 0) { showToast('Enter a valid amount', 'error'); return; }
    setSavingBudget(true);
    try {
      await budgetApi.upsert({ amount: v, month: viewMonth, year: viewYear });
      showToast('Budget saved!');
      setShowBudgetModal(false);
      fetchAll();
    } catch {
      showToast('Failed to save budget', 'error');
    }
    setSavingBudget(false);
  };

  // ── Export CSV ─────────────────────────────────────────────
  const exportCSV = () => {
    if (!transactions.length) { showToast('No transactions to export', 'error'); return; }
    const rows = [
      'Date,Description,Category,Type,Amount,Note',
      ...transactions.map(t =>
        `${t.date},"${t.description}","${CAT_MAP[t.category]?.label || t.category}",${t.type},${t.amount},"${t.note || ''}"`
      ),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = `spendly-${viewYear}-${String(viewMonth).padStart(2, '0')}.csv`;
    a.click();
    showToast('Exported!');
  };

  // ── Derived stats ──────────────────────────────────────────
  const expenses   = useMemo(() => transactions.filter(t => t.type === 'EXPENSE'), [transactions]);
  const income     = useMemo(() => transactions.filter(t => t.type === 'INCOME'),  [transactions]);
  const totalExp   = useMemo(() => expenses.reduce((s, t) => s + Number(t.amount), 0), [expenses]);
  const totalInc   = useMemo(() => income.reduce((s, t) => s + Number(t.amount), 0),   [income]);
  const balance    = totalInc - totalExp;
  const budgetAmt  = budget?.amount ? Number(budget.amount) : 0;
  const budgetPct  = budgetAmt > 0 ? (totalExp / budgetAmt) * 100 : 0;
  const savingsPct = totalInc > 0 ? Math.round(((totalInc - totalExp) / totalInc) * 100) : 0;
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Category donut data
  const catData = useMemo(() => {
    const bycat = {};
    expenses.forEach(t => { bycat[t.category] = (bycat[t.category] || 0) + Number(t.amount); });
    return Object.entries(bycat).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([id, value]) => ({ id, value, color: CAT_MAP[id]?.color || '#555' }));
  }, [expenses]);

  // Top category
  const topCat = catData[0] ? CAT_MAP[catData[0].id] : null;

  // Chart data
  const chartData = useMemo(() => {
    const today = new Date();
    if (chartView === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today); d.setDate(today.getDate() - (6 - i));
        const key = d.toISOString().slice(0, 10);
        const val = expenses.filter(t => t.date === key).reduce((s, t) => s + Number(t.amount), 0);
        return { label: ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()], value: val, isToday: key === today.toISOString().slice(0,10) };
      });
    }
    const days = daysInMonth;
    const step = Math.ceil(days / 10);
    return Array.from({ length: Math.ceil(days / step) }, (_, i) => {
      const start = i * step + 1, end = Math.min((i + 1) * step, days);
      const val = expenses.filter(t => { const td = parseInt(t.date.slice(8)); return td >= start && td <= end; })
        .reduce((s, t) => s + Number(t.amount), 0);
      return { label: String(start), value: val, isToday: false };
    });
  }, [chartView, expenses, daysInMonth]);

  // Filtered & sorted tx list
  const filteredTx = useMemo(() => {
    let list = [...transactions];
    if (search)     list = list.filter(t => t.description.toLowerCase().includes(search.toLowerCase()) || t.note?.toLowerCase().includes(search.toLowerCase()));
    if (filterCat)  list = list.filter(t => t.category === filterCat);
    if (filterType) list = list.filter(t => t.type === filterType);
    list.sort((a, b) => {
      if (sortBy === 'date-desc')   return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date-asc')    return new Date(a.date) - new Date(b.date);
      if (sortBy === 'amount-desc') return Number(b.amount) - Number(a.amount);
      return Number(a.amount) - Number(b.amount);
    });
    return list;
  }, [transactions, search, filterCat, filterType, sortBy]);

  // ── Tabs config ────────────────────────────────────────────
  const tabs = [
    { id: 'dashboard',    label: 'Dashboard',    icon: '📊' },
    { id: 'transactions', label: 'Transactions', icon: '📋' },
    { id: 'ai',           label: 'AI Advisor',   icon: '✨', badge: 'NEW' },
  ];

  return (
    <>
      <AmbientOrbs />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── Header ─────────────────────────────────────── */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', height: 60,
          background: 'rgba(7,8,15,0.92)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100,
        }}>
          {/* Logo + Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.5px', userSelect: 'none' }}>
              <span style={{ background: 'linear-gradient(135deg,#6c63ff,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Spend</span>
              <span style={{ color: 'var(--muted2)', fontWeight: 400 }}>ly</span>
            </div>
            <nav style={{ display: 'flex', gap: 2 }}>
              {tabs.map(t => (
                <button key={t.id} className="nav-tab" onClick={() => setActiveTab(t.id)} style={{
                  fontFamily: 'Cabinet Grotesk', fontWeight: 700, fontSize: 13,
                  padding: '6px 14px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
                  background: activeTab === t.id ? 'var(--s3)' : 'transparent',
                  color: activeTab === t.id ? 'var(--text)' : 'var(--muted2)',
                  boxShadow: activeTab === t.id && t.id === 'ai' ? '0 0 18px rgba(108,99,255,0.3)' : 'none',
                }}>
                  {t.icon} {t.label}
                  {t.badge && <span style={{ fontSize: 8, background: 'linear-gradient(135deg,#6c63ff,#a855f7)', color: '#fff', padding: '1px 5px', borderRadius: 99, fontWeight: 800, letterSpacing: '0.5px' }}>{t.badge}</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* Month Nav + Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '5px 10px' }}>
              <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--muted2)', cursor: 'pointer', fontSize: 12, padding: '0 4px' }}>◀</button>
              <span style={{ fontSize: 13, fontWeight: 700, minWidth: 128, textAlign: 'center' }}>{MONTHS[viewMonth - 1]} {viewYear}</span>
              <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--muted2)', cursor: 'pointer', fontSize: 12, padding: '0 4px' }}>▶</button>
            </div>
            <Btn variant="ghost" size="sm" onClick={exportCSV}>⬇ Export</Btn>
            <Btn variant="primary" size="sm" onClick={() => { setEditTx(null); setShowAddModal(true); }}>+ Add</Btn>
            <div style={{ width: 1, height: 24, background: 'var(--border2)', margin: '0 4px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--em)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--muted2)', cursor: 'pointer', fontSize: 12, padding: '4px 6px', borderRadius: 6, transition: 'color 0.15s' }}>Sign out</button>
            </div>
          </div>
        </header>

        {/* ── Main content ────────────────────────────────── */}
        <main style={{ flex: 1, padding: '24px 32px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12, color: 'var(--muted2)' }}>
              <Spinner size={28} /> <span style={{ fontSize: 14 }}>Loading your data…</span>
            </div>
          ) : (
            <>
              {/* ══ DASHBOARD ══════════════════════════════ */}
              {activeTab === 'dashboard' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

                  {/* Top 3 stat cards */}
                  <StatCard label="Total Spent"  value={fmt(totalExp)} icon="💸" color="#ff4d77"
                    sub={budgetAmt ? `${Math.round(budgetPct)}% of monthly budget` : 'No budget set'} />
                  <StatCard label="Total Income" value={fmt(totalInc)} icon="💰" color="#00e5a0"
                    sub={`${income.length} income entries`} />
                  <StatCard label="Net Balance"  value={(balance >= 0 ? '+' : '−') + fmt(Math.abs(balance))} icon="💎"
                    color={balance >= 0 ? '#00e5a0' : '#ff4d77'}
                    sub={`Savings rate: ${savingsPct}%`} />

                  {/* Budget + Insights */}
                  <div style={{ gridColumn: '1 / 3', background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 24, animation: 'fadeUp 0.4s 0.1s ease both' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>Monthly Budget</div>
                      <Btn variant="ghost" size="sm" onClick={() => { setBudgetInput(budgetAmt || ''); setShowBudgetModal(true); }}>
                        {budgetAmt ? 'Edit' : '+ Set Budget'}
                      </Btn>
                    </div>
                    {budgetAmt > 0 ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 13, color: 'var(--muted2)' }}>Spent</span>
                          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 600 }}>
                            {fmt(totalExp)} <span style={{ color: 'var(--muted2)' }}>/ {fmt(budgetAmt)}</span>
                          </span>
                        </div>
                        <ProgressBar pct={budgetPct} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--muted2)' }}>
                          <span>{Math.round(budgetPct)}% used</span>
                          <span style={{ color: budgetPct >= 100 ? 'var(--rose)' : budgetPct >= 70 ? 'var(--amber)' : 'var(--emerald)' }}>
                            {budgetPct >= 100 ? `Over by ${fmt(totalExp - budgetAmt)}` : `${fmt(budgetAmt - totalExp)} remaining`}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--muted2)', textAlign: 'center', padding: '16px 0' }}>
                        Set a budget to track your monthly spending goal
                      </div>
                    )}

                    {/* Quick insights grid */}
                    <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--muted2)', marginBottom: 14 }}>Quick Insights</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                        {[
                          { label: 'Top Category', val: topCat ? `${topCat.emoji} ${topCat.label}` : '—', color: topCat?.color },
                          { label: 'Avg / Day',    val: fmt(totalExp / daysInMonth, true) },
                          { label: 'Transactions', val: transactions.length },
                          { label: 'Savings %',    val: savingsPct + '%', color: savingsPct >= 20 ? 'var(--emerald)' : savingsPct >= 0 ? 'var(--amber)' : 'var(--rose)' },
                        ].map((ins, i) => (
                          <div key={i} style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--muted2)', marginBottom: 6 }}>{ins.label}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'JetBrains Mono', color: ins.color || 'var(--text)' }}>{ins.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Donut chart */}
                  <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 24, animation: 'fadeUp 0.4s 0.15s ease both' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>By Category</div>
                    {catData.length > 0 ? (
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <DonutChart segments={catData} total={totalExp} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {catData.map(seg => {
                            const c = CAT_MAP[seg.id];
                            return (
                              <div key={seg.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c?.color, flexShrink: 0 }} />
                                <div style={{ fontSize: 11, color: 'var(--muted2)', flex: 1 }}>{c?.label}</div>
                                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                                  {Math.round((seg.value / totalExp) * 100)}%
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--muted2)', fontSize: 13, padding: 24 }}>No expenses yet</div>
                    )}
                  </div>

                  {/* Bar chart */}
                  <div style={{ gridColumn: '1 / -1', background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 24, animation: 'fadeUp 0.4s 0.2s ease both' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>Daily Spending</div>
                      <div style={{ display: 'flex', background: 'var(--s2)', borderRadius: 'var(--r-sm)', padding: 3, gap: 2 }}>
                        {['week', 'month'].map(v => (
                          <button key={v} onClick={() => setChartView(v)} style={{
                            fontFamily: 'Cabinet Grotesk', fontWeight: 700, fontSize: 12, padding: '6px 14px',
                            borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                            background: chartView === v ? 'var(--s4)' : 'transparent',
                            color: chartView === v ? 'var(--text)' : 'var(--muted2)',
                          }}>{v === 'week' ? 'This Week' : 'This Month'}</button>
                        ))}
                      </div>
                    </div>
                    <BarChart data={chartData} />
                  </div>

                  {/* Recent transactions */}
                  <div style={{ gridColumn: '1 / -1', background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 24, animation: 'fadeUp 0.4s 0.25s ease both' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>Recent Transactions</div>
                      <Btn variant="ghost" size="sm" onClick={() => setActiveTab('transactions')}>View All →</Btn>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {filteredTx.slice(0, 5).map(tx => (
                        <TxItem key={tx.id} tx={tx} onEdit={t => { setEditTx(t); setShowAddModal(true); }} onDelete={handleDeleteTx} />
                      ))}
                      {filteredTx.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--muted2)', padding: 36, fontSize: 14 }}>
                          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.3 }}>📭</div>
                          No transactions this month. Press <kbd style={{ background: 'var(--s3)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>Ctrl+N</kbd> to add one.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ══ TRANSACTIONS ═══════════════════════════ */}
              {activeTab === 'transactions' && (
                <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>
                      All Transactions{' '}
                      <span style={{ fontSize: 13, color: 'var(--muted2)', fontWeight: 500 }}>({transactions.length})</span>
                    </div>
                    <Btn variant="danger" size="sm" onClick={handleClearMonth}>Clear Month</Btn>
                  </div>

                  {/* Filters */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)', fontSize: 14 }}>🔍</span>
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions…"
                        style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', color: 'var(--text)', padding: '10px 14px 10px 36px', fontSize: 13, outline: 'none', fontFamily: 'Cabinet Grotesk' }} />
                    </div>
                    {[
                      { val: filterCat,  set: setFilterCat,  opts: [['','All Categories'], ...CATEGORIES.map(c => [c.id, `${c.emoji} ${c.label}`])] },
                      { val: filterType, set: setFilterType, opts: [['','All Types'],['EXPENSE','Expense'],['INCOME','Income']] },
                      { val: sortBy,     set: setSortBy,      opts: [['date-desc','Newest'],['date-asc','Oldest'],['amount-desc','Highest'],['amount-asc','Lowest']] },
                    ].map((f, i) => (
                      <select key={i} value={f.val} onChange={e => f.set(e.target.value)} style={{
                        background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)',
                        color: 'var(--text)', padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'Cabinet Grotesk', cursor: 'pointer',
                      }}>
                        {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    ))}
                  </div>

                  {/* List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {filteredTx.map(tx => (
                      <TxItem key={tx.id} tx={tx}
                        onEdit={t => { setEditTx(t); setShowAddModal(true); }}
                        onDelete={handleDeleteTx} />
                    ))}
                    {filteredTx.length === 0 && (
                      <div style={{ textAlign: 'center', padding: 56, color: 'var(--muted2)' }}>
                        <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.35 }}>📭</div>
                        <div style={{ fontSize: 14 }}>No transactions found</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══ AI ADVISOR ═════════════════════════════ */}
              {activeTab === 'ai' && (
                <AIAdvisor
                  transactions={transactions}
                  budget={budgetAmt}
                  month={viewMonth}
                  year={viewYear}
                  summary={summary}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Modals ───────────────────────────────────────── */}
      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setEditTx(null); }}
        title={editTx ? 'Edit Transaction' : 'New Transaction'}>
        <TxForm onSave={handleSaveTx} onClose={() => { setShowAddModal(false); setEditTx(null); }} editTx={editTx} />
      </Modal>

      <Modal open={showBudgetModal} onClose={() => setShowBudgetModal(false)} title="Set Monthly Budget" width={380}>
        <Input label="Budget Amount (₹)" type="number" value={budgetInput}
          onChange={e => setBudgetInput(e.target.value)} placeholder="e.g. 30000" min="0" />
        <div style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 16, marginTop: -8 }}>
          Setting budget for {MONTHS[viewMonth - 1]} {viewYear}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" onClick={() => setShowBudgetModal(false)} style={{ flex: 1 }}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSaveBudget} disabled={savingBudget} style={{ flex: 2 }}>
            {savingBudget ? 'Saving…' : 'Save Budget'}
          </Btn>
        </div>
      </Modal>

      <Toast toasts={toasts} />
    </>
  );
}
