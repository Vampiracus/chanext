import {
  AbstractGameObject,
  GameObjectType,
  TGameObjectOptions,
} from './AbstractGameObject'
import {
  DARK_CHECKER_COLOR,
  GameState,
  LIGHT_CHECKER_COLOR,
  getAreaWidth,
  getCheckerRadius,
  getStartCoord,
} from './const'
import { Checker } from './Checker'

type TPlayerOptions = TGameObjectOptions & {
  getGameState: () => GameState
  setGameState: (state: GameState) => void
  withBot: boolean
}

// В Checkers.x, Checkers.y хранится положение канвы

export class Checkers extends AbstractGameObject {
  static type = GameObjectType.Player

  private getGameState: () => GameState
  private setGameState: (state: GameState) => void

  private checkersPlayer: Checker[] = []
  private checkersEnemy: Checker[] = []

  private selectedChecker: Checker | null = null

  private withBot: boolean

  private _userScrollAndResizeHandler_withContext: (e: Event) => void

  constructor(options: TPlayerOptions) {
    super(options)
    this.getGameState = options.getGameState
    this.setGameState = options.setGameState
    this._userScrollAndResizeHandler_withContext =
    this._userScrollAndResizeHandler.bind(this)
    this.withBot = options.withBot
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
    const step = getAreaWidth() / 8
    this._createAndDrawColoredCheckers(
      this.ctx,
      getStartCoord(),
      getStartCoord(),
      step,
      DARK_CHECKER_COLOR,
      false
    )
    this._createAndDrawColoredCheckers(
      this.ctx,
      getStartCoord(),
      getStartCoord() + step * 7,
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
        radius: getCheckerRadius(),
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
    if (!(this.withBot && this.getGameState() === GameState.enemyTurn)) {
      this.selectedChecker?.makeInactive()
      this.selectedChecker = null
    }
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
    if (this.withBot && state === GameState.enemyTurn) return

    const x = e.offsetX
    const y = e.offsetY

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
          this.withBot && this._botTakeTurn();
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

  // On delete of Checkers element
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
    // this.ctx.strokeText(this.getGameState().toString(), 0, 50) // for debugging
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

  private _botTakeTurn() {
    /**
     * Выбирает одну шашку бота и две шашки игрока, так что расстояние между шашкой бота и
     * первой из шашек игрока минимально. Вторая шашка игрока — второй минимум по растоянию
     */
    const botPickCheckers: () => [Checker, Checker, Checker] = () => {
      let bots = this.checkersEnemy[0], players1 = this.checkersPlayer[0], 
          players2 = this.checkersPlayer[0], d = bots.distTo(players1)
      for(let i = 0; i < this.checkersEnemy.length; i++) {
        for(let j = 0; j < this.checkersPlayer.length; j++) {
          const c1 = this.checkersEnemy[i], c2 = this.checkersPlayer[j]
          const d1 = c1.distTo(c2)
          if (d1 < d) {
            d = d1
            players2 = players1
            players1 = c2
            bots = c1
          }
        }
      }
      return [bots, players1, players2]
    }

    const [ bots, players1, players2 ] = botPickCheckers()

    let players = players1
    if (Math.random() > 0.65) {
      players = players2
    }
    
    this.selectedChecker = bots
    bots.makeActive()

    const botThrow = () => {
      // Угол разброса
      const phi = Math.PI / 12 // 15deg
      const deviation = Math.random() * phi
      const alpha = phi / 2 - deviation
      // Нужно повернуть вектор от bots до players на alpha
      const [ vectX, vectY ] = bots.vectorTo(players)
      let newX = vectX * Math.cos(alpha) - vectY * Math.sin(alpha)
      let newY = vectX * Math.sin(alpha) + vectY * Math.cos(alpha)
      // Силу броска сделать побольше
      newX *= 1000
      newY *= 1000

      const x = bots.getX() + newX, y = bots.getY() + newY

      bots.throw(x, y)
      
      this.selectedChecker!.makeInactive()
      this.selectedChecker = null
      this.setGameState(GameState.enemyTurnAnimation)
    }

    // Задержка, чтобы игрок понял, какую шашку кидает бот
    setTimeout(botThrow, 700)
  }
}
