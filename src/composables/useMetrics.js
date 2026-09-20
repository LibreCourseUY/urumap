import { appConfig } from '../config.js'

export function useMetrics() {
  const { apiKey, eventsUrl, viewsUrl } = appConfig.metrics

  const track = async (eventType, metadata = {}) => {
    if (!apiKey) return
    try {
      await fetch(eventsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify({ event_type: eventType, metadata })
      })
    } catch (error) {
      console.error('Metrics tracking error:', error)
    }
  }

  const trackView = () => {
    if (!apiKey) return
    fetch(viewsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        document_title: document.title
      })
    }).catch(() => {})
  }

  return { track, trackView }
}
