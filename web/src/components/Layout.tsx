import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/', label: '종 도감', end: true },
  { to: '/compat', label: '합사 체크 (2종)' },
  { to: '/tank-builder', label: '어항 구성 체크' },
  { to: '/my-tanks', label: '내 어항' },
];

export function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>열대어 도감 &amp; 합사 호환성 체커</h1>
        <p className="sub">React + Supabase 마이그레이션 진행 중</p>
        <nav className="tab-nav">
          {TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
