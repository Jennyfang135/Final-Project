import React from 'react'
import Calendar from 'react-input-calendar'
import BottomMenu from './BottomMenu'
import Loading from './Loading'

class MyCalendar extends React.Component {
  render () {
    if (this.props.pending) {
      return <Loading />
    }
    return (
      <div>
        <Calendar format='DD/MM/YYYY' />
        <BottomMenu />
      </div>
    )
  }
}
export default MyCalendar
