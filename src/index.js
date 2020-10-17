const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Fiter = require('bad-words')
const { generateMessage, generateUrl } = require('./utils/messages')
const { addUser,
    removeUser,
    getUser,
    getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

//let count = 0

io.on('connection', (socket) => {
    console.log('Nueva conexion del socket')

    socket.on('join', ({ username, room }, callback) => {

        const { error, user } = addUser({
            id: socket.id,
            username,
            room
        })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Bienvenido!!!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} se ha unido`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        const filter = new Fiter()

        if (filter.isProfane(message)) {
            return callback('No diga malas palabras')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback('Entregado')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} se ha ido`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })

    socket.on('sendLocation', (posicion, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateUrl(user.username, `http://google.com/maps?q=${posicion.latitude},${posicion.longitude}`))
        callback('Localizacion enviada')
    })
})

server.listen(port, () => {
    console.log(`Conectado en el puerto ${port}`)
})
module.exports = app 