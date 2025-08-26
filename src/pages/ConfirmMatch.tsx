import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, Trophy, Users, Calendar, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface TournamentData {
  id: string;
  name: string;
  tournament_date: string;
  status: string;
  courses: {
    name: string;
    location: string;
  };
  tournament_groups: Array<{
    id: string;
    group_name: string;
    group_players: Array<{
      profiles: {
        full_name: string;
      };
    }>;
  }>;
}

const ConfirmMatch = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentData();
    }
  }, [tournamentId]);

  const fetchTournamentData = async () => {
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
        .eq('id', tournamentId)
        .single();

      // Buscar jogadores dos grupos separadamente  
      if (data?.tournament_groups) {
        for (const group of data.tournament_groups) {
          const { data: playersData } = await supabase
            .from('group_players')
            .select(`
              profiles (
                full_name
              )
            `)
            .eq('group_id', group.id);
          
          (group as any).group_players = playersData || [];
        }
      }

      if (error) throw error;
      setTournament(data as TournamentData);
    } catch (error) {
      console.error('Erro ao buscar dados do torneio:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do torneio",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTournamentStatus = async (newStatus: string) => {
    if (!tournament) return;
    
    setUpdating(true);
    
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: newStatus })
        .eq('id', tournament.id);

      if (error) throw error;

      const statusText = newStatus === 'completed' ? 'finalizado' : 'marcado para ajustes';
      
      toast({
        title: "Sucesso",
        description: `Torneio ${statusText} com sucesso!`,
      });

      navigate('/tournaments');
    } catch (error) {
      console.error('Erro ao atualizar status do torneio:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do torneio",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'completed': return 'bg-muted text-muted-foreground';
      case 'needs_adjustment': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-warning text-warning-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'completed': return 'Finalizado';
      case 'needs_adjustment': return 'Precisa Ajustes';
      default: return 'Planejado';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout>
        <div className="p-4 md:p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Torneio não encontrado</h2>
          <Button onClick={() => navigate('/tournaments')}>
            Voltar aos Torneios
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-8 w-8" />
              Confirmar Partida
            </h1>
            <p className="text-muted-foreground">
              Finalize ou solicite ajustes no torneio
            </p>
          </div>
          
          <Badge className={getStatusColor(tournament.status)}>
            {getStatusText(tournament.status)}
          </Badge>
        </div>

        {/* Tournament Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {tournament.name}
            </CardTitle>
            <CardDescription className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(tournament.tournament_date).toLocaleDateString('pt-BR')}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {tournament.courses.name} - {tournament.courses.location}
              </div>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Groups Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Grupos do Torneio
            </CardTitle>
            <CardDescription>
              {tournament.tournament_groups.length} grupo(s) participando
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournament.tournament_groups.map((group) => (
                <div key={group.id} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">{group.group_name}</h4>
                  <div className="space-y-1">
                    {group.group_players.map((player, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        {player.profiles.full_name}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {tournament.status === 'active' && (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => updateTournamentStatus('completed')}
              disabled={updating}
              className="flex-1 gap-2 bg-success text-success-foreground hover:bg-success/90"
            >
              <CheckCircle className="h-5 w-5" />
              {updating ? 'Processando...' : 'Confirmar e Finalizar'}
            </Button>
            
            <Button
              onClick={() => updateTournamentStatus('needs_adjustment')}
              disabled={updating}
              variant="destructive"
              className="flex-1 gap-2"
            >
              <XCircle className="h-5 w-5" />
              {updating ? 'Processando...' : 'Solicitar Ajustes'}
            </Button>
          </div>
        )}

        {tournament.status === 'completed' && (
          <Card className="bg-success/10 border-success">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Torneio finalizado com sucesso!</span>
              </div>
            </CardContent>
          </Card>
        )}

        {tournament.status === 'needs_adjustment' && (
          <Card className="bg-destructive/10 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Este torneio precisa de ajustes antes da finalização.</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ConfirmMatch;