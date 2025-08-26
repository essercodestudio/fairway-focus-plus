import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  player_id: string;
  player_name: string;
  total_strokes: number;
  holes_played: number;
  average_score: number;
  position: number;
  scores: Array<{
    hole_number: number;
    par: number;
    strokes: number;
    net_strokes: number;
  }>;
}

const Leaderboard = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tournamentName, setTournamentName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) {
      fetchLeaderboardData();
      
      // Setup realtime subscription
      const channel = supabase
        .channel('scores-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'scores',
            filter: `tournament_id=eq.${tournamentId}`
          },
          () => {
            fetchLeaderboardData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [tournamentId]);

  const fetchLeaderboardData = async () => {
    try {
      // Buscar nome do torneio
      const { data: tournamentData } = await supabase
        .from('tournaments')
        .select('name')
        .eq('id', tournamentId)
        .single();

      if (tournamentData) {
        setTournamentName(tournamentData.name);
      }

      // Buscar scores
      const { data: scoresData, error } = await supabase
        .from('scores')
        .select(`
          player_id,
          strokes,
          net_strokes,
          holes (
            hole_number,
            par
          ),
          profiles (
            full_name
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('player_id');

      if (error) throw error;

      // Processar dados do leaderboard
      const playerStats = new Map<string, any>();

      scoresData?.forEach((score: any) => {
        const playerId = score.player_id;
        const playerName = score.profiles.full_name;
        
        if (!playerStats.has(playerId)) {
          playerStats.set(playerId, {
            player_id: playerId,
            player_name: playerName,
            total_strokes: 0,
            holes_played: 0,
            scores: []
          });
        }

        const playerData = playerStats.get(playerId);
        playerData.total_strokes += score.strokes;
        playerData.holes_played += 1;
        playerData.scores.push({
          hole_number: score.holes.hole_number,
          par: score.holes.par,
          strokes: score.strokes,
          net_strokes: score.net_strokes
        });
      });

      // Converter para array e calcular posições
      const leaderboardArray = Array.from(playerStats.values())
        .map(player => ({
          ...player,
          average_score: player.holes_played > 0 ? player.total_strokes / player.holes_played : 0,
          scores: player.scores.sort((a: any, b: any) => a.hole_number - b.hole_number)
        }))
        .sort((a, b) => a.total_strokes - b.total_strokes)
        .map((player, index) => ({
          ...player,
          position: index + 1
        }));

      setLeaderboard(leaderboardArray);
    } catch (error) {
      console.error('Erro ao buscar leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (strokes: number, par: number) => {
    const diff = strokes - par;
    if (diff < 0) return 'text-success'; // Abaixo do par
    if (diff === 0) return 'text-foreground'; // No par
    return 'text-destructive'; // Acima do par
  };

  const getScoreText = (strokes: number, par: number) => {
    const diff = strokes - par;
    if (diff === -2) return 'Eagle';
    if (diff === -1) return 'Birdie';
    if (diff === 0) return 'Par';
    if (diff === 1) return 'Bogey';
    if (diff === 2) return 'Double Bogey';
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-orange-500" />;
      default: return <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{position}</div>;
    }
  };

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
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <Trophy className="h-8 w-8" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground">{tournamentName}</p>
          <Badge variant="outline" className="gap-2">
            <Target className="h-4 w-4" />
            Atualização em tempo real
          </Badge>
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          {leaderboard.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  Nenhum score registrado ainda
                </p>
              </CardContent>
            </Card>
          ) : (
            leaderboard.map((player) => (
              <Card key={player.player_id} className={`${player.position <= 3 ? 'ring-2 ring-primary/20' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getPositionIcon(player.position)}
                      <div>
                        <CardTitle className="text-lg">{player.player_name}</CardTitle>
                        <CardDescription>
                          {player.total_strokes} strokes em {player.holes_played} buracos
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold">{player.total_strokes}</div>
                      <div className="text-sm text-muted-foreground">
                        Média: {player.average_score.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-6 md:grid-cols-9 gap-2">
                    {player.scores.map((score) => (
                      <div
                        key={score.hole_number}
                        className="text-center p-2 border rounded text-sm"
                      >
                        <div className="text-xs text-muted-foreground">H{score.hole_number}</div>
                        <div className={`font-bold ${getScoreColor(score.strokes, score.par)}`}>
                          {score.strokes}
                        </div>
                        <div className="text-xs">
                          Par {score.par}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {player.scores.length > 0 && (
                    <div className="mt-3 text-center">
                      <div className="text-sm text-muted-foreground">
                        Último buraco: {getScoreText(
                          player.scores[player.scores.length - 1]?.strokes || 0,
                          player.scores[player.scores.length - 1]?.par || 0
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Leaderboard;