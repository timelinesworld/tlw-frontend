-- Apply only AFTER 20261004000100_add_event_sort_order.sql has committed successfully.
-- Two invoker RPCs: ordered block insertion and atomic new-timeline import.
-- No existing policy, table grant, or security-definer privilege is changed.
-- Stale direct inserts without sort_order fail NOT NULL rather than guessing order.
BEGIN;

CREATE FUNCTION public.tlw_add_event_block(
  p_timeline_id text,
  p_events jsonb,
  p_placement text DEFAULT 'top',
  p_skip_existing boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  parent_id public.timelines.id%TYPE;
  item jsonb;
  accepted jsonb := '[]'::jsonb;
  event_record public.events%ROWTYPE;
  inserted_id public.events.id%TYPE;
  inserted_ids jsonb := '[]'::jsonb;
  matched integer;
  skipped integer := 0;
  block_size bigint;
  position bigint;
  lower_position bigint;
  upper_position bigint;
BEGIN
  -- Backend authorization complements (and never bypasses) existing RLS.
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin authorization required' USING ERRCODE = '42501';
  END IF;
  IF p_placement IS NULL OR p_placement NOT IN ('top', 'bottom')
     OR p_skip_existing IS NULL OR jsonb_typeof(p_events) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Events must be an array; placement must be top or bottom';
  END IF;

  -- Every allocator locks the parent BEFORE reading its current extremes.
  -- At READ COMMITTED the subsequent queries see the previous allocator's commit.
  SELECT id INTO parent_id FROM public.timelines
  WHERE id::text = p_timeline_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Timeline not found or not writable' USING ERRCODE = '42501';
  END IF;

  FOR item IN
    SELECT value FROM jsonb_array_elements(p_events) WITH ORDINALITY AS incoming(value, ordinal)
    ORDER BY ordinal
  LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'object'
       OR item ? 'sort_order'
       OR jsonb_typeof(item->'year') IS DISTINCT FROM 'string'
       OR btrim(item->>'year') = ''
       OR item->>'side' IS NULL OR item->>'side' NOT IN ('positive', 'negative')
       OR jsonb_typeof(item->'title') NOT IN ('string', 'null')
       OR jsonb_typeof(item->'description') NOT IN ('string', 'null')
       OR jsonb_typeof(item->'details') NOT IN ('array', 'null') THEN
      RAISE EXCEPTION 'Invalid event JSON; array order supplies placement, not sort_order';
    END IF;
    IF jsonb_typeof(item->'details') = 'array' THEN
      IF EXISTS (SELECT 1 FROM jsonb_array_elements(item->'details') AS detail(value)
                 WHERE jsonb_typeof(value) IS DISTINCT FROM 'string') THEN
        RAISE EXCEPTION 'Event details must be an array of strings';
      END IF;
    END IF;

    IF p_skip_existing THEN
      -- Recheck under the allocation lock; the client preview is informational.
      -- Null and empty titles use one consistent duplicate-matching contract.
      SELECT count(*) INTO matched FROM public.events
      WHERE timeline_id = parent_id AND year = item->>'year'
        AND coalesce(title, '') = coalesce(item->>'title', '');
      IF matched > 1 THEN
        RAISE EXCEPTION 'Ambiguous duplicate match for event %, %', item->>'year', item->>'title';
      END IF;
      IF matched = 1 OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(accepted) AS previous(value)
        WHERE value->>'year' = item->>'year'
          AND coalesce(value->>'title', '') = coalesce(item->>'title', '')
      ) THEN
        skipped := skipped + 1;
        CONTINUE;
      END IF;
    END IF;
    accepted := accepted || jsonb_build_array(item);
  END LOOP;

  block_size := jsonb_array_length(accepted);
  IF block_size = 0 THEN
    RETURN jsonb_build_object('inserted', 0, 'skipped', skipped, 'event_ids', inserted_ids);
  END IF;
  SELECT min(sort_order), max(sort_order) INTO lower_position, upper_position
  FROM public.events WHERE timeline_id = parent_id;
  -- A top block preserves JSON order: never prepend its members one at a time.
  -- bigint arithmetic errors abort the transaction; there is no silent wraparound.
  position := CASE
    WHEN lower_position IS NULL THEN 0
    WHEN p_placement = 'top' THEN lower_position - block_size * 10 - 10
    ELSE upper_position
  END;
  FOR item IN
    SELECT value FROM jsonb_array_elements(accepted) WITH ORDINALITY AS block(value, ordinal)
    ORDER BY ordinal
  LOOP
    position := position + 10;
    SELECT * INTO event_record FROM jsonb_populate_record(NULL::public.events,
      jsonb_build_object('year', item->'year', 'title', item->'title',
        'description', item->'description', 'side', item->'side', 'details', item->'details'));
    INSERT INTO public.events (timeline_id, year, title, description, side, details, sort_order)
    VALUES (parent_id, event_record.year, event_record.title, event_record.description,
            event_record.side, event_record.details, position)
    RETURNING id INTO inserted_id;
    inserted_ids := inserted_ids || jsonb_build_array(inserted_id::text);
  END LOOP;
  RETURN jsonb_build_object('inserted', block_size, 'skipped', skipped, 'event_ids', inserted_ids);
