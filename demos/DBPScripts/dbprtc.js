/**
 * 초기 접속이 되면 주어진 파라미터에 따라서 방생성 혹은 방참가한다.
 */
window.onload = function () {
    // 파라미터에서 방번호를 가지고 와서 방생성 혹은 참가한다.
    var url_string = window.location.href
    var url = new URL(url_string);
    var roomid = url.searchParams.get("room");

    connection.openOrJoin(roomid, function(isRoomExists, roomid) {
        showVideoComponents(roomid);
    });
}

var connection = new RTCMultiConnection();

// by default, socket.io server is assumed to be deployed on your own URL
connection.socketURL = '/';
connection.socketMessageEvent = 'audio-video-file-chat-demo';

connection.session = {
    audio: true,
    video: true,
    data: true,
};

connection.sdpConstraints.mandatory = {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
};

/**
 * OnStream 자신 혹은 누군가가 접속하면 발생
 */
var mainIndex = -1;
var videoContainers = [];
var object = {}; // 들어온 사람들의 닉네임 체크

containerDoubleClick = (event) => { //더블클릭 했을 때
    var id = event.target.id;

    // 서브 프레임에서 더블클릭한 컴포넌트를 찾아서 메인과 교체한다.
    var subFrame = document.getElementById('sub_frame');
    for(var i = 0 ; i < subFrame.children.length; ++i) {
        // 서브 프레임을 돌면서 로그아웃된 컨테이너를 찾는다.
        if(subFrame.children[i].children[0].children[0].id === id) {
            var mainFrame = document.getElementById('main_frame');

            // 메인프레임의 비디오 element 제거
            var beforeMain = mainFrame.children[0];
            mainFrame.removeChild(beforeMain);

            // 클릭한 영역을 서브 프레임에서 제거한다.
            var beforeSub = subFrame.children[i].children[0];
            subFrame.children[i].removeChild(subFrame.children[i].children[0]);

            resizeVideo(beforeSub);

            //기존 메인프레임에 스타일 속성 수정
            beforeMain.style.width = "";
            beforeMain.style.height = "";
            beforeMain.style.top = "";
            beforeMain.style.marginTop = "";

            // 기존 서브프레임의 비디오를 메인프레임으로 올린다.
            mainFrame.appendChild(beforeSub);
            subFrame.children[i].appendChild(beforeMain);

            setTimeout(function () {
                beforeMain.children[0].media.play();
                beforeSub.children[0].media.play();
            }, 1000);
            return;
        }
    }
}

//비디오 사이즈 조정
resizeVideo = (inbx) => {
    // 기준을 잡는다(가로인지 세로인지)
    var mainFrame = document.getElementById('main_frame');
    var width = mainFrame.clientWidth;
    var height = mainFrame.clientHeight;

    if(width / 4 > (height / 3)) {
        // 세로가 기준이다.
        console.log('height');
        inbx.style.width = ((height / 3) * 4) + "px";
        inbx.style.height = height + "px";
        inbx.style.top = "50%";
        inbx.style.marginTop = -(height / 2) + "px";

    } else {
        // 가로가 기준이다.
        console.log('width');
        console.log(width);
        inbx.style.width = width + "px";
        inbx.style.height = ((width / 4) * 3) + "px";
        inbx.style.top = "50%";
        inbx.style.marginTop = -(((width / 4) * 3) / 2) + "px";
    }
}

