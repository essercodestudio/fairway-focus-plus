import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Calendar, MapPin, Users, Plus, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Tournament {
  id: string;
  name: string;
  tournament_date: string;
  status: string;
  courses: {
    name: string;
    location: string;
  };
  tournament_groups?: {
    id: string;
    group_name: string;
  }[];
}

const Tournaments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    fetchTournaments();
    fetchUserRole();
  }, []);

  useEffect(() => {
    filterTournaments();
  }, [tournaments, searchTerm, statusFilter]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .order('role')
      .limit(1);
    
    if (data && data.length > 0) {
      setUserRole(data[0].role);
    }
  };

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          id,
          name,
          tournament_date,
          status,
          courses (
            name,
            location
          ),
          tournament_groups (
            id,
            group_name
          )
        `)
        .order('tournament_date', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Erro ao buscar torneios:', error);
      toast.error('Erro ao carregar torneios');
    } finally {
      setLoading(false);
    }
  };

  const filterTournaments = () => {
    let filtered = tournaments;

    if (searchTerm) {
      filtered = filtered.filter(tournament =>
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.courses.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tournament => tournament.status === statusFilter);
    }

    setFilteredTournaments(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planned: { label: 'Planejado', variant: 'secondary' as const },
      active: { label: 'Ativo', variant: 'default' as const },
      completed: { label: 'Finalizado', variant: 'outline' as const },
      needs_adjustment: { label: 'Precisa Ajuste', variant: 'destructive' as const }
    };

    return statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const };
  };

  const canCreateTournament = userRole === 'admin' || userRole === 'super_admin';

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
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
              <Trophy className="h-8 w-8" />
              Torneios
            </h1>
            <p className="text-muted-foreground">
              Gerencie e participe de torneios de golfe
            </p>
          </div>
          
          {canCreateTournament && (
            <Button onClick={() => navigate('/tournaments/create')} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Torneio
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar torneios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="planned">Planejado</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="completed">Finalizado</SelectItem>
                <SelectItem value="needs_adjustment">Precisa Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tournaments List */}
        <div className="space-y-4">
          {filteredTournaments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'Nenhum torneio encontrado' : 'Nenhum torneio cadastrado'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Ainda não há torneios criados'
                  }
                </p>
                {canCreateTournament && !searchTerm && statusFilter === 'all' && (
                  <Button onClick={() => navigate('/tournaments/create')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Primeiro Torneio
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredTournaments.map((tournament) => {
              const statusBadge = getStatusBadge(tournament.status);
              return (
                <Card key={tournament.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{tournament.name}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(tournament.tournament_date).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {tournament.courses.name}
                          </div>
                          {tournament.tournament_groups && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {tournament.tournament_groups.length} grupos
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {tournament.courses.location}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/tournaments/${tournament.id}/leaderboard`)}
                        >
                          Leaderboard
                        </Button>
                        {canCreateTournament && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/tournaments/${tournament.id}/manage`)}
                          >
                            Gerenciar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Tournaments;