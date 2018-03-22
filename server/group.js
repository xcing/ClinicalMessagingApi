let rocketChatUrl = 'http://10.88.10.209:3020/api/v1/';
let trakCareUrl = 'http://10.88.10.77/wsbhq2016/WS_GetDataBytrak.asmx/';
let trakCareTestUrl = 'http://10.88.10.77/wsemrpathway_test/WS_GetDataBytrak.asmx/';

Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    extended: false
}));

Router.route('/api/group/name', {name: 'group_name', where: 'server'})
    .post(function () {
        try{
            let roomCode = this.request.body.roomCode;
            let xml;
            if(typeof roomCode === 'undefined' || roomCode === "" || roomCode.split('.')[1] === "" || roomCode.split('.')[2] === ""){
                this.response.writeHead(200);
                this.response.end("");
                return;
            }
            if(roomCode.split('.')[2] === 'patient'){
                const optionsLocationList = {
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                };
                xml = Meteor.http.call("POST", trakCareTestUrl + "GetAllLocation", optionsLocationList);

                let jsonDataLocationList = xml2js.parseStringSync(xml.content);
                jsonDataLocationList = jsonDataLocationList.DataSet['diffgr:diffgram'][0].NewDataSet[0].tblResult;

                const optionsGetPTByEN = {
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    params: {
                        EpiRowID: roomCode.split('.')[0]
                    }
                };
                xml = Meteor.http.call("POST", trakCareUrl + "getPatientByEpiRowID", optionsGetPTByEN);

                let jsonDataGetPTByEN = xml2js.parseStringSync(xml.content);
                jsonDataGetPTByEN = jsonDataGetPTByEN.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;
                let roomName = "";
                if (jsonDataGetPTByEN[0].hasOwnProperty('Fname')) {
                    roomName += jsonDataGetPTByEN[0].Fname[0] + " ";
                }
                if (jsonDataGetPTByEN[0].hasOwnProperty('Lname')) {
                    roomName += jsonDataGetPTByEN[0].Lname[0];
                } else {
                    return;
                }

                let CTLOC_Desc = jsonDataLocationList.filter(
                    function (jsonDataLocationList) {
                        return jsonDataLocationList.CTLOC_Code[0] === roomCode.split('.')[1]
                    }
                );

                if(CTLOC_Desc.length > 0){
                    roomName += " " +CTLOC_Desc[0].CTLOC_Desc[0];
                }

                if (jsonDataGetPTByEN[0].hasOwnProperty('ward') && jsonDataGetPTByEN[0].hasOwnProperty('Room')) {
                    roomName += " " + jsonDataGetPTByEN[0].ward[0] + " - " + jsonDataGetPTByEN[0].Room[0];
                }

                this.response.writeHead(200);
                this.response.end(roomName);
            }
        }
        catch(e){
            console.log(e);
            this.response.writeHead(e.response.statusCode);

            this.response.end('Error: Cannot get room name by room code');
        }
    });

Router.route('/api/group/name/byRoomId', {name: 'group_name_by_room_id', where: 'server'})
    .post(function () {
        try{
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

            let xml;
            const optionsLocationList = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            };
            xml = Meteor.http.call("POST", trakCareTestUrl + "GetAllLocation", optionsLocationList);

            let jsonDataLocationList = xml2js.parseStringSync(xml.content);
            jsonDataLocationList = jsonDataLocationList.DataSet['diffgr:diffgram'][0].NewDataSet[0].tblResult;

            const optionsGetPTByEN = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                params: {
                    EpiRowID: roomCode.split('.')[0]
                }
            };
            xml = Meteor.http.call("POST", trakCareUrl + "getPatientByEpiRowID", optionsGetPTByEN);

            let jsonDataGetPTByEN = xml2js.parseStringSync(xml.content);
            jsonDataGetPTByEN = jsonDataGetPTByEN.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;
            let roomName = "";
            if (jsonDataGetPTByEN[0].hasOwnProperty('Fname')) {
                roomName += jsonDataGetPTByEN[0].Fname[0] + " ";
            }
            if (jsonDataGetPTByEN[0].hasOwnProperty('Lname')) {
                roomName += jsonDataGetPTByEN[0].Lname[0];
            } else {
                return;
            }

            let CTLOC_Desc = jsonDataLocationList.filter(
                function (jsonDataLocationList) {
                    return jsonDataLocationList.CTLOC_Code[0] === roomCode.split('.')[1]
                }
            );

            if (CTLOC_Desc.length > 0) {
                roomName += " " + CTLOC_Desc[0].CTLOC_Desc[0];
            }

            if (jsonDataGetPTByEN[0].hasOwnProperty('ward') && jsonDataGetPTByEN[0].hasOwnProperty('Room')) {
                roomName += " " + jsonDataGetPTByEN[0].ward[0] + " - " + jsonDataGetPTByEN[0].Room[0];
            }

            this.response.writeHead(200);
            this.response.end(roomName);
        }
        catch(e){
            console.log(e);
            this.response.writeHead(e.response.statusCode);

            this.response.end('Error: Cannot get room name by room id');
        }
    });

