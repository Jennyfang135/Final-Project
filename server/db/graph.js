const connection = require('./')
// const dates = require('./dates')

function getDates (userId, startDate, endDate, db = connection) {
  return db('dates')
    .where('user_id', '=', userId)
    .where('created_at', '>=', startDate)
    .where('created_at', '<=', endDate)
    .select()
}

function getCardsPerDate (dateId, db = connection) {
  return db('cardData')
    .where('date_id', '=', dateId)
}

module.exports = {
  getCardsPerDate,
  getDates
}
