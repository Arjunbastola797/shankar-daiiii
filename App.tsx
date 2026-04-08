import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

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

/** Hero slideshow — food photography (Unsplash). Crossfade + slow zoom. */
const HERO_FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop',
] as const;

const TESTIMONIALS = [
  {
    quote: 'The menu changes often and it always feels fresh. Booking online took seconds.',
    author: 'Priya K.',
  },
  {
    quote: 'Warm service and honest portions — our favourite spot before a night out.',
    author: 'Marco & Elena',
  },
  {
    quote: 'They accommodated our group and dietary notes without fuss. Highly recommend.',
    author: 'Samir T.',
  },
];

const readFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) return fallback;
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
};

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  const [navOpen, setNavOpen] = useState(false);

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

  const [appView, setAppView] = useState<'public' | 'admin'>('public');
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const adminOn = appView === 'admin' && isAdminLoggedIn;
    document.body.classList.toggle('admin-mode', adminOn);
    return () => document.body.classList.remove('admin-mode');
  }, [appView, isAdminLoggedIn]);

  useEffect(() => {
    if (!isAdminLoggedIn && appView === 'admin') {
      setAppView('public');
    }
  }, [isAdminLoggedIn, appView]);

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

  const recentReservations = useMemo(() => {
    return [...reservations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  }, [reservations]);

  const newBookingsToday = useMemo(() => {
    const ymd = new Date().toISOString().slice(0, 10);
    return reservations.filter((r) => r.date === ymd && r.status === 'Pending').length;
  }, [reservations]);

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
      setNotice('Welcome — live dashboard opened.');
      setActiveTab('overview');
      setAppView('admin');
      return;
    }

    setLoginError('Invalid username or password.');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAppView('public');
    setNotice('Signed out of admin.');
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

  const closeNav = () => setNavOpen(false);

  const clockTime = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date(tick));
  const clockDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(tick));

  if (appView === 'admin' && isAdminLoggedIn) {
    const tabBtn = (id: DashboardTab, label: string) => (
      <button
        key={id}
        type="button"
        className={`admin-nav__btn ${activeTab === id ? 'admin-nav__btn--active' : ''}`}
        onClick={() => setActiveTab(id)}
      >
        {label}
      </button>
    );

    return (
      <div className="admin-app">
        <a className="skip-link" href="#admin-main">
          Skip to dashboard
        </a>
        <aside className="admin-sidebar" aria-label="Admin navigation">
          <div className="admin-sidebar__brand">
            <span className="admin-sidebar__logo">GN</span>
            <div>
              <p className="admin-sidebar__title">Ghamau Nepal</p>
              <p className="admin-sidebar__sub">Live console</p>
            </div>
          </div>
          <nav className="admin-nav">{tabBtn('overview', 'Overview')}{tabBtn('menu', 'Menu')}{tabBtn('reservations', 'Reservations')}{tabBtn('settings', 'Settings')}</nav>
          <div className="admin-sidebar__foot">
            <p className="admin-sidebar__user">Signed in as {credentials.username}</p>
            <button type="button" className="admin-btn-ghost" onClick={() => setAppView('public')}>
              View public site
            </button>
            <button type="button" className="admin-btn-logout" onClick={handleAdminLogout}>
              Sign out
            </button>
          </div>
        </aside>

        <div className="admin-workspace">
          <header className="admin-topbar">
            <div className="admin-topbar__live">
              <span className="admin-live-pill" title="Local session — updates save to this device">
                <span className="admin-live-pill__dot" aria-hidden />
                Live
              </span>
              <div className="admin-topbar__clock">
                <span className="admin-topbar__time">{clockTime}</span>
                <span className="admin-topbar__date">{clockDate}</span>
              </div>
            </div>
            <div className="admin-topbar__meta">
              {newBookingsToday > 0 && (
                <span className="admin-badge-warn">{newBookingsToday} new today</span>
              )}
              <span className="admin-sync">Data sync · local</span>
            </div>
          </header>

          <main id="admin-main" className="admin-main">
            {notice && (
              <div className="admin-toast" role="status">
                {notice}
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="admin-panels">
                <div className="admin-stat-grid">
                  <div className="admin-stat">
                    <span className="admin-stat__label">Menu items</span>
                    <strong className="admin-stat__num">{dashboardStats.totalMenuItems}</strong>
                  </div>
                  <div className="admin-stat">
                    <span className="admin-stat__label">Available</span>
                    <strong className="admin-stat__num">{dashboardStats.availableItems}</strong>
                  </div>
                  <div className="admin-stat">
                    <span className="admin-stat__label">Reservations</span>
                    <strong className="admin-stat__num">{dashboardStats.totalReservations}</strong>
                  </div>
                  <div className="admin-stat admin-stat--accent">
                    <span className="admin-stat__label">Pending</span>
                    <strong className="admin-stat__num">{dashboardStats.pendingReservations}</strong>
                  </div>
                </div>
                <section className="admin-feed">
                  <h2 className="admin-feed__title">Recent bookings</h2>
                  {recentReservations.length === 0 ? (
                    <p className="admin-feed__empty">No reservations yet — they appear here as guests book.</p>
                  ) : (
                    <ul className="admin-feed__list">
                      {recentReservations.map((r) => (
                        <li key={r.id} className="admin-feed__item">
                          <span className={`admin-feed__status admin-feed__status--${r.status === 'Pending' ? 'pending' : 'ok'}`}>{r.status}</span>
                          <span className="admin-feed__who">{r.customerName}</span>
                          <span className="admin-feed__when">
                            {r.date} · {r.time}
                          </span>
                          <span className="admin-feed__guests">{r.guests} pax</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'menu' && (
              <div className="admin-panels admin-panels--split">
                <form className="admin-card admin-form" onSubmit={handleAddMenuItem}>
                  <h2 className="admin-card__h">Add menu item</h2>
                  <input
                    placeholder="Item name"
                    value={menuDraft.name}
                    onChange={(e) => setMenuDraft((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <textarea rows={3} placeholder="Description" value={menuDraft.description} onChange={(e) => setMenuDraft((prev) => ({ ...prev, description: e.target.value }))} />
                  <select value={menuDraft.category} onChange={(e) => setMenuDraft((prev) => ({ ...prev, category: e.target.value as MenuCategory }))}>
                    <option>Starters</option>
                    <option>Main Course</option>
                    <option>Desserts</option>
                    <option>Drinks</option>
                  </select>
                  <input type="number" step="0.01" min="0.01" placeholder="Price" value={menuDraft.price} onChange={(e) => setMenuDraft((prev) => ({ ...prev, price: e.target.value }))} />
                  <button className="admin-btn-primary" type="submit">
                    Publish to menu
                  </button>
                </form>
                <div className="admin-card admin-list">
                  <h2 className="admin-card__h">Live menu</h2>
                  {menuItems.map((item) => (
                    <div className="admin-list__row" key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <p>
                          {item.category} · ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="admin-list__actions">
                        <button type="button" className="admin-btn-small" onClick={() => toggleMenuItemAvailability(item.id)}>
                          {item.available ? 'Unavailable' : 'Available'}
                        </button>
                        <button type="button" className="admin-btn-small admin-btn-small--danger" onClick={() => deleteMenuItem(item.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reservations' && (
              <div className="admin-card admin-list admin-list--wide">
                <h2 className="admin-card__h">All reservations</h2>
                {reservations.length === 0 && <p className="admin-feed__empty">No reservations yet.</p>}
                {reservations.map((reservation) => (
                  <div className="admin-list__row" key={reservation.id}>
                    <div>
                      <strong>{reservation.customerName}</strong>
                      <p>
                        {reservation.date} at {reservation.time} · {reservation.guests} guests · {reservation.phone}
                      </p>
                      {reservation.specialRequest && <p className="admin-list__note">Note: {reservation.specialRequest}</p>}
                    </div>
                    <select
                      className="admin-select"
                      value={reservation.status}
                      onChange={(e) => updateReservationStatus(reservation.id, e.target.value as ReservationStatus)}
                    >
                      <option>Pending</option>
                      <option>Confirmed</option>
                      <option>Completed</option>
                      <option>Cancelled</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'settings' && (
              <form className="admin-card admin-form admin-form--narrow" onSubmit={handleSettingsUpdate}>
                <h2 className="admin-card__h">Credentials</h2>
                <label>
                  Username
                  <input value={settingsDraft.username} onChange={(e) => setSettingsDraft((prev) => ({ ...prev, username: e.target.value }))} />
                </label>
                <label>
                  Password
                  <input type="password" value={settingsDraft.password} onChange={(e) => setSettingsDraft((prev) => ({ ...prev, password: e.target.value }))} />
                </label>
                <label>
                  Confirm password
                  <input type="password" value={settingsDraft.confirmPassword} onChange={(e) => setSettingsDraft((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
                </label>
                <button className="admin-btn-primary" type="submit">
                  Save
                </button>
              </form>
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="site">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <nav className="site-nav" aria-label="Primary">
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={navOpen}
            aria-controls="nav-menu"
            onClick={() => setNavOpen((o) => !o)}
          >
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
            <span className="sr-only">Menu</span>
          </button>

          <a className="nav-logo font-serif" href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            Ghamau Nepal
          </a>

          <ul id="nav-menu" className={`nav-links ${navOpen ? 'nav-links--open' : ''}`}>
            <li>
              <a href="#menu" onClick={closeNav}>
                Menu
              </a>
            </li>
            <li>
              <a href="#book" onClick={closeNav}>
                Book
              </a>
            </li>
            <li>
              <a href="#testimonials" onClick={closeNav}>
                Testimonials
              </a>
            </li>
            <li>
              <a href="#contact" onClick={closeNav}>
                Contact
              </a>
            </li>
          </ul>

          <div className="nav-actions">
            {isAdminLoggedIn ? (
              <>
                <button type="button" className="nav-link-btn" onClick={() => { setAppView('admin'); closeNav(); }}>
                  Dashboard
                </button>
                <button type="button" className="nav-link-btn" onClick={handleAdminLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button type="button" className="nav-link-btn" onClick={() => setShowAdminLogin(true)}>
                Admin
              </button>
            )}
            <button type="button" className="btn-cta-nav" onClick={() => { scrollToId('book'); closeNav(); }}>
              Book your table
            </button>
          </div>
        </nav>
      </header>

      <main id="main-content" className="site-main">
        <section className="hero-hero" aria-labelledby="hero-heading">
          <div className="hero-hero__bg" aria-hidden="true">
            {HERO_FOOD_IMAGES.map((src, index) => (
              <div key={src} className="hero-hero__slide" style={{ backgroundImage: `url(${src})` }} data-slide={index} />
            ))}
            <div className="hero-hero__gradient" />
          </div>
          <div className="hero-hero__inner site-inner">
            <p className="hero-hero__kicker">This is Ghamau Nepal</p>
            <h1 id="hero-heading" className="hero-hero__title font-serif">
              We&apos;ve grown — our welcome is the same.
            </h1>
            <p className="hero-hero__sub">
              A dynamic menu, instant table requests, and an admin dashboard for your team. Guests see what you publish; you
              control it after login.
            </p>
            <div className="hero-hero__cta">
              <button type="button" className="btn-cta-hero" onClick={() => scrollToId('book')}>
                Book your table
              </button>
              <button type="button" className="btn-ghost-hero" onClick={() => scrollToId('menu')}>
                View menu
              </button>
            </div>
          </div>
        </section>

        {notice && (
          <div className="site-inner notice-banner" role="status">
            {notice}
          </div>
        )}

        <section id="menu" className="section-block section-menu">
          <div className="site-inner">
            <header className="section-intro">
              <h2 className="section-intro__title font-serif">Menu</h2>
              <p className="section-intro__lede">Dishes and prices update live when staff edit them in the admin panel.</p>
            </header>

            <div className="category-row">
              {MENU_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={activeCategory === category ? 'chip chip--active' : 'chip'}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="menu-grid">
              {filteredMenuItems.map((item) => (
                <article key={item.id} className="menu-card">
                  <div className="menu-card__top">
                    <h3 className="menu-card__name">{item.name}</h3>
                    <span className={item.available ? 'tag tag--ok' : 'tag tag--off'}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <p className="menu-card__desc">{item.description}</p>
                  <div className="menu-card__meta">
                    <span className="menu-card__cat">{item.category}</span>
                    <span className="menu-card__price">${item.price.toFixed(2)}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="section-block section-testimonials">
          <div className="site-inner">
            <header className="section-intro section-intro--center">
              <h2 className="section-intro__title font-serif">Testimonials</h2>
              <p className="section-intro__lede">What guests say — your real reviews can replace these anytime.</p>
            </header>
            <div className="testimonial-grid">
              {TESTIMONIALS.map((t) => (
                <blockquote key={t.author} className="testimonial-card">
                  <p className="testimonial-card__quote">&ldquo;{t.quote}&rdquo;</p>
                  <footer className="testimonial-card__by">— {t.author}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section id="book" className="section-block section-book">
          <div className="site-inner section-book__grid">
            <div className="section-book__copy">
              <h2 className="section-intro__title font-serif">Book your table</h2>
              <p className="section-intro__lede">
                Reserve in a few steps — same flow your team sees in the live dashboard. We&apos;ll confirm by phone.
              </p>
            </div>
            <form className="book-form" onSubmit={handleReservationSubmit}>
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
              <label className="book-form__full">
                Special request
                <textarea
                  value={reservationForm.specialRequest}
                  onChange={(e) => updateReservationField('specialRequest', e.target.value)}
                  rows={3}
                />
              </label>
              <button className="btn-cta-hero book-form__submit" type="submit">
                Submit reservation
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer id="contact" className="site-footer">
        <div className="site-inner site-footer__grid">
          <div>
            <p className="site-footer__brand font-serif">Ghamau Nepal</p>
            <p className="site-footer__text">
              Inspired by the clarity of classic restaurant sites — dynamic menu and booking, with a secure admin area for your team.
            </p>
          </div>
          <div>
            <h3 className="site-footer__heading">Sitemap</h3>
            <ul className="site-footer__links">
              <li>
                <a href="#menu">Menu</a>
              </li>
              <li>
                <a href="#book">Book</a>
              </li>
              <li>
                <a href="#testimonials">Testimonials</a>
              </li>
              <li>
                {isAdminLoggedIn ? (
                  <button type="button" className="site-footer__link-btn" onClick={() => setAppView('admin')}>
                    Dashboard
                  </button>
                ) : (
                  <button type="button" className="site-footer__link-btn" onClick={() => setShowAdminLogin(true)}>
                    Admin login
                  </button>
                )}
              </li>
            </ul>
          </div>
          <div>
            <h3 className="site-footer__heading">Contact</h3>
            <p className="site-footer__text">Replace with your phone, email, and hours.</p>
            <p className="site-footer__muted">© {new Date().getFullYear()} Ghamau Nepal</p>
          </div>
        </div>
      </footer>

      {showAdminLogin && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-login-title"
          onClick={() => setShowAdminLogin(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 id="admin-login-title" className="modal-card__title font-serif">
              Admin login
            </h2>
            <p className="modal-card__lede">Sign in to manage menu, reservations, and settings.</p>
            <form className="stacked-form" onSubmit={handleAdminLogin}>
              <input
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                autoComplete="username"
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                autoComplete="current-password"
              />
              {loginError && <p className="form-error">{loginError}</p>}
              <button className="btn-cta-hero" type="submit">
                Login
              </button>
            </form>
            <p className="modal-card__hint">Demo: admin / admin123</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
