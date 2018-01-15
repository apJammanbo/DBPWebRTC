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

containerDoubleClick = (event) => {
    var id = event.target.id;
    // 서브 프레임에서 더블클릭한 컴포넌트를 찾아서 메인과 교체한다.
    var subFrame = document.getElementById('sub_frame');
    for(var i = 0 ; i < subFrame.children.length; ++i) {
        // 서브 프레임을 돌면서 로그아웃된 컨테이너를 찾는다.
        if(subFrame.children[i].children[0].id === id) {
            var mainFrame = document.getElementById('main_frame');
            // 기존의 메인프레임의 비디오를 메인프레임에서 제거한다.
            var beforeMainId; // 메인 프레임 닉네임
            var beforeMain; // 메임 프레임 비디오
            if (mainFrame.children[0].classList.contains('media-container')) { //해당 태그가 비디오인지 확인
                beforeMain = mainFrame.children[0];
                beforeMainId = mainFrame.children[1];
            } else {
                beforeMain = mainFrame.children[1];
                beforeMainId = mainFrame.children[0];
            }

            mainFrame.removeChild(beforeMain);
            mainFrame.removeChild(beforeMainId);

            // 클릭된 컴포넌트를 서브 프레임에서 제거한다.
            var beforeSubId; // 서브 프레임 닉네임
            var beforeSub; // 서브 프레임 비디오

            if (subFrame.children[i].children[0].classList.contains('media-container')) { // 해당 태그가 비디오인지
                beforeSub = subFrame.children[i].children[0]; //비디오
                beforeSubId = subFrame.children[i].children[1]; //아아디
            } else {
                beforeSub = subFrame.children[i].children[1];
                beforeSubId = subFrame.children[i].children[0];
            }

            subFrame.children[i].removeChild(beforeSub);
            subFrame.children[i].removeChild(beforeSubId);

            // 기존 서브프레임의 비디오를 메인프레임으로 올린다.
            mainFrame.appendChild(beforeSub);
            mainFrame.appendChild(beforeSubId);
            subFrame.children[i].appendChild(beforeMain);
            subFrame.children[i].appendChild(beforeMainId);

            setTimeout(function () {
                beforeMain.media.play();
                beforeSub.media.play();
            }, 1000);
            return;
        }
    }
};

// 자신 혹은 상대방이 접속할때 발생하는 이벤트
connection.onstream = function(event) {
    // 메인 프레임 큰화면 태그를 가져온다.
    var mainFrame = document.getElementById('main_frame');
    var subFrame = document.getElementById('sub_frame');

    // 미디어 객체를 가져온다.
    var mediaElement = getMediaElement(event.mediaElement, {});
    videoContainers.push(mediaElement);

    mediaElement.style.width = "100%";
    mediaElement.style.height = "100%";
    mediaElement.id = event.streamid;
    mediaElement.ondblclick = containerDoubleClick;

    var url_string = window.location.href;
    var url = new URL(url_string);
    var name = url.searchParams.get("name");

    if(mainIndex === -1) {  // 처음 접속(페이지 진입이면..)
        //메인 프레임의 닉네임 생성
        var mainId = document.createElement('div');
        mainId.style.overflow = "hidden";
        mainId.style.position = "absolute";
        mainId.style.top= "10px";
        mainId.style.left= "10px";
        mainId.style.textShadow= "2px 2px red";
        mainId.style.fontSize= "14px";
        mainId.style.color= "#fff";
        mainId.style.zIndex= "100";
        mainId.id = event.userid;

        mainFrame.appendChild(mediaElement); // 메인 프레임에 비디오 추가
        mainId.appendChild(document.createTextNode(name));
        mainFrame.appendChild(mainId); // 메인 프레임에 닉네임 추가
        mainIndex = 0;
    } else {
        var item = document.createElement('div');
        item.className = "item";

        var itemId = document.createElement('div');
        itemId.id = event.userid;
        itemId.style.overflow= "hidden";
        itemId.style.position= "absolute";
        itemId.style.top= "10px";
        itemId.style.left= "10px";
        itemId.style.textShadow= "2px 2px red";
        itemId.style.fontSize= "14px";
        itemId.style.color= "#fff";
        itemId.style.zIndex= "100";

        // 다른사람 접속이면...
        if(mainIndex === 0) {
            // 나혼자 접속하고 있을때 다른사람 접속이라면 다른사람의 화면을 메인프레임에 위치한다.
            var beforeMain = mainFrame.children[0];
            mainFrame.removeChild(beforeMain);
            item.appendChild(beforeMain);
            item.appendChild(itemId);
            subFrame.appendChild(item);
            connection.onmessage = appendDIV; // 서브 프레임에 닉네임 추가

            mainFrame.appendChild(mediaElement); // 서브 프레임에 비디오 추가
            setTimeout(function () {
                beforeMain.media.play();
            }, 1000);
        } else {
            // 서브프레임에 붙인다.
            item.appendChild(mediaElement);
            item.appendChild(itemId);
            subFrame.appendChild(item)
            connection.onmessage = appendDIV;
        }
        mainIndex += 1;
    }

    var check = 0;

    setTimeout(function () {
        mediaElement.media.play();
        if (check === 0) { // 닉네임에 대한 정보를 한번만 보내기 위해
            connection.send(name);
            check ++;
        }
    }, 1000);
};

connection.onstreamended = function(event) {
    // 서브 프레임에서 접속종료한 컴포넌트를 제거한다.
    let subFrame = document.getElementById('sub_frame');
    for(var i = 0 ; i < subFrame.children.length; ++i) {
        // 서브 프레임을 돌면서 로그아웃된 컨테이너를 찾는다.
        if(subFrame.children[i].children[0].id === event.streamid) {
            subFrame.removeChild(subFrame.children[i]);
            return;
        }
    }
    // 서브 프레임에서 제거되지 않았다면 메인프레임에서 제거한다.
    let mainFrame = document.getElementById('main_frame');
    if(mainFrame.children[0].id === event.streamid) {
        mainFrame.removeChild(mainFrame.children[0]);
        mainFrame.appendChild(subFrame.children[0].children[0]);
        subFrame.removeChild(subFrame.children[0]);
        setTimeout(function () {
            mainFrame.children[0].media.play();
        }, 1000);
    }

};

function appendDIV(event) {
    if (object[event.userid] !== 1) {
        var item = document.getElementById(event.userid);
        var itemId = document.createElement('div');
        itemId.appendChild(document.createTextNode(event.data));
        item.appendChild(itemId);
        object[event.userid] = 1;
    }
}

function showVideoComponents(roomid) {
    // var videosContainer = document.getElementById('videos-container');
    // videosContainer.style.display = 'block';
}





