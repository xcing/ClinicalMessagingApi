let rocketChatUrl = 'http://10.88.10.209:3000/api/v1/';
let trakCareUrl = 'http://10.88.10.77/wsbhq2016/WS_GetDataBytrak.asmx/';


Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    extended: false
}));

Router.route('/api/channel/create', {name: 'channel_create', where: 'server'})
    .post(function () {
        try {
            let token = this.request.headers.token;
            let userId = this.request.headers.userid;
            let username = this.request.body.username;
            let member = this.request.body.member;
            let roomName;

            if(parseInt(username) > parseInt(member)){
                roomName = member+"_"+username;
            } else{
                roomName = username+"_"+member;
            }

            const optionsChannelCreate = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                },
                data: {
                    name: roomName,
                    members: [member]
                }
            };
            let jsonChannelCreate = Meteor.http.call("POST", rocketChatUrl + "channels.create", optionsChannelCreate);

            var result = {
                roomId: jsonChannelCreate.data.channel._id
                // roomName: jsonChannelCreate.data.channel.name,
            };
            console.log(result);

            const optionsPostMessage = {
                headers: {
                    'Content-Type': 'application/json',
                    'token': token,
                    'userid': userId
                },
                data: {
                    roomId: result.roomId,
                    message: "Hi",
                    type: "99",
                    channelType: "channel",
                    username: username
                }
            };
            let jsonPostMessage = Meteor.http.call("POST", "http://"+this.request.headers.host + "/api/chat/postMessage", optionsPostMessage);
            console.log(jsonPostMessage);
            result = JSON.stringify(result);

            this.response.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });

            this.response.end(result);
        }
        catch (e) {
            if(e.response.data.errorType === 'error-duplicate-channel-name'){
                this.response.writeHead(200);
                this.response.end("duplicate");
            }
            console.log(e);
            this.response.writeHead(e.response.statusCode);

            this.response.end('Error: Cannot create channel');
        }
    });

Router.route('/api/channel/history', {name: 'channel_history', where: 'server'})
    .post(function () {
        try {
            var token = this.request.headers.token;
            var userId = this.request.headers.userid;
            var startDateTime = this.request.body.startDateTime;
            var roomId = this.request.body.roomId;
            var params;

            var dateTime = new Date();

            var currentDateTime = dateTime.getUTCFullYear()
                + "-" + ("0" + (dateTime.getUTCMonth()+1)).slice(-2)
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
            optionChannelListHistory = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                },
                params: params
            };
            jsonChannelListHistory = Meteor.http.call("GET", rocketChatUrl + "channels.history", optionChannelListHistory);
            chatJson = [];

            jsonChannelListHistory.data.messages.sort(function(a, b){
                return a.ts.localeCompare(b.ts);
            });
            jsonChannelListHistory.data.messages.forEach(function (chat) {
                chatTime = new Date(chat.ts);
                chatTime = chatTime.getFullYear()
                    + ";" + ("0" + (chatTime.getMonth()+1)).slice(-2)
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

            this.response.end('Error: Cannot get channel history chat');
        }
    });


Router.route('/api/channel/list/history', {name: 'channel_list_history', where: 'server'})
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

            const optionsChannelList = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                }
            };
            let jsonChannelList = Meteor.http.call("GET", rocketChatUrl + "channels.list", optionsChannelList);

            var optionChannelListHistory;
            let jsonChannelListHistory;
            var dateTime = new Date();

            var currentDateTime = dateTime.getUTCFullYear()
                + "-" + ("0" + (dateTime.getUTCMonth()+1)).slice(-2)
                + "-" + ("0" + dateTime.getUTCDate()).slice(-2)
                + "T" + ("0" + dateTime.getUTCHours()).slice(-2)
                + ":" + ("0" + dateTime.getUTCMinutes()).slice(-2)
                + ":" + ("0" + dateTime.getUTCSeconds()).slice(-2)
                + "." + ("0" + dateTime.getUTCMilliseconds()).slice(-3) + "Z";

            var result = {
                currentDatetime: currentDateTime,
                rooms: []
            };

            // console.log(jsonChannelList.channels);

            var chatTemp;
            var chatJson;
            var chatTime;
            var optionUserInfo;
            var jsonUserInfo;
            var usernameTemp;

            jsonChannelList.data.channels.forEach(function (group) {
                if(group._id === 'GENERAL'){
                    return;
                }
                if(jsonMyUserInfo.data.user.username === group.usernames[0]){
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
                optionChannelListHistory = {
                    headers: {
                        'X-Auth-Token': token,
                        'X-User-Id': userId
                    },
                    params: params
                };
                jsonChannelListHistory = Meteor.http.call("GET", rocketChatUrl + "channels.history", optionChannelListHistory);
                chatJson = [];

                // console.log(jsonChannelListHistory.data);

                jsonChannelListHistory.data.messages.sort(function(a, b){
                    return a.ts.localeCompare(b.ts);
                });

                jsonChannelListHistory.data.messages.forEach(function (chat) {
                    chatTime = new Date(chat.ts);
                    chatTime = chatTime.getFullYear()
                        + ";" + ("0" + (chatTime.getMonth()+1)).slice(-2)
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

            this.response.end('Error: Cannot get channel list history chat');
        }
    });