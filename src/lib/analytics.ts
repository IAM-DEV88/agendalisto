type AnalyticsEventName =
  | 'booking_page_viewed'
  | 'date_selected'
  | 'time_selected'
  | 'booking_submitted'
  | 'booking_confirmed'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'review_submitted'
  | 'waitlist_joined';

type AnalyticsProps = Record<string, string | number | boolean>;

export function trackEvent(name: AnalyticsEventName, props: AnalyticsProps = {}) {
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${name}`, props);
  }
}