Router.route('/api/group/list', {name: 'group_list', where: 'server'})
    .get(function () {
        try {
            var token = this.request.headers.token;
            var userId = this.request.headers.userid;
            const optionsUserList = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                },
                params: {
                    count: 0
                }
            };
            let jsonUserList = Meteor.http.call("GET", rocketChatUrl + "users.list", optionsUserList);

            const optionsLocationList = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            };
            let xml = Meteor.http.call("POST", trakCareTestUrl + "GetAllLocation", optionsLocationList);

            let jsonDataLocationList = xml2js.parseStringSync(xml.content);
            jsonDataLocationList = jsonDataLocationList.DataSet['diffgr:diffgram'][0].NewDataSet[0].tblResult;

            const optionsGroupList = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                },
                params: {
                    count: 0
                }
            };
            let jsonGroupList = Meteor.http.call("GET", rocketChatUrl + "groups.list", optionsGroupList);

            let optionsGetPTByEN;
            let jsonDataGetPTByEN;
            let result = [];
            let roomName = "";
            let optionsGroupMember;
            let jsonGroupMember;
            let members;
            let CTLOC_Desc;

            jsonGroupList.data.groups.forEach(function (group) {
                if (group.name.indexOf('.') === -1) {
                    return;
                }
                if (group.name.split('.')[1] === "") {
                    return;
                }
                if (group.name.split('.')[2] === "personal") {
                    return;
                }
                if (group.name.split('.')[1] === "subdivision") {
                    return;
                }

                optionsGroupMember = {
                    headers: {
                        'X-Auth-Token': token,
                        'X-User-Id': userId
                    },
                    params: {
                        roomId: group._id
                    }
                };
                jsonGroupMember = Meteor.http.call("GET", rocketChatUrl + "groups.members", optionsGroupMember);

                members = [];
                jsonGroupMember.data.members.forEach(function (member) {
                    memberTemp = jsonUserList.data.users.find(item => {
                        return item.username === member.username
                    });
                    if (memberTemp !== null) {
                        members.push({
                            userId: memberTemp._id,
                            realname: memberTemp.name.split(';')[0]
                        });
                    }
                });

                optionsGetPTByEN = {
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    params: {
                        EpiRowID: group.name.split('.')[0]
                    }
                };
                xml = Meteor.http.call("POST", trakCareUrl + "getPatientByEpiRowID", optionsGetPTByEN);

                jsonDataGetPTByEN = xml2js.parseStringSync(xml.content);
                if (!jsonDataGetPTByEN.DataTable['diffgr:diffgram'][0].hasOwnProperty('DocumentElement')) {
                    console.log("is EN");
                    return;
                }
                jsonDataGetPTByEN = jsonDataGetPTByEN.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;
                roomName = "";
                if (jsonDataGetPTByEN[0].hasOwnProperty('Fname')) {
                    roomName += jsonDataGetPTByEN[0].Fname[0] + " ";
                }
                if (jsonDataGetPTByEN[0].hasOwnProperty('Lname')) {
                    roomName += jsonDataGetPTByEN[0].Lname[0];
                } else {
                    return;
                }

                CTLOC_Desc = jsonDataLocationList.filter(
                    function (jsonDataLocationList) {
                        return jsonDataLocationList.CTLOC_Code[0] === group.name.split('.')[1]
                    }
                );

                if(CTLOC_Desc.length > 0){
                    roomName += ";" +CTLOC_Desc[0].CTLOC_Desc[0];
                }

                // roomName += ";" + jsonDataLocationList.filter(
                //     function (jsonDataLocationList) {
                //         return jsonDataLocationList.CTLOC_Code[0] === group.name.split('.')[1]
                //     }
                // )[0].CTLOC_Desc[0];

                if (jsonDataGetPTByEN[0].hasOwnProperty('ward') && jsonDataGetPTByEN[0].hasOwnProperty('Room')) {
                    roomName += "\n" + jsonDataGetPTByEN[0].ward[0] + " - " + jsonDataGetPTByEN[0].Room[0];
                }

                result.push({
                    roomId: group._id,
                    roomName: roomName,
                    member: members,
                    HN: jsonDataGetPTByEN[0].HN[0],
                    EN: group.name.split('.')[0]
                });

            });

            result = JSON.stringify(result);
            this.response.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });

            this.response.end(result);
        }
        catch (e) {
            console.log(e);
            this.response.writeHead(e.response.statusCode);

            this.response.end('Error: Cannot get group list');
        }
    });

Router.route('/api/group/history', {name: 'group_history', where: 'server'})
    .post(function () {
        try {
            var token = this.request.headers.token;
            var userId = this.request.headers.userid;
            var startDateTime = this.request.body.startDateTime;
            var roomId = this.request.body.roomId;
            var params;

            var dateTime = new Date();

            var currentDateTime = dateTime.getUTCFullYear()
                + "-" + ("0" + (dateTime.getUTCMonth() + 1)).slice(-2)
                + "-" + ("0" + dateTime.getUTCDate()).slice(-2)
                + "T" + ("0" + dateTime.getUTCHours()).slice(-2)
                + ":" + ("0" + dateTime.getUTCMinutes()).slice(-2)
                + ":" + ("0" + dateTime.getUTCSeconds()).slice(-2)
                + "." + ("0" + dateTime.getUTCMilliseconds()).slice(-3) + "Z";

            var result = {
                currentDatetime: currentDateTime,
                chats: []
            };

            if (startDateTime === null) {
                params = {
                    roomId: roomId,
                    count: 0
                }
            }
            else {
                params = {
                    roomId: roomId,
                    oldest: startDateTime,
                    count: 0
                }
            }
            optionGroupListHistory = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                },
                params: params
            };
            jsonGroupListHistory = Meteor.http.call("GET", rocketChatUrl + "groups.history", optionGroupListHistory);
            chatJson = [];

            jsonGroupListHistory.data.messages.sort(function (a, b) {
                return a.ts.localeCompare(b.ts);
            });

            jsonGroupListHistory.data.messages.forEach(function (chat) {
                chatTime = new Date(chat.ts);
                chatTime = chatTime.getFullYear()
                    + ";" + ("0" + (chatTime.getMonth() + 1)).slice(-2)
                    + ";" + ("0" + chatTime.getDate()).slice(-2)
                    + "|" + ("0" + chatTime.getHours()).slice(-2)
                    + ";" + ("0" + chatTime.getMinutes()).slice(-2)
                    + ";" + ("0" + chatTime.getSeconds()).slice(-2)
                    + ";" + ("0" + chatTime.getMilliseconds()).slice(-3);
                chatTemp = {
                    id: chat._id,
                    msg: chat.msg,
                    dateTime: chatTime,
                    ownerUsername: chat.u.username,
                    ownerRealname: chat.u.name.split(';')[0],
                    type: (!chat.hasOwnProperty('alias') || chat.alias === "" || chat.alias === null) ? "0" : chat.alias
                };
                chatJson.push(chatTemp);
            });

            result.chats = chatJson;

            result = JSON.stringify(result);

            this.response.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });

            this.response.end(result);
        }
        catch (e) {
            console.log(e);
            this.response.writeHead(e.response.statusCode);

            this.response.end('Error: Cannot get group history chat');
        }
    });

