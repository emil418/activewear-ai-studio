
CREATE POLICY "Authenticated users can upload to generated-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'generated-images');

CREATE POLICY "Authenticated users can read generated-images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'generated-images');
