import React, { useEffect, useMemo, useState } from 'react';

type MenuCategory = 'Starters' | 'Main Course' | 'Desserts' | 'Drinks';
type ReservationStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
type DashboardTab = 'overview' | 'menu' | 'reservations' | 'settings';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: MenuCategory;
  price: number;
  available: boolean;
}

interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  specialRequest: string;
  status: ReservationStatus;
  createdAt: string;
}

interface AdminCredentials {
  username: string;
  password: string;
}

const STORAGE_KEYS = {
  menu: 'restaurant_menu_items_v1',
  reservations: 'restaurant_reservations_v1',
  admin: 'restaurant_admin_credentials_v1',
};

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'Tomato Basil Soup',
    description: 'Fresh tomato soup with cream swirl and basil.',
    category: 'Starters',
    price: 5.5,
    available: true,
  },
  {
    id: 'm2',
    name: 'Smoky Chicken Burger',
    description: 'Grilled chicken, cheddar, lettuce, and house sauce.',
    category: 'Main Course',
    price: 10.99,
    available: true,
  },
  {
    id: 'm3',
    name: 'Pasta Alfredo',
    description: 'Creamy alfredo pasta with mushrooms and parmesan.',
    category: 'Main Course',
    price: 12.5,
    available: true,
  },
  {
    id: 'm4',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with vanilla ice cream.',
    category: 'Desserts',
    price: 6.75,
    available: true,
  },
  {
    id: 'm5',
    name: 'Mint Lemon Cooler',
    description: 'Refreshing lemon mint cooler, lightly sweetened.',
    category: 'Drinks',
    price: 3.99,
    available: true,
  },
];

const DEFAULT_ADMIN: AdminCredentials = {
  username: 'admin',
  password: 'admin123',
};

const MENU_CATEGORIES: Array<'All' | MenuCategory> = ['All', 'Starters', 'Main Course', 'Desserts', 'Drinks'];

const readFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) return fallback;
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
};

