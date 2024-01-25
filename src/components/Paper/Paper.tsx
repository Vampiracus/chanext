import './Paper.css'
import { PropsWithChildren } from 'react'

const Paper = (
  props: PropsWithChildren & { class?: string; outerClass?: string }
) => {
  return (
    <div
      className={
        'primitive-paper ' + (props.outerClass ? props.outerClass : '')
      }>
      <div
        className={
          'primitive-paper__content ' + (props.class ? props.class : '')
        }>
        {props.children}
      </div>
    </div>
  )
}

export default Paper