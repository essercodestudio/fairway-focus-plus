import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Search, UserPlus, Users, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface Player {
  id: string;
  user_id: string;
  full_name: string;
  cpf: string;
  phone: string;
  role: string;
}

const PlayerManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          cpf,
          phone,
          user_roles!inner (role)
        `)
        .order('full_name');

      if (error) throw error;

      const formattedPlayers = data?.map(player => ({
        id: player.id,
        user_id: player.user_id,
        full_name: player.full_name,
        cpf: player.cpf,
        phone: player.phone || '',
        role: (player.user_roles as any)?.[0]?.role || 'player'
      })) || [];

      setPlayers(formattedPlayers);
    } catch (error) {
      console.error('Erro ao buscar jogadores:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de jogadores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async (playerId: string, userId: string) => {
    setPromoting(playerId);
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([
          { user_id: userId, role: 'admin' }
        ]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Jogador promovido a administrador com sucesso!",
      });

      // Atualizar a lista
      await fetchPlayers();
    } catch (error) {
      console.error('Erro ao promover jogador:', error);
      toast({
        title: "Erro",
        description: "Não foi possível promover o jogador",
        variant: "destructive",
      });
    } finally {
      setPromoting(null);
    }
  };

  const filteredPlayers = players.filter(player =>
    player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.cpf.includes(searchTerm)
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-destructive text-destructive-foreground';
      case 'admin': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Administrador';
      default: return 'Jogador';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-8 w-8" />
              Gerenciar Jogadores
            </h1>
            <p className="text-muted-foreground">
              Promova jogadores para administradores
            </p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Jogadores
            </CardTitle>
            <CardDescription>
              Busque por nome ou CPF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Digite o nome ou CPF do jogador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardHeader>
            <CardTitle>Jogadores Cadastrados</CardTitle>
            <CardDescription>
              {filteredPlayers.length} jogador(es) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum jogador encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg space-y-2 sm:space-y-0"
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium">{player.full_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        CPF: {player.cpf}
                      </p>
                      {player.phone && (
                        <p className="text-sm text-muted-foreground">
                          Tel: {player.phone}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getRoleColor(player.role)}>
                        {getRoleText(player.role)}
                      </Badge>
                      
                      {player.role === 'player' && (
                        <Button
                          onClick={() => promoteToAdmin(player.id, player.user_id)}
                          disabled={promoting === player.id}
                          className="gap-2"
                          size="sm"
                        >
                          <Shield className="h-4 w-4" />
                          {promoting === player.id ? 'Promovendo...' : 'Promover'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PlayerManagement;