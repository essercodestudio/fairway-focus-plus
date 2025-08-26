import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Trophy, Target, Award, BarChart3, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PlayerStats {
  player_id: string;
  player_name: string;
  cpf: string;
  phone: string;
  handicap: number;
  total_tournaments: number;
  total_training_sessions: number;
  achievements_count: number;
  avg_par3: number;
  avg_par4: number;
  avg_par5: number;
  recent_scores: Array<{
    tournament_name: string;
    hole_number: number;
    par: number;
    strokes: number;
    date: string;
  }>;
  achievements: Array<{
    title: string;
    description: string;
    achievement_type: string;
    earned_at: string;
  }>;
}

const PlayerDetail = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (playerId) {
      fetchPlayerData();
    }
  }, [playerId]);

  const fetchPlayerData = async () => {
    try {
      // Buscar dados básicos do jogador
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', playerId)
        .single();

      if (profileError) throw profileError;

      // Buscar estatísticas de torneios
      const { data: tournamentScores } = await supabase
        .from('scores')
        .select(`
          strokes,
          holes (
            hole_number,
            par
          ),
          tournaments (
            name,
            tournament_date
          )
        `)
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      // Buscar sessões de treino
      const { data: trainingData } = await supabase
        .from('training_sessions')
        .select(`
          id,
          session_date,
          training_scores (
            strokes,
            holes (
              par
            )
          )
        `)
        .eq('player_id', playerId);

      // Buscar conquistas
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .eq('player_id', playerId)
        .order('earned_at', { ascending: false });

      // Calcular estatísticas
      const allScores = [
        ...(tournamentScores || []),
        ...(trainingData?.flatMap(session => 
          session.training_scores?.map((score: any) => ({
            strokes: score.strokes,
            holes: score.holes
          })) || []
        ) || [])
      ];

      const par3Scores = allScores.filter((score: any) => score.holes.par === 3);
      const par4Scores = allScores.filter((score: any) => score.holes.par === 4);
      const par5Scores = allScores.filter((score: any) => score.holes.par === 5);

      const avgPar3 = par3Scores.length > 0 
        ? par3Scores.reduce((sum: number, score: any) => sum + score.strokes, 0) / par3Scores.length 
        : 0;
      const avgPar4 = par4Scores.length > 0 
        ? par4Scores.reduce((sum: number, score: any) => sum + score.strokes, 0) / par4Scores.length 
        : 0;
      const avgPar5 = par5Scores.length > 0 
        ? par5Scores.reduce((sum: number, score: any) => sum + score.strokes, 0) / par5Scores.length 
        : 0;

      // Contar torneios únicos
      const uniqueTournaments = new Set(
        tournamentScores?.map((score: any) => score.tournaments.name) || []
      ).size;

      const recentScores = (tournamentScores || [])
        .slice(0, 10)
        .map((score: any) => ({
          tournament_name: score.tournaments.name,
          hole_number: score.holes.hole_number,
          par: score.holes.par,
          strokes: score.strokes,
          date: score.tournaments.tournament_date
        }));

      setPlayerStats({
        player_id: playerId,
        player_name: profileData.full_name,
        cpf: profileData.cpf,
        phone: profileData.phone || '',
        handicap: profileData.handicap || 36,
        total_tournaments: uniqueTournaments,
        total_training_sessions: trainingData?.length || 0,
        achievements_count: achievementsData?.length || 0,
        avg_par3: avgPar3,
        avg_par4: avgPar4,
        avg_par5: avgPar5,
        recent_scores: recentScores,
        achievements: achievementsData || []
      });

    } catch (error) {
      console.error('Erro ao buscar dados do jogador:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (strokes: number, par: number) => {
    const diff = strokes - par;
    if (diff < 0) return 'text-success';
    if (diff === 0) return 'text-foreground';
    return 'text-destructive';
  };

  const getPerformanceLevel = (avg: number, par: number) => {
    const diff = avg - par;
    if (diff <= 0) return { level: 'Excelente', color: 'bg-success', progress: 100 };
    if (diff <= 1) return { level: 'Muito Bom', color: 'bg-primary', progress: 80 };
    if (diff <= 2) return { level: 'Bom', color: 'bg-warning', progress: 60 };
    return { level: 'Pode Melhorar', color: 'bg-destructive', progress: 40 };
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!playerStats) {
    return (
      <Layout>
        <div className="p-4 md:p-6 text-center">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Jogador não encontrado</h2>
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
            <User className="h-8 w-8" />
            {playerStats.player_name}
          </h1>
          <div className="space-y-1 text-muted-foreground">
            <p>CPF: {playerStats.cpf}</p>
            {playerStats.phone && <p>Tel: {playerStats.phone}</p>}
            <Badge variant="outline">Handicap: {playerStats.handicap}</Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Torneios</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playerStats.total_tournaments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treinos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playerStats.total_training_sessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conquistas</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playerStats.achievements_count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Handicap</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playerStats.handicap}</div>
            </CardContent>
          </Card>
        </div>

        {/* Performance por Par */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance por Par
            </CardTitle>
            <CardDescription>
              Média de strokes por tipo de buraco
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { par: 3, avg: playerStats.avg_par3, label: 'Par 3' },
              { par: 4, avg: playerStats.avg_par4, label: 'Par 4' },
              { par: 5, avg: playerStats.avg_par5, label: 'Par 5' }
            ].map(({ par, avg, label }) => {
              if (avg === 0) return null;
              const performance = getPerformanceLevel(avg, par);
              
              return (
                <div key={par} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{label}</span>
                    <div className="text-right">
                      <span className="text-lg font-bold">{avg.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground ml-1">
                        ({avg > par ? '+' : ''}{(avg - par).toFixed(1)})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={performance.progress} className="flex-1" />
                    <Badge variant="outline" className="text-xs">
                      {performance.level}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Scores Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scores Recentes
            </CardTitle>
            <CardDescription>
              Últimos 10 buracos jogados em torneios
            </CardDescription>
          </CardHeader>
          <CardContent>
            {playerStats.recent_scores.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum score registrado ainda
              </p>
            ) : (
              <div className="space-y-2">
                {playerStats.recent_scores.map((score, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{score.tournament_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Buraco {score.hole_number} (Par {score.par})
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(score.strokes, score.par)}`}>
                        {score.strokes}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(score.date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conquistas */}
        {playerStats.achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Conquistas
              </CardTitle>
              <CardDescription>
                Títulos e premiações conquistados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {playerStats.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Trophy className="h-5 w-5 text-primary mt-1" />
                    <div className="space-y-1">
                      <h4 className="font-medium">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {achievement.achievement_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(achievement.earned_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default PlayerDetail;