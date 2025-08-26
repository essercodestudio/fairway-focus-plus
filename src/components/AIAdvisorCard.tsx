import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, RefreshCw, TrendingUp, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';

interface AIAdvice {
  advice: string;
  stats?: {
    par3: string;
    par4: string;
    par5: string;
  };
}

const AIAdvisorCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAdvice();
    }
  }, [user]);

  const fetchAdvice = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-advisor', {
        body: { player_id: user.id }
      });

      if (error) throw error;

      setAdvice(data);
    } catch (error) {
      console.error('Erro ao buscar dica de IA:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a dica de IA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Golf Advisor
        </CardTitle>
        <CardDescription>
          Dicas personalizadas baseadas nos seus treinos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ) : advice ? (
          <div className="space-y-4">
            {advice.stats && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-card rounded-lg border">
                  <div className="text-xs text-muted-foreground">Par 3</div>
                  <div className="font-bold text-sm">{advice.stats.par3}</div>
                </div>
                <div className="text-center p-2 bg-card rounded-lg border">
                  <div className="text-xs text-muted-foreground">Par 4</div>
                  <div className="font-bold text-sm">{advice.stats.par4}</div>
                </div>
                <div className="text-center p-2 bg-card rounded-lg border">
                  <div className="text-xs text-muted-foreground">Par 5</div>
                  <div className="font-bold text-sm">{advice.stats.par5}</div>
                </div>
              </div>
            )}
            
            <div className="bg-card p-4 rounded-lg border-l-4 border-l-primary">
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {advice.advice}
              </p>
            </div>
            
            <Badge variant="outline" className="gap-2 w-fit">
              <TrendingUp className="h-3 w-3" />
              Baseado nos seus dados
            </Badge>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Registre alguns treinos para receber dicas personalizadas</p>
          </div>
        )}
        
        <Button
          onClick={fetchAdvice}
          disabled={loading}
          variant="outline"
          className="w-full gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Gerando dica...' : 'Nova dica'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AIAdvisorCard;