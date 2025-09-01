import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Crown,
  Shield,
  Edit,
  Trash2,
  Key
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Group {
  id: string;
  group_name: string;
  starting_hole: number;
  access_code: string;
  captain_id: string;
  tournament_id: string;
  tournaments: {
    name: string;
    status: string;
  };
  group_players: {
    id: string;
    is_captain: boolean;
    profiles: {
      full_name: string;
    };
  }[];
}

const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    filterGroups();
  }, [groups, searchTerm]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_groups')
        .select(`
          id,
          group_name,
          starting_hole,
          access_code,
          captain_id,
          tournament_id,
          tournaments (
            name,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch group players separately to avoid relation issues
      const groupsWithPlayers = await Promise.all((data || []).map(async (group) => {
        const { data: playersData } = await supabase
          .from('group_players')
          .select(`
            id,
            is_captain,
            player_id
          `)
          .eq('group_id', group.id);

        // Get player profiles
        const playersWithProfiles = await Promise.all((playersData || []).map(async (player) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', player.player_id)
            .single();

          return {
            ...player,
            profiles: {
              full_name: profileData?.full_name || 'Nome não encontrado'
            }
          };
        }));

        return {
          ...group,
          group_players: playersWithProfiles
        };
      }));

      setGroups(groupsWithPlayers);
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
      toast.error('Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  };

  const filterGroups = () => {
    let filtered = groups;

    if (searchTerm) {
      filtered = filtered.filter(group =>
        group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.tournaments.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.access_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredGroups(filtered);
  };

  const generateNewAccessCode = async (groupId: string) => {
    try {
      // Generate new access code
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { error } = await supabase
        .from('tournament_groups')
        .update({ access_code: newCode })
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Novo código de acesso gerado!');
      await fetchGroups();
    } catch (error) {
      console.error('Erro ao gerar novo código:', error);
      toast.error('Erro ao gerar novo código');
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo?')) return;

    try {
      const { error } = await supabase
        .from('tournament_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Grupo excluído com sucesso!');
      await fetchGroups();
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      toast.error('Erro ao excluir grupo');
    }
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

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado para a área de transferência!');
  };

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
              <Users className="h-8 w-8" />
              Grupos de Torneios
            </h1>
            <p className="text-muted-foreground">
              Gerencie grupos e códigos de acesso dos torneios
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar grupos por nome, torneio ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Groups List */}
        <div className="space-y-4">
          {filteredGroups.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'Nenhum grupo encontrado' : 'Nenhum grupo cadastrado'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Tente ajustar os filtros de busca' : 'Os grupos serão criados automaticamente quando os torneios forem organizados'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredGroups.map((group) => {
              const statusBadge = getStatusBadge(group.tournaments.status);
              const captain = group.group_players.find(p => p.is_captain);
              
              return (
                <Card key={group.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-xl">{group.group_name}</CardTitle>
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p><strong>Torneio:</strong> {group.tournaments.name}</p>
                          <p><strong>Buraco inicial:</strong> {group.starting_hole}</p>
                          <p><strong>Capitão:</strong> {captain?.profiles.full_name || 'Não definido'}</p>
                          <p><strong>Jogadores:</strong> {group.group_players.length}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateNewAccessCode(group.id)}
                          className="gap-1"
                        >
                          <Key className="h-4 w-4" />
                          Novo Código
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteGroup(group.id)}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Access Code */}
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold mb-1">Código de Acesso</h4>
                            <p className="text-sm text-muted-foreground">
                              Use este código para acessar o scorecard
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-2xl font-bold bg-background px-4 py-2 rounded border">
                              {group.access_code}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyAccessCode(group.access_code)}
                            >
                              Copiar
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Players List */}
                      <div>
                        <h4 className="font-semibold mb-2">Jogadores do Grupo</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {group.group_players.map((player) => (
                            <div key={player.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                              <div className="flex-1">
                                <span className="font-medium">{player.profiles.full_name}</span>
                              </div>
                              {player.is_captain && (
                                <Badge variant="default" className="gap-1">
                                  <Crown className="h-3 w-3" />
                                  Capitão
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
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

export default Groups;