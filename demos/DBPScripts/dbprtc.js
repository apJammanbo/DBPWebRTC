
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
connection.socketMessageEvent = 'video-conference-demo';

connection.session = {
    audio: true,
    video: true
};

connection.sdpConstraints.mandatory = {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
};

/**
 * OnStream 자신 혹은 누군가가 접속하면 발생
 */

var mainIndex = -1;
let videoContainers = [];

containerDoubleClick = (event) => {
    var id = event.target.id;

    // 서브 프레임에서 더블클릭한 컴포넌트를 찾아서 메인과 교체한다.
    let subFrame = document.getElementById('sub_frame');
    for(var i = 0 ; i < subFrame.children.length; ++i) {
        // 서브 프레임을 돌면서 로그아웃된 컨테이너를 찾는다.
        if(subFrame.children[i].children[0].children[0].id === id) {
            let mainFrame = document.getElementById('main_frame');

            // 기존의 메인프레임의 비디오를 메인프레임에서 제거한다.
            let beforeMain = mainFrame.children[0];
            mainFrame.removeChild(mainFrame.children[0]);

            // 클릭된 컴포넌트를 서브 프레임에서 제거한다.
            let beforeSub = subFrame.children[i].children[0];
            subFrame.children[i].removeChild(subFrame.children[i].children[0]);

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

// 자신 혹은 상대방이 접속할때 발생하는 이벤트
connection.onstream = function(event) {
    // 메인 프레임 큰화면 태그를 가져온다.
    let mainFrame = document.getElementById('main_frame');
    let subFrame = document.getElementById('sub_frame');
    let inbx = document.getElementById('inbx');

    // 미디어 객체를 가져온다.
    var mediaElement = getMediaElement(event.mediaElement, {});
    videoContainers.push(mediaElement);

    // mediaElement.style.width = "100%";
    // mediaElement.style.height = "100%";
    mediaElement.id = event.streamid;
    mediaElement.ondblclick = containerDoubleClick;


    if(mainIndex === -1) {
        // 처음 접속(페이지 진입이면..)



        inbx.appendChild(mediaElement);

        mediaElement.addEventListener('onresize', function(){
            console.log("#%%%%")
        });

        if (document.body.clientWidth > document.body.clientHeight) { //가로가 길 때
            console.log("##",  document.body.clientHeight)
            mediaElement.style.width = document.body.clientHeight;
            mediaElement.style.height = document.body.clientHeight;
        } else {

            mediaElement.style.width = "100%";
            mediaElement.style.height = document.body.clientWidth;
        }
        //mainFrame.appendChild(mediaElement);
        mainIndex = 0;
    } else {
        mediaElement.style.width = "100%";
        mediaElement.style.height = "100%";

        var item = document.createElement('div');
        item.className = "item";

        var subInbx = document.createElement('div');
        subInbx.className = "inbx";

        // 다른사람 접속이면...
        if(mainIndex === 0) {
            // 나혼자 접속하고 있을때 다른사람 접속이라면 다른사람의 화면을 메인프레임에 위치한다.
            var beforeMain = inbx.children[0];
            inbx.removeChild(beforeMain);

            subInbx.appendChild(beforeMain);
            item.appendChild(subInbx);
            subFrame.appendChild(item);
            inbx.appendChild(mediaElement);
            setTimeout(function () {
                beforeMain.media.play();
            }, 1000);
        } else {
            // 서브프레임에 붙인다.
            subInbx.appendChild(mediaElement);
            item.appendChild(subInbx);
            subFrame.appendChild(item)
        }
        mainIndex += 1;
    }

    setTimeout(function () {
        mediaElement.media.play();
    }, 1000);
};

connection.onstreamended = function(event) {
    console.log("end")
    // 서브 프레임에서 접속종료한 컴포넌트를 제거한다.
    let subFrame = document.getElementById('sub_frame');
    for(var i = 0 ; i < subFrame.children.length; ++i) {
        // 서브 프레임을 돌면서 로그아웃된 컨테이너를 찾는다.
        if(subFrame.children[i].children[0].children[0].id === event.streamid) {
            console.log(1)
            subFrame.removeChild(subFrame.children[i]);
            return;
        }
    }
    // 서브 프레임에서 제거되지 않았다면 메인프레임에서 제거한다.
    let mainFrame = document.getElementById('main_frame');
    if(mainFrame.children[0].children[0].id === event.streamid) {
        console.log(2)
        mainFrame.removeChild(mainFrame.children[0]);
        mainFrame.appendChild(subFrame.children[0].children[0]);
        subFrame.removeChild(subFrame.children[0]);
        setTimeout(function () {
            mainFrame.children[0].children[0].media.play();
        }, 1000);
    }

};

function showVideoComponents(roomid) {
    // var videosContainer = document.getElementById('videos-container');
    // videosContainer.style.display = 'block';
}

