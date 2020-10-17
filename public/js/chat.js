
const socket = io()
//Elementos
const $menssageForm = document.querySelector('#message-form')
const $messageFormInput = $menssageForm.querySelector('input')
const $menssageFormButton = $menssageForm.querySelector('button')
const $menssageFormButtonLocation = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templatess
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//opciones
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    //Nuevo elemento de mensaje
    const $newMessage = $messages.lastElementChild

    //altura del nuevo mensaje
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight = newMessageMargin

    //visible altura
    const visibleHeight = $messages.offsetHeight

    //altura del contenedor del mensaje
    const containerHeight = $messages.scrollHeight

    //como almacenar el scroll
    const scrollOffset = $messages.scrollTop = visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (url) => {
    console.log(url)
    const html = Mustache.render(locationMessageTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$menssageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $menssageFormButton.setAttribute('disabled', 'disabled')
    //desabilitar

    const message = e.target.elements.message.value //document.querySelector('input').value
    socket.emit('sendMessage', message, (error) => {

        //enable
        $menssageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }
        console.log('El mensaje se entrego')
    })


})

$menssageFormButtonLocation.addEventListener('click', () => {

    $menssageFormButtonLocation.setAttribute('disabled', 'disabled')

    if (!navigator.geolocation) {
        return alert('Localizacion no tiene soporte con su navegador')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position)

        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $menssageFormButtonLocation.removeAttribute('disabled')
            console.log('Ubicacion enviada')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})

// socket.on('countUpdate', (count) => {
//     console.log('Lo tiene actualizado ', count)
// })

// document.querySelector('#increment').addEventListener('click',()=>{
//     console.log('Clicked')
//     socket.emit('increment')
// })