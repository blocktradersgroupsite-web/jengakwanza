-- =========================================================================
-- JENGA KWANZA HARDWARE & POS - SUPABASE AUTH & PROFILES SCHEMA
-- Nakili na ubandike (Copy & Paste) hii kwenye Supabase SQL Editor
-- Dashboard > SQL Editor > New query > Run
-- =========================================================================

-- 1. Create a table for public profiles linked to Supabase Auth Users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier')),
  assigned_shop_id TEXT DEFAULT 'shop-main',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Kila mtumiaji anaweza kusoma wasifu wake
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Wasimamizi (Admins / Store Owners) wanaweza kuona wasifu wote
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Mtumiaji anaweza kuboresha wasifu wake
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 4. Function & Trigger to automatically create profile upon Supabase signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, assigned_shop_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'cashier'),
    COALESCE(new.raw_user_meta_data->>'shopId', 'shop-main')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- IMEMALIZIKA! Sasa unaweza kusajili watumiaji na kuingia moja kwa moja.
-- =========================================================================
