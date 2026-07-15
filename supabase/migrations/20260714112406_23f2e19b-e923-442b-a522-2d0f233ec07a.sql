
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Storage RLS: users can manage files under their own user_id/ prefix
CREATE POLICY "site_images_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'site-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "site_images_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "site_images_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'site-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "site_images_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'site-images' AND auth.uid()::text = (storage.foldername(name))[1]);
