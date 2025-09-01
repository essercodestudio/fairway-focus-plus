import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Trophy, 
  Star, 
  Target,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  title: string;
  description: string;
  achievement_type: string;
  earned_at: string;
  tournament_id?: string;
  tournaments?: {
    name: string;
  };
}

const Achievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('achievements')
        .select(`
          id,
          title,
          description,
          achievement_type,
          earned_at,
          tournament_id,
          tournaments (
            name
          )
        `)
        .eq('player_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Erro ao buscar conquistas:', error);
      toast.error('Erro ao carregar conquistas');
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'tournament':
        return Trophy;
      case 'score':
        return Target;
      case 'consistency':
        return TrendingUp;
      default:
        return Star;
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case 'tournament':
        return 'text-yellow-500';
      case 'score':
        return 'text-green-500';
      case 'consistency':
        return 'text-blue-500';
      default:
        return 'text-purple-500';
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'tournament':
        return 'default' as const;
      case 'score':
        return 'secondary' as const;
      case 'consistency':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
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
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <Award className="h-8 w-8" />
            Suas Conquistas
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seus marcos e realizações no golfe
          </p>
        </div>

        {/* Achievements Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">
                {achievements.filter(a => a.achievement_type === 'tournament').length}
              </div>
              <p className="text-xs text-muted-foreground">Torneios</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">
                {achievements.filter(a => a.achievement_type === 'score').length}
              </div>
              <p className="text-xs text-muted-foreground">Scores</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">
                {achievements.filter(a => a.achievement_type === 'consistency').length}
              </div>
              <p className="text-xs text-muted-foreground">Consistência</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{achievements.length}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Achievements List */}
        <div className="space-y-4">
          {achievements.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhuma conquista ainda
                </h3>
                <p className="text-muted-foreground mb-4">
                  Participe de torneios e treinos para desbloquear suas primeiras conquistas!
                </p>
                <Button onClick={() => window.location.href = '/tournaments'} className="gap-2">
                  <Trophy className="h-4 w-4" />
                  Ver Torneios
                </Button>
              </CardContent>
            </Card>
          ) : (
            achievements.map((achievement) => {
              const IconComponent = getAchievementIcon(achievement.achievement_type);
              const iconColor = getAchievementColor(achievement.achievement_type);
              const badgeVariant = getBadgeVariant(achievement.achievement_type);
              
              return (
                <Card key={achievement.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full bg-muted ${iconColor}`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{achievement.title}</CardTitle>
                          <CardDescription>{achievement.description}</CardDescription>
                          {achievement.tournaments && (
                            <p className="text-sm text-muted-foreground">
                              Torneio: {achievement.tournaments.name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <Badge variant={badgeVariant}>
                          {achievement.achievement_type === 'tournament' ? 'Torneio' :
                           achievement.achievement_type === 'score' ? 'Score' :
                           achievement.achievement_type === 'consistency' ? 'Consistência' : 
                           'Especial'}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(achievement.earned_at).toLocaleDateString('pt-BR')}
                        </div>
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

export default Achievements;