-- BHAROTE Voting System Database Schema

-- Enum for vote status
CREATE TYPE public.vote_status AS ENUM ('pending', 'verified', 'rejected');

-- Enum for voter verification status  
CREATE TYPE public.verification_status AS ENUM ('unverified', 'otp_sent', 'verified');

-- Political Parties Table
CREATE TABLE public.political_parties (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    symbol_url TEXT,
    color TEXT NOT NULL DEFAULT '#6366f1',
    description TEXT,
    is_nota BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.political_parties ENABLE ROW LEVEL SECURITY;

-- Parties are viewable by everyone
CREATE POLICY "Parties are viewable by everyone" 
ON public.political_parties 
FOR SELECT 
USING (true);

-- Only admins can manage parties
CREATE POLICY "Admins can manage parties" 
ON public.political_parties 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Voters Table
CREATE TABLE public.voters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    phone_number TEXT NOT NULL UNIQUE,
    voter_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    constituency TEXT NOT NULL,
    verification_status verification_status NOT NULL DEFAULT 'unverified',
    otp_code TEXT,
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    has_voted BOOLEAN NOT NULL DEFAULT false,
    voted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;

-- Users can view their own voter record
CREATE POLICY "Users can view own voter record" 
ON public.voters 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own voter record
CREATE POLICY "Users can register as voter" 
ON public.voters 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own voter record (before voting)
CREATE POLICY "Users can update own voter record" 
ON public.voters 
FOR UPDATE 
USING (auth.uid() = user_id AND has_voted = false);

-- Admins can view all voters
CREATE POLICY "Admins can view all voters" 
ON public.voters 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Votes Table (blockchain-ready with hashing)
CREATE TABLE public.votes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    voter_id UUID REFERENCES public.voters(id) NOT NULL,
    party_id UUID REFERENCES public.political_parties(id) NOT NULL,
    vote_hash TEXT NOT NULL UNIQUE,
    previous_hash TEXT,
    block_number BIGINT NOT NULL,
    nonce INTEGER NOT NULL DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status vote_status NOT NULL DEFAULT 'verified',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Users can insert votes (through verified process only via edge function)
-- No direct insert policy - votes are inserted via service role in edge function

-- Admins can view all votes
CREATE POLICY "Admins can view votes" 
ON public.votes 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Vote Blocks Table (for blockchain chain verification)
CREATE TABLE public.vote_blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    block_number BIGINT NOT NULL UNIQUE,
    block_hash TEXT NOT NULL UNIQUE,
    previous_block_hash TEXT,
    merkle_root TEXT NOT NULL,
    vote_count INTEGER NOT NULL DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_verified BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.vote_blocks ENABLE ROW LEVEL SECURITY;

-- Anyone can view blocks for transparency
CREATE POLICY "Blocks are publicly viewable" 
ON public.vote_blocks 
FOR SELECT 
USING (true);

-- Function to generate voter ID
CREATE OR REPLACE FUNCTION public.generate_voter_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    new_id TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        new_id := 'BHV' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0');
        SELECT EXISTS(SELECT 1 FROM public.voters WHERE voter_id = new_id) INTO exists_check;
        EXIT WHEN NOT exists_check;
    END LOOP;
    RETURN new_id;
END;
$$;

-- Function to get next block number
CREATE OR REPLACE FUNCTION public.get_next_block_number()
RETURNS BIGINT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    next_num BIGINT;
BEGIN
    SELECT COALESCE(MAX(block_number), 0) + 1 INTO next_num FROM public.votes;
    RETURN next_num;
END;
$$;

-- Function to get vote counts (public transparency)
CREATE OR REPLACE FUNCTION public.get_vote_counts()
RETURNS TABLE (
    party_id UUID,
    party_name TEXT,
    short_name TEXT,
    color TEXT,
    is_nota BOOLEAN,
    vote_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.id,
        pp.name,
        pp.short_name,
        pp.color,
        pp.is_nota,
        COUNT(v.id)::BIGINT
    FROM public.political_parties pp
    LEFT JOIN public.votes v ON v.party_id = pp.id AND v.status = 'verified'::vote_status
    GROUP BY pp.id, pp.name, pp.short_name, pp.color, pp.is_nota
    ORDER BY pp.display_order;
END;
$$;

-- Insert the 6 political parties + NOTA
INSERT INTO public.political_parties (name, short_name, color, description, is_nota, display_order) VALUES
('Bharatiya Janata Party', 'BJP', '#FF9933', 'National political party', false, 1),
('Indian National Congress', 'INC', '#00BFFF', 'National political party', false, 2),
('Aam Aadmi Party', 'AAP', '#0066CC', 'National political party', false, 3),
('Bahujan Samaj Party', 'BSP', '#0000FF', 'National political party', false, 4),
('Communist Party of India', 'CPI', '#FF0000', 'National political party', false, 5),
('Trinamool Congress', 'TMC', '#20C646', 'National political party', false, 6),
('None of the Above', 'NOTA', '#808080', 'Vote for none of the candidates', true, 7);

-- Trigger to update updated_at on voters
CREATE TRIGGER update_voters_updated_at
BEFORE UPDATE ON public.voters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();