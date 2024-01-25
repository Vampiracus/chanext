import {
  AbstractGameObject,
  GameObjectType,
  TGameObjectOptions,
} from './AbstractGameObject'
import {
  BEGIN_COORD_X,
  BEGIN_COORD_Y,
  CHESSBOARD_WIDTH,
  DARK_CHECKER_COLOR,
  GameState,
  LIGHT_CHECKER_COLOR,
  RADIUS_CHECKER,
} from './const'
import { Checker } from './Checker'

type TPlayerOptions = TGameObjectOptions & {
  getGameState: () => GameState
  setGameState: (state: GameState) => void
}

// В Checkers.x, Checkers.y хранится положение канвы

export class Checkers extends AbstractGameObject {
  static type = GameObjectType.Player

  private getGameState: () => GameState
  private setGameState: (state: GameState) => void

  private checkersPlayer: Checker[] = []
  private checkersEnemy: Checker[] = []

  private selectedChecker: Checker | null = null

  private _userScrollAndResizeHandler_withContext: (e: Event) => void

  constructor(options: TPlayerOptions) {
    super(options)
    this.getGameState = options.getGameState
    this.setGameState = options.setGameState
    this._userScrollAndResizeHandler_withContext =
      this._userScrollAndResizeHandler.bind(this)
  }

  public async init() {
    this.ctx.canvas.onclick = this._userClickHandler.bind(this)
    this.ctx.canvas.oncontextmenu = this._userRightClickHandler.bind(this)

    window.addEventListener(
      'scroll',
      this._userScrollAndResizeHandler_withContext
    )
    window.addEventListener(
      'resize',
      this._userScrollAndResizeHandler_withContext
    )

    return true
  }

  /**
   * Создает все пешки
   */
  private _createAndDrawAllCheckers() {
    const step = CHESSBOARD_WIDTH / 8
    this._createAndDrawColoredCheckers(
      this.ctx,
      BEGIN_COORD_X,
      BEGIN_COORD_Y,
      step,
      DARK_CHECKER_COLOR,
      false
    )
    this._createAndDrawColoredCheckers(
      this.ctx,
      BEGIN_COORD_X,
      BEGIN_COORD_Y + step * 7,
      step,
      LIGHT_CHECKER_COLOR,
      true
    )
  }

  /**
   * Создает пешки одной из сторон
   */
  private _createAndDrawColoredCheckers(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    step: number,
    color: string,
    ours: boolean
  ) {
    for (let i = 0; i <= 7; i++) {
      const checker = new Checker({
        ctx: this.ctx,
        x: x + step / 2 + step * i,
        y: y + step / 2,
        vx: 0,
        vy: 0,
        radius: RADIUS_CHECKER,
        color: color,
        width: 0,
        height: 0,
      })
      checker.init()
      if (ours) this.checkersPlayer.push(checker)
      else this.checkersEnemy.push(checker)
    }
  }

  private _userRightClickHandler(e: MouseEvent): void {
    e.preventDefault()
    this.selectedChecker?.makeInactive()
    this.selectedChecker = null
  }

  private _userScrollAndResizeHandler(): void {
    this._recalculateBoundries()
  }

  private _recalculateBoundries(): void {
    const { x: canvX, y: canvY } = this.ctx.canvas.getBoundingClientRect()
    this.x = canvX
    this.y = canvY
  }

  private _userClickHandler(e: MouseEvent): void {
    const state = this.getGameState()
    if (state !== GameState.playerTurn && state !== GameState.enemyTurn) return

    const x = e.clientX - this.x
    const y = e.clientY - this.y
    this.selectedChecker?.makeInactive()

    const newChecker = this._findCheckerByCords(x, y)

    // если текущий игрок выбрал новую шашку
    if (
      newChecker &&
      ((state === GameState.playerTurn &&
        this.checkersPlayer.indexOf(newChecker) !== -1) ||
        (state === GameState.enemyTurn &&
          this.checkersEnemy.indexOf(newChecker) !== -1))
    ) {
      this.selectedChecker = newChecker
      newChecker.makeActive()
    } else if (this.selectedChecker) {
      this.selectedChecker.throw(x, y)
      this.selectedChecker = null
      if (state === GameState.playerTurn)
        this.setGameState(GameState.playerTurnAnimation)
      else this.setGameState(GameState.enemyTurnAnimation)
    }
  }

  private _findCheckerByCords(x: number, y: number): Checker | null {
    for (const checker of this.checkersEnemy) {
      if (checker.pointFromHere(x, y)) return checker
    }
    for (const checker of this.checkersPlayer) {
      if (checker.pointFromHere(x, y)) return checker
    }
    return null
  }

  public update(dt: number): void {
    if (this.checkersEnemy.length === 0) {
      this._createAndDrawAllCheckers()
    } else {
      this.garbageCollector()

      for (const checker of this.checkersEnemy) checker.update(dt)
      for (const checker of this.checkersPlayer) checker.update(dt)

      // Проверка на соударения
      this._checkForCollisions()

      if (this._areCheckersStill()) {
        if (this.getGameState() === GameState.playerTurnAnimation) {
          this.setGameState(GameState.enemyTurn)
        } else if (this.getGameState() === GameState.enemyTurnAnimation) {
          this.setGameState(GameState.playerTurn)
        }
      }

      if (this.isGameOver()) {
        this.setGameState(GameState.gameOver)
      }
    }

    this.draw()
  }

  private _areCheckersStill() {
    for (const checker of this.checkersPlayer) {
      if (!checker.isStill()) return false
    }
    for (const checker of this.checkersEnemy) {
      if (!checker.isStill()) return false
    }
    return true
  }

  private _checkForCollisions() {
    for (let i = 0; i < this.checkersPlayer.length; i++) {
      for (let j = 0; j < this.checkersPlayer.length; j++) {
        if (i == j) continue
        this.checkersPlayer[i].collide(this.checkersPlayer[j])
      }
      for (let j = 0; j < this.checkersEnemy.length; j++) {
        this.checkersPlayer[i].collide(this.checkersEnemy[j])
      }
    }
    for (let i = 0; i < this.checkersEnemy.length; i++) {
      for (let j = 0; j < this.checkersEnemy.length; j++) {
        if (i == j) continue
        this.checkersEnemy[i].collide(this.checkersEnemy[j])
      }
      for (let j = 0; j < this.checkersPlayer.length; j++) {
        this.checkersEnemy[i].collide(this.checkersPlayer[j])
      }
    }
  }

  public override delete() {
    window.removeEventListener(
      'scroll',
      this._userScrollAndResizeHandler_withContext
    )
    window.removeEventListener(
      'resize',
      this._userScrollAndResizeHandler_withContext
    )
  }

  protected draw(): void {
    this.ctx.strokeText(this.getGameState().toString(), 0, 50)
  }

  public garbageCollector() {
    for (const checker of this.checkersPlayer) {
      if (checker.isOutOfBoundaries()) {
        this.checkersPlayer = this.checkersPlayer.filter(obj => obj !== checker)
      }
    }
    for (const checker of this.checkersEnemy) {
      if (checker.isOutOfBoundaries()) {
        this.checkersEnemy = this.checkersEnemy.filter(obj => obj !== checker)
      }
    }
  }

  public isGameOver() {
    return this.checkersEnemy.length === 0 || this.checkersPlayer.length === 0
  }

  public getScore() {
    return (
      (8 - this.checkersEnemy.length) * 100 -
      (8 - this.checkersPlayer.length) * 50
    )
  }
}
