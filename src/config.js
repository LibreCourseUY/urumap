const env = import.meta.env
const base = env.BASE_URL || '/'

export const appConfig = {
  name: env.VITE_APP_NAME || 'UruMap',
  description:
    env.VITE_APP_DESCRIPTION || 'Mapas interactivos de edificios públicos de Uruguay',
  disclaimer: env.VITE_DISCLAIMER || '',
  base,
  catalogUrl: `${base}maps/index.json`,
  metrics: {
    apiKey: env.VITE_METRICS_API_KEY || '',
    eventsUrl: env.VITE_METRICS_EVENTS_URL || 'https://api.eclipselabs.com.uy/metrics/event',
    viewsUrl: env.VITE_METRICS_VIEWS_URL || 'https://api.eclipselabs.com.uy/metrics/views'
  }
}
