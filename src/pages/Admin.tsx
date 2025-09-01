import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Users, 
  Shield, 
  UserPlus, 
  Search,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  full_name: string;
  cpf: string;
  phone: string;
  created_at: string;
  roles: {
    role: string;
  }[];
}

const Admin = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    fetchUsers();
    fetchUserRole();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (data && data.length > 0) {
      setUserRole(data[0].role);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          cpf,
          phone,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
      const combinedUsers = profilesData?.map(profile => {
        const userRoles = rolesData?.filter(r => r.user_id === profile.user_id) || [];
        
        return {
          id: profile.user_id,
          email: 'Email privado', // Não podemos acessar emails por questões de segurança
          full_name: profile.full_name,
          cpf: profile.cpf,
          phone: profile.phone,
          created_at: profile.created_at,
          roles: userRoles
        };
      }) || [];

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.cpf.includes(searchTerm)
      );
    }

    setFilteredUsers(filtered);
  };

  const promoteToAdmin = async (userId: string) => {
    if (userRole !== 'super_admin') {
      toast.error('Apenas Super Admins podem promover usuários');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (error) throw error;

      toast.success('Usuário promovido a Admin com sucesso!');
      await fetchUsers();
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      toast.error('Erro ao promover usuário');
    }
  };

  const getUserHighestRole = (userRoles: { role: string }[]) => {
    if (userRoles.some(r => r.role === 'super_admin')) return 'super_admin';
    if (userRoles.some(r => r.role === 'admin')) return 'admin';
    return 'player';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="destructive" className="gap-1"><Crown className="h-3 w-3" />Super Admin</Badge>;
      case 'admin':
        return <Badge variant="default" className="gap-1"><Shield className="h-3 w-3" />Admin</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" />Jogador</Badge>;
    }
  };

  if (userRole !== 'super_admin') {
    return (
      <Layout>
        <div className="p-4 md:p-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
              <p className="text-muted-foreground">
                Apenas Super Admins podem acessar esta área
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Administração
            </h1>
            <p className="text-muted-foreground">
              Gerencie usuários e permissões do sistema
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Usuários do Sistema</h2>
          
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((userData) => {
              const highestRole = getUserHighestRole(userData.roles);
              return (
                <Card key={userData.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{userData.full_name}</CardTitle>
                          {getRoleBadge(highestRole)}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>📧 {userData.email}</p>
                          <p>📱 {userData.phone}</p>
                          <p>🆔 {userData.cpf}</p>
                          <p>📅 Cadastrado em {new Date(userData.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {highestRole === 'player' && (
                          <Button
                            onClick={() => promoteToAdmin(userData.id)}
                            size="sm"
                            className="gap-2"
                          >
                            <UserPlus className="h-4 w-4" />
                            Promover a Admin
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;