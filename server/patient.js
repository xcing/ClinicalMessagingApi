let rocketChatUrl = 'http://10.88.10.209:3020/api/v1/';
let trakCareUrl = 'http://10.88.10.77/wsbhq2016/WS_GetDataBytrak.asmx/';

Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    extended: false
}));

Router.route('/api/patient/image', {name: 'patient_image', where: 'server'})
    .post(function () {
        try {
            var HN = this.request.body.HN;
            const optionsEN = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                params: {
                    HN: HN
                }
            };
            let xmlEN = Meteor.http.call("POST", trakCareUrl + "GetPTImageByHN", optionsEN);

            var jsonDataEN = xml2js.parseStringSync(xmlEN.content);

            jsonDataEN = jsonDataEN.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

            var result = {
                hn: HN,
                image: jsonDataEN[0].hasOwnProperty('docData') ? jsonDataEN[0].docData[0] : ""
            };

            result = JSON.stringify(result);

            this.response.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });

            this.response.end(result);
        }
        catch (e) {
            console.log(e);
            this.response.writeHead(500);

            this.response.end('Get Patient Image Fail');
        }
    });

Router.route('/api/patient/image/byRoomId', {name: 'patient_image_by_roomId', where: 'server'})
    .post(function () {
        try {
            let roomId = this.request.body.roomId;

            if(typeof roomId === 'undefined' || roomId === ""){
                this.response.writeHead(200);
                this.response.end("");
                return;
            }

            let token = this.request.headers.token;
            let userId = this.request.headers.userid;

            const optionsGroupInfo = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                },
                params: {
                    roomId: roomId
                }
            };
            let jsonGroupInfo = Meteor.http.call("GET", rocketChatUrl + "groups.info", optionsGroupInfo);

            let roomCode = jsonGroupInfo.data.group.name;

            const optionsGetPTByEN = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                params: {
                    EpiRowID: roomCode.split('.')[0]
                }
            };
            xml = Meteor.http.call("POST", trakCareUrl + "getPatientByEpiRowID", optionsGetPTByEN);

            let jsonDataGetPTByEN = xml2js.parseStringSync(xml.content);
            jsonDataGetPTByEN = jsonDataGetPTByEN.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

            const optionsEN = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                params: {
                    HN: jsonDataGetPTByEN[0].HN[0]
                }
            };
            let xmlEN = Meteor.http.call("POST", trakCareUrl + "GetPTImageByHN", optionsEN);

            let jsonDataEN = xml2js.parseStringSync(xmlEN.content);

            jsonDataEN = jsonDataEN.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

            let ptImage = jsonDataEN[0].hasOwnProperty('docData') ? jsonDataEN[0].docData[0] : "";

            this.response.writeHead(200);
            this.response.end(ptImage);
        }
        catch (e) {
            console.log(e);
            this.response.writeHead(500);

            this.response.end('Get Patient Image by Room Id Fail');
        }
    });