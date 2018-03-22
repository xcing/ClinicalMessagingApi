var rocketChatUrl = 'http://10.88.10.209:3000/api/v1/';
let trakCareUrl = 'http://10.88.10.77/wsbhq2016/WS_GetDataBytrak.asmx/';
let trakCareTestUrl = 'http://10.88.10.77/wsemrpathway_test/WS_GetDataBytrak.asmx/';

Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    extended: false
}));

Router.route('/api/im/list/all', {name: 'im_list_all', where: 'server'})
    .post(function () {
        try {
            let token = this.request.headers.token;
            let userId = this.request.headers.userid;
            let username = this.request.body.username;

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

            const optionsGetCareprovider = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                params: {
                    CareproviderName: ""
                }
            };
            let xml = Meteor.http.call("POST", trakCareTestUrl + "GetAllCareprovider", optionsGetCareprovider);

            var jsonDataGetCareprovider = xml2js.parseStringSync(xml.content);

            jsonDataGetCareprovider = jsonDataGetCareprovider.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

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

            let result = {
                group: [],
                doctor: [],
                nurse: [],
                pharmacy: [],
                cashier: [],
                other: []
            };

            let optionsGroupMember;
            let jsonGroupMember;
            let members;
            let userAlreadyPush = [];

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
                if (group.name.split('.')[2] === "patient") {
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
                            username: memberTemp.username,
                            realname: memberTemp.name.split(';')[0]
                        });
                    }
                });

                result.group.push({
                    roomId: group._id,
                    roomName: group.name.split('.')[0],
                    member: members
                });
            });
            let dataTemp;

            jsonDataGetCareprovider.forEach(function (user) {
                if (username === user.CTPCP_Code[0]) {
                    return;
                } else if (userAlreadyPush.includes(user.CTPCP_Code[0])) {
                    return;
                }

                dataTemp = {
                    roomName: user.DoctorName[0],
                    username: user.CTPCP_Code[0],
                    position: user.CTCPT_Desc[0],
                    positionId: user.CTCPT_rowid[0],
                    specialty_desc: user.hasOwnProperty('specialty_desc') ? user.specialty_desc[0] : ""
                };
                switch (user.CTCPT_rowid[0]) {
                    case "1":
                    case "2":
                    case "3":
                    case "28":
                        result.doctor.push(dataTemp);
                        break;
                    case "4":
                    case "5":
                    case "6":
                    case "7":
                    case "26":
                    case "27":
                        result.nurse.push(dataTemp);
                        break;
                    case "12":
                    case "13":
                        result.pharmacy.push(dataTemp);
                        break;
                    case "17":
                        result.cashier.push(dataTemp);
                        break;
                    default:
                        result.other.push(dataTemp);
                        break;
                }
                userAlreadyPush.push(user.CTPCP_Code[0]);
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

            this.response.end('Error: Cannot get im list all');
        }
    });

Router.route('/api/im/list', {name: 'im_list', where: 'server'})
    .get(function () {
        try {
            let token = this.request.headers.token;
            let userId = this.request.headers.userid;

            const optionMyUserInfo = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                },
                params: {
                    userId: userId
                }
            };
            let jsonMyUserInfo = Meteor.http.call("GET", rocketChatUrl + "users.info", optionMyUserInfo);

            const optionsImList = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                }
            };
            let jsonImList = Meteor.http.call("GET", rocketChatUrl + "im.list", optionsImList);

            let result = [];

            jsonImList.data.ims.forEach(function (group) {
                if (jsonMyUserInfo.data.user.username === group.usernames[0]) {
                    usernameTemp = group.usernames[1];
                } else {
                    usernameTemp = group.usernames[0];
                }
                optionUserInfo = {
                    headers: {
                        'X-Auth-Token': token,
                        'X-User-Id': userId
                    },
                    params: {
                        username: usernameTemp
                    }
                };
                jsonUserInfo = Meteor.http.call("GET", rocketChatUrl + "users.info", optionUserInfo);

                result.push({
                    roomId: group._id,
                    roomName: jsonUserInfo.data.user.name.split(';')[0],
                    username: jsonUserInfo.data.user.username
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

            this.response.end('Error: Cannot get im list');
        }
    });

Router.route('/api/im/history', {name: 'im_history', where: 'server'})
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
                    count: 100
                }
            }
            else {
                params = {
                    roomId: roomId,
                    oldest: startDateTime,
                    count: 100
                }
            }
            optionImListHistory = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                },
                params: params
            };
            jsonImListHistory = Meteor.http.call("GET", rocketChatUrl + "im.history", optionImListHistory);
            chatJson = [];

            jsonImListHistory.data.messages.sort(function (a, b) {
                return a.ts.localeCompare(b.ts);
            });
            jsonImListHistory.data.messages.forEach(function (chat) {
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

            this.response.end('Error: Cannot get im history chat');
        }
    });


Router.route('/api/im/list/history', {name: 'im_list_history', where: 'server'})
    .post(function () {
        try {
            var token = this.request.headers.token;
            var userId = this.request.headers.userid;
            var startDateTime = this.request.body.startDateTime;
            var params;

            const optionMyUserInfo = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                },
                params: {
                    userId: userId
                }
            };
            var jsonMyUserInfo = Meteor.http.call("GET", rocketChatUrl + "users.info", optionMyUserInfo);

            const optionsImList = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                }
            };
            let jsonImList = Meteor.http.call("GET", rocketChatUrl + "im.list", optionsImList);

            var optionImListHistory;
            let jsonImListHistory;
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

            // console.log(jsonImList.data.ims);

            var chatTemp;
            var chatJson;
            var chatTime;
            var optionUserInfo;
            var jsonUserInfo;
            var usernameTemp;

            jsonImList.data.ims.forEach(function (group) {
                if (jsonMyUserInfo.data.user.username === group.usernames[0]) {
                    usernameTemp = group.usernames[1];
                } else {
                    usernameTemp = group.usernames[0];
                }
                optionUserInfo = {
                    headers: {
                        'X-Auth-Token': token,
                        'X-User-Id': userId
                    },
                    params: {
                        username: usernameTemp
                    }
                };
                jsonUserInfo = Meteor.http.call("GET", rocketChatUrl + "users.info", optionUserInfo);

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
                optionImListHistory = {
                    headers: {
                        'X-Auth-Token': token,
                        'X-User-Id': userId
                    },
                    params: params
                };
                jsonImListHistory = Meteor.http.call("GET", rocketChatUrl + "im.history", optionImListHistory);
                chatJson = [];

                // console.log(jsonImListHistory.data);

                jsonImListHistory.data.messages.sort(function (a, b) {
                    return a.ts.localeCompare(b.ts);
                });

                jsonImListHistory.data.messages.forEach(function (chat) {
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

                result.rooms.push({
                    roomId: group._id,
                    roomName: jsonUserInfo.data.user.name.split(';')[0],
                    username: jsonUserInfo.data.user.username,
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

            this.response.end('Error: Cannot get im list history chat');
        }
    });