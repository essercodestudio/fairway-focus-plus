import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Target, 
  Plus, 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Flag,
  Trophy,
  TrendingUp,
  CheckCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Course {
  id: string;
  name: string;
  location: string;
  par: number;
}

interface Hole {
  id: string;
  hole_number: number;
  par: number;
  handicap_index: number;
}

interface TrainingSession {
  id: string;
  session_date: string;
  completed: boolean;
  courses: Course;
  training_scores: {
    strokes: number;
    holes: Hole;
  }[];
}

interface HoleScore {
  hole_id: string;
  strokes: number;
}

const Training = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // New session state
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [sessionDate, setSessionDate] = useState<Date>(new Date());
  const [holes, setHoles] = useState<Hole[]>([]);
  const [scores, setScores] = useState<HoleScore[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, name, location, par')
        .order('name');

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      // Fetch training sessions
      if (user) {
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('training_sessions')
          .select(`
            id,
            session_date,
            completed,
            courses (
              id,
              name,
              location,
              par
            ),
            training_scores (
              strokes,
              holes (
                id,
                hole_number,
                par,
                handicap_index
              )
            )
          `)
          .eq('player_id', user.id)
          .order('session_date', { ascending: false });

        if (sessionsError) throw sessionsError;
        setTrainingSessions(sessionsData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchHoles = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('holes')
        .select('id, hole_number, par, handicap_index')
        .eq('course_id', courseId)
        .order('hole_number');

      if (error) throw error;
      setHoles(data || []);
      setScores(data?.map(hole => ({ hole_id: hole.id, strokes: hole.par })) || []);
    } catch (error) {
      console.error('Erro ao carregar buracos:', error);
      toast.error('Erro ao carregar buracos do campo');
    }
  };

  const createSession = async () => {
    if (!selectedCourse || !user) return;

    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .insert({
          player_id: user.id,
          course_id: selectedCourse,
          session_date: format(sessionDate, 'yyyy-MM-dd'),
          completed: false
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(data.id);
      await fetchHoles(selectedCourse);
      setIsCreating(true);
      toast.success('Sessão de treino criada!');
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      toast.error('Erro ao criar sessão de treino');
    }
  };

  const updateScore = (holeId: string, strokes: number) => {
    setScores(prev => 
      prev.map(score => 
        score.hole_id === holeId 
          ? { ...score, strokes: Math.max(1, strokes) }
          : score
      )
    );
  };

  const saveScores = async () => {
    if (!currentSession) return;

    try {
      // Save all scores
      const scoreInserts = scores.map(score => ({
        session_id: currentSession,
        hole_id: score.hole_id,
        strokes: score.strokes
      }));

      const { error: scoresError } = await supabase
        .from('training_scores')
        .insert(scoreInserts);

      if (scoresError) throw scoresError;

      // Mark session as completed
      const { error: sessionError } = await supabase
        .from('training_sessions')
        .update({ completed: true })
        .eq('id', currentSession);

      if (sessionError) throw sessionError;

      toast.success('Treino finalizado com sucesso!');
      setIsCreating(false);
      setCurrentSession(null);
      await fetchData();
    } catch (error) {
      console.error('Erro ao salvar scores:', error);
      toast.error('Erro ao salvar scores');
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast.success('Sessão de treino excluída');
      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir sessão:', error);
      toast.error('Erro ao excluir sessão');
    }
  };

  const calculateSessionStats = (session: TrainingSession) => {
    if (!session.training_scores.length) return { totalStrokes: 0, totalPar: 0, differential: 0 };
    
    const totalStrokes = session.training_scores.reduce((sum, score) => sum + score.strokes, 0);
    const totalPar = session.training_scores.reduce((sum, score) => sum + score.holes.par, 0);
    const differential = totalStrokes - totalPar;
    
    return { totalStrokes, totalPar, differential };
  };

  const getScoreColor = (strokes: number, par: number) => {
    const diff = strokes - par;
    if (diff < 0) return 'text-success';
    if (diff === 0) return 'text-foreground';
    return 'text-destructive';
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
              <Target className="h-8 w-8" />
              Treinos
            </h1>
            <p className="text-muted-foreground">
              Registre seus treinos e acompanhe sua evolução
            </p>
          </div>
          
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Treino
            </Button>
          )}
        </div>

        {/* Create New Training Session */}
        {isCreating && !currentSession && (
          <Card>
            <CardHeader>
              <CardTitle>Nova Sessão de Treino</CardTitle>
              <CardDescription>
                Selecione o campo e a data para começar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Campo</label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name} - {course.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(sessionDate, 'PPP', { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={sessionDate}
                        onSelect={(date) => date && setSessionDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={createSession}
                  disabled={!selectedCourse}
                  className="gap-2"
                >
                  <Flag className="h-4 w-4" />
                  Começar Treino
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreating(false)}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Score Input */}
        {isCreating && currentSession && (
          <Card>
            <CardHeader>
              <CardTitle>Registrar Scores</CardTitle>
              <CardDescription>
                Registre as tacadas para cada buraco
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {holes.map((hole, index) => {
                  const currentScore = scores.find(s => s.hole_id === hole.id);
                  return (
                    <div key={hole.id} className="space-y-2">
                      <div className="text-center">
                        <div className="text-sm font-medium">Buraco {hole.hole_number}</div>
                        <div className="text-xs text-muted-foreground">Par {hole.par}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateScore(hole.id, (currentScore?.strokes || hole.par) - 1)}
                          disabled={(currentScore?.strokes || hole.par) <= 1}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max="15"
                          value={currentScore?.strokes || hole.par}
                          onChange={(e) => updateScore(hole.id, parseInt(e.target.value) || hole.par)}
                          className="text-center"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateScore(hole.id, (currentScore?.strokes || hole.par) + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={saveScores} className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Finalizar Treino
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreating(false);
                    setCurrentSession(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Training Sessions List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Histórico de Treinos</h2>
          
          {trainingSessions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum treino registrado
                </h3>
                <p className="text-muted-foreground mb-4">
                  Registre seus primeiros treinos para acompanhar sua evolução
                </p>
                <Button onClick={() => setIsCreating(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Primeiro Treino
                </Button>
              </CardContent>
            </Card>
          ) : (
            trainingSessions.map((session) => {
              const stats = calculateSessionStats(session);
              return (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{session.courses.name}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {format(new Date(session.session_date), 'PPP', { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {session.courses.location}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {session.completed ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Finalizado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Em andamento
                          </Badge>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSession(session.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {session.completed && session.training_scores.length > 0 && (
                    <CardContent>
                      <div className="space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{stats.totalStrokes}</div>
                            <div className="text-sm text-muted-foreground">Total de Tacadas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{stats.totalPar}</div>
                            <div className="text-sm text-muted-foreground">Par do Campo</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${getScoreColor(stats.totalStrokes, stats.totalPar)}`}>
                              {stats.differential > 0 ? '+' : ''}{stats.differential}
                            </div>
                            <div className="text-sm text-muted-foreground">Diferença</div>
                          </div>
                        </div>
                        
                        {/* Detailed Scores */}
                        <div className="grid grid-cols-6 md:grid-cols-9 gap-2">
                          {session.training_scores
                            .sort((a, b) => a.holes.hole_number - b.holes.hole_number)
                            .map((score) => (
                              <div key={score.holes.id} className="text-center p-2 border rounded text-sm">
                                <div className="text-xs text-muted-foreground">H{score.holes.hole_number}</div>
                                <div className={`font-bold ${getScoreColor(score.strokes, score.holes.par)}`}>
                                  {score.strokes}
                                </div>
                                <div className="text-xs">Par {score.holes.par}</div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Training;