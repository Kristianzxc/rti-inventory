-- ============================================================
-- AssetVault v2 Migration — Run this in Supabase SQL Editor
-- Adds: 'it-admin' role, 'domain' column on assets
-- ============================================================

-- 1. Update profiles role constraint to include 'it-admin'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('tech-admin', 'it-admin', 'utility-admin'));

-- 2. Add domain column to assets (it | utility)
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS domain text NOT NULL DEFAULT 'it'
  CHECK (domain IN ('it', 'utility'));

-- 3. Index for fast domain filtering
CREATE INDEX IF NOT EXISTS assets_domain_idx ON public.assets(domain);

-- 4. Update RLS: it-admin can only see IT assets, utility-admin only utility assets
DROP POLICY IF EXISTS "Assets viewable by authenticated" ON public.assets;

CREATE POLICY "Assets viewable by role"
  ON public.assets FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      -- tech-admin sees everything
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tech-admin')
      OR
      -- it-admin sees only IT assets
      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'it-admin') AND domain = 'it')
      OR
      -- utility-admin sees only utility assets
      (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'utility-admin') AND domain = 'utility')
    )
  );

-- 5. Update insert RLS to enforce domain on insert
DROP POLICY IF EXISTS "Authenticated users can insert assets" ON public.assets;

CREATE POLICY "Role-scoped asset insert"
  ON public.assets FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tech-admin')
      OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'it-admin')      AND domain = 'it')
      OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'utility-admin') AND domain = 'utility')
    )
  );

-- 6. Backfill existing assets — classify by category type
UPDATE public.assets a
SET domain = 'utility'
WHERE EXISTS (
  SELECT 1 FROM asset_categories c
  WHERE c.id = a.category_id
  AND c.name IN ('Chairs','Tables','Stand Fans','Cabinets','Whiteboards','Air Conditioners','Projectors')
);

UPDATE public.assets a
SET domain = 'it'
WHERE EXISTS (
  SELECT 1 FROM asset_categories c
  WHERE c.id = a.category_id
  AND c.name IN ('PC Sets','Laptops','Servers','Monitors','Networking Devices','Printers','CCTV','Laboratory Equipment')
);

-- 7. To create an IT Admin user — run after creating the user in Auth:
-- UPDATE profiles
--   SET role = 'it-admin', full_name = 'IT Admin Name'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'itadmin@company.com');

-- 8. To create a Utility Admin user:
-- UPDATE profiles
--   SET role = 'utility-admin', full_name = 'Utility Admin Name'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'utility@company.com');
