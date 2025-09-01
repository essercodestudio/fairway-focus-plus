import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Flag, 
  Plus, 
  MapPin, 
  Edit, 
  Trash2,
  Target,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Course {
  id: string;
  name: string;
  location: string;
  par: number;
  total_holes: number;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    par: 72,
    total_holes: 18
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Erro ao buscar campos:', error);
      toast.error('Erro ao carregar campos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(formData)
          .eq('id', editingCourse.id);

        if (error) throw error;
        toast.success('Campo atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('courses')
          .insert(formData);

        if (error) throw error;
        toast.success('Campo criado com sucesso!');
      }

      setFormData({ name: '', location: '', par: 72, total_holes: 18 });
      setIsCreating(false);
      setEditingCourse(null);
      await fetchCourses();
    } catch (error) {
      console.error('Erro ao salvar campo:', error);
      toast.error('Erro ao salvar campo');
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      location: course.location,
      par: course.par,
      total_holes: course.total_holes
    });
    setIsCreating(true);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Tem certeza que deseja excluir este campo?')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast.success('Campo excluído com sucesso!');
      await fetchCourses();
    } catch (error) {
      console.error('Erro ao excluir campo:', error);
      toast.error('Erro ao excluir campo');
    }
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingCourse(null);
    setFormData({ name: '', location: '', par: 72, total_holes: 18 });
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
              <Flag className="h-8 w-8" />
              Campos de Golfe
            </h1>
            <p className="text-muted-foreground">
              Gerencie os campos onde os torneios serão realizados
            </p>
          </div>
          
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Campo
            </Button>
          )}
        </div>

        {/* Create/Edit Form */}
        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingCourse ? 'Editar Campo' : 'Novo Campo'}
              </CardTitle>
              <CardDescription>
                {editingCourse ? 'Atualize as informações do campo' : 'Adicione um novo campo de golfe'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome do Campo</label>
                    <Input
                      placeholder="Ex: Clube de Campo São Paulo"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Localização</label>
                    <Input
                      placeholder="Ex: São Paulo, SP"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Par Total</label>
                    <Input
                      type="number"
                      min="60"
                      max="80"
                      value={formData.par}
                      onChange={(e) => setFormData(prev => ({ ...prev, par: parseInt(e.target.value) }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total de Buracos</label>
                    <Input
                      type="number"
                      min="9"
                      max="27"
                      value={formData.total_holes}
                      onChange={(e) => setFormData(prev => ({ ...prev, total_holes: parseInt(e.target.value) }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" className="gap-2">
                    <Flag className="h-4 w-4" />
                    {editingCourse ? 'Atualizar Campo' : 'Criar Campo'}
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Courses List */}
        <div className="space-y-4">
          {courses.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum campo cadastrado
                </h3>
                <p className="text-muted-foreground mb-4">
                  Adicione campos de golfe para criar torneios
                </p>
                <Button onClick={() => setIsCreating(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Primeiro Campo
                </Button>
              </CardContent>
            </Card>
          ) : (
            courses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{course.name}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {course.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          Par {course.par}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.total_holes} buracos
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(course)}
                        className="gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(course.id)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Courses;