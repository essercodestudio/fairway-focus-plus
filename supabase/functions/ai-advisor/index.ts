import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const { player_id } = await req.json();

    if (!player_id) {
      throw new Error('Player ID é obrigatório');
    }

    // Buscar estatísticas do jogador
    const { data: trainingData, error: trainingError } = await supabase
      .from('training_sessions')
      .select(`
        id,
        training_scores (
          strokes,
          holes (
            par,
            hole_number
          )
        )
      `)
      .eq('player_id', player_id)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (trainingError) {
      throw trainingError;
    }

    if (!trainingData || trainingData.length === 0) {
      return new Response(JSON.stringify({
        advice: "Ainda não há dados suficientes para análise. Registre algumas sessões de treino primeiro para receber dicas personalizadas!"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calcular estatísticas por par
    const stats = {
      par3: { total: 0, count: 0, avg: 0 },
      par4: { total: 0, count: 0, avg: 0 },
      par5: { total: 0, count: 0, avg: 0 }
    };

    trainingData.forEach(session => {
      session.training_scores?.forEach((score: any) => {
        const par = score.holes?.par;
        if (par === 3) {
          stats.par3.total += score.strokes;
          stats.par3.count++;
        } else if (par === 4) {
          stats.par4.total += score.strokes;
          stats.par4.count++;
        } else if (par === 5) {
          stats.par5.total += score.strokes;
          stats.par5.count++;
        }
      });
    });

    stats.par3.avg = stats.par3.count > 0 ? stats.par3.total / stats.par3.count : 0;
    stats.par4.avg = stats.par4.count > 0 ? stats.par4.total / stats.par4.count : 0;
    stats.par5.avg = stats.par5.count > 0 ? stats.par5.total / stats.par5.count : 0;

    if (!openAIApiKey) {
      // Fallback sem IA
      let advice = "Análise dos seus treinos:\n\n";
      
      if (stats.par3.avg > 0) {
        const diff3 = stats.par3.avg - 3;
        advice += `Par 3: Média de ${stats.par3.avg.toFixed(1)} (${diff3 > 0 ? '+' : ''}${diff3.toFixed(1)})\n`;
      }
      
      if (stats.par4.avg > 0) {
        const diff4 = stats.par4.avg - 4;
        advice += `Par 4: Média de ${stats.par4.avg.toFixed(1)} (${diff4 > 0 ? '+' : ''}${diff4.toFixed(1)})\n`;
      }
      
      if (stats.par5.avg > 0) {
        const diff5 = stats.par5.avg - 5;
        advice += `Par 5: Média de ${stats.par5.avg.toFixed(1)} (${diff5 > 0 ? '+' : ''}${diff5.toFixed(1)})\n`;
      }

      advice += "\nConfigure a chave da OpenAI para receber dicas personalizadas de IA!";

      return new Response(JSON.stringify({ advice }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gerar dica com IA
    const prompt = `Você é um instrutor profissional de golfe. Analise estas estatísticas de treino e forneça uma dica específica e útil em português:

Par 3: Média ${stats.par3.avg.toFixed(1)} strokes (${stats.par3.count} buracos)
Par 4: Média ${stats.par4.avg.toFixed(1)} strokes (${stats.par4.count} buracos)  
Par 5: Média ${stats.par5.avg.toFixed(1)} strokes (${stats.par5.count} buracos)

Forneça uma dica prática focada na área que mais precisa de melhoria. Seja específico e encorajador.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um instrutor profissional de golfe que dá dicas práticas e encorajadoras.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error('Erro na API da OpenAI');
    }

    const aiData = await response.json();
    const advice = aiData.choices[0].message.content;

    return new Response(JSON.stringify({ 
      advice,
      stats: {
        par3: stats.par3.avg.toFixed(1),
        par4: stats.par4.avg.toFixed(1), 
        par5: stats.par5.avg.toFixed(1)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função ai-advisor:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      advice: "Erro ao gerar dica. Tente novamente mais tarde."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});