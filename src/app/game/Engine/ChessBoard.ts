import {
  AbstractGameObject,
  GameObjectType,
  TGameObjectOptions,
} from './AbstractGameObject'

import { DARK_CELL_COLOR, LIGHT_CELL_COLOR, getAreaWidth, getCanvasWidth } from './const'

type TPlayerOptions = TGameObjectOptions

export class ChessBoard extends AbstractGameObject {
  static type = GameObjectType.Table

  private symbolsArr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

  get delta() {
    return getAreaWidth() / 8
  }

  constructor(options: TPlayerOptions) {
    super(options)
  }

  public async init() {
    return true
  }

  public update(): void {
    this.draw()
  }

  protected draw(): void {
    for (let i = 1; i <= 8; i++) {
      for (let j = 1; j <= 8; j++) {
        this.ctx.fillStyle =
          (i + j) % 2 == 0 ? LIGHT_CELL_COLOR : DARK_CELL_COLOR
        this.ctx.fillRect(
          this.x + this.delta * (i - 1),
          this.y + this.delta * (j - 1),
          this.delta,
          this.delta
        )
      }
    }

    this.symbolsArr.forEach((item, index) => {
      const w = getCanvasWidth()
      const fontSz = Math.round(24 * w / 800), offX = 35 * w / 800, offY = 32 * w / 800
      this.ctx.font = `${fontSz}px serif`
      this.ctx.fillText(item, this.x + this.delta * index + offX, this.y - offY)
      this.ctx.fillText(
        String(8 - index),
        this.x - offX,
        this.y + this.delta * index + offY
      )
    })
  }
}
