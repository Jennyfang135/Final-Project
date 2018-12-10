const express = require('express')
const moment = require('moment')

const cardData = require('../db/cardData')
const graph = require('../db/graph')
const activities = require('../db/activities')

const router = express.Router()

module.exports = router

// router.post('/', (req, res) => {
//   // req.body required to look like :
//   // {userId: 1, records:{activityId:1, rating: 1, log:'asdfdgfh'}}
//   const {userId, records} = req.body

//   // if (isRecordOkay) {
//   cardData.addDate({user_id: userId})
//     .then(dateId => {
//       for (let rec of records) {
//         rec.date_id = dateId[0]
//         rec.activity_id = rec.activityId
//         delete rec.activityId
//       }

//       cardData.addRecords(records)
//         .then(() => {
//           // res.json(records)
//           res.json({Okay: true, records})
//         })
//         .catch((err) => res.json({Okay: false, error: err.message}))
//     })
//     .catch((err) => res.json({Okay: false, error: err.message}))

//   // }
//   // else {
//   //   res.json({Okay: false, error: 'Data format is not correct'})
//   // }
// })

const addRecords = (record, dateId, date, res) => {
  record.date_id = dateId
  record.activity_id = record.activityId
  delete record.activityId

  cardData.checkRecords(dateId, record.activity_id)
    .then(value => {
      if (!value.length) {
        // add
        cardData.addRecord(record)
          .then(() => {
            res.json()
          })
      } else {
        // update
        value = value[0]
        record.rating ? value.rating = record.rating : value.log = record.log
        cardData.updateRecord(value)
          .then(() => {})
      }
    })
}

router.post('/', (req, res) => {
  // req.body look like :
  // {userId: 1, records:{activityId:1, rating: 1, log:'asdfdgfh'}}
  const {userId, date, records} = req.body
  let dateId
  // check if date data is exist in dates table
  cardData.checkDate(userId, date)
    .then(dateFound => {
      if (!dateFound.length) {
        cardData.addDate({user_id: userId, date})
          .then(id => {
            dateId = id[0]
            addRecords(records, dateId, res)
            // console.log(dateId)
          })
      } else {
        dateId = dateFound[0].id
        addRecords(records, dateId, res)
      }
    })
})

// Gets all data for graph component
router.get('/graph/:userId/:endDate', (req, res) => {
  const userId = Number(req.params.userId)
  let endDate = req.params.endDate
  // let endDate = '2018-12-14'
  endDate += ' 23:59:59'
  const period = 'week'

  let date = moment(endDate)
  let startDate = date.add(-1, period).format('YYYY-MM-DD')
  let chartData = {}

  // get dates data
  graph.getDates(userId, startDate, endDate)
    .then(dates => {
      // get cards data
      graph.getAllCards()
        .then(cards => {
          let cardsPerDate = []

          // loop through dates data to add cards for each day
          dates.forEach(date => {
            let obj = {date_id: date.id}
            let dateCards = cards.filter((card) => {
              return card.date_id === date.id
            })
            obj.cards = dateCards
            cardsPerDate.push(obj)
          })

          // rearrange the data as graph component wants
          chartData.labels = []
          for (date of dates) {
            chartData.labels.push(date.created_at.slice(5, 10))
          }
          chartData.datasets = []

          // get activity names
          activities.getActivities()
            .then(actis => {
              for (let a of actis) {
                let aObj = {}
                aObj.label = a.name
                aObj.borderColor = a.colour
                aObj.backgroundColor = a.colour
                a.name === 'mood' ? aObj.borderWidth = 4 : aObj.borderWidth = 2
                aObj.fill = false
                aObj.data = []

                chartData.datasets.push(aObj)
              }

              // loop through the cardsPerDate to get each card data.
              for (let date of cardsPerDate) {
                for (let card of date.cards) {
                  chartData.datasets[card.activity_id - 1].data.push(card.rating)
                }
              }
              res.status(200).json({
                ok: true, chartData
              })
            })
            .catch(err => res.status(500).json({
              ok: false, error: err.message
            }))
        })
    })
})