// not use
Router.route('/api/group/list/history', {name: 'group_list_history', where: 'server'})
    .post(function () {
        try {
            var token = this.request.headers.token;
            var userId = this.request.headers.userid;
            var startDateTime = this.request.body.startDateTime;
            var params;

            const optionsLocationList = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            };
            let xml = Meteor.http.call("POST", trakCareTestUrl + "GetAllLocation", optionsLocationList);

            let jsonDataLocationList = xml2js.parseStringSync(xml.content);
            jsonDataLocationList = jsonDataLocationList.DataSet['diffgr:diffgram'][0].NewDataSet[0].tblResult;

            const optionsGroupList = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                },
                params: {
                    count: 0
                }
            };
            let jsonGroupList = Meteor.http.call("GET", rocketChatUrl + "groups.list", optionsGroupList);

            var optionGroupListHistory;
            let jsonGroupListHistory;
            var dateTime = new Date();

            var currentDateTime = dateTime.getUTCFullYear()
                + "-" + ("0" + (dateTime.getUTCMonth() + 1)).slice(-2)
                + "-" + ("0" + dateTime.getUTCDate()).slice(-2)
                + "T" + ("0" + dateTime.getUTCHours()).slice(-2)
                + ":" + ("0" + dateTime.getUTCMinutes()).slice(-2)
                + ":" + ("0" + dateTime.getUTCSeconds()).slice(-2)
                + "." + ("0" + dateTime.getUTCMilliseconds()).slice(-3) + "Z";

            var result = {
                currentDatetime: currentDateTime,
                rooms: []
            };

            var chatTemp;
            var chatJson;
            var chatTime;
            var members;
            var memberTemp;

            const optionsUserList = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                },
                params: {
                    count: 0
                }
            };
            let jsonUserList = Meteor.http.call("GET", rocketChatUrl + "users.list", optionsUserList);

            let optionsGetPTByEN;
            let jsonDataGetPTByEN;
            let roomName = "";

            jsonGroupList.data.groups.forEach(function (group) {
                if (group.name.indexOf('.') === -1) {
                    return;
                }
                if (group.name.split('.')[1] === "") {
                    return;
                }
                if (startDateTime === null) {
                    params = {
                        roomId: group._id,
                        count: 100
                    }
                }
                else {
                    params = {
                        roomId: group._id,
                        oldest: startDateTime,
                        count: 100
                    }
                }
                optionGroupListHistory = {
                    headers: {
                        'X-Auth-Token': token,
                        'X-User-Id': userId
                    },
                    params: params
                };
                jsonGroupListHistory = Meteor.http.call("GET", rocketChatUrl + "groups.history", optionGroupListHistory);
                chatJson = [];

                jsonGroupListHistory.data.messages.sort(function (a, b) {
                    return a.ts.localeCompare(b.ts);
                });

                jsonGroupListHistory.data.messages.forEach(function (chat) {
                    chatTime = new Date(chat.ts);
                    chatTime = chatTime.getFullYear()
                        + ";" + ("0" + (chatTime.getMonth() + 1)).slice(-2)
                        + ";" + ("0" + chatTime.getDate()).slice(-2)
                        + "|" + ("0" + chatTime.getHours()).slice(-2)
                        + ";" + ("0" + chatTime.getMinutes()).slice(-2)
                        + ";" + ("0" + chatTime.getSeconds()).slice(-2)
                        + ";" + ("0" + chatTime.getMilliseconds()).slice(-3);
                    if (chat.u.hasOwnProperty('name')) {
                        chatTemp = {
                            id: chat._id,
                            msg: chat.msg,
                            dateTime: chatTime,
                            ownerUsername: chat.u.username,
                            ownerRealname: chat.u.name.split(';')[0],
                            type: (!chat.hasOwnProperty('alias') || chat.alias === "" || chat.alias === null) ? "0" : chat.alias
                        };
                        chatJson.push(chatTemp);
                    }
                });
                members = [];
                group.usernames.forEach(function (member) {
                    memberTemp = jsonUserList.data.users.find(item => {
                        return item.username === member
                    });
                    members.push({
                        userId: memberTemp._id,
                        realname: memberTemp.name.split(';')[0]
                    });
                });

                optionsGetPTByEN = {
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    params: {
                        EN: group.name.split('.')[0]
                    }
                };
                xml = Meteor.http.call("POST", trakCareUrl + "GetPTInfoByEN", optionsGetPTByEN);

                jsonDataGetPTByEN = xml2js.parseStringSync(xml.content);

                jsonDataGetPTByEN = jsonDataGetPTByEN.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

                roomName = "";
                if (jsonDataGetPTByEN[0].hasOwnProperty('PAPMI_Name')) {
                    roomName += jsonDataGetPTByEN[0].PAPMI_Name[0] + " ";
                }
                if (jsonDataGetPTByEN[0].hasOwnProperty('PAPMI_Name2')) {
                    roomName += jsonDataGetPTByEN[0].PAPMI_Name2[0];
                }

                roomName += ";" + jsonDataLocationList.filter(
                    function (jsonDataLocationList) {
                        return jsonDataLocationList.CTLOC_Code[0] === group.name.split('.')[1]
                    }
                )[0].CTLOC_Desc[0];

                if (jsonDataGetPTByEN[0].hasOwnProperty('WARD_Desc') && jsonDataGetPTByEN[0].hasOwnProperty('ROOM_Desc')) {
                    roomName += "\n" + jsonDataGetPTByEN[0].WARD_Desc[0] + " - " + jsonDataGetPTByEN[0].ROOM_Desc[0];
                }

                result.rooms.push({
                    roomId: group._id,
                    roomName: roomName,
                    member: members,
                    chats: chatJson
                });
            });
            result = JSON.stringify(result);

            this.response.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });

            this.response.end(result);
        }
        catch (e) {
            console.log(e);
            this.response.writeHead(e.response.statusCode);

            this.response.end('Error: Cannot get group list history chat');
        }
    });

