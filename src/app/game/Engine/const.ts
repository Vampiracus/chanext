export const BG_COLOR = '#333'
export const LIGHT_CELL_COLOR = '#ddd'
export const DARK_CELL_COLOR = '#769656'
export const DARK_CHECKER_COLOR = '#333'
export const LIGHT_CHECKER_COLOR = '#fff'
export const CHECKER_SHADOW_COLOR = 'red'

export enum GameState {
  init,
  ready,
  playerTurn,
  playerTurnAnimation,
  enemyTurn,
  enemyTurnAnimation,
  gameOver,
}

// Physics
export const FRICTION_COEFFICIENT = 1.4

export function getCanvasWidth() {
  return Math.max(Math.min(window.screen.width * 0.9, (window.screen.height - 100) * 0.75), 270)
}

export function getAreaWidth() {
  return getCanvasWidth() * 0.75
}

export function getCheckerRadius() {
  return getAreaWidth() / 20
}

export function getStartCoord() {
  return (getCanvasWidth() - getAreaWidth()) / 2
}

export function getMaxSpeed() {
  return 1000 / 800 * getCanvasWidth()
}

export function getMaxSpeedDist() {
  return getMaxSpeed() * 0.3
}