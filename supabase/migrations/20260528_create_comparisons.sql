-- Create the comparisons table
CREATE TABLE IF NOT EXISTS public.comparisons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url_a TEXT NOT NULL,
  url_b TEXT NOT NULL,
  winner TEXT NOT NULL,
  summary TEXT,
  key_differences JSONB,
  comparison_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;

-- Policy: users can insert their own comparisons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'comparisons' AND policyname = 'insert_own_comparisons'
  ) THEN
    CREATE POLICY "insert_own_comparisons"
    ON public.comparisons FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy: users can read their own comparisons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'comparisons' AND policyname = 'select_own_comparisons'
  ) THEN
    CREATE POLICY "select_own_comparisons"
    ON public.comparisons FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END
$$;
