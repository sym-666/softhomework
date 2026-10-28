import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { toast } from 'sonner';
import { Button } from '@/shadcn/components/ui/button';
import { Input } from '@/shadcn/components/ui/input';
import { Textarea } from '@/shadcn/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table';
import { Badge } from '@/shadcn/components/ui/badge';
import {
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
  Building2,
  Megaphone,
  FolderOpen,
} from 'lucide-react';
import {
  useGetCurrentUserQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
} from '@/redux/api/user';
import {
  useGetOrganizationsQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useAddUserToOrganizationMutation,
  useRemoveUserFromOrganizationMutation,
} from '@/redux/api/organization';
import {
  useGetNoticesQuery,
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useDeleteNoticeMutation,
} from '@/redux/api/notice';
import {
  useLazyGetAdminCasesQuery,
  type CaseListItem,
} from '@/redux/api/case';
import { RibbonGroup } from '@/components/office/RibbonGroup';
import { RibbonButton } from '@/components/office/RibbonButton';

const roleText: Record<number, string> = {
  1: '普通用户',
  2: '组织管理员',
  3: '超级管理员',
};

type AdminTab = 'users' | 'organizations' | 'notices' | 'cases';

const tabConfig: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; superAdminOnly?: boolean }[] = [
  { id: 'users', label: '用户管理', icon: Users },
  { id: 'organizations', label: '组织管理', icon: Building2, superAdminOnly: true },
  { id: 'notices', label: '公告管理', icon: Megaphone },
  { id: 'cases', label: '算例概览', icon: FolderOpen },
];

