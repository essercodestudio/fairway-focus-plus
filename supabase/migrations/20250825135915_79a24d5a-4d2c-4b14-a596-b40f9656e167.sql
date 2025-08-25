-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'player');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone VARCHAR(20),
  handicap INTEGER DEFAULT 36,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  total_holes INTEGER DEFAULT 18,
  par INTEGER DEFAULT 72,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create holes table
CREATE TABLE public.holes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL,
  par INTEGER NOT NULL CHECK (par IN (3, 4, 5)),
  handicap_index INTEGER NOT NULL,
  distance_meters INTEGER,
  UNIQUE(course_id, hole_number)
);

-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id),
  tournament_date DATE NOT NULL,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tournament_groups table
CREATE TABLE public.tournament_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  access_code VARCHAR(6) NOT NULL UNIQUE,
  captain_id UUID REFERENCES auth.users(id),
  starting_hole INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_players table
CREATE TABLE public.group_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.tournament_groups(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id),
  is_captain BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, player_id)
);

-- Create scores table
CREATE TABLE public.scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id),
  player_id UUID NOT NULL REFERENCES auth.users(id),
  hole_id UUID NOT NULL REFERENCES public.holes(id),
  strokes INTEGER NOT NULL CHECK (strokes > 0),
  net_strokes INTEGER,
  confirmed BOOLEAN DEFAULT false,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, player_id, hole_id)
);

-- Create training_sessions table
CREATE TABLE public.training_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES auth.users(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  session_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training_scores table
CREATE TABLE public.training_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  hole_id UUID NOT NULL REFERENCES public.holes(id),
  strokes INTEGER NOT NULL CHECK (strokes > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, hole_id)
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES auth.users(id),
  tournament_id UUID REFERENCES public.tournaments(id),
  title TEXT NOT NULL,
  description TEXT,
  achievement_type TEXT CHECK (achievement_type IN ('tournament_win', 'best_score', 'improvement', 'participation')),
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid ORDER BY 
    CASE role 
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2  
      WHEN 'player' THEN 3
    END LIMIT 1;
$$;

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(user_uuid UUID, role_name app_role)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = role_name
  );
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, cpf, full_name, phone)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'cpf',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  
  -- Assign default player role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'player');
  
  RETURN new;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- RLS Policies for user_roles (super_admin only for INSERT)
CREATE POLICY "Only super_admin can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view roles" ON public.user_roles
  FOR SELECT USING (
    auth.uid() = user_id OR 
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- RLS Policies for courses
CREATE POLICY "Anyone can view courses" ON public.courses
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- RLS Policies for holes
CREATE POLICY "Anyone can view holes" ON public.holes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage holes" ON public.holes
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- RLS Policies for tournaments
CREATE POLICY "Anyone can view tournaments" ON public.tournaments
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tournaments" ON public.tournaments
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- RLS Policies for tournament_groups
CREATE POLICY "Anyone can view tournament groups" ON public.tournament_groups
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tournament groups" ON public.tournament_groups
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- RLS Policies for group_players
CREATE POLICY "Anyone can view group players" ON public.group_players
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage group players" ON public.group_players
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- RLS Policies for scores
CREATE POLICY "Players can view their own scores" ON public.scores
  FOR SELECT USING (
    auth.uid() = player_id OR 
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Captains and admins can insert scores" ON public.scores
  FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.group_players gp
      JOIN public.tournament_groups tg ON gp.group_id = tg.id
      WHERE gp.player_id = auth.uid() AND gp.is_captain = true
    )
  );

CREATE POLICY "Captains and admins can update scores" ON public.scores
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.group_players gp
      JOIN public.tournament_groups tg ON gp.group_id = tg.id
      WHERE gp.player_id = auth.uid() AND gp.is_captain = true
    )
  );

-- RLS Policies for training_sessions
CREATE POLICY "Users can manage their own training sessions" ON public.training_sessions
  FOR ALL USING (auth.uid() = player_id);

CREATE POLICY "Admins can view all training sessions" ON public.training_sessions
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- RLS Policies for training_scores
CREATE POLICY "Users can manage scores in their training sessions" ON public.training_scores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.training_sessions ts
      WHERE ts.id = training_scores.session_id AND ts.player_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all training scores" ON public.training_scores
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- RLS Policies for achievements
CREATE POLICY "Users can view their own achievements" ON public.achievements
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Admins can manage all achievements" ON public.achievements
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Generate unique access codes function
CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.tournament_groups WHERE access_code = code);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;