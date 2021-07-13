/**  It contains all client side code. --> client.js */
const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("messages");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

const user = prompt("Enter your name");

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});

const peers = {}; //storing all the peer objects to remove respective videos after they leave
// the call

let myVideoStream;

var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;
/************************ */
var myUserId = "";
/**************************** */
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    /********************************************************************** */
    socket.on("user-connected", (userId, userName) => {
      myUserId = userId;
      connectToNewUser(userId, stream);
      addToUsersBox(userName);
    });
    /*********************************************************************** */
    document.addEventListener("keydown", (e) => {
      if (e === 13 && chatInputBox.value != "") {
        socket.emit("message", chatInputBox.value);
        chatInputBox.value = "";
      }
    });
  });

/********************************************************** */
socket.on("user-disconnected", (userId, userName) => {
  if (peers[userId]) peers[userId].close();
  document.querySelector(`.${userName}-userlist`).remove();
});

/************************************************************ */
peer.on("call", function (call) {
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      call.answer(stream); // Answer the call with an A/V stream.
      const video = document.createElement("video");
      call.on("stream", function (remoteStream) {
        addVideoStream(video, remoteStream);
      });
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

// CHAT

const connectToNewUser = (userId, streams) => {
  var call = peer.call(userId, streams);
  // console.log(call);
  var video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    //  console.log(userVideoStream);
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
};

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (videoEl, stream) => {
  videoEl.srcObject = stream;
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });

  videoGrid.append(videoEl);
  /********* TOTAL USERS IN CALL */
  let totalUsers = document.getElementsByTagName("video").length;
  console.log(totalUsers);
  if (totalUsers > 1) {
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName("video")[index].style.width =
        100 / totalUsers + "%";
    }
  }
};
/*************************************************************************************/
let text = document.getElementById("chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

/*
text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
    $("div.emojionearea-editor").data("emojioneArea").setText("");
  }
});
*/
socket.on("createMessage", (message, userName) => {
  shouldScroll =
    main__chat__window.scrollTop + main__chat__window.clientHeight ===
    main__chat__window.scrollHeight;

  const time = new Date();
  const formattedTime = time.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
  });

  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="fas fa-user-circle"></i> <span> ${
          userName === user ? "me" : userName
        }</span> </b>
        <span>${message}
        <span 
          style =
          "float: right;
          position:relative; 
          padding-bottom: 0px; 
          font-size:12px; 
          background: #e85348;
          color: white;
          font-weight: bold;" 
          class="time_date">${formattedTime}</span>
        </span>
        
    </div>`;

  // Automatic scroll to bottom added
  if (!shouldScroll) {
    main__chat__window.scrollTop = main__chat__window.scrollHeight;
  }
});

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
    $("div.emojionearea-editor").data("emojioneArea").setText("");
  }
});
/***********************************************************************************/
const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setPlayVideo = () => {
  const html = `<i class="stop fas fa-video-slash"></i>
  <span class="unmute">Play Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
  const html = `<i class="fas fa-video"></i>
  <span class="">Stop Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `<i class="unmute fas fa-microphone-slash"></i>
  <span class="unmute">Unmute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
const setMuteButton = () => {
  const html = `<i class="fas fa-microphone"></i>
  <span>Mute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
/********************************************************************************* */
const inviteButton = document.getElementById("inviteButton");
inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});
/************************************************************************************** */
//Prompt the user before leaving video chat room
document.getElementById("leave-meeting").addEventListener("click", () => {
  const leaveRoom = confirm("Are you sure you want to leave the meeting?");
  if (leaveRoom) {
    window.location.replace("/dashboard");
  } else {
  }
});
/***************************************************************************************/
//TIMER IMPLEMENTATION
var minutesLabel = document.getElementById("minutes");
var secondsLabel = document.getElementById("seconds");
var totalSeconds = 0;
setInterval(setTime, 1000);

function setTime() {
  ++totalSeconds;
  secondsLabel.innerHTML = pad(totalSeconds % 60);
  minutesLabel.innerHTML = pad(parseInt(totalSeconds / 60));
}

function pad(val) {
  var valString = val + "";
  if (valString.length < 2) {
    return "0" + valString;
  } else {
    return valString;
  }
}
/****************************************************************** */
const inboxPeople = document.querySelector(".inbox__people");

const addToUsersBox = (userName) => {
  if (!!document.querySelector(`.${userName}-userlist`)) {
    return;
  }

  const userBox = `
 
    <div class="chat_ib ${userName}-userlist">
    <h3>${userName}</h3>
    <hr style="color: white; weight: 10px">
    </div>
  
  `;
  inboxPeople.innerHTML += userBox;
};

socket.on("new user", function (data) {
  data.map((user) => addToUsersBox(user));
});
/***************************************************************************************/

const shareScreen = async () => {
  /************************************************/
  const html = `<i class="fas fa-video"></i>
  <span class="">Stop Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
  /*************************************************** */

  let captureStream = null;

  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia();
  } catch (err) {
    console.error("Error: " + err);
  }
  //connectToNewUser(myUserId, captureStream);
  if (captureStream) {
    peer.call(myUserId, captureStream);
    const video = document.createElement("video");
    addVideoStream(video, captureStream);

    // somebody clicked on "Stop sharing"
    captureStream.getVideoTracks()[0].onended = function () {
      // doWhatYouNeedToDo();

      video.remove();

      alert("Screen Sharing stopped");
    };
  }
};
/************************************************************************************* */

socket.on("output-messages", (data) => {
  // console.log(data);

  if (data.length) {
    data.forEach((message) => {
      if (message.uid === ROOM_ID) {
        messages.innerHTML =
          messages.innerHTML +
          `<div class="message">
          <b><i class="fas fa-user-circle"></i> <span> ${
            message.name === user ? "me" : message.name
          }</span> </b>
          <span>${message.msg}
         </div>`;
      }
    });
  }
});
