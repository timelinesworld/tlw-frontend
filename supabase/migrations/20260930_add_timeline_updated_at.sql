-- Track timeline content changes independently of views and other activity.
-- One-time migration: timelines.updated_at does not exist yet, and all
-- existing timelines.created_at values are non-null.
-- SECURITY INVOKER preserves existing grants and RLS. Event-writing roles
-- must already be allowed to select/update the affected parent timelines.
-- No policies, grants, or security-definer privileges are changed here.

BEGIN;

-- Add without a default first so historical rows retain their creation date
-- as a baseline, rather than receiving the migration execution time.
ALTER TABLE public.timelines
  ADD COLUMN updated_at timestamptz;

UPDATE public.timelines
SET updated_at = created_at;

ALTER TABLE public.timelines
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now();

-- Timestamp only meaningful changes to the approved timeline content fields.
-- Comparing values also avoids timestamp changes on unchanged form saves.
CREATE FUNCTION public.tlw_set_timeline_content_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.category_id IS DISTINCT FROM OLD.category_id
     OR NEW.secondary_category_id
          IS DISTINCT FROM OLD.secondary_category_id
     OR pg_catalog.to_jsonb(NEW.filters)
          IS DISTINCT FROM pg_catalog.to_jsonb(OLD.filters)
     OR NEW.is_live IS DISTINCT FROM OLD.is_live
  THEN
    NEW.updated_at :=
      GREATEST(OLD.updated_at, pg_catalog.clock_timestamp());
  END IF;

  -- Views, is_admins_pick, and other non-content changes do not assign a
  -- timestamp. Leave timestamp-only updates from the event trigger intact.
  RETURN NEW;
END;
$function$;

CREATE TRIGGER tlw_timeline_content_updated_at
BEFORE UPDATE ON public.timelines
FOR EACH ROW
EXECUTE FUNCTION public.tlw_set_timeline_content_updated_at();

-- All event mutation paths (including imports) touch their parent timeline.
-- The timestamp write is part of the same transaction as the event mutation;
-- it does not make multi-request application imports atomic.
CREATE FUNCTION public.tlw_touch_timeline_from_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  old_parent_id public.timelines.id%TYPE;
  new_parent_id public.timelines.id%TYPE;
BEGIN
  IF TG_OP = 'INSERT' THEN
    new_parent_id := NEW.timeline_id;

  ELSIF TG_OP = 'DELETE' THEN
    old_parent_id := OLD.timeline_id;

  ELSIF TG_OP = 'UPDATE' THEN
    -- details is an array. IS DISTINCT FROM compares it directly and handles
    -- null transitions safely. id/created_at changes alone are not content.
    IF NOT (
      NEW.year IS DISTINCT FROM OLD.year
      OR NEW.title IS DISTINCT FROM OLD.title
      OR NEW.description IS DISTINCT FROM OLD.description
      OR NEW.side IS DISTINCT FROM OLD.side
      OR NEW.details IS DISTINCT FROM OLD.details
      OR NEW.timeline_id IS DISTINCT FROM OLD.timeline_id
    ) THEN
      RETURN NULL;
    END IF;

    old_parent_id := OLD.timeline_id;
    new_parent_id := NEW.timeline_id;
  END IF;

  -- Touch each matching parent once, including both parents on reassignment.
  -- AFTER DELETE runs after cascading parent removal: the deleted parent
  -- matches no row, so there is no attempt to recreate it or require it.
  -- GREATEST avoids moving an existing timestamp backward.
  UPDATE public.timelines AS timeline
  SET updated_at =
    GREATEST(timeline.updated_at, pg_catalog.clock_timestamp())
  WHERE timeline.id = old_parent_id
     OR timeline.id = new_parent_id;

  -- PostgreSQL ignores the return value for AFTER row triggers.
  RETURN NULL;
END;
$function$;

CREATE TRIGGER tlw_event_content_updated_at
AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.tlw_touch_timeline_from_event();

COMMIT;
