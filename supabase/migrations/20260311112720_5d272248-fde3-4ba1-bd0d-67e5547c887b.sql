
DROP POLICY IF EXISTS "Authenticated users can insert votes" ON public.votes;

CREATE POLICY "Authenticated users can insert own votes"
ON public.votes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.voters 
    WHERE voters.id = votes.voter_id 
    AND voters.user_id = auth.uid()
    AND voters.has_voted = false
  )
);