// 자신 혹은 상대방이 접속할때 발생하는 이벤트
connection.onstream = function(event) {
    // 메인 프레임 큰화면 태그를 가져온다.
    var mainFrame = document.getElementById('main_frame');
    // 서브 프레임을 가져온다
    var subFrame = document.getElementById('sub_frame');
    // 메인 프레임의 inbx을 가져온다.
    var inbx = document.getElementById('inbx');

    //url로 부터 현재 local의 name값을 가져온다
    var url_string = window.location.href;
    var url = new URL(url_string);
    var name = url.searchParams.get("name");

    // 미디어 객체를 가져온다.
    var mediaElement = getMediaElement(event.mediaElement, {});
    videoContainers.push(mediaElement);

    mediaElement.id = event.streamid;
    mediaElement.ondblclick = containerDoubleClick;

    window.onresize = (event) => { // 브라우저 화면 크기가 변할 때마다 호출되도록
        resizeVideo(inbx);
    };

    //video 화질 개선
    var wid = 1600;
    var hei = 1200;

    connection.mediaConstraints.video.mandatory={
        maxWidth: wid,
        maxHeight: hei
    };

    var supports = navigator.mediaDevices.getSupportedConstraints();

    var constraints={};
    if(supports.width && supports.height){
        constraints = {
            width:wid, height:hei
        };
    }

    connection.applyConstraints({
        video: constraints
    });

    // 처음 입장했을 때
    if(mainIndex === -1) {
        resizeVideo(inbx);
        mediaElement.style.width = "100%";
        mediaElement.style.height = "100%";

        //이름 나오는 영역 구성
        var mainId = document.createElement('div');
        mainId.className = "user";
        var spanId = document.createElement('span');
        spanId.className = "name";
        spanId.id = event.userid;
        spanId.appendChild(document.createTextNode(name));
        mainId.appendChild(spanId);
        inbx.appendChild(mediaElement); // 비디오 태그
        inbx.appendChild(mainId); // 이름값
        mainIndex = 0;
    } else {
        mediaElement.style.width = "100%";
        mediaElement.style.height = "100%";

        var item = document.createElement('div');
        item.className = "item";
        var subInbx = document.createElement('div');
        subInbx.className = "inbx";

        // 혼자 접속한 상태에서 다른 사람이 접속하면
        if(mainIndex === 0) {
            var beforeMain = inbx.children[0]; // 메인 화면에 있는 비디오 태그
            var beforeMainId = inbx.children[1]; // 메인 화면에 있는 이름 값

            subInbx.appendChild(beforeMain);  //메인을 서브에 넣는다.
            subInbx.appendChild(beforeMainId);
            item.appendChild(subInbx);
            subFrame.appendChild(item);

            inbx.appendChild(mediaElement); // 새로 들어온 사람(비디오태그)을 메인 화면에 넣는다
            var mainId = document.createElement('div'); //이름 나오는 영역 세팅
            mainId.className = "user";
            var spanId = document.createElement('span');
            spanId.id = event.userid;
            spanId.className = "name";
            connection.onmessage = appendDIV; // 새로 들어오는 사람의 이름값 세팅
            mainId.appendChild(spanId);
            inbx.appendChild(mainId);

            setTimeout(function () {
                beforeMain.media.play();
            }, 1000);
        } else {
            // 3명 이상부터 서브프레임에 붙는다.
            subInbx.appendChild(mediaElement);
            var mainId = document.createElement('div'); //이름 나오는 영역 세팅
            mainId.className = "user";
            var spanId = document.createElement('span');
            spanId.id = event.userid;
            spanId.className = "name";
            connection.onmessage = appendDIV; // 이름 값 받아옴
            mainId.appendChild(spanId);
            subInbx.appendChild(mainId);
            item.appendChild(subInbx);
            subFrame.appendChild(item); // 서브프레임에 추가
        }
        mainIndex += 1;
    }

    var check = 0;

    setTimeout(function () {
        mediaElement.media.play();
        if (check === 0) {  // 1초 한번씩 보내는 것을 막기 위해 체크함
            connection.send(name); // 상대에게 이름값을 보냄
            check++;
        }
    }, 1000);
};

connection.onstreamended = function(event) {
    // 서브 프레임에서 접속종료한 컴포넌트를 제거한다.
    var subFrame = document.getElementById('sub_frame');
    for(var i = 0 ; i < subFrame.children.length; ++i) {
        // 서브 프레임을 돌면서 로그아웃된 컨테이너를 찾는다.
        if(subFrame.children[i].children[0].children[0].id === event.streamid) {
            subFrame.removeChild(subFrame.children[i]);
            return;
        }
    }
    // 서브 프레임에서 제거되지 않았다면 메인프레임에서 제거한다.
    var mainFrame = document.getElementById('main_frame');
    if(mainFrame.children[0].children[0].id === event.streamid) {
        mainFrame.removeChild(mainFrame.children[0]);

        var sub = subFrame.children[0].children[0];
        resizeVideo(sub);

        mainFrame.appendChild(sub);
        subFrame.removeChild(subFrame.children[0]);
        setTimeout(function () {
            mainFrame.children[0].children[0].media.play();
        }, 1000);
    }

};

function appendDIV(event) { // 3명이상 들어욌을 때 서브프레임쪽 이름을 세팅하는 부분
    if (object[event.userid] !== 1) {
        var spanId = document.getElementById(event.userid);
        spanId.innerHTML = event.data;
        object[event.userid] = 1;
    }
}

function showVideoComponents(roomid) {
    // var videosContainer = document.getElementById('videos-container');
    // videosContainer.style.display = 'block';
}



