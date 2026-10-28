import React from 'react';
import { useLocation } from 'wouter';
import { FormattedMessage } from 'react-intl';
import { Home, Calendar, GraduationCap, LogOut, User } from 'lucide-react';
import { useGetCurrentUserQuery, useLogoutMutation } from '@/redux/api/user';

type NavItem = {
  titleId: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
};

const navItems: NavItem[] = [
  {
    titleId: 'sider.home',
    icon: Home,
    path: '/',
  },
  {
    titleId: 'sider.cases',
    icon: Calendar,
    path: '/cases',
  },
];

export const Sider: React.FC = () => {
  const [location, setLocation] = useLocation();

  // 使用Redux RTK Query获取用户信息
  const { data: user, isLoading: loading } = useGetCurrentUserQuery();
  const [logout] = useLogoutMutation();

  // 导航函数
  const navigateTo = (path: string) => {
    setLocation(path);
  };

  // 退出登录
  const signOut = async () => {
    try {
      await logout().unwrap();
      window.location.href = '/auth/sign-in';
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  // 检查当前路径是否激活
  const isActive = (path: string) => {
    if (path === '/') {
      return location === path;
    }
    return location.includes(path);
  };

  if (loading) {
    return (
      <div className="fixed py-4 w-20 h-screen bg-sidebar border-r border-sidebar-border z-50 transition-all overflow-hidden hover:w-60 hover:z-[52]">
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sidebar-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed py-4 w-20 h-screen bg-sidebar border-r border-sidebar-border z-50 transition-all overflow-hidden hover:w-60 hover:z-[52]">
      <ul className="relative h-full w-full">
        {/* 用户头像 */}
        <li
          onClick={() => navigateTo('/user')}
          className="mb-4 w-full flex justify-center items-center cursor-pointer"
        >
          {user ? (
            <div className="w-12 h-12 rounded-full bg-sidebar-accent flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-sidebar-primary" />
              )}
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-sidebar-accent flex items-center justify-center">
              <User className="w-6 h-6 text-sidebar-primary" />
            </div>
          )}
        </li>

        {/* 导航项 */}
        {navItems.map((navItem, index) => {
          const IconComponent = navItem.icon;
          return (
            <li key={index} className="relative">
              <div
                onClick={() => navigateTo(navItem.path)}
                className={`flex pl-2 ml-1 my-2 rounded-l-full items-center w-60 cursor-pointer transition-colors ${
                  isActive(navItem.path)
                    ? 'bg-sidebar-accent'
                    : 'hover:bg-sidebar-accent/50'
                }`}
              >
                <IconComponent className="w-5 h-5 m-3 text-sidebar-primary" />
                <div className="mx-6 my-3 text-sidebar-foreground whitespace-nowrap">
                  <FormattedMessage id={navItem.titleId} />
                </div>
              </div>
            </li>
          );
        })}

        {/* 管理中心 - 角色ID>=2 可见 */}
        {user && user.roleId >= 2 && (
          <li className="relative">
            <div
              onClick={() => navigateTo('/sadmin')}
              className="flex pl-2 ml-1 my-2 rounded-l-full items-center w-60 cursor-pointer hover:bg-sidebar-accent/50"
            >
              <GraduationCap className="w-5 h-5 m-3 text-sidebar-primary" />
              <div className="mx-6 my-3 text-sidebar-foreground whitespace-nowrap">
                <FormattedMessage id="sider.adminCenter" />
              </div>
            </div>
          </li>
        )}

        {/* 退出登录 */}
        <li className="absolute bottom-3">
          <div
            onClick={signOut}
            className="flex pl-2 ml-1 my-2 rounded-l-full items-center w-60 cursor-pointer hover:bg-sidebar-accent/50 active:bg-sidebar"
          >
            <LogOut className="w-5 h-5 m-3 text-sidebar-primary" />
            <div className="mx-6 my-3 text-sidebar-foreground whitespace-nowrap">
              <FormattedMessage id="sider.logout" />
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
};
