import { Checkers, ChessBoard } from '../Engine'
import { AbstractGameObject } from './AbstractGameObject'
import {
  BG_COLOR,
  BEGIN_COORD_X,
  BEGIN_COORD_Y,
  CHESSBOARD_WIDTH,
  CHESSBOARD_HEIGHT,
  GameState,
} from './const'

export type TGameEngineOptions = {
  ctx: CanvasRenderingContext2D
  ref: HTMLCanvasElement
  debug?: boolean
  onScoreUpdate?: (newScore: number) => void
  onGameOver?: (score: number) => void
}

const noop = () => {}

export class GameEngine {
  static gameAreaWidth = 800

  static gameAreaHeight = 800

  private _ctx: CanvasRenderingContext2D

  private _ref: HTMLCanvasElement

  private _gameState: GameState = GameState.init

  private _score = 0

  private _onScoreUpdate: (newScore: number) => void

  private _onGameOver: (score: number) => void

  private _lastTime = performance.now()

  private _objects: AbstractGameObject[] = []

  private _bgObjects: AbstractGameObject[] = []

  private _objectsClass: typeof AbstractGameObject[] = []

  constructor({
    ctx,
    ref,
    debug,
    onScoreUpdate,
    onGameOver,
  }: TGameEngineOptions) {
    this._ctx = ctx
    this._ref = ref

    ctx.canvas.width = GameEngine.gameAreaWidth
    ctx.canvas.height = GameEngine.gameAreaHeight

    this._onScoreUpdate = onScoreUpdate ?? noop
    this._onGameOver = onGameOver ?? noop
  }

  /**
   * Запускает и перезапускает игру
   */
  public start() {
    const run = () => {
      this._gameState = GameState.playerTurn

      // Запускаем основной цикл игры
      this._lastTime = performance.now()
      requestAnimationFrame(this._gameLoop.bind(this))
    }

    if (this._gameState === GameState.ready) {
      // Первый запуск
      run()
    } else {
      // Перезапуск
      this.emergencyStop()
      this._objects = []
      this._bgObjects = []
      this._score = 0
      this.init().then(run)
    }
  }

  /**
   * Остановка игры
   */
  public stop() {
    this._bgObjects.forEach(obj => {
      obj.delete()
    })
  }

  /**
   * Экстренное завершение игры
   */
  public emergencyStop() {
    this.stop()
    this._gameState = GameState.gameOver
  }

  /**
   * Добавляет очки
   *
   * @param score - Добавляемое количество очков
   */
  public addScore(score: number) {
    this._score += score
    this._onScoreUpdate(this._score)
  }

  /**
   * Регистрирует конструкторы возможных объектов
   *
   * @param objectClass - Конструктор игрового объекта или массив конструкторов
   */
  public registerObject(
    objectClass: typeof AbstractGameObject | typeof AbstractGameObject[]
  ): void {
    if (Array.isArray(objectClass)) {
      this._objectsClass.push(...objectClass)
    } else {
      this._objectsClass.push(objectClass)
    }
  }

  /**
   * Инициализация всех игровых объектов.
   *
   * @returns Возвращает true при удачной инициализации игровых объектов
   */
  public async init() {
    this._clear()
    this.registerObject([ChessBoard, Checkers])
    const { x: canvX, y: canvY } = this._ref.getBoundingClientRect()
    this._bgObjects.push(
      new ChessBoard({
        ctx: this._ctx,
        debug: false,
        x: BEGIN_COORD_X,
        y: BEGIN_COORD_Y,
        // Чтобы не падал TS
        vx: 0,
        vy: 0,
        width: CHESSBOARD_WIDTH,
        height: CHESSBOARD_HEIGHT,
      })
    )
    this._bgObjects.push(
      new Checkers({
        ctx: this._ctx,
        debug: false,
        x: canvX,
        y: canvY,
        // Чтобы не падал TS
        vx: 0,
        vy: 0,
        width: 0,
        height: 0,
        getGameState: () => {
          return this._gameState
        },
        setGameState: (state: GameState) => {
          this._gameState = state
        },
      })
    )

    // Инициализация объектов, подгрузка спрайтов и тд.
    const objectInit = this._objects.map(object =>
      object.init().catch(error => console.error(error))
    )
    const bgObjectInit = this._bgObjects.map(bgObject =>
      bgObject.init().catch(error => console.error(error))
    )

    const initResult = await Promise.all(objectInit.concat(bgObjectInit))
    if (!initResult.every(res => res)) {
      throw new Error('Init objects failure')
    }

    this._gameState = GameState.ready

    if (
      'Notification' in window &&
      Notification.permission !== 'denied' &&
      Notification.permission !== 'granted'
    ) {
      Notification.requestPermission()
    }
    return true
  }

  /**
   * Главный игровой цикл.
   *
   * @param nowTime - Время в мсек прошедшее с последнего вызова
   */
  private _gameLoop(nowTime: DOMHighResTimeStamp) {
    const dt = nowTime - this._lastTime
    this._lastTime = nowTime

    this._clear()

    for (let i = 0; i < this._bgObjects.length; i += 1) {
      this._bgObjects[i].update(dt)
    }

    const isGameOver = this._gameState === GameState.gameOver

    if (!isGameOver) requestAnimationFrame(this._gameLoop.bind(this))
    else {
      const score = (this._bgObjects[1] as Checkers).getScore()
      this._onGameOver(score)
      this.stop()
    }
  }

  /**
   * Очистка игрового поля
   */
  private _clear() {
    this._ctx.fillStyle = BG_COLOR
    this._ctx.fillRect(
      0,
      0,
      GameEngine.gameAreaWidth,
      GameEngine.gameAreaHeight
    )
  }
}
