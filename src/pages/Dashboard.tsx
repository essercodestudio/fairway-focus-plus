import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Target, Award, Calendar, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  tournaments: number;
  activeTournaments: number;
  trainingSessions: number;
  achievements: number;
  userRole: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    tournaments: 0,
    activeTournaments: 0,
    trainingSessions: 0,
    achievements: 0,
    userRole: 'player'
  });
  const [recentTournaments, setRecentTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Get user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get tournaments stats
        const { data: tournamentsData } = await supabase
          .from('tournaments')
          .select('id, status');

        // Get training sessions
        const { data: trainingData } = await supabase
          .from('training_sessions')
          .select('id')
          .eq('player_id', user.id);

        // Get achievements
        const { data: achievementsData } = await supabase
          .from('achievements')
          .select('id')
          .eq('player_id', user.id);

        // Get recent tournaments
        const { data: recentData } = await supabase
          .from('tournaments')
          .select(`
            id,
            name,
            tournament_date,
            status,
            courses (name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          tournaments: tournamentsData?.length || 0,
          activeTournaments: tournamentsData?.filter(t => t.status === 'active').length || 0,
          trainingSessions: trainingData?.length || 0,
          achievements: achievementsData?.length || 0,
          userRole: roleData?.role || 'player'
        });

        setRecentTournaments(recentData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'completed': return 'bg-muted text-muted-foreground';
      case 'planned': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'completed': return 'Finalizado';
      case 'planned': return 'Planejado';
      default: return status;
    }
  };

  const isAdmin = stats.userRole === 'admin' || stats.userRole === 'super_admin';

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Bem-vindo ao 18BIRDIES</p>
          </div>
          
          {isAdmin && (
            <Button onClick={() => navigate('/tournaments/create')} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Torneio
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Torneios</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tournaments}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeTournaments} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treinos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trainingSessions}</div>
              <p className="text-xs text-muted-foreground">
                sessões registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conquistas</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.achievements}</div>
              <p className="text-xs text-muted-foreground">
                títulos obtidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Papel</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold capitalize">{stats.userRole.replace('_', ' ')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tournaments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Torneios Recentes
            </CardTitle>
            <CardDescription>
              Últimos torneios cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTournaments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum torneio encontrado</p>
                {isAdmin && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate('/tournaments/create')}
                  >
                    Criar Primeiro Torneio
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {recentTournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/tournaments/${tournament.id}`)}
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium">{tournament.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {tournament.courses?.name || 'Campo não especificado'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tournament.tournament_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge className={getStatusColor(tournament.status)}>
                      {getStatusText(tournament.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/training')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" />
                Nova Sessão de Treino
              </CardTitle>
              <CardDescription>
                Registre uma nova sessão de treino
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/tournaments')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5" />
                Ver Torneios
              </CardTitle>
              <CardDescription>
                Visualize todos os torneios
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/achievements')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5" />
                Minhas Conquistas
              </CardTitle>
              <CardDescription>
                Veja seus títulos e prêmios
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;