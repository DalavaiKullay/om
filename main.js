let APP_ID="9658b116b5cf4f7cab32f87d0f33dbc4"

let token=null;
let uid=String((Math.floor(Math.random()*10000)))
 let client;
 let channel;

let localstream;
let remotestream;
let peerConnection;

const servers={
    iceServers:[
        {
        urls:
            ['stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']
        }

    ]
}
let init=async()=>{
    client=await AgoraRTM.createInstance(APP_ID)
    await client.login({uid,token})


    channel=client.createChannel('main')
    await channel.join()
    channel.on('MemberJoined',handleUserJoined)

    client.on('MessageFromPeer',handleMessageFromPeer)

    localstream=await navigator.mediaDevices.getUserMedia({ video:true,audio:true});
    document.getElementById("user-1").srcObject=localstream
    
}

let handleMessageFromPeer=async(message,MemberId)=>{
    message=JSON.parse(message.text)
    if(message.type=='offer'){
        createAnswer(MemberId,message.offer)
    }

    if(message.type=='answer'){
        addAnswer(message.answer)
    }
    if(message.type=='candidate'){
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        }
    }
}

let handleUserJoined=async(MemberId)=>{
    console.log("new user joined",MemberId)
    createOffer(MemberId)

}
let createPeerConection=async(MemberId)=>{
        peerConnection=new RTCPeerConnection(servers);
        remotestream=new MediaStream();
        document.getElementById('user-2').srcObject=remotestream;

        if(!localstream){
            localstream=await navigator.mediaDevices.getUserMedia({ video:true,audio:false});
    document.getElementById("user-1").srcObject=localstream
        }

        localstream.getTracks().forEach((track)=> {
            peerConnection.addTrack(track,localstream)
        });

        peerConnection.ontrack=(event)=>{
            event.streams[0].getTracks().forEach((track)=>{
                remotestream.addTrack(track);
            })
        }

        peerConnection.onicecandidate=async(event)=>{
            if(event.candidate){
                client.sendMessageToPeer({text:JSON.stringify({'type':'candidate','candidate':event.candidate})},MemberId)
            }
        }
}


let createOffer=async(MemberId)=>{
        
        await createPeerConection(MemberId)
        let offer=await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        client.sendMessageToPeer({text:JSON.stringify({'type':'offer','offer':offer})},MemberId)
}

let createAnswer=async(MemberId,offer)=>{

        await createPeerConection(MemberId)
        await peerConnection.setRemoteDescription(offer)
        let answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)
        client.sendMessageToPeer({text:JSON.stringify({'type':'answer','answer':answer})},MemberId)
}
let addAnswer=async(answer)=>{
    if(!peerConnection.currentRemoteDiscription){
        peerConnection.setRemoteDescription(answer)
    }
}

init()

