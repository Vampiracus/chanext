export const BG_COLOR = '#333'
export const LIGHT_CELL_COLOR = '#ddd'
export const DARK_CELL_COLOR = '#769656'
export const DARK_CHECKER_COLOR = '#333'
export const LIGHT_CHECKER_COLOR = '#fff'
export const CHECKER_SHADOW_COLOR = 'red'
export const BEGIN_COORD_X = 100
export const BEGIN_COORD_Y = 100
export const RADIUS_CHECKER = 30
export const CHESSBOARD_WIDTH = 600
export const CHESSBOARD_HEIGHT = 600

export const MAXSPEED = 1000
export const MAXSPEED_DISTANCE = MAXSPEED * 0.3

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
