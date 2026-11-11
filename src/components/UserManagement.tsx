import React, { useState, useEffect, useRef } from 'react';
import { getAllUsers, updateUserRole, confirmUserEmail, deleteUser, generateAdminCode, saveAdminCode, approveUser, rejectUser } from '@/lib/admin';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Users, Mail, Trash2, Key, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  approver?: {
    full_name: string;
    email: string;
  };
}

export const UserManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser, resetPassword } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('usuario');

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadUsers();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadUsers = async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await getAllUsers();
      if (error) throw error;

      const transformedUsers = data?.map(user => ({
        id: user.id,
        email: user.auth_users?.email || user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at,
        email_confirmed_at: user.auth_users?.email_confirmed_at,
        last_sign_in_at: user.auth_users?.last_sign_in_at,
        is_approved: user.is_approved || false,
        approved_by: user.approved_by,
        approved_at: user.approved_at,
        approver: user.approver,
      })) || [];

      if (mountedRef.current) {
        setUsers(transformedUsers);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    try {
      const { error } = await updateUserRole(selectedUser.id, newRole);
      if (error) throw error;

      setSuccess(t('admin.users.messages.roleUpdated', { name: selectedUser.full_name, role: newRole }));
      setRoleDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleQuickApprove = async (user: UserProfile) => {
    if (!currentUser) return;

    try {
      // Primero confirmamos el email
      const { error: emailError } = await confirmUserEmail(user.id);
      if (emailError) {
        console.warn('No se pudo confirmar email en auth, pero continuando con aprobación:', emailError);
      }

      // Luego aprobamos el usuario
      const { error: approveError } = await approveUser(user.id, currentUser.id);
      if (approveError) throw approveError;

      // Finalmente asignamos el rol de usuario por defecto
      const { error: roleError } = await updateUserRole(user.id, 'usuario');
      if (roleError) {
        console.warn('No se pudo actualizar el rol a usuario, pero el usuario fue aprobado:', roleError);
      }

      setSuccess(t('admin.users.messages.approvedWithEmail', {
        name: user.full_name,
        status: !emailError ? t('admin.users.messages.yes') : t('admin.users.messages.partial')
      }));
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApproveUser = async () => {
    if (!selectedUser || !currentUser) return;

    try {
      const { error } = await approveUser(selectedUser.id, currentUser.id);
      if (error) throw error;

      setSuccess(t('admin.users.messages.approved', { name: selectedUser.full_name }));
      setRoleDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRejectUser = async () => {
    if (!selectedUser || !currentUser) return;

    try {
      const { error } = await rejectUser(selectedUser.id, currentUser.id);
      if (error) throw error;

      setSuccess(t('admin.users.messages.rejected', { name: selectedUser.full_name }));
      setRoleDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirmEmail = async (userId: string) => {
    try {
      const { error } = await confirmUserEmail(userId);
      if (error) throw error;

      setSuccess(t('admin.users.messages.emailConfirmed'));
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t('admin.users.messages.deleteConfirm'))) {
      return;
    }

    try {
      const { error } = await deleteUser(userId);
      if (error) throw error;

      setSuccess(t('admin.users.messages.deleted'));
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSendReset = async (email: string) => {
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setSuccess(t('admin.users.messages.resetSent', { email }));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'investor': return 'bg-blue-500';
      case 'agent': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getApprovalBadgeColor = (isApproved: boolean) => {
    return isApproved ? 'bg-green-500' : 'bg-yellow-500';
  };

  const getApprovalText = (isApproved: boolean) => {
    return isApproved ? t('admin.users.status.approved') : t('admin.users.status.pending');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">{t('admin.users.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            {t('admin.users.title')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('admin.users.subtitle')}
          </p>
        </div>
        <Button onClick={loadUsers} variant="outline">
          {t('admin.users.update')}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.users.registeredTitle')}</CardTitle>
          <CardDescription>
            {t('admin.users.total', { count: users.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.users.table.user')}</TableHead>
                <TableHead>{t('admin.users.table.email')}</TableHead>
                <TableHead>{t('admin.users.table.role')}</TableHead>
                <TableHead>{t('admin.users.table.status')}</TableHead>
                <TableHead>{t('admin.users.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || t('admin.users.status.noName')}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getApprovalBadgeColor(user.is_approved)}>
                      {getApprovalText(user.is_approved)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {/* Botón para aprobar usuario si no está aprobado */}
                      {!user.is_approved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickApprove(user)}
                          className="text-green-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {t('admin.users.actions.quickApprove')}
                        </Button>
                      )}

                      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role);
                            }}
                          >
                            {t('admin.users.actions.changeRole')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t('admin.users.dialogs.role.title')}</DialogTitle>
                            <DialogDescription>
                              {t('admin.users.dialogs.role.description', { name: selectedUser?.full_name })}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="role">{t('admin.users.dialogs.role.label')}</Label>
                              <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pendiente">Pendiente (Usuario no aprobado)</SelectItem>
                                  <SelectItem value="usuario">Usuario (Aprobado)</SelectItem>
                                  <SelectItem value="investor">Investor</SelectItem>
                                  <SelectItem value="agent">Agent</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter className="flex gap-2">
                            {selectedUser && !selectedUser.is_approved && (
                              <Button onClick={handleApproveUser} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {t('admin.users.dialogs.role.approve')}
                              </Button>
                            )}
                            {selectedUser && selectedUser.is_approved && (
                              <Button onClick={() => handleRejectUser()} variant="destructive">
                                <XCircle className="w-4 h-4 mr-2" />
                                {t('admin.users.dialogs.role.reject')}
                              </Button>
                            )}
                            <Button onClick={handleRoleChange}>
                              {t('admin.users.dialogs.role.update')}
                            </Button>
                            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                              {t('common.cancel')}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendReset(user.email)}
                        title={t('admin.users.actions.sendReset')}
                      >
                        <Key className="w-4 h-4" />
                      </Button>

                      {user.id !== currentUser?.id && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
