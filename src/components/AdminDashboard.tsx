import React, { useState, useEffect } from 'react';
import { UserManagement } from '@/components/UserManagement';
import { PropertyList } from '@/components/PropertyList';
import { PropertyForm } from '@/components/PropertyForm';
import PropertyDetail from '@/components/properties/PropertyDetail';
import PropertyInterests from '@/components/PropertyInterests';
import type { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Building2, Settings, BarChart3, Plus, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalInterests: 0,
    activeUsers: 0,
    pendingConfirmations: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para propiedades
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [editPropertyOpen, setEditPropertyOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddProperty = () => {
    setAddPropertyOpen(true);
  };

  const handleEditProperty = (property: Property) => {
    setPropertyToEdit(property);
    setEditPropertyOpen(true);
  };

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
  };

  const handlePropertyAdded = () => {
    setAddPropertyOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const handlePropertyUpdated = () => {
    setEditPropertyOpen(false);
    setPropertyToEdit(null);
    setRefreshKey(prev => prev + 1);
  };

  const handlePropertyCancel = () => {
    setAddPropertyOpen(false);
    setEditPropertyOpen(false);
    setPropertyToEdit(null);
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Cargar estadísticas reales
        const [usersCount, propertiesCount, interestsCount, recentUsers, recentProperties, recentInterests] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('properties').select('*', { count: 'exact', head: true }),
          supabase.from('property_interests').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('full_name, created_at').order('created_at', { ascending: false }).limit(3),
          supabase.from('properties').select('title, created_at').order('created_at', { ascending: false }).limit(3),
          supabase.from('property_interests').select(`
            created_at,
            user:profiles(full_name),
            property:properties(title)
          `).order('created_at', { ascending: false }).limit(3)
        ]);

        setStats({
          totalUsers: usersCount.count || 0,
          totalProperties: propertiesCount.count || 0,
          totalInterests: interestsCount.count || 0,
          activeUsers: 0,
          pendingConfirmations: 0,
        });

        // Crear actividad reciente
        const activity = [
          ...(recentUsers.data || []).map((user: any) => ({
            type: 'user',
            title: t('admin.activity.newUser', { name: user.full_name }),
            time: new Date(user.created_at).toLocaleString(),
            color: 'green'
          })),
          ...(recentProperties.data || []).map((property: any) => ({
            type: 'property',
            title: t('admin.activity.propertyCreated', { title: property.title }),
            time: new Date(property.created_at).toLocaleString(),
            color: 'blue'
          })),
          ...(recentInterests.data || []).map((interest: any) => ({
            type: 'interest',
            title: t('admin.activity.interestCreated', { name: interest.user.full_name, title: interest.property.title }),
            time: new Date(interest.created_at).toLocaleString(),
            color: 'red'
          }))
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

        setRecentActivity(activity);
      } catch (error) {
        console.error('❌ AdminDashboard: Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-red-600" />
            {t('admin.title')}
          </h1>
          <p className="text-gray-600">
            {t('admin.subtitle')}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {t('admin.roleBadge', { email: user?.email })}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {t('admin.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t('admin.tabs.users')}
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {t('admin.tabs.properties')}
          </TabsTrigger>
          <TabsTrigger value="interests" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            {t('admin.tabs.interests')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.stats.totalUsers')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.stats.subtitleUsers')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.tabs.properties')}</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.totalProperties}</div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.stats.subtitleProperties')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.stats.activeUsers')}</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.stats.subtitleActiveUsers')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.tabs.interests')}</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.totalInterests}</div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.stats.subtitleInterests')}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.actions.title')}</CardTitle>
                <CardDescription>
                  {t('admin.actions.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setActiveTab('users')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {t('admin.actions.viewUsers')}
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setActiveTab('properties')}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    {t('admin.actions.manageProperties')}
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {t('admin.actions.systemSettings')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.activity.title')}</CardTitle>
                <CardDescription>
                  {t('admin.activity.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p className="text-sm text-gray-500">{t('admin.activity.loading')}</p>
                  ) : recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div
                          className={`w-2 h-2 rounded-full ${activity.color === 'green' ? 'bg-green-500' :
                              activity.color === 'blue' ? 'bg-blue-500' :
                                activity.color === 'red' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}
                        ></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">{t('admin.activity.empty')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="properties">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{t('admin.properties.title')}</h2>
                <p className="text-sm text-gray-600">
                  {t('admin.properties.subtitle')}
                </p>
              </div>
              <Button onClick={handleAddProperty}>
                <Plus className="w-4 h-4 mr-2" />
                {t('admin.properties.add')}
              </Button>
            </div>

            <PropertyList
              key={refreshKey}
              adminMode={true}
              showAdminActions={true}
              onEdit={handleEditProperty}
              onView={handleViewProperty}
            />
          </div>
        </TabsContent>

        <TabsContent value="interests" className="space-y-6">
          <PropertyInterests />
        </TabsContent>
      </Tabs>

      {/* Modal para agregar propiedad */}
      <Dialog open={addPropertyOpen} onOpenChange={setAddPropertyOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.properties.addTitle')}</DialogTitle>
          </DialogHeader>
          <PropertyForm
            onSuccess={handlePropertyAdded}
            onCancel={handlePropertyCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para editar propiedad */}
      <Dialog open={editPropertyOpen} onOpenChange={setEditPropertyOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.properties.editTitle')}</DialogTitle>
          </DialogHeader>
          <PropertyForm
            property={propertyToEdit}
            onSuccess={handlePropertyUpdated}
            onCancel={handlePropertyCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para ver propiedad */}
      <PropertyDetail
        property={selectedProperty}
        open={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </div>
  );
};
