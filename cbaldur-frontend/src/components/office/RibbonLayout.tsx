import React, { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Settings,
  User,
  LogOut,
  LayoutDashboard,
  Library,
  Search,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useIntl } from 'react-intl';
import { useGetCurrentUserQuery, useLogoutMutation } from '@/redux/api/user';
import { RibbonTab } from './RibbonTab';
import { RibbonGroup } from './RibbonGroup';
import { RibbonButton } from './RibbonButton';
import { StatusBar } from './StatusBar';
import {
  RibbonCollapseProvider,
  useRibbonCollapse,
} from './RibbonCollapseContext';

interface RibbonLayoutProps {
  children: React.ReactNode;
}

type TabId = 'home' | 'user' | 'papers' | 'reader' | 'notes';

const getActiveTabFromPath = (path: string): TabId => {
  if (path.startsWith('/user')) return 'user';
  if (path.startsWith('/notes')) return 'notes';
  if (/^\/papers\/\d+/.test(path)) return 'reader';
  if (path.startsWith('/papers')) return 'papers';
  return 'home';
};

const pathWithoutQuery = (path: string) => path.split('?')[0] ?? path;

export const RibbonLayout: React.FC<RibbonLayoutProps> = ({ children }) => (
  <RibbonCollapseProvider>
    <RibbonLayoutInner>{children}</RibbonLayoutInner>
  </RibbonCollapseProvider>
);

const RibbonLayoutInner: React.FC<RibbonLayoutProps> = ({ children }) => {
  const [location, setLocation] = useLocation();
  const intl = useIntl();
  const { data: user } = useGetCurrentUserQuery();
  const [logout] = useLogoutMutation();
  const { collapsed, toggle } = useRibbonCollapse();

  const activeTab = getActiveTabFromPath(location);
  const [ribbonTab, setRibbonTab] = useState<TabId>(activeTab);

  React.useEffect(() => {
    setRibbonTab(getActiveTabFromPath(location));
  }, [location]);

  const handleTabClick = (tab: TabId) => {
    setRibbonTab(tab);
    const paths: Record<TabId, string> = {
      home: '/',
      user: '/user',
      papers: '/papers',
      reader: location,
      notes: '/notes',
    };
    if (tab !== 'reader' && tab !== ribbonTab) {
      setLocation(paths[tab]);
    }
  };

  const signOut = async () => {
    try {
      await logout().unwrap();
      window.location.href = '/auth/sign-in';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Title Bar */}
      <div className="h-8 bg-[var(--office-blue)] flex items-center px-3 shrink-0 select-none">
        <div className="flex items-center gap-2 flex-1">
          <img
            src="https://s2.loli.net/2024/12/04/nCkNI1J5AmgQ9l6.png"
            alt="Logo"
            className="h-4 w-auto brightness-0 invert"
          />
          <span className="text-white text-xs font-medium tracking-wide">
            CBaldur Simulation Platform
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => setLocation('/user')}
              className="flex items-center gap-1 text-white/90 hover:text-white text-xs cursor-pointer"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-4 h-4 rounded-full"
                />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
              <span>{user.username}</span>
            </button>
          )}
          <button
            onClick={signOut}
            className="text-white/70 hover:text-white cursor-pointer p-0.5"
            title={intl.formatMessage({ id: 'sider.logout' })}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Ribbon Tabs Row */}
      <div className="flex items-end bg-[var(--ribbon-bg)] border-b border-[var(--ribbon-separator)] shrink-0">
        <RibbonTab
          label={intl.formatMessage({ id: 'ribbon.tab.home' })}
          active={ribbonTab === 'home'}
          onClick={() => handleTabClick('home')}
        />
        <RibbonTab
          label={intl.formatMessage({ id: 'ribbon.tab.settings' })}
          active={ribbonTab === 'user'}
          onClick={() => handleTabClick('user')}
        />
        <RibbonTab
          label={intl.formatMessage({ id: 'ribbon.tab.papers' })}
          active={ribbonTab === 'papers'}
          onClick={() => handleTabClick('papers')}
        />
        <RibbonTab
          label={intl.formatMessage({ id: 'ribbon.tab.notes' })}
          active={ribbonTab === 'notes'}
          onClick={() => handleTabClick('notes')}
        />
        {activeTab === 'reader' && (
          <RibbonTab
            label={intl.formatMessage({ id: 'ribbon.tab.reader' })}
            active={ribbonTab === 'reader'}
            contextual
            onClick={() => handleTabClick('reader')}
          />
        )}

        <div className="flex-1" />
        <div className="px-3 py-1 flex items-center gap-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={intl.formatMessage({
                id: 'ribbon.search.placeholder',
              })}
              className="h-6 w-48 bg-white border border-gray-300 rounded-sm pl-7 pr-2 text-xs focus:outline-none focus:border-[var(--office-blue)] focus:ring-1 focus:ring-[var(--office-blue)]/30"
            />
          </div>
          {(ribbonTab === 'home' || ribbonTab === 'user') && (
            <button
              type="button"
              onClick={toggle}
              className="h-6 w-6 flex items-center justify-center rounded-sm text-gray-500 hover:bg-white/80 hover:text-[var(--office-blue)] cursor-pointer"
              title={intl.formatMessage({
                id: collapsed
                  ? 'ribbon.collapse.expand'
                  : 'ribbon.collapse.collapse',
              })}
              aria-label={intl.formatMessage({
                id: collapsed
                  ? 'ribbon.collapse.expand'
                  : 'ribbon.collapse.collapse',
              })}
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Ribbon Content - hidden for tabs that use their own in-page toolbar */}
      {!collapsed &&
        ribbonTab !== 'papers' &&
        ribbonTab !== 'reader' &&
        ribbonTab !== 'notes' && (
          <div className="bg-[var(--ribbon-content-bg)] border-b border-[var(--ribbon-separator)] shrink-0 min-h-[68px] flex items-stretch px-1">
            {ribbonTab === 'home' && (
              <HomeRibbon location={location} onNavigate={setLocation} />
            )}
            {ribbonTab === 'user' && <UserRibbon />}
          </div>
        )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-[#f5f5f5]">
        <div className="p-4 min-h-full flex flex-col">{children}</div>
      </div>

      {/* Status Bar */}
      <StatusBar userInfo={user?.username} />
    </div>
  );
};

const HomeRibbon: React.FC<{
  location: string;
  onNavigate: (path: string) => void;
}> = ({ location, onNavigate }) => {
  const intl = useIntl();
  return (
    <>
      <RibbonGroup title={intl.formatMessage({ id: 'ribbon.group.view' })}>
        <RibbonButton
          icon={LayoutDashboard}
          label={intl.formatMessage({ id: 'ribbon.button.dashboard' })}
          active={pathWithoutQuery(location) === '/'}
        />
      </RibbonGroup>
      <RibbonGroup title={intl.formatMessage({ id: 'ribbon.group.library' })}>
        <RibbonButton
          icon={Library}
          label={intl.formatMessage({ id: 'ribbon.button.papers' })}
          onClick={() => onNavigate('/papers')}
        />
      </RibbonGroup>
    </>
  );
};

const UserRibbon: React.FC = () => {
  const intl = useIntl();
  return (
    <>
      <RibbonGroup title={intl.formatMessage({ id: 'ribbon.group.account' })}>
        <RibbonButton
          icon={Settings}
          label={intl.formatMessage({ id: 'ribbon.button.settings' })}
          active
        />
      </RibbonGroup>
    </>
  );
};