END;
$function$;

CREATE FUNCTION public.tlw_import_timeline(p_document jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  primary_category public.categories.id%TYPE;
  secondary_category public.categories.id%TYPE;
  new_parent public.timelines.id%TYPE;
  timeline_record public.timelines%ROWTYPE;
  result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin authorization required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_document) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_document->'title') IS DISTINCT FROM 'string'
     OR btrim(p_document->>'title') = ''
     OR jsonb_typeof(p_document->'category') IS DISTINCT FROM 'string'
     OR jsonb_typeof(p_document->'events') IS DISTINCT FROM 'array'
     OR jsonb_typeof(p_document->'description') NOT IN ('string', 'null')
     OR jsonb_typeof(p_document->'filters') NOT IN ('array', 'null')
     OR jsonb_typeof(p_document->'secondary_category') NOT IN ('string', 'null') THEN
    RAISE EXCEPTION 'Invalid timeline import JSON';
  END IF;
  -- Serialize same-title imports. This is not a new table uniqueness contract.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_document->>'title', 0));
  IF EXISTS (SELECT 1 FROM public.timelines WHERE title = p_document->>'title') THEN
    RAISE EXCEPTION 'Timeline already exists; use update import';
  END IF;
  SELECT id INTO STRICT primary_category FROM public.categories WHERE name = p_document->>'category';
  IF coalesce(p_document->>'secondary_category', '') <> '' THEN
    SELECT id INTO STRICT secondary_category FROM public.categories WHERE name = p_document->>'secondary_category';
  END IF;
  -- Populate native fields without guessing the live filters/details data types.
  SELECT * INTO timeline_record FROM jsonb_populate_record(NULL::public.timelines,
    jsonb_build_object('title', p_document->'title', 'description', p_document->'description',
      'filters', p_document->'filters'));
  INSERT INTO public.timelines (title, description, category_id, secondary_category_id, filters, views)
  VALUES (timeline_record.title, timeline_record.description, primary_category, secondary_category,
          timeline_record.filters, 0)
  RETURNING id INTO new_parent;
  result := public.tlw_add_event_block(new_parent::text, p_document->'events', 'bottom', false);
  -- Any failed event/trigger/RLS check rolls back the new timeline as well.
  RETURN result || jsonb_build_object('timeline_id', new_parent::text);
END;
$function$;

REVOKE ALL ON FUNCTION public.tlw_add_event_block(text, jsonb, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.tlw_import_timeline(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tlw_add_event_block(text, jsonb, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tlw_import_timeline(jsonb) TO authenticated;

-- Install AFTER baseline backfill: ordinary position edits are now editorial.
-- Keep all Feature #1 comparisons, invoker privileges, and cascade handling.
CREATE OR REPLACE FUNCTION public.tlw_touch_timeline_from_event()
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
    IF NOT (
      NEW.year IS DISTINCT FROM OLD.year
      OR NEW.title IS DISTINCT FROM OLD.title
      OR NEW.description IS DISTINCT FROM OLD.description
      OR NEW.side IS DISTINCT FROM OLD.side
      OR NEW.details IS DISTINCT FROM OLD.details
      OR NEW.timeline_id IS DISTINCT FROM OLD.timeline_id
      OR NEW.sort_order IS DISTINCT FROM OLD.sort_order
    ) THEN RETURN NULL; END IF;
    old_parent_id := OLD.timeline_id;
    new_parent_id := NEW.timeline_id;
  END IF;
  UPDATE public.timelines AS timeline
  SET updated_at = GREATEST(timeline.updated_at, pg_catalog.clock_timestamp())
  WHERE timeline.id = old_parent_id OR timeline.id = new_parent_id;
  RETURN NULL;
END;
$function$;
COMMIT;
