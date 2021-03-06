const connection = require('./')
const hashing = require('../auth/hashing')

function create (user, db = connection) {
  return hashing.generate(user.password)
    .then(hash => {
      const {username, email} = user
      return db('users').insert({
        username,
        email,
        hash
      })
    })
    .then(([ id ]) => getById(id, db))
}

// function userExists (username, conn) {
//   const db = conn || connection
//   return db('users')
//     .count('id as n')
//     .where('username', username)
//     .then(count => {
//       return count[0].n > 0
//     })
// }

function createUser (newUser, db = connection) {
  return db('users')
    .insert(newUser)
}

function get (db = connection) {
  return db('users')
}

function getById (id, db = connection) {
  return db('users').where('id', id).first()
}

function getByUsername (username, db = connection) {
  return db('users').where('username', username).first()
}

module.exports = {
  create,
  createUser,
  get,
  getById,
  getByUsername
}
