export const tileStylesDark = {
  wall: { fill: '#554848', stroke: '#6a5c5c' },
  floor: { fill: '#262636', stroke: '#36364a' },
  stairs: { fill: '#fe9f2e', stroke: '#e07a10', label: '\u25B2\u25BC' },
  elevator: { fill: '#8839ef', stroke: '#6c2dcb', label: '\u2B06\u2B07' },
  outside: { fill: '#2a1e1e', stroke: '#3d2828' },
  dirt_path: { fill: '#4a3e2e', stroke: '#5a4e3e', label: '~' },
  void: { fill: '#0a0a0f', stroke: '#16161e' }
}

export const tileStylesLight = {
  wall: { fill: '#b0a8a0', stroke: '#948c84' },
  floor: { fill: '#ffffff', stroke: '#e4e4e7' },
  stairs: { fill: '#f59e0b', stroke: '#d97706', label: '\u25B2\u25BC' },
  elevator: { fill: '#8b5cf6', stroke: '#7c3aed', label: '\u2B06\u2B07' },
  outside: { fill: '#d4ccc4', stroke: '#b8b0a8' },
  dirt_path: { fill: '#e8d5b7', stroke: '#c4a97d', label: '~' },
  void: { fill: '#f2f2f0', stroke: '#d8d8d4' }
}

export const overlayStyles = {
  door: { fill: 'rgba(64, 160, 43, 0.6)', label: '\u25FB' },
  exit_door: { fill: 'rgba(210, 15, 57, 0.7)', label: 'EXIT' },
  room: { fill: 'rgba(30, 102, 245, 0.18)' }
}

export function getTileStyles(theme) {
  return theme === 'light' ? tileStylesLight : tileStylesDark
}