const App: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => readFromStorage(STORAGE_KEYS.menu, DEFAULT_MENU_ITEMS));
  const [reservations, setReservations] = useState<Reservation[]>(() =>
    readFromStorage(STORAGE_KEYS.reservations, [] as Reservation[])
  );
  const [credentials, setCredentials] = useState<AdminCredentials>(() =>
    readFromStorage(STORAGE_KEYS.admin, DEFAULT_ADMIN)
  );

  const [activeCategory, setActiveCategory] = useState<'All' | MenuCategory>('All');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [notice, setNotice] = useState('');

  const [reservationForm, setReservationForm] = useState({
    customerName: '',
    phone: '',
    date: '',
    time: '',
    guests: 2,
    specialRequest: '',
  });

  const [menuDraft, setMenuDraft] = useState({
    name: '',
    description: '',
    category: 'Starters' as MenuCategory,
    price: '',
  });

  const [settingsDraft, setSettingsDraft] = useState({
    username: credentials.username,
    password: credentials.password,
    confirmPassword: credentials.password,
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.menu, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.reservations, JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.admin, JSON.stringify(credentials));
  }, [credentials]);

  const filteredMenuItems = useMemo(() => {
    if (activeCategory === 'All') return menuItems;
    return menuItems.filter((item) => item.category === activeCategory);
  }, [activeCategory, menuItems]);

  const dashboardStats = useMemo(() => {
    const pendingReservations = reservations.filter((r) => r.status === 'Pending').length;
    const availableItems = menuItems.filter((m) => m.available).length;
    return {
      totalMenuItems: menuItems.length,
      availableItems,
      totalReservations: reservations.length,
      pendingReservations,
    };
  }, [menuItems, reservations]);

  const updateReservationField = (field: keyof typeof reservationForm, value: string | number) => {
    setReservationForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleReservationSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reservationForm.customerName || !reservationForm.phone || !reservationForm.date || !reservationForm.time) {
      setNotice('Please fill all required reservation fields.');
      return;
    }

    const newReservation: Reservation = {
      id: crypto.randomUUID(),
      customerName: reservationForm.customerName,
      phone: reservationForm.phone,
      date: reservationForm.date,
      time: reservationForm.time,
      guests: Number(reservationForm.guests),
      specialRequest: reservationForm.specialRequest.trim(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    setReservations((prev) => [newReservation, ...prev]);
    setReservationForm({
      customerName: '',
      phone: '',
      date: '',
      time: '',
      guests: 2,
      specialRequest: '',
    });
    setNotice('Reservation submitted successfully. We will contact you soon.');
  };

  const handleAdminLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loginForm.username === credentials.username && loginForm.password === credentials.password) {
      setIsAdminLoggedIn(true);
      setShowAdminLogin(false);
      setLoginError('');
      setNotice('Admin login successful.');
      setActiveTab('overview');
      return;
    }

    setLoginError('Invalid username or password.');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setNotice('Admin logged out.');
  };

  const handleAddMenuItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedPrice = Number(menuDraft.price);
    if (!menuDraft.name.trim() || !menuDraft.description.trim() || !Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      setNotice('Please provide a valid name, description, and price.');
      return;
    }

    const newItem: MenuItem = {
      id: crypto.randomUUID(),
      name: menuDraft.name.trim(),
      description: menuDraft.description.trim(),
      category: menuDraft.category,
      price: normalizedPrice,
      available: true,
    };

    setMenuItems((prev) => [newItem, ...prev]);
    setMenuDraft({ name: '', description: '', category: 'Starters', price: '' });
    setNotice(`Added "${newItem.name}" to menu.`);
  };

  const toggleMenuItemAvailability = (itemId: string) => {
    setMenuItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, available: !item.available } : item)));
  };

  const deleteMenuItem = (itemId: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateReservationStatus = (reservationId: string, status: ReservationStatus) => {
    setReservations((prev) => prev.map((entry) => (entry.id === reservationId ? { ...entry, status } : entry)));
  };

  const handleSettingsUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!settingsDraft.username.trim() || !settingsDraft.password) {
      setNotice('Username and password are required.');
      return;
    }

    if (settingsDraft.password !== settingsDraft.confirmPassword) {
      setNotice('Password and confirm password do not match.');
      return;
    }

    setCredentials({
      username: settingsDraft.username.trim(),
      password: settingsDraft.password,
    });
    setNotice('Admin credentials updated.');
  };

  return (
    <div className="page">
      <header className="top-bar">
        <div>
          <h1>Bistro Delight</h1>
          <p>Dynamic Restaurant Website</p>
        </div>
        <div className="top-actions">
          {isAdminLoggedIn ? (
            <button className="secondary-btn" onClick={handleAdminLogout}>
              Logout Admin
            </button>
          ) : (
            <button className="secondary-btn" onClick={() => setShowAdminLogin(true)}>
              Admin Login
            </button>
          )}
        </div>
      </header>

      <main>
        <section className="hero section-card">
          <div>
            <h2>Fresh food, warm service, and an easy booking experience.</h2>
            <p>
              Customers can browse a dynamic menu and reserve tables online. Admin can log in to manage menu items,
              reservations, and account settings from a dashboard.
            </p>
          </div>
          <div className="hero-stats">
            <div>
              <strong>{dashboardStats.totalMenuItems}</strong>
              <span>Menu Items</span>
            </div>
            <div>
              <strong>{dashboardStats.totalReservations}</strong>
              <span>Reservations</span>
            </div>
          </div>
        </section>

        {notice && <p className="notice">{notice}</p>}

        <section className="section-card">
          <h3>Our Menu</h3>
          <div className="category-row">
            {MENU_CATEGORIES.map((category) => (
              <button
                key={category}
                className={activeCategory === category ? 'chip active-chip' : 'chip'}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="menu-grid">
            {filteredMenuItems.map((item) => (
              <article key={item.id} className="menu-card">
                <div className="menu-header">
                  <h4>{item.name}</h4>
                  <span className={item.available ? 'tag available' : 'tag unavailable'}>
                    {item.available ? 'Available' : 'Not Available'}
                  </span>
                </div>
                <p>{item.description}</p>
                <div className="menu-footer">
                  <small>{item.category}</small>
                  <strong>${item.price.toFixed(2)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-card">
          <h3>Book a Table</h3>
          <form className="form-grid" onSubmit={handleReservationSubmit}>
            <label>
              Name *
              <input
                value={reservationForm.customerName}
                onChange={(e) => updateReservationField('customerName', e.target.value)}
                required
              />
            </label>
            <label>
              Phone *
              <input value={reservationForm.phone} onChange={(e) => updateReservationField('phone', e.target.value)} required />
            </label>
            <label>
              Date *
              <input type="date" value={reservationForm.date} onChange={(e) => updateReservationField('date', e.target.value)} required />
            </label>
            <label>
              Time *
              <input type="time" value={reservationForm.time} onChange={(e) => updateReservationField('time', e.target.value)} required />
            </label>
            <label>
              Guests
              <input
                type="number"
                min={1}
                max={20}
                value={reservationForm.guests}
                onChange={(e) => updateReservationField('guests', Number(e.target.value))}
              />
            </label>
            <label className="full-width">
              Special Request
              <textarea
                value={reservationForm.specialRequest}
                onChange={(e) => updateReservationField('specialRequest', e.target.value)}
                rows={3}
              />
            </label>
            <button className="primary-btn full-width" type="submit">
              Submit Reservation
            </button>
          </form>
        </section>

        {isAdminLoggedIn && (
          <section className="section-card">
            <h3>Admin Dashboard</h3>
            <div className="dashboard-tabs">
              <button className={activeTab === 'overview' ? 'chip active-chip' : 'chip'} onClick={() => setActiveTab('overview')}>
                Overview
              </button>
              <button className={activeTab === 'menu' ? 'chip active-chip' : 'chip'} onClick={() => setActiveTab('menu')}>
                Manage Menu
              </button>
              <button className={activeTab === 'reservations' ? 'chip active-chip' : 'chip'} onClick={() => setActiveTab('reservations')}>
                Reservations
              </button>
              <button className={activeTab === 'settings' ? 'chip active-chip' : 'chip'} onClick={() => setActiveTab('settings')}>
                Settings
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="stats-grid">
                <div className="stat-card">
                  <h4>Total Menu Items</h4>
                  <strong>{dashboardStats.totalMenuItems}</strong>
                </div>
                <div className="stat-card">
                  <h4>Available Items</h4>
                  <strong>{dashboardStats.availableItems}</strong>
                </div>
                <div className="stat-card">
                  <h4>Total Reservations</h4>
                  <strong>{dashboardStats.totalReservations}</strong>
                </div>
                <div className="stat-card">
                  <h4>Pending Reservations</h4>
                  <strong>{dashboardStats.pendingReservations}</strong>
                </div>
              </div>
            )}

            {activeTab === 'menu' && (
              <div className="admin-grid">
                <form className="stacked-form" onSubmit={handleAddMenuItem}>
                  <h4>Add New Menu Item</h4>
                  <input
                    placeholder="Item name"
                    value={menuDraft.name}
                    onChange={(e) => setMenuDraft((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <textarea
                    rows={3}
                    placeholder="Description"
                    value={menuDraft.description}
                    onChange={(e) => setMenuDraft((prev) => ({ ...prev, description: e.target.value }))}
                  />
                  <select
                    value={menuDraft.category}
                    onChange={(e) => setMenuDraft((prev) => ({ ...prev, category: e.target.value as MenuCategory }))}
                  >
                    <option>Starters</option>
                    <option>Main Course</option>
                    <option>Desserts</option>
                    <option>Drinks</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Price"
                    value={menuDraft.price}
                    onChange={(e) => setMenuDraft((prev) => ({ ...prev, price: e.target.value }))}
                  />
                  <button className="primary-btn" type="submit">
                    Add Item
                  </button>
                </form>

                <div className="list-panel">
                  <h4>Current Menu Items</h4>
                  {menuItems.map((item) => (
                    <div className="list-row" key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <p>
                          {item.category} • ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="row-actions">
                        <button className="small-btn" onClick={() => toggleMenuItemAvailability(item.id)}>
                          {item.available ? 'Mark Unavailable' : 'Mark Available'}
                        </button>
                        <button className="small-btn danger" onClick={() => deleteMenuItem(item.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reservations' && (
              <div className="list-panel">
                <h4>Reservation Requests</h4>
                {reservations.length === 0 && <p>No reservations yet.</p>}
                {reservations.map((reservation) => (
                  <div className="list-row" key={reservation.id}>
                    <div>
                      <strong>{reservation.customerName}</strong>
                      <p>
                        {reservation.date} at {reservation.time} • {reservation.guests} guests • {reservation.phone}
                      </p>
                      {reservation.specialRequest && <p>Request: {reservation.specialRequest}</p>}
                    </div>
                    <div className="row-actions">
                      <select
                        value={reservation.status}
                        onChange={(e) => updateReservationStatus(reservation.id, e.target.value as ReservationStatus)}
                      >
                        <option>Pending</option>
                        <option>Confirmed</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'settings' && (
              <form className="stacked-form max-form-width" onSubmit={handleSettingsUpdate}>
                <h4>Update Admin Credentials</h4>
                <label>
                  Username
                  <input
                    value={settingsDraft.username}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, username: e.target.value }))}
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={settingsDraft.password}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </label>
                <label>
                  Confirm Password
                  <input
                    type="password"
                    value={settingsDraft.confirmPassword}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </label>
                <button className="primary-btn" type="submit">
                  Save Credentials
                </button>
              </form>
            )}
          </section>
        )}
      </main>

      {showAdminLogin && (
        <div className="modal-overlay" onClick={() => setShowAdminLogin(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Admin Login</h3>
            <p>Use your admin credentials to access the dashboard.</p>
            <form className="stacked-form" onSubmit={handleAdminLogin}>
              <input
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
              />
              {loginError && <p className="error-text">{loginError}</p>}
              <button className="primary-btn" type="submit">
                Login
              </button>
            </form>
            <small>Default demo login: admin / admin123</small>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #f5f7fb; color: #121826; }
        .page { max-width: 1100px; margin: 0 auto; padding: 20px; }
        .top-bar { display: flex; justify-content: space-between; align-items: center; background: #ffffff; border-radius: 14px; padding: 18px 20px; margin-bottom: 18px; box-shadow: 0 6px 24px rgba(17, 24, 39, 0.06); }
        .top-bar h1 { margin: 0; font-size: 1.45rem; }
        .top-bar p { margin: 2px 0 0; color: #6b7280; font-size: 0.92rem; }
        .section-card { background: #ffffff; border-radius: 14px; padding: 18px; margin-bottom: 18px; box-shadow: 0 6px 24px rgba(17, 24, 39, 0.06); }
        .section-card h3 { margin-top: 0; }
        .hero { display: flex; justify-content: space-between; gap: 24px; align-items: center; }
        .hero h2 { margin-top: 0; font-size: 1.5rem; }
        .hero p { color: #4b5563; max-width: 620px; }
        .hero-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; min-width: 220px; }
        .hero-stats div { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; text-align: center; }
        .hero-stats strong { display: block; font-size: 1.4rem; }
        .hero-stats span { color: #6b7280; font-size: 0.82rem; }
        .category-row, .dashboard-tabs { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
        .chip { border: 1px solid #cbd5e1; background: #fff; border-radius: 999px; padding: 8px 12px; cursor: pointer; }
        .active-chip { background: #111827; color: #fff; border-color: #111827; }
        .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
        .menu-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #fcfcfd; }
        .menu-card h4 { margin: 0; }
        .menu-card p { color: #4b5563; margin: 10px 0; }
        .menu-header, .menu-footer { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .menu-footer small { color: #6b7280; }
        .tag { border-radius: 999px; font-size: 0.75rem; padding: 4px 8px; font-weight: 600; }
        .available { background: #dcfce7; color: #166534; }
        .unavailable { background: #fee2e2; color: #991b1b; }
        .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .form-grid label, .stacked-form label { display: flex; flex-direction: column; gap: 5px; color: #374151; font-size: 0.9rem; }
        .full-width { grid-column: 1 / -1; }
        input, textarea, select { border: 1px solid #d1d5db; border-radius: 10px; padding: 10px 11px; font: inherit; background: #fff; }
        textarea { resize: vertical; }
        .primary-btn, .secondary-btn, .small-btn { border: none; border-radius: 10px; padding: 10px 12px; cursor: pointer; font-weight: 600; }
        .primary-btn { background: #111827; color: #fff; }
        .secondary-btn, .small-btn { background: #e5e7eb; color: #111827; }
        .danger { background: #fee2e2; color: #991b1b; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
        .stat-card { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
        .stat-card h4 { margin: 0 0 4px; font-size: 0.92rem; color: #475569; }
        .stat-card strong { font-size: 1.4rem; }
        .admin-grid { display: grid; grid-template-columns: 320px 1fr; gap: 12px; }
        .stacked-form { display: flex; flex-direction: column; gap: 10px; }
        .list-panel { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; background: #fff; }
        .list-panel h4 { margin-top: 0; }
        .list-row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .list-row:last-child { border-bottom: none; }
        .list-row p { margin: 3px 0; color: #4b5563; font-size: 0.9rem; }
        .row-actions { display: flex; align-items: center; gap: 8px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(17, 24, 39, 0.45); display: grid; place-items: center; padding: 16px; }
        .modal-card { width: 100%; max-width: 380px; background: #fff; border-radius: 12px; padding: 16px; }
        .modal-card h3 { margin: 0; }
        .modal-card p { margin-top: 6px; color: #6b7280; }
        .modal-card small { display: block; margin-top: 8px; color: #6b7280; }
        .error-text { color: #b91c1c; margin: 0; font-size: 0.85rem; }
        .notice { background: #eef2ff; color: #312e81; border: 1px solid #c7d2fe; border-radius: 10px; padding: 10px 12px; margin: 0 0 18px; }
        .max-form-width { max-width: 420px; }

        @media (max-width: 860px) {
          .hero { flex-direction: column; align-items: flex-start; }
          .hero-stats { width: 100%; }
          .admin-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 700px) {
          .form-grid { grid-template-columns: 1fr; }
          .top-bar { flex-direction: column; align-items: flex-start; gap: 12px; }
          .top-actions { width: 100%; }
          .top-actions button { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default App;