const AdminPage: React.FC = () => {
  const { data: currentUser, isLoading: loadingUser } = useGetCurrentUserQuery();
  const isAdmin = currentUser && currentUser.roleId >= 2;
  const isSuperAdmin = currentUser && currentUser.roleId === 3;

  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  const {
    data: users = [],
    isLoading: loadingUsers,
    refetch: refetchUsers,
  } = useGetUsersQuery(isSuperAdmin ? { includeInactive: true } : undefined, {
    skip: !isAdmin,
  });

  const { data: organizations = [], refetch: refetchOrganizations } =
    useGetOrganizationsQuery(undefined, { skip: !isSuperAdmin });

  const { data: notices = [], refetch: refetchNotices } = useGetNoticesQuery(
    undefined,
    { skip: !isAdmin },
  );

  const [
    triggerGetAdminCases,
    { data: adminCases = [], isLoading: loadingCases },
  ] = useLazyGetAdminCasesQuery();

  const userOrganizationByUserId = useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    for (const user of users) {
      map.set(user.id, user.organizationId);
    }
    return map;
  }, [users]);

  useEffect(() => {
    if (isAdmin) {
      triggerGetAdminCases({});
    }
  }, [isAdmin]);

  const [createUser, { isLoading: creatingUser }] = useCreateUserMutation();
  const [deleteUser, { isLoading: deletingUser }] = useDeleteUserMutation();
  const [createOrganization, { isLoading: creatingOrg }] = useCreateOrganizationMutation();
  const [updateOrganization] = useUpdateOrganizationMutation();
  const [removeOrganization] = useDeleteOrganizationMutation();
  const [addUserToOrganization, { isLoading: invitingUser }] = useAddUserToOrganizationMutation();
  const [removeUserFromOrganization, { isLoading: removingUser }] = useRemoveUserFromOrganizationMutation();
  const [createNotice, { isLoading: creatingNotice }] = useCreateNoticeMutation();
  const [updateNoticeMut] = useUpdateNoticeMutation();
  const [deleteNoticeMut] = useDeleteNoticeMutation();

  const [newUserForm, setNewUserForm] = useState({
    username: '', email: '', password: '', roleId: 1, organizationId: '' as string,
  });
  const [inviteForm, setInviteForm] = useState({ userId: '', username: '', organizationId: '' });
  const [orgForm, setOrgForm] = useState({ name: '', description: '' });
  const [orgEditForm, setOrgEditForm] = useState({ id: '', name: '', description: '' });
  const [orgDeleteId, setOrgDeleteId] = useState('');
  const [noticeForm, setNoticeForm] = useState({ id: '', title: '', content: '', organizationId: '' });
  const [caseFilterOrg, setCaseFilterOrg] = useState('');
  const [caseFilterUser, setCaseFilterUser] = useState('');

  const systemNotices = useMemo(() => notices.filter((n) => !n.organizationId), [notices]);
  const orgNotices = useMemo(() => notices.filter((n) => n.organizationId), [notices]);

  const roleOptions = useMemo(() => [
    { label: '普通用户', value: 1 },
    { label: '组织管理员', value: 2 },
    { label: '超级管理员', value: 3 },
  ], []);

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-[80vh] text-sm text-gray-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-[80vh] text-sm text-gray-500">
        您没有访问管理中心的权限
      </div>
    );
  }

  const handleRefreshAll = () => {
    refetchUsers();
    refetchNotices();
    if (isSuperAdmin) refetchOrganizations();
    triggerGetAdminCases({});
  };

  const handleCreateUser = async () => {
    if (!newUserForm.username || !newUserForm.email || !newUserForm.password) {
      toast.error('请完整填写用户信息'); return;
    }
    if (Number(newUserForm.roleId) === 2 && !newUserForm.organizationId) {
      toast.error('创建组织管理员时请填写组织ID'); return;
    }
    try {
      await createUser({
        username: newUserForm.username, email: newUserForm.email, password: newUserForm.password,
        roleId: Number(newUserForm.roleId) || 1,
        organizationId: newUserForm.organizationId ? String(newUserForm.organizationId) : undefined,
      }).unwrap();
      toast.success('创建成功');
      setNewUserForm({ username: '', email: '', password: '', roleId: 1, organizationId: '' });
      refetchUsers();
    } catch (error: any) { toast.error(error?.data?.message || '创建失败'); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('确定要删除该用户吗？该操作不可撤回。')) return;
    try {
      await deleteUser({ userId }).unwrap();
      toast.success('删除成功'); refetchUsers();
    } catch (error: any) { toast.error(error?.data?.message || '删除失败'); }
  };

  const handleInviteUser = async () => {
    if (!inviteForm.userId || !inviteForm.username) { toast.error('请同时填写用户ID和用户名'); return; }
    if (isSuperAdmin && !inviteForm.organizationId) { toast.error('请填写组织ID'); return; }
    try {
      await addUserToOrganization({
        userId: inviteForm.userId, username: inviteForm.username,
        organizationId: isSuperAdmin && inviteForm.organizationId ? inviteForm.organizationId : undefined,
      }).unwrap();
      toast.success('操作成功');
      setInviteForm({ userId: '', username: '', organizationId: '' }); refetchUsers();
    } catch (error: any) { toast.error(error?.data?.message || '邀请失败或用户不存在'); }
  };

  const handleRemoveFromOrg = async (userId: string) => {
    try {
      await removeUserFromOrganization({ userId }).unwrap();
      toast.success('已移出组织'); refetchUsers();
    } catch (error: any) { toast.error(error?.data?.message || '移出失败'); }
  };

  const handleCreateOrg = async () => {
    if (!orgForm.name) { toast.error('请输入组织名称'); return; }
    try {
      await createOrganization({ name: orgForm.name, description: orgForm.description }).unwrap();
      toast.success('创建成功'); setOrgForm({ name: '', description: '' }); refetchOrganizations();
    } catch (error: any) { toast.error(error?.data || '创建失败'); }
  };

  const handleUpdateOrg = async () => {
    if (!orgEditForm.id) { toast.error('请输入组织ID'); return; }
    try {
      await updateOrganization({ id: orgEditForm.id, name: orgEditForm.name, description: orgEditForm.description }).unwrap();
      toast.success('更新成功'); setOrgEditForm({ id: '', name: '', description: '' }); refetchOrganizations();
    } catch (error: any) { toast.error(error?.data || '更新失败'); }
  };

  const handleDeleteOrg = async () => {
    if (!orgDeleteId) { toast.error('请输入组织ID'); return; }
    try {
      await removeOrganization({ id: orgDeleteId }).unwrap();
      toast.success('删除成功'); setOrgDeleteId(''); refetchOrganizations();
    } catch (error: any) { toast.error(error?.data || '删除失败'); }
  };

  const handleSubmitNotice = async () => {
    if (!noticeForm.title || !noticeForm.content) { toast.error('请输入公告标题和内容'); return; }
    const payload = {
      title: noticeForm.title, content: noticeForm.content,
      organizationId: isSuperAdmin && noticeForm.organizationId ? noticeForm.organizationId : undefined,
    };
    try {
      if (noticeForm.id) {
        await updateNoticeMut({ id: noticeForm.id, title: payload.title, content: payload.content }).unwrap();
        toast.success('公告已更新');
      } else {
        await createNotice(payload).unwrap();
        toast.success('公告已创建');
      }
      setNoticeForm({ id: '', title: '', content: '', organizationId: '' }); refetchNotices();
    } catch (error: any) { toast.error(error?.data?.message || '操作失败'); }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm('确认删除该公告？')) return;
    try {
      await deleteNoticeMut({ id }).unwrap();
      toast.success('删除成功'); refetchNotices();
    } catch (error: any) { toast.error(error?.data?.message || '删除失败'); }
  };

  const visibleTabs = tabConfig.filter(t => !t.superAdminOnly || isSuperAdmin);

  return (
    <div className="-m-4 flex flex-col h-[calc(100vh-120px)]">
      {/* Ribbon Content Bar */}
      <div className="bg-[var(--ribbon-content-bg)] border-b border-[var(--ribbon-separator)] shrink-0 min-h-[68px] flex items-stretch px-1">
        <RibbonGroup title="管理中心">
          {visibleTabs.map((tab) => (
            <RibbonButton
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </RibbonGroup>
        <RibbonGroup title="操作">
          <RibbonButton icon={RefreshCw} label="刷新" onClick={handleRefreshAll} />
        </RibbonGroup>
        <div className="flex-1" />
        <div className="flex items-center px-3">
          <span className="text-[10px] text-gray-400">
            {roleText[currentUser.roleId as keyof typeof roleText]}
          </span>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'users' && (
          <UsersPanel
            currentUser={currentUser}
            isSuperAdmin={!!isSuperAdmin}
            users={users}
            loadingUsers={loadingUsers}
            newUserForm={newUserForm}
            setNewUserForm={setNewUserForm}
            inviteForm={inviteForm}
            setInviteForm={setInviteForm}
            roleOptions={roleOptions}
            creatingUser={creatingUser}
            deletingUser={deletingUser}
            invitingUser={invitingUser}
            removingUser={removingUser}
            onCreateUser={handleCreateUser}
            onDeleteUser={handleDeleteUser}
            onInviteUser={handleInviteUser}
            onRemoveFromOrg={handleRemoveFromOrg}
          />
        )}
        {activeTab === 'organizations' && isSuperAdmin && (
          <OrganizationsPanel
            organizations={organizations}
            orgForm={orgForm}
            setOrgForm={setOrgForm}
            orgEditForm={orgEditForm}
            setOrgEditForm={setOrgEditForm}
            orgDeleteId={orgDeleteId}
            setOrgDeleteId={setOrgDeleteId}
            creatingOrg={creatingOrg}
            onCreateOrg={handleCreateOrg}
            onUpdateOrg={handleUpdateOrg}
            onDeleteOrg={handleDeleteOrg}
          />
        )}
        {activeTab === 'notices' && (
          <NoticesPanel
            isSuperAdmin={!!isSuperAdmin}
            systemNotices={systemNotices}
            orgNotices={orgNotices}
            noticeForm={noticeForm}
            setNoticeForm={setNoticeForm}
            creatingNotice={creatingNotice}
            onSubmitNotice={handleSubmitNotice}
            onDeleteNotice={handleDeleteNotice}
          />
        )}
        {activeTab === 'cases' && (
          <CasesPanel
            isSuperAdmin={!!isSuperAdmin}
            adminCases={adminCases}
            userOrganizationByUserId={userOrganizationByUserId}
            loadingCases={loadingCases}
            caseFilterOrg={caseFilterOrg}
            setCaseFilterOrg={setCaseFilterOrg}
            caseFilterUser={caseFilterUser}
            setCaseFilterUser={setCaseFilterUser}
            onApplyFilter={(org, user) => triggerGetAdminCases({ organizationId: org, userId: user })}
            onResetFilter={() => { setCaseFilterOrg(''); setCaseFilterUser(''); triggerGetAdminCases({}); }}
          />
        )}
      </div>
    </div>
  );
};

/* ===== Users Panel ===== */
const UsersPanel: React.FC<{
  currentUser: any;
  isSuperAdmin: boolean;
  users: any[];
  loadingUsers: boolean;
  newUserForm: any;
  setNewUserForm: (v: any) => void;
  inviteForm: any;
  setInviteForm: (v: any) => void;
  roleOptions: { label: string; value: number }[];
  creatingUser: boolean;
  deletingUser: boolean;
  invitingUser: boolean;
  removingUser: boolean;
  onCreateUser: () => void;
  onDeleteUser: (id: string) => void;
  onInviteUser: () => void;
  onRemoveFromOrg: (id: string) => void;
}> = ({
  currentUser, isSuperAdmin, users, loadingUsers, newUserForm, setNewUserForm,
  inviteForm, setInviteForm, roleOptions, creatingUser, deletingUser, invitingUser,
  removingUser, onCreateUser, onDeleteUser, onInviteUser, onRemoveFromOrg,
}) => (
  <div className="space-y-4">
    {/* Create User Form (Super Admin) */}
    {isSuperAdmin && (
      <div className="bg-white border border-gray-200 rounded-sm p-4">
        <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">创建用户</h4>
        <div className="grid gap-3 md:grid-cols-5">
          <Input placeholder="用户名" className="h-8 text-xs" value={newUserForm.username}
            onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })} />
          <Input placeholder="邮箱" className="h-8 text-xs" value={newUserForm.email}
            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })} />
          <Input placeholder="密码" type="password" className="h-8 text-xs" value={newUserForm.password}
            onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })} />
          <div className="flex items-center gap-2">
            <select className="flex-1 border border-gray-300 rounded-sm px-2 h-8 text-xs"
              value={newUserForm.roleId}
              onChange={(e) => setNewUserForm({ ...newUserForm, roleId: Number(e.target.value) })}>
              {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Input placeholder="组织ID" className="h-8 text-xs flex-1" value={newUserForm.organizationId}
              onChange={(e) => setNewUserForm({ ...newUserForm, organizationId: e.target.value })} />
            <Button size="sm" className="h-8 text-xs bg-[var(--office-blue)] hover:bg-[var(--office-blue-dark)]"
              onClick={onCreateUser} disabled={creatingUser}>
              <Plus className="w-3 h-3 mr-1" /> 创建
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Invite to Org Form (Org Admin) */}
    {currentUser.roleId === 2 && (
      <div className="bg-white border border-gray-200 rounded-sm p-4">
        <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">邀请用户加入组织</h4>
        <div className="grid gap-3 md:grid-cols-4">
          <Input placeholder="用户ID" className="h-8 text-xs" value={inviteForm.userId}
            onChange={(e) => setInviteForm({ ...inviteForm, userId: e.target.value })} />
          <Input placeholder="用户名" className="h-8 text-xs" value={inviteForm.username}
            onChange={(e) => setInviteForm({ ...inviteForm, username: e.target.value })} />
          {isSuperAdmin && (
            <Input placeholder="组织ID" className="h-8 text-xs" value={inviteForm.organizationId}
              onChange={(e) => setInviteForm({ ...inviteForm, organizationId: e.target.value })} />
          )}
          <Button size="sm" className="h-8 text-xs" onClick={onInviteUser} disabled={invitingUser}>
            <UserPlus className="w-3 h-3 mr-1" /> 加入组织
          </Button>
        </div>
      </div>
    )}

    {/* Users Table */}
    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-semibold">ID</TableHead>
            <TableHead className="text-xs font-semibold">用户名</TableHead>
            <TableHead className="text-xs font-semibold">邮箱</TableHead>
            <TableHead className="text-xs font-semibold">角色</TableHead>
            <TableHead className="text-xs font-semibold">组织</TableHead>
            <TableHead className="text-xs font-semibold">状态</TableHead>
            <TableHead className="text-xs font-semibold text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingUsers ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-xs text-gray-400 py-8">
                <Loader2 className="inline w-4 h-4 mr-2 animate-spin" /> 加载用户...
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className="hover:bg-[var(--office-blue-light)]/20">
                <TableCell className="text-xs">{user.id}</TableCell>
                <TableCell className="text-xs font-medium">{user.username}</TableCell>
                <TableCell className="text-xs text-gray-500">{user.email || '—'}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" className="text-[10px]">
                    {roleText[user.roleId] || '未知'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-gray-500">{user.organizationId ?? '—'}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant={user.isActive === false ? 'destructive' : 'default'} className="text-[10px]">
                    {user.isActive === false ? '已停用' : '活跃'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {user.organizationId && currentUser.organizationId === user.organizationId && (
                    <Button variant="outline" size="sm" className="h-6 text-[10px]"
                      onClick={() => onRemoveFromOrg(user.id)} disabled={removingUser}>
                      移出组织
                    </Button>
                  )}
                  {isSuperAdmin && (
                    <Button variant="destructive" size="sm" className="h-6 text-[10px]"
                      onClick={() => onDeleteUser(user.id)} disabled={deletingUser}>
                      <Trash2 className="w-3 h-3 mr-0.5" /> 删除
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);

/* ===== Organizations Panel ===== */
const OrganizationsPanel: React.FC<{
  organizations: any[];
  orgForm: any;
  setOrgForm: (v: any) => void;
  orgEditForm: any;
  setOrgEditForm: (v: any) => void;
  orgDeleteId: string;
  setOrgDeleteId: (v: string) => void;
  creatingOrg: boolean;
  onCreateOrg: () => void;
  onUpdateOrg: () => void;
  onDeleteOrg: () => void;
}> = ({
  organizations, orgForm, setOrgForm, orgEditForm, setOrgEditForm,
  orgDeleteId, setOrgDeleteId, creatingOrg, onCreateOrg, onUpdateOrg, onDeleteOrg,
}) => (
  <div className="space-y-4">
    {/* Create Org */}
    <div className="bg-white border border-gray-200 rounded-sm p-4">
      <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">新建组织</h4>
      <div className="grid gap-3 md:grid-cols-3">
        <Input placeholder="组织名称" className="h-8 text-xs" value={orgForm.name}
          onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
        <Input placeholder="组织描述" className="h-8 text-xs" value={orgForm.description}
          onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })} />
        <Button size="sm" className="h-8 text-xs bg-[var(--office-blue)] hover:bg-[var(--office-blue-dark)]"
          onClick={onCreateOrg} disabled={creatingOrg}>
          <Plus className="w-3 h-3 mr-1" /> 新建组织
        </Button>
      </div>
    </div>

    {/* Edit Org */}
    <div className="bg-white border border-gray-200 rounded-sm p-4">
      <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">编辑组织</h4>
      <div className="grid gap-3 md:grid-cols-4">
        <Input placeholder="组织ID" className="h-8 text-xs" value={orgEditForm.id}
          onChange={(e) => setOrgEditForm({ ...orgEditForm, id: e.target.value })} />
        <Input placeholder="新名称" className="h-8 text-xs" value={orgEditForm.name}
          onChange={(e) => setOrgEditForm({ ...orgEditForm, name: e.target.value })} />
        <Input placeholder="新描述" className="h-8 text-xs" value={orgEditForm.description}
          onChange={(e) => setOrgEditForm({ ...orgEditForm, description: e.target.value })} />
        <Button size="sm" className="h-8 text-xs" onClick={onUpdateOrg}>更新组织</Button>
      </div>
    </div>

    {/* Delete Org */}
    <div className="bg-white border border-gray-200 rounded-sm p-4">
      <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">删除组织</h4>
      <div className="flex items-center gap-3">
        <Input placeholder="要删除的组织ID" className="h-8 text-xs max-w-xs" value={orgDeleteId}
          onChange={(e) => setOrgDeleteId(e.target.value)} />
        <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={onDeleteOrg}>删除组织</Button>
      </div>
    </div>

    {/* Org Table */}
    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-semibold">ID</TableHead>
            <TableHead className="text-xs font-semibold">名称</TableHead>
            <TableHead className="text-xs font-semibold">描述</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id} className="hover:bg-[var(--office-blue-light)]/20">
              <TableCell className="text-xs">{org.id}</TableCell>
              <TableCell className="text-xs font-medium">{org.name}</TableCell>
              <TableCell className="text-xs text-gray-500">{org.description || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

/* ===== Notices Panel ===== */
const NoticesPanel: React.FC<{
  isSuperAdmin: boolean;
  systemNotices: any[];
  orgNotices: any[];
  noticeForm: any;
  setNoticeForm: (v: any) => void;
  creatingNotice: boolean;
  onSubmitNotice: () => void;
  onDeleteNotice: (id: string) => void;
}> = ({
  isSuperAdmin, systemNotices, orgNotices, noticeForm, setNoticeForm,
  creatingNotice, onSubmitNotice, onDeleteNotice,
}) => (
  <div className="space-y-4">
    {/* Notice Form */}
    <div className="bg-white border border-gray-200 rounded-sm p-4">
      <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">
        {noticeForm.id ? '编辑公告' : '发布公告'}
      </h4>
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="公告标题" className="h-8 text-xs" value={noticeForm.title}
            onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} />
          {isSuperAdmin && (
            <Input placeholder="组织ID（空为系统公告）" className="h-8 text-xs" value={noticeForm.organizationId}
              onChange={(e) => setNoticeForm({ ...noticeForm, organizationId: e.target.value })} />
          )}
        </div>
        <Textarea placeholder="公告内容" className="text-xs min-h-[80px]" value={noticeForm.content}
          onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })} />
        <div className="flex items-center gap-2">
          {noticeForm.id && (
            <Input placeholder="公告ID" className="h-8 text-xs max-w-[120px]" value={noticeForm.id} readOnly />
          )}
          <Button size="sm" className="h-8 text-xs bg-[var(--office-blue)] hover:bg-[var(--office-blue-dark)]"
            onClick={onSubmitNotice} disabled={creatingNotice}>
            {noticeForm.id ? '更新公告' : '发布公告'}
          </Button>
          {noticeForm.id && (
            <Button variant="outline" size="sm" className="h-8 text-xs"
              onClick={() => setNoticeForm({ id: '', title: '', content: '', organizationId: '' })}>
              取消编辑
            </Button>
          )}
        </div>
      </div>
    </div>

    {/* System Notices */}
    {isSuperAdmin && (
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700">系统公告</h4>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold">ID</TableHead>
              <TableHead className="text-xs font-semibold">标题</TableHead>
              <TableHead className="text-xs font-semibold text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {systemNotices.map((notice) => (
              <TableRow key={notice.id} className="hover:bg-[var(--office-blue-light)]/20">
                <TableCell className="text-xs">{notice.id}</TableCell>
                <TableCell className="text-xs font-medium">{notice.title}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="outline" className="h-6 text-[10px]"
                    onClick={() => setNoticeForm({ id: String(notice.id), title: notice.title, content: notice.content, organizationId: '' })}>
                    编辑
                  </Button>
                  <Button size="sm" variant="destructive" className="h-6 text-[10px]"
                    onClick={() => onDeleteNotice(notice.id)}>
                    删除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )}

    {/* Org Notices */}
    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <h4 className="text-xs font-semibold text-gray-700">组织公告</h4>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs font-semibold">ID</TableHead>
            <TableHead className="text-xs font-semibold">标题</TableHead>
            <TableHead className="text-xs font-semibold">组织</TableHead>
            <TableHead className="text-xs font-semibold text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orgNotices.map((notice) => (
            <TableRow key={notice.id} className="hover:bg-[var(--office-blue-light)]/20">
              <TableCell className="text-xs">{notice.id}</TableCell>
              <TableCell className="text-xs font-medium">{notice.title}</TableCell>
              <TableCell className="text-xs text-gray-500">{notice.organizationId ?? '—'}</TableCell>
              <TableCell className="text-right space-x-1">
                <Button size="sm" variant="outline" className="h-6 text-[10px]"
                  onClick={() => setNoticeForm({ id: String(notice.id), title: notice.title, content: notice.content, organizationId: notice.organizationId?.toString() ?? '' })}>
                  编辑
                </Button>
                <Button size="sm" variant="destructive" className="h-6 text-[10px]"
                  onClick={() => onDeleteNotice(notice.id)}>
                  删除
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

