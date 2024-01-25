export enum GameObjectType {
  Table,
  Player,
  Enemy,
  Swarm,
  Projectile,
  Star,
  Unknown,
}

export interface IGameObject {
  update(dt: number): void
}

export type TGameObjectOptions = {
  ctx: CanvasRenderingContext2D
  debug?: boolean
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
}

export abstract class AbstractGameObject implements IGameObject {
  static type = GameObjectType.Unknown

  protected x: number
  protected y: number
  protected vx: number
  protected vy: number

  public width: number

  public height: number

  protected ctx: CanvasRenderingContext2D

  protected debug: boolean

  private _hasDelete = false

  constructor({ ctx, debug, x, y, vx, vy, width, height }: TGameObjectOptions) {
    this.ctx = ctx
    this.debug = debug ?? false
    this.x = x
    this.y = y
    this.vx = vx
    this.vy = vy
    this.width = width
    this.height = height
  }

  /**
   * Пометить объект как удаленный, для сборщика мусора
   */
  public delete() {
    this._hasDelete = true
  }

  /**
   * Возвращает пометку удален ли объект
   */
  public get hasDelete() {
    return this._hasDelete
  }

  /**
   * Инициализация объекта, подргузка спрайтов и т.д
   *
   * @returns Возвращает true в результате удачной инициализации
   */
  public abstract init(): Promise<boolean>

  /**
   * Обновление состояния объекта, координаты, скорости и т.д.
   *
   * @param dt - Время в мсек прошедшее с предыдущего запуска
   */
  public abstract update(dt: number): void

  /**
   * Отрисовка объекта
   */
  protected abstract draw(): void
}
