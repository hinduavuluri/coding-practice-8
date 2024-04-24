const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
const app = express()
app.use(express.json())
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

//API 1
const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  )
}
const hasPriorityProperties = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasStatusProperties = requestQuery => {
  return requestQuery.status !== undefined
}
app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%{search_q}%' AND status='${status}' AND priority='${priority}';`
      break
    case hasPriorityProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%{search_q}%' AND priority= '${priority}';`
      break
    case hasStatusProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%{search_q}%' AND status='${status}';`
      break
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%{search_q}%';`
      break
  }
  data = await db.all(getTodosQuery)
  response.send(data)
})

//API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`
  const todo = await db.get(getTodoQuery)
  response.send(todo)
})

//API 3
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postTodosQuery = `INSERT INTO todo(id,todo,priority,status) VALUES(${id},'${todo}','${priority}','${status}');`
  await db.run(postTodosQuery)
  response.send('Todo Successfully Added')
})

//API 4
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const updateColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }
  const previousTodoQuery = ` SELECT * FROM todo WHERE id=${todoId};`
  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body
  const updateTodoQuery = `UPDATE todo SET todo='${todo}', status='${status}',priority='${priority}';`
  await db.run(updateTodoQuery)
  response.send(`${updateColumn} Updated`)
})

//API 5
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `DELETE  FROM todo WHERE id=${todoId};`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})
module.exports = app
