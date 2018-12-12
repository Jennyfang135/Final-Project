const express = require('express')
const moment = require('moment')

const cardDb = require('../db/cardData')
const graph = require('../db/graph')
const activities = require('../db/activities')

const router = express.Router()

module.exports = router

const addRecords = (record, dateId, date) => {
  record.date_id = dateId
  record.activity_id = record.activityId
  delete record.activityId

  return cardDb.checkRecords(dateId, record.activity_id).then(card => {
    if (!card) {
      // add
      return cardDb.addRecord(record)
    }
    // update
    return cardDb.updateRecord({
      id: card.id,
      ...record
    })
  })
}

router.post('/', (req, res) => {
  // req.body look like :
  // { userId: 1, date: 'YYYY-MM-DD', cardData: { activityId: 1, rating: 1, log: 'asdfdgfh'} }
  const {userId, date, cardData} = req.body

  // check if date data is exist in dates table
  cardDb
    .checkDate(userId, date)
    .then(existingDate => {
      if (!existingDate) {
        return cardDb.addDate({user_id: userId, date})
      }
      return [existingDate.id]
    })
    .then(([dateId]) => addRecords(cardData, dateId))
    .then(() => cardDb.getRecordsForDate(userId, date))
    .then(records => res.status(200).json({Okay: true, records}))
    .catch(err => res.status(500).json({Okay: false, error: err.message}))
})

router.get('/cards/:userId/:date', (req, res) => {
  const userId = Number(req.params.userId)
  const date = req.params.date

  cardDb.getRecordsForDate(userId, date)
    .then(records => res.status(200).json({Okay: true, records}))
    .catch(err => res.status(500).json({Okay: false, error: err.message}))
})

// Gets all data for graph component
router.get('/stats/:period/:userId/:endDate', (req, res) => {
  let {userId, endDate, period} = req.params
  userId = Number(userId)
  // const userId = Number(req.params.userId)
  // let endDate = req.params.endDate
  // const period = req.params.period
  let startDate = moment(endDate).add(-1, period).format('YYYY-MM-DD')
  let graphData = {}
  let barData = {}

  // get dates data
  graph.getDates(userId, startDate, endDate)
    .then(dates => {
      graphData = {
        labels: dates.map(date => date.date.slice(5, 10)),
        datasets: []
      }
      // graphData.labels = dates.map(date => date.date.slice(5, 10))
      // graphData.datasets = []
      //

      // get cards data
      graph.getAllCards()
        .then(cards => {
          // loop through activities to add data for each activity
          activities.getActivities()
            .then(acts => {
              // Bar Chart
              barData = {
                labels: acts.map(a => a.name),
                datasets: []
              }
              // barData.labels = acts.map(a => a.name)
              // barData.datasets = []
              let bObj = {
                backgroundColor: [],
                data: [],
                label: 'Activities'
              }
              // bObj.backgroundColor = []
              // bObj.data = []
              // bObj.label = 'Activities'

              // loop through activities
              acts.map(a => {
                // Graph
                let aObj = {
                  label: a.name,
                  borderColor: a.colour,
                  backgroundColor: a.colour,
                  fill: false,
                  pointRadius: 1,
                  spanGaps: true,
                  data: []
                }
                // aObj.label = a.name
                // aObj.borderColor = a.colour
                // aObj.backgroundColor = a.colour
                // aObj.fill = false
                // aObj.pointRadius = 1
                // aObj.spanGaps = true
                a.id === 1 ? aObj.borderWidth = 2 : aObj.borderWidth = 1
                a.id === 1 ? aObj.hidden = false : aObj.hidden = true
                // aObj.data = []

                dates.map(date => {
                  let [filteredCard] = cards.filter(card => {
                    return card.activity_id === a.id && card.date_id === date.id
                  })
                  if (filteredCard) {
                    aObj.data.push(filteredCard.rating)
                  } else {
                    aObj.data.push(null)
                  }
                })
                graphData.datasets.push(aObj)

                // Bar Chart
                let sum = 0
                let count = 0
                aObj.data.map(rating => {
                  if (rating) {
                    sum += rating
                    count++
                  }
                })
                let av = sum / count
                bObj.data.push(av)
                bObj.backgroundColor.push(a.colour)
              })
              barData.datasets.push(bObj)

              res.status(200).json({
                ok: true, chartData: {graphData, barData}
              })
            })
            .catch(err => res.status(500).json({
              ok: false, error: err.message
            }))
        })
        .catch(err =>
          res.status(500).json({
            ok: false,
            error: err.message
          })
        )
    })
})
