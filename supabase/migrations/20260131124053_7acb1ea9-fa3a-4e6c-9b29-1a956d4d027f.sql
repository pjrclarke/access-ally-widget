-- Add widget customization columns to widget_api_keys table
ALTER TABLE public.widget_api_keys
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#8b5cf6',
ADD COLUMN IF NOT EXISTS position text DEFAULT 'bottom-right' CHECK (position IN ('bottom-right', 'bottom-left')),
ADD COLUMN IF NOT EXISTS voice_rate numeric DEFAULT 1.0 CHECK (voice_rate >= 0.5 AND voice_rate <= 2.0),
ADD COLUMN IF NOT EXISTS voice_pitch numeric DEFAULT 1.0 CHECK (voice_pitch >= 0.5 AND voice_pitch <= 2.0);