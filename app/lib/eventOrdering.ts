import type { SupabaseClient } from '@supabase/supabase-js';

export type EventPlacement = 'top' | 'bottom';
export interface EventInput {
  year: string;
  title?: string | null;
  description?: string | null;
  side: 'positive' | 'negative';
  details?: string[] | null;
}

export function validateImportEvents(events: unknown): asserts events is EventInput[] {
  if (!Array.isArray(events)) throw new Error('JSON events must be an array.');
  for (const event of events) {
    if (!event || typeof event !== 'object' || Array.isArray(event)
      || 'sort_order' in event
      || typeof event.year !== 'string' || !event.year.trim()
      || !['positive', 'negative'].includes(event.side)
      || (event.title != null && typeof event.title !== 'string')
      || (event.description != null && typeof event.description !== 'string')
      || (event.details != null && (!Array.isArray(event.details)
        || event.details.some((detail: unknown) => typeof detail !== 'string')))) {
      throw new Error('Invalid event JSON. Use array order, not sort_order; details must be an array of strings.');
    }
  }
}

// Position allocation belongs to the locked database transaction, never JS.
export function addEventBlock(
  client: SupabaseClient,
  timelineId: string | number,
  events: EventInput[],
  placement: EventPlacement = 'top',
  skipExisting = false,
) {
  return client.rpc('tlw_add_event_block', {
    p_timeline_id: String(timelineId), p_events: events,
    p_placement: placement, p_skip_existing: skipExisting,
  });
}

// A single RPC creates the timeline and all its ordered events atomically.
export function importTimeline(client: SupabaseClient, document: unknown) {
  return client.rpc('tlw_import_timeline', { p_document: document });
}