Router.route('/api/group/create/subdivision', {name: 'group_create_subdivision', where: 'server'})
    .post(function () {
        let token = this.request.headers.token;
        let userId = this.request.headers.userid;
        let roomName = this.request.body.roomName+".subdivision";
        try {
            const optionsGroupCreate = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                },
                data: {
                    name: roomName,
                    members: this.request.body.members
                }
            };
            let jsonGroupCreate = Meteor.http.call("POST", rocketChatUrl + "groups.create", optionsGroupCreate);

            var result = {
                roomId: jsonGroupCreate.data.group._id,
                // roomName: jsonGroupCreate.data.group.name,
            };

            result = JSON.stringify(result);

            this.response.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });

            this.response.end(result);
        }
        catch (e) {
            console.log(e);
            try {
                if (e.response.data.errorType === 'error-duplicate-channel-name') {
                    this.response.writeHead(500);

                    this.response.end('Duplicate');

                    // const optionsGroupInfo = {
                    //     headers: {
                    //         'X-Auth-Token': token,
                    //         'X-User-Id': userId
                    //     },
                    //     params: {
                    //         roomName: roomName
                    //     }
                    // };
                    // let jsonGroupInfo = Meteor.http.call("GET", rocketChatUrl + "groups.info", optionsGroupInfo);
                    // result = {
                    //     roomId: jsonGroupInfo.data.group._id
                    // };
                    //
                    // result = JSON.stringify(result);
                    //
                    // this.response.writeHead(200, {
                    //     'Content-Type': 'application/json; charset=utf-8'
                    // });
                    //
                    // this.response.end(result);
                }

            }
            catch(ee){
                console.log(ee);
                this.response.writeHead(e.response.statusCode);

                this.response.end('Error: Cannot create group subdivision');
            }
        }
    });


Router.route('/api/group/create', {name: 'group_create', where: 'server'})
    .post(function () {
        let token = this.request.headers.token;
        let userId = this.request.headers.userid;
        let roomName;
        let result;
        try {
            let username = this.request.body.username;
            let member = this.request.body.member;

            if (parseInt(username) > parseInt(member)) {
                roomName = member + "." + username;
            } else {
                roomName = username + "." + member;
            }
            roomName += ".personal";
            const optionsGroupCreate = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                },
                data: {
                    name: roomName,
                    members: [member]
                }
            };
            let jsonGroupCreate = Meteor.http.call("POST", rocketChatUrl + "groups.create", optionsGroupCreate);
            result = {
                roomId: jsonGroupCreate.data.group._id
                // roomName: jsonGroupCreate.data.channel.name,
            };

            result = JSON.stringify(result);

            this.response.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });

            this.response.end(result);
        }
        catch (e) {
            try {
                if (e.response.data.errorType === 'error-duplicate-channel-name') {
                    const optionsGroupInfo = {
                        headers: {
                            'X-Auth-Token': token,
                            'X-User-Id': userId
                        },
                        params: {
                            roomName: roomName
                        }
                    };
                    let jsonGroupInfo = Meteor.http.call("GET", rocketChatUrl + "groups.info", optionsGroupInfo);
                    result = {
                        roomId: jsonGroupInfo.data.group._id
                    };

                    result = JSON.stringify(result);

                    this.response.writeHead(200, {
                        'Content-Type': 'application/json; charset=utf-8'
                    });

                    this.response.end(result);
                }

            }
            catch(ee){
                console.log(ee);
                this.response.writeHead(e.response.statusCode);

                this.response.end('Error: Cannot create group');
            }
        }
    });
