import React, { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import api from './api';

const money = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(n || 0));

const emptyProduct = {
  name: '',
  sku: '',
  description: '',
  category_id: '',
  supplier_id: '',
  quantity: 0,
  reorder_level: 5,
  unit_price: 0,
};

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('inventory_user') || 'null'));
  const [authMode, setAuthMode] = useState('login');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem('inventory_token');
    localStorage.removeItem('inventory_user');
    setUser(null);
    navigate('/login');
  };

  async function submitAuth(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const path = authMode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(path, Object.fromEntries(form.entries()));
      localStorage.setItem('inventory_token', data.token);
      localStorage.setItem('inventory_user', JSON.stringify(data.user));
      setUser(data.user);
      setNotice('');
      navigate('/');
    } catch (err) {
      setNotice(err.response?.data?.message || 'Unable to authenticate. Check that the API is running.');
    }
  }

  if (!user) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="brand-mark"><i className="bi bi-box-seam" /></div>
          <h2>StockWise</h2>
          <p className="muted">Inventory & stock management</p>
          {notice && <div className="alert alert-danger">{notice}</div>}
          <form onSubmit={submitAuth} className="d-grid gap-3">
            {authMode === 'register' && <input name="name" className="form-control" placeholder="Full name" required />}
            <input name="email" type="email" className="form-control" placeholder="Email address" required />
            <input name="password" type="password" minLength="8" className="form-control" placeholder="Password (min 8 characters)" required />
            <button className="btn btn-primary py-2">{authMode === 'login' ? 'Sign in' : 'Create account'}</button>
          </form>
          <p className="mt-3 mb-0 small">
            {authMode === 'login' ? 'New to StockWise?' : 'Already registered?'}{' '}
            <button className="link-button" onClick={() => { setNotice(''); setAuthMode(authMode === 'login' ? 'register' : 'login'); }}>
              {authMode === 'login' ? 'Create account' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  const titles = {
    '/': 'Overview',
    '/products': 'Products',
    '/categories': 'Categories',
    '/suppliers': 'Suppliers',
    '/stock': 'Stock movements',
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="side-brand"><span className="brand-mark small-mark"><i className="bi bi-box-seam" /></span><span>StockWise</span></div>
        <div className="side-label">WORKSPACE</div>
        <NavLink to="/" end className="side-link"><i className="bi bi-grid-1x2" /> Dashboard</NavLink>
        <NavLink to="/products" className="side-link"><i className="bi bi-boxes" /> Products</NavLink>
        <NavLink to="/categories" className="side-link"><i className="bi bi-tags" /> Categories</NavLink>
        <NavLink to="/suppliers" className="side-link"><i className="bi bi-truck" /> Suppliers</NavLink>
        <NavLink to="/stock" className="side-link"><i className="bi bi-arrow-left-right" /> Stock movements</NavLink>
        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
            <div className="user-meta"><strong>{user.name}</strong><small>{user.role}</small></div>
            <button title="Sign out" onClick={logout} className="logout"><i className="bi bi-box-arrow-right" /></button>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div><span className="eyebrow">INVENTORY CONTROL</span><h5 className="mb-0">{titles[location.pathname] || 'Workspace'}</h5></div>
          <div className="top-date"><i className="bi bi-calendar3 me-2" />{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </header>
        {notice && <div className="alert alert-info">{notice}<button className="btn-close float-end" onClick={() => setNotice('')} /></div>}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products setNotice={setNotice} />} />
          <Route path="/categories" element={<Resources type="categories" title="Categories" fields={[['name', 'Category name'], ['description', 'Description']]} />} />
          <Route path="/suppliers" element={<Resources type="suppliers" title="Suppliers" fields={[['name', 'Supplier name'], ['contact_name', 'Contact person'], ['email', 'Email'], ['phone', 'Phone'], ['address', 'Address']]} />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/dashboard/summary')
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.response?.data?.message || 'Cannot connect to API. Check that backend and MySQL are running.'));
  }, []);

  const totals = data?.totals || {};
  return (
    <div className="page-content">
      <div className="welcome-row">
        <div><h3>Good to see you</h3><p>Here is what is happening with your inventory today.</p></div>
        <Link to="/products" className="btn btn-primary"><i className="bi bi-plus-lg me-2" />Manage products</Link>
      </div>
      {err && <div className="alert alert-warning">{err}</div>}
      <div className="stats-grid">
        <Stat title="Total products" value={totals.totalProducts ?? '-'} icon="bi-boxes" tone="blue" sub="Unique SKUs in catalog" />
        <Stat title="Units in stock" value={Number(totals.totalUnits || 0).toLocaleString('en-IN')} icon="bi-stack" tone="purple" sub="Across all products" />
        <Stat title="Stock valuation" value={money(totals.stockValue)} icon="bi-currency-rupee" tone="green" sub="Based on unit prices" />
        <Stat title="Low stock alerts" value={totals.lowStock ?? '-'} icon="bi-exclamation-triangle" tone="orange" sub="At or below reorder level" />
      </div>
      <div className="content-grid">
        <section className="panel">
          <div className="panel-head"><div><h5>Low stock alerts</h5><p>Items that may need replenishment</p></div><span className="soft-badge">{data?.lowStock?.length || 0} items</span></div>
          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Product</th><th>SKU</th><th>Available</th><th>Reorder at</th></tr></thead>
              <tbody>
                {(data?.lowStock || []).map((p) => <tr key={p.id}><td className="fw-semibold">{p.name}</td><td className="text-secondary">{p.sku}</td><td><span className="stock-low">{p.quantity}</span></td><td>{p.reorder_level}</td></tr>)}
                {data && !data.lowStock.length && <tr><td colSpan="4" className="empty-cell">All products are sufficiently stocked.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><div><h5>Recent stock activity</h5><p>Latest inventory changes</p></div><i className="bi bi-activity panel-icon" /></div>
          <div className="activity-list">
            {(data?.recent || []).map((m) => (
              <div className="activity-item" key={m.id}>
                <span className={`activity-icon ${m.movement_type === 'IN' ? 'in' : 'out'}`}><i className={`bi ${m.movement_type === 'IN' ? 'bi-arrow-down-left' : 'bi-arrow-up-right'}`} /></span>
                <div className="activity-text"><strong>{m.product_name}</strong><small>{m.user_name || 'User'} - {new Date(m.created_at).toLocaleString()}</small></div>
                <span className={m.movement_type === 'IN' ? 'text-success' : 'text-danger'}>{m.movement_type === 'IN' ? '+' : '-'}{m.quantity}</span>
              </div>
            ))}
            {data && !data.recent.length && <p className="empty-cell">No stock movements recorded yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ title, value, icon, tone, sub }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><i className={`bi ${icon}`} /></div><p>{title}</p><h3>{value}</h3><small>{sub}</small></div>;
}

function Field({ label, className = '', children }) {
  return <div className={className}><label className="form-label">{label}</label>{children}</div>;
}

function Products({ setNotice }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const load = () => Promise.all([api.get('/products', { params: { q } }), api.get('/categories'), api.get('/suppliers')])
    .then(([products, cats, sups]) => { setItems(products.data); setCategories(cats.data); setSuppliers(sups.data); })
    .catch((e) => setNotice(e.response?.data?.message || 'Could not load products'));

  useEffect(() => { load(); }, [q]);

  const open = (product) => {
    setEdit(product?.id || null);
    setForm(product ? { ...emptyProduct, ...product, category_id: product.category_id || '', supplier_id: product.supplier_id || '' } : emptyProduct);
  };

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        category_id: form.category_id || null,
        supplier_id: form.supplier_id || null,
        quantity: Number(form.quantity || 0),
        reorder_level: Number(form.reorder_level || 0),
        unit_price: Number(form.unit_price || 0),
      };
      if (edit) await api.put(`/products/${edit}`, payload);
      else await api.post('/products', payload);
      setEdit(null);
      setForm({});
      setNotice('Product saved successfully');
      await load();
    } catch (e) {
      setNotice(e.response?.data?.message || 'Could not save product');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this product and its stock movement history?')) return;
    try {
      await api.delete(`/products/${id}`);
      await load();
      setNotice('Product deleted');
    } catch (e) {
      setNotice(e.response?.data?.message || 'Could not delete product');
    }
  }

  return (
    <div className="page-content">
      <div className="section-title"><div><h3>Products</h3><p>Manage product details, quantities and reorder levels.</p></div><button className="btn btn-primary" onClick={() => open(null)}><i className="bi bi-plus-lg me-2" />Add product</button></div>
      <div className="panel">
        <div className="toolbar"><div className="search-box"><i className="bi bi-search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by product or SKU..." /></div><span className="text-secondary small">{items.length} products</span></div>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Quantity</th><th>Unit price</th><th>Status</th><th /></tr></thead>
            <tbody>
              {items.map((p) => <tr key={p.id}><td><strong>{p.name}</strong><small className="d-block text-secondary">{p.description}</small></td><td>{p.sku}</td><td>{p.category_name || '-'}</td><td className="fw-semibold">{p.quantity}</td><td>{money(p.unit_price)}</td><td><span className={p.quantity <= p.reorder_level ? 'status-pill warning' : 'status-pill success'}>{p.quantity <= p.reorder_level ? 'Low stock' : 'In stock'}</span></td><td className="text-end"><button className="icon-btn" onClick={() => open(p)} title="Edit"><i className="bi bi-pencil" /></button><button className="icon-btn danger" onClick={() => remove(p.id)} title="Delete"><i className="bi bi-trash" /></button></td></tr>)}
              {!items.length && <tr><td colSpan="7" className="empty-cell">No products found. Add your first product to get started.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {(edit !== null || form.name !== undefined) && (
        <div className="modal-backdrop-custom">
          <div className="form-modal">
            <div className="panel-head"><div><h5>{edit ? 'Edit product' : 'Add product'}</h5><p>Enter product information below.</p></div><button className="icon-btn" onClick={() => { setEdit(null); setForm({}); }}><i className="bi bi-x-lg" /></button></div>
            <form onSubmit={save}>
              <div className="form-grid">
                <Field label="Product name *"><input className="form-control" required value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="SKU *"><input className="form-control" required value={form.sku ?? ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
                <Field label="Description" className="span-two"><textarea className="form-control" rows="2" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                <Field label="Category"><select className="form-select" value={form.category_id ?? ''} onChange={(e) => setForm({ ...form, category_id: e.target.value })}><option value="">Uncategorized</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                <Field label="Supplier"><select className="form-select" value={form.supplier_id ?? ''} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}><option value="">No supplier</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
                <Field label="Opening quantity"><input className="form-control" type="number" min="0" step="1" value={form.quantity ?? 0} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
                <Field label="Reorder level"><input className="form-control" type="number" min="0" step="1" value={form.reorder_level ?? 0} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} /></Field>
                <Field label="Unit price (INR)"><input className="form-control" type="number" min="0" step="0.01" value={form.unit_price ?? 0} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} /></Field>
              </div>
              <div className="modal-actions"><button type="button" className="btn btn-light" onClick={() => { setEdit(null); setForm({}); }}>Cancel</button><button disabled={busy} className="btn btn-primary">{busy ? 'Saving...' : 'Save product'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Resources({ type, title, fields }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const singular = title.slice(0, -1).toLowerCase();

  const load = () => api.get(`/${type}`).then((r) => setItems(r.data)).catch((e) => setMsg(e.response?.data?.message || 'Failed to load'));
  useEffect(() => { setForm({}); setEditing(null); load(); }, [type]);

  async function save(e) {
    e.preventDefault();
    try {
      if (editing) await api.put(`/${type}/${editing}`, form);
      else await api.post(`/${type}`, form);
      setForm({});
      setEditing(null);
      setMsg('Saved successfully');
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Save failed');
    }
  }

  async function del(id) {
    if (!confirm('Delete this record?')) return;
    try {
      await api.delete(`/${type}/${id}`);
      load();
      setMsg('Deleted');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Delete failed');
    }
  }

  return (
    <div className="page-content">
      <div className="section-title"><div><h3>{title}</h3><p>Maintain your {title.toLowerCase()} directory.</p></div></div>
      {msg && <div className="alert alert-info">{msg}<button className="btn-close float-end" onClick={() => setMsg('')} /></div>}
      <div className="content-grid resource-grid">
        <section className="panel">
          <div className="panel-head"><div><h5>{editing ? 'Edit record' : `Add ${singular}`}</h5><p>Fill in the information.</p></div></div>
          <form onSubmit={save} className="d-grid gap-3">
            {fields.map(([key, label]) => <Field key={key} label={label}>{key === 'description' || key === 'address' ? <textarea className="form-control" rows="2" value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /> : <input className="form-control" required={key === 'name'} type={key === 'email' ? 'email' : 'text'} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />}</Field>)}
            <div className="d-flex gap-2"><button className="btn btn-primary">{editing ? 'Update' : 'Save'} {singular}</button>{editing && <button type="button" className="btn btn-light" onClick={() => { setEditing(null); setForm({}); }}>Cancel</button>}</div>
          </form>
        </section>
        <section className="panel">
          <div className="panel-head"><div><h5>All {title.toLowerCase()}</h5><p>{items.length} records</p></div></div>
          <div className="resource-list">
            {items.map((item) => <div className="resource-item" key={item.id}><div><strong>{item.name}</strong><small>{item.email || item.description || item.phone || item.contact_name || '-'}</small></div><div><button className="icon-btn" onClick={() => { setEditing(item.id); setForm(Object.fromEntries(fields.map(([k]) => [k, item[k] || '']))); }}><i className="bi bi-pencil" /></button><button className="icon-btn danger" onClick={() => del(item.id)}><i className="bi bi-trash" /></button></div></div>)}
            {!items.length && <p className="empty-cell">No records yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stock() {
  const [products, setProducts] = useState([]);
  const [moves, setMoves] = useState([]);
  const [form, setForm] = useState({ movement_type: 'IN', quantity: 1, note: '' });
  const [msg, setMsg] = useState('');

  const load = () => Promise.all([api.get('/products'), api.get('/stock/movements')])
    .then(([p, m]) => { setProducts(p.data); setMoves(m.data); })
    .catch((e) => setMsg(e.response?.data?.message || 'Could not load stock data'));
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      const path = form.movement_type === 'IN' ? '/stock/in' : '/stock/out';
      await api.post(path, { product_id: Number(form.product_id), quantity: Number(form.quantity), note: form.note });
      setMsg('Stock movement recorded');
      setForm({ ...form, quantity: 1, note: '' });
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Could not record movement');
    }
  }

  return (
    <div className="page-content">
      <div className="section-title"><div><h3>Stock movements</h3><p>Record incoming deliveries and outgoing stock.</p></div></div>
      {msg && <div className="alert alert-info">{msg}<button className="btn-close float-end" onClick={() => setMsg('')} /></div>}
      <div className="content-grid resource-grid">
        <section className="panel">
          <div className="panel-head"><div><h5>Record a movement</h5><p>Stock is updated automatically.</p></div></div>
          <form onSubmit={submit} className="d-grid gap-3">
            <Field label="Movement type"><select className="form-select" value={form.movement_type} onChange={(e) => setForm({ ...form, movement_type: e.target.value })}><option value="IN">Stock in - receive goods</option><option value="OUT">Stock out - issue goods</option></select></Field>
            <Field label="Product"><select className="form-select" required value={form.product_id || ''} onChange={(e) => setForm({ ...form, product_id: e.target.value })}><option value="">Choose a product...</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) - {p.quantity} available</option>)}</select></Field>
            <Field label="Quantity"><input className="form-control" type="number" min="1" step="1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
            <Field label="Note (optional)"><textarea className="form-control" rows="3" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Purchase order, reason, reference..." /></Field>
            <button className="btn btn-primary">Record movement</button>
          </form>
        </section>
        <section className="panel">
          <div className="panel-head"><div><h5>Movement history</h5><p>Most recent 100 transactions</p></div></div>
          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Product</th><th>Type</th><th>Qty</th><th>By</th><th>Date</th></tr></thead>
              <tbody>
                {moves.map((m) => <tr key={m.id}><td><strong>{m.product_name}</strong><small className="d-block text-secondary">{m.sku}</small></td><td><span className={m.movement_type === 'IN' ? 'status-pill success' : 'status-pill warning'}>{m.movement_type}</span></td><td>{m.quantity}</td><td>{m.user_name || '-'}</td><td className="small">{new Date(m.created_at).toLocaleDateString()}</td></tr>)}
                {!moves.length && <tr><td colSpan="5" className="empty-cell">No movements recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
