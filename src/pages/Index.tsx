import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, Target, Award, ArrowRight, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Trophy,
      title: 'Gestão de Torneios',
      description: 'Crie e gerencie torneios com sistema Shotgun Start'
    },
    {
      icon: Users,
      title: 'Grupos e Scorecards',
      description: 'Organize grupos e acompanhe scores em tempo real'
    },
    {
      icon: Target,
      title: 'Treino Personalizado',
      description: 'Registre treinos e receba dicas de IA'
    },
    {
      icon: Award,
      title: 'Sistema de Conquistas',
      description: 'Conquiste títulos e acompanhe seu progresso'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="text-center space-y-6 mb-16">
          <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6">
            <Flag className="h-10 w-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            18<span className="text-primary">BIRDIES</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Sistema completo de gerenciamento para torneios de Golfe
          </p>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Gerencie torneios, acompanhe scores em tempo real, registre treinos e conquiste títulos
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="gap-2 text-lg px-8 py-6"
            >
              Começar Agora
              <ArrowRight className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6"
            >
              Fazer Login
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-primary/10">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-card rounded-2xl p-8 md:p-12 border">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Por que escolher o 18BIRDIES?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold">Mobile-First</h3>
              <p className="text-muted-foreground">
                Design otimizado para dispositivos móveis, perfeito para usar no campo
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold">Segurança</h3>
              <p className="text-muted-foreground">
                Sistema robusto com autenticação e controle de permissões por CPF
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Tempo Real</h3>
              <p className="text-muted-foreground">
                Scorecards e atualizações em tempo real para todos os participantes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
