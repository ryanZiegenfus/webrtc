let Peer = require('simple-peer')
let socket = io()
const video = document.querySelector('video')
let client = {}

//get stream
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        socket.emit('NewClient')
        video.srcObject = stream
        video.play()

        //used to initialize a peer
        function InitPeer(type) {
            console.log('InitPeer')
            let peer = new Peer({initiator:(type === 'init') ? true : false, stream:stream, trickle: false })
            peer.on('stream', function (stream) {
                CreateVideo(stream)
            })
            peer.on('close', function () {
                document.getElementById("peerVideo").remove();
                peer.destroy()
            })
            return peer
        }

        //for peer of type init
        function MakePeer() {
            console.log('MakePeer')
            client.gotAnswer = false
            let peer = InitPeer('init')
            peer.on('signal', function(data) {
                if(!client.gotAnswer) {
                    socket.emit('Offer', data)
                }
            })
            client.peer = peer
        }

        //for peer of type not init
        function FrontAnswer(offer) {
            console.log('FrontAnswer')
            let peer = InitPeer('notInit')
            peer.on('signal', (data) => {
                socket.emit('Answer', data)
            })
            peer.signal(offer)
        }

        function SignalAnswer(answer) {
            console.log('SignalAnswer')
            client.gotAnswer = true
            let peer = client.peer
            peer.signal(answer)
        }

        function CreateVideo(stream) {
            console.log('CreateVideo')
            let video = document.createElement('video')
            video.id = 'peerVideo'
            video.srcObject = stream
            video.class = 'embed-responsive-item'
            document.querySelector('#peerDiv').appendChild(video)
            video.play()
        }

        function SessionActive() {
            console.log('SessionActive')
            document.write('Session active. Please come back later')
        }

        socket.on('BackOffer', FrontAnswer)
        socket.on('BackAnswer', SignalAnswer)
        socket.on('SessionActive', SessionActive)
        socket.on('CreatePeer', MakePeer)

    })
    .catch(err => document.write(err))