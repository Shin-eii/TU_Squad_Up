import { NavLink } from 'react-router-dom';
import { useToast } from './Toast.jsx';

const icon = (paths) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    {paths}
  </svg>
);

const TABS = [
  { key: 'map', label: 'MAP', icon: icon(<><path d="M10 18s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10z" /><circle cx="10" cy="8" r="2" /></>) },
  { key: 'browse', label: 'BROWSE', icon: icon(<><circle cx="9" cy="9" r="6" /><path d="M13.5 13.5 18 18" /></>) },
  { key: 'host', label: 'HOST', to: '/host/new', host: true },
  { key: 'mine', label: 'MINE', to: '/mine', icon: icon(<path d="M3 5h14M3 10h14M3 15h9" />) },
  { key: 'alerts', label: 'ALERTS', icon: icon(<><path d="M6 8a4 4 0 0 1 8 0c0 4 2 5 2 5H4s2-1 2-5z" /><path d="M8.5 16a1.5 1.5 0 0 0 3 0" /></>) },
  { key: 'me', label: 'ME', icon: icon(<><circle cx="10" cy="7" r="3.2" /><path d="M4 17c.8-3 3.1-4.5 6-4.5s5.2 1.5 6 4.5" /></>) },
];

const hostIcon = (
  <span className="tab-host-icon" aria-hidden="true">
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M10 3v14M3 10h14" /></svg>
  </span>
);

export default function TabBar() {
  const toast = useToast();
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((tab) =>
        tab.to ? (
          <NavLink key={tab.key} to={tab.to} className={({ isActive }) => `tab${isActive && !tab.host ? ' active' : ''}`}>
            {tab.host ? hostIcon : tab.icon}
            <span>{tab.label}</span>
          </NavLink>
        ) : (
          <button key={tab.key} type="button" className="tab" onClick={() => toast(`The ${tab.label.toLowerCase()} screen isn't built yet.`)}>
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ),
      )}
    </nav>
  );
}
