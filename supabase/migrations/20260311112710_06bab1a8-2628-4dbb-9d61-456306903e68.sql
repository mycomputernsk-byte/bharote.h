
ALTER TABLE public.voters 
ADD COLUMN IF NOT EXISTS webauthn_credential_id text,
ADD COLUMN IF NOT EXISTS webauthn_credential_hash text,
ADD COLUMN IF NOT EXISTS biometric_registered boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.party_constituency_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid NOT NULL REFERENCES public.political_parties(id) ON DELETE CASCADE,
  constituency_id uuid REFERENCES public.constituencies(id) ON DELETE CASCADE,
  state text NOT NULL,
  district text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.party_constituency_mapping 
ADD CONSTRAINT unique_party_constituency UNIQUE (party_id, constituency_id);

ALTER TABLE public.party_constituency_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Party mappings are publicly viewable"
ON public.party_constituency_mapping
FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage party mappings"
ON public.party_constituency_mapping
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert votes"
ON public.votes
FOR INSERT
TO authenticated
WITH CHECK (true);