/* ===== Cases Panel ===== */
const CasesPanel: React.FC<{
  isSuperAdmin: boolean;
  adminCases: CaseListItem[];
  userOrganizationByUserId: Map<string, string | null | undefined>;
  loadingCases: boolean;
  caseFilterOrg: string;
  setCaseFilterOrg: (v: string) => void;
  caseFilterUser: string;
  setCaseFilterUser: (v: string) => void;
  onApplyFilter: (org?: string, user?: string) => void;
  onResetFilter: () => void;
}> = ({
  isSuperAdmin, adminCases, userOrganizationByUserId, loadingCases, caseFilterOrg, setCaseFilterOrg,
  caseFilterUser, setCaseFilterUser, onApplyFilter, onResetFilter,
}) => (
  <div className="space-y-4">
    {/* Filters */}
    <div className="bg-white border border-gray-200 rounded-sm p-4">
      <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">筛选</h4>
      <div className="flex flex-col md:flex-row gap-3">
        {isSuperAdmin && (
          <Input placeholder="按组织ID筛选" className="h-8 text-xs max-w-[200px]" value={caseFilterOrg}
            onChange={(e) => setCaseFilterOrg(e.target.value)} />
        )}
        <Input placeholder="按用户ID筛选" className="h-8 text-xs max-w-[200px]" value={caseFilterUser}
          onChange={(e) => setCaseFilterUser(e.target.value)} />
        <Button size="sm" className="h-8 text-xs bg-[var(--office-blue)] hover:bg-[var(--office-blue-dark)]"
          onClick={() => {
            const org = isSuperAdmin && caseFilterOrg.trim() ? caseFilterOrg.trim() : undefined;
            const user = caseFilterUser.trim() ? caseFilterUser.trim() : undefined;
            onApplyFilter(org, user);
          }}>
          应用筛选
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onResetFilter}>重置</Button>
      </div>
    </div>

    {/* Cases Table */}
    <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
      {loadingCases ? (
        <div className="flex items-center justify-center py-10 text-xs text-gray-400">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 加载算例...
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold">案例ID</TableHead>
              <TableHead className="text-xs font-semibold">用户ID</TableHead>
              <TableHead className="text-xs font-semibold">组织ID</TableHead>
              <TableHead className="text-xs font-semibold">状态</TableHead>
              <TableHead className="text-xs font-semibold">备注</TableHead>
              <TableHead className="text-xs font-semibold">创建时间</TableHead>
              <TableHead className="text-xs font-semibold text-right">查看</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminCases.map((item) => (
              <TableRow key={`${item.id}-${item.userId}`} className="hover:bg-[var(--office-blue-light)]/20">
                <TableCell className="text-xs font-medium">{item.caseId}</TableCell>
                <TableCell className="text-xs">{item.userId}</TableCell>
                <TableCell className="text-xs text-gray-500">
                  {item.userId != null
                    ? (userOrganizationByUserId.get(item.userId) ?? '—')
                    : '—'}
                </TableCell>
                <TableCell className="text-xs">{item.status}</TableCell>
                <TableCell className="text-xs text-gray-500 max-w-[200px] truncate">{item.comment || '—'}</TableCell>
                <TableCell className="text-xs text-gray-500">{item.createdAt}</TableCell>
                <TableCell className="text-right">
                  {item.userId ? (
                    <Button variant="outline" size="sm" className="h-6 text-[10px]" asChild>
                      <Link href={`/cases/${item.userId}/${item.id}?admin=1`}>查看详情</Link>
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  </div>
);

export default AdminPage;
