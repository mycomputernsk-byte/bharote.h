-- Add device fingerprint and email verification fields to voters table
ALTER TABLE public.voters ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE public.voters ADD COLUMN IF NOT EXISTS device_fingerprint_hash TEXT;

-- Create index on device fingerprint for duplicate detection
CREATE INDEX IF NOT EXISTS idx_voters_device_fingerprint_hash ON public.voters(device_fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_voters_email ON public.voters(email);

-- Update political_parties with real Indian parties and their leaders
TRUNCATE TABLE public.political_parties CASCADE;

INSERT INTO public.political_parties (id, name, short_name, color, description, display_order, is_nota) VALUES
  (gen_random_uuid(), 'Bharatiya Janata Party', 'BJP', '#FF9933', 'Led by Narendra Modi - Prime Minister of India', 1, false),
  (gen_random_uuid(), 'Indian National Congress', 'INC', '#00BFFF', 'Led by Mallikarjun Kharge - President of INC', 2, false),
  (gen_random_uuid(), 'Aam Aadmi Party', 'AAP', '#0066FF', 'Led by Arvind Kejriwal - National Convenor', 3, false),
  (gen_random_uuid(), 'Bahujan Samaj Party', 'BSP', '#0000FF', 'Led by Mayawati - National President', 4, false),
  (gen_random_uuid(), 'Samajwadi Party', 'SP', '#FF0000', 'Led by Akhilesh Yadav - National President', 5, false),
  (gen_random_uuid(), 'All India Trinamool Congress', 'TMC', '#00FF00', 'Led by Mamata Banerjee - Chief Minister of West Bengal', 6, false),
  (gen_random_uuid(), 'None of the Above', 'NOTA', '#808080', 'Vote for none of the above candidates', 7, true);

-- Add leader_name and symbol columns to political_parties
ALTER TABLE public.political_parties ADD COLUMN IF NOT EXISTS leader_name TEXT;
ALTER TABLE public.political_parties ADD COLUMN IF NOT EXISTS party_symbol TEXT;

-- Update with leader names
UPDATE public.political_parties SET leader_name = 'Narendra Modi', party_symbol = 'Lotus' WHERE short_name = 'BJP';
UPDATE public.political_parties SET leader_name = 'Mallikarjun Kharge', party_symbol = 'Hand' WHERE short_name = 'INC';
UPDATE public.political_parties SET leader_name = 'Arvind Kejriwal', party_symbol = 'Broom' WHERE short_name = 'AAP';
UPDATE public.political_parties SET leader_name = 'Mayawati', party_symbol = 'Elephant' WHERE short_name = 'BSP';
UPDATE public.political_parties SET leader_name = 'Akhilesh Yadav', party_symbol = 'Bicycle' WHERE short_name = 'SP';
UPDATE public.political_parties SET leader_name = 'Mamata Banerjee', party_symbol = 'Flowers and Grass' WHERE short_name = 'TMC';
UPDATE public.political_parties SET leader_name = NULL, party_symbol = 'Ballot with Cross' WHERE short_name = 'NOTA';