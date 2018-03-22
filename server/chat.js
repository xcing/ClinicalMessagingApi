var rocketChatUrl = 'http://10.88.10.209:3000/api/v1/';
let trakCareUrl = 'http://10.88.10.77/wsbhq2016/WS_GetDataBytrak.asmx/';
let trakCareTestUrl = 'http://10.88.10.77/wsemrpathway_test/WS_GetDataBytrak.asmx/';
// let key = "/Users/pawanwit/Clinical.Messaging.All/cnm-backend-meteor/cer.p8";
let key = "/home/veerasak/cnm-backend-meteor/cer.p8";

const utf8 = require('utf8');

// var admin = require("firebase-admin");
//
// var serviceAccount = require("../clinicalmessaging-12d88-firebase-adminsdk-l9ii9-932a2a3674.json");
//
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://clinicalmessaging-12d88.firebaseio.com"
// });

Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    extended: false
}));

function getBytes(str) {
    var bytes = [], char;
    str = encodeURI(str);

    while (str.length) {
        char = str.slice(0, 1);
        str = str.slice(1);

        if ('%' !== char) {
            bytes.push(char.charCodeAt(0));
        } else {
            char = str.slice(0, 2);
            str = str.slice(2);

            bytes.push(parseInt(char, 16));
        }
    }

    return bytes;
}

function encryptClinic(str, key) {
    let keyBase64 = new Buffer(key).toString('base64');
    let strUriEncode = encodeURIComponent(str);
    let strByteArray = getBytes(strUriEncode);
    let result = "";
    strByteArray.forEach(function (strByte) {
        result += strByte.toString(16) + keyBase64;
    });

    return new Buffer(result).toString('base64');
}

function decryptClinic(str, key) {
    let keyBase64 = new Buffer(key).toString('base64');
    let result = new Buffer(str, 'base64').toString('ascii');
    result = result.split(keyBase64);
    let i = 0;
    result.forEach(function (temp) {
        if (temp === null || temp === "") {
            return;
        }
        result[i] = parseInt(temp, 16);
        i++;
    });
    result = new Buffer(result).toString('ascii');
    return decodeURIComponent(result);
}

Router.route('/api/testEncrypt', {name: 'testEncrypt', where: 'server'})
    .get(function () {
        let str = 'ไทยThai';
        let key = 'CL1n1c';

        let encrypt = encryptClinic(str, key);

        let decrypt = decryptClinic(encrypt, key);

        console.log(decrypt);
    });

Router.route('/api/chat/postMessage', {name: 'chat_postMessage', where: 'server'})
    .post(function () {
        try {
            let gcm = require('android-gcm');
            var token = this.request.headers.token;
            var userId = this.request.headers.userid;

            // console.log(this.request.body.message);
            const optionsPostMessage = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                },
                data: {
                    roomId: this.request.body.roomId,
                    text: this.request.body.message,
                    alias: this.request.body.type
                }
            };
            let jsonPostMessage = Meteor.http.call("POST", rocketChatUrl + "chat.postMessage", optionsPostMessage);

            if (jsonPostMessage.data.success === true) {
                var registrationToken = [];
                var optionUserInfo;
                var jsonUserInfo;
                const optionsGroupInfo = {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Auth-Token': token,
                        'X-User-Id': userId
                    },
                    params: {
                        roomId: this.request.body.roomId
                    }
                };
                let jsonGroupInfo = Meteor.http.call("GET", rocketChatUrl + "groups.info", optionsGroupInfo);

                let optionsGroupMember = {
                    headers: {
                        'X-Auth-Token': token,
                        'X-User-Id': userId
                    },
                    params: {
                        roomId: this.request.body.roomId
                    }
                };
                let jsonGroupMember = Meteor.http.call("GET", rocketChatUrl + "groups.members", optionsGroupMember);

                jsonGroupMember.data.members.forEach(function (member) {
                    if (jsonPostMessage.data.message.u.username === member.username) {
                        return;
                    }
                    optionUserInfo = {
                        headers: {
                            'X-Auth-Token': token,
                            'X-User-Id': userId
                        },
                        params: {
                            username: member.username
                        }
                    };
                    jsonUserInfo = Meteor.http.call("GET", rocketChatUrl + "users.info", optionUserInfo);
                    registrationToken.push(jsonUserInfo.data.user.name.split(';')[1]);
                });

                var chatTime = new Date(jsonPostMessage.data.message.ts);
                chatTime = chatTime.getFullYear()
                    + ";" + ("0" + (chatTime.getMonth() + 1)).slice(-2)
                    + ";" + ("0" + chatTime.getDate()).slice(-2)
                    + "|" + ("0" + chatTime.getHours()).slice(-2)
                    + ";" + ("0" + chatTime.getMinutes()).slice(-2)
                    + ";" + ("0" + chatTime.getSeconds()).slice(-2)
                    + ";" + ("0" + chatTime.getMilliseconds()).slice(-3);

                if (this.request.body.type !== "99") {
                    let apn = require("apn");
                    let options = {
                        token: {
                            key: key,
                            keyId: "P2VKC65JH4",
                            teamId: "28YQ7CPK6R"
                        },
                        production: false
                    };
                    let apnProvider = new apn.Provider(options);
                    // let deviceToken = "1252a7fb2651d1c133db58e992127f04be0a7da82b03dc1f50b2f472c7d7e83f";

                    let notification = new apn.Notification();
                    notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600; // will expire in 24 hours from now
                    notification.sound = "mega.aiff";
                    // notification.alert = this.request.body.message;
                    notification.alert = "มีข้อความใหม่";
                    notification.payload = {
                        "messageFrom": jsonPostMessage.data.message.u.name.split(';')[0],
                        "roomId": jsonPostMessage.data.message.rid,
                        "id": jsonPostMessage.data.message._id,
                        "msg": this.request.body.message,
                        "dateTime": chatTime,
                        "ownerUsername": jsonPostMessage.data.message.u.username,
                        "ownerRealname": jsonPostMessage.data.message.u.name.split(';')[0],
                        "type": this.request.body.type
                    };
                    notification.topic = "com.BangkokHospital.ChatBH";
                    notification.tag = "newMessage";
                    notification.collapse_key = "newMessage";
                    apnProvider.send(notification, registrationToken).then(result => {
                        console.log(result);
                    });

                    apnProvider.shutdown();

                    let gcmObject = new gcm.AndroidGcm('API_KEY');

                    let message = new gcm.Message({
                        registration_ids: registrationToken,
                        data: {
                            "messageFrom": jsonPostMessage.data.message.u.name.split(';')[0],
                            "roomId": jsonPostMessage.data.message.rid,
                            "id": jsonPostMessage.data.message._id,
                            "msg": this.request.body.message,
                            "dateTime": chatTime,
                            "ownerUsername": jsonPostMessage.data.message.u.username,
                            "ownerRealname": jsonPostMessage.data.message.u.name.split(';')[0],
                            "type": this.request.body.type
                        }
                    });
                    message.collapse_key = 'newsMessage';

                    gcmObject.send(message, function(err, response) {});
                }

                // var payload = {
                //     notification: {
                //         tag: "new_messages",
                //         title: jsonPostMessage.data.message.u.name.split(';')[0],
                //         body: this.request.body.message,
                //         sound: "default"
                //     },
                //     data: {
                //         roomId: jsonPostMessage.data.message.rid,
                //         id: jsonPostMessage.data.message._id,
                //         msg: this.request.body.message,
                //         dateTime: chatTime,
                //         ownerUsername: jsonPostMessage.data.message.u.username,
                //         ownerRealname: jsonPostMessage.data.message.u.name.split(';')[0],
                //         type: this.request.body.type
                //     }
                // };
                //
                // var optionPayload = {
                //     collapseKey: 'new_messages',
                //     "apns-collapse-id": 'new_messages'
                // };
                //
                // admin.messaging().sendToDevice(registrationToken, payload, optionPayload)
                //     .then(function (response) {
                //         console.log("Successfully sent message:", response);
                //     })
                //     .catch(function (error) {
                //         console.log("Error sending message:", error);
                //     });

                this.response.writeHead(200);

                this.response.end("success");
            } else {
                this.response.writeHead(500);

                this.response.end("Rocket Chat: Post Message Fail");
            }
        }
        catch (e) {
            console.log(e);
            this.response.writeHead(e.response.statusCode);

            this.response.end('Error: Cannot Post Message');
        }
    });

Router.route('/api/chat/list/history', {name: 'chat_list_history', where: 'server'})
    .post(function () {
        try {
            let token = this.request.headers.token;
            let userId = this.request.headers.userid;
            let startDateTime = this.request.body.startDateTime;
            let params;

            // get all location
            const optionsLocationList = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            };
            let xml = Meteor.http.call("POST", trakCareTestUrl + "GetAllLocation", optionsLocationList);

            let jsonDataLocationList = xml2js.parseStringSync(xml.content);
            jsonDataLocationList = jsonDataLocationList.DataSet['diffgr:diffgram'][0].NewDataSet[0].tblResult;

            //get list history group
            const optionsGroupList = {
                headers: {
                    'X-Auth-Token': token,
                    'X-User-Id': userId
                },
                params: {
                    count: 1
                }
            };
            let jsonGroupList = Meteor.http.call("GET", rocketChatUrl + "groups.list", optionsGroupList);

            let optionGroupListHistory;
            let jsonGroupListHistory;
            let dateTime = new Date();

            let currentDateTime = dateTime.getUTCFullYear()
                + "-" + ("0" + (dateTime.getUTCMonth() + 1)).slice(-2)
                + "-" + ("0" + dateTime.getUTCDate()).slice(-2)
                + "T" + ("0" + dateTime.getUTCHours()).slice(-2)
                + ":" + ("0" + dateTime.getUTCMinutes()).slice(-2)
                + ":" + ("0" + dateTime.getUTCSeconds()).slice(-2)
                + "." + ("0" + dateTime.getUTCMilliseconds()).slice(-3) + "Z";

            let result = {
                currentDatetime: currentDateTime,
                rooms: []
            };

            let chatTemp;
            let chatJson;
            let chatTime;
            let members;
            let memberTemp;
            let dateTimeTemp;

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

            let optionsGetPTByEN;
            let jsonDataGetPTByEN;
            let roomName = "";
            let category = "";
            let usernameTemp;
            let optionUserInfo;
            let jsonUserInfo;
            let username = "";
            let optionsGroupMember;
            let jsonGroupMember;

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

                dateTimeTemp = "";
                if (jsonGroupListHistory.data.messages.hasOwnProperty('0')) {
                    dateTimeTemp = jsonGroupListHistory.data.messages[0].ts;
                }
                else {
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
                if(jsonGroupMember.data.members.length < 2){
                    return;
                }
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
                // console.log(group._id);
                if (group.name.split('.')[2] === "personal") {
                    if (jsonMyUserInfo.data.user.username === jsonGroupMember.data.members[0].username) {
                        usernameTemp = jsonGroupMember.data.members[1];
                    } else {
                        usernameTemp = jsonGroupMember.data.members[0];
                    }
                    roomName = usernameTemp.name.split(';')[0];
                    username = usernameTemp.username;
                    category = "personal";
                } else if (group.name.split('.')[1] === "subdivision") {
                    roomName = group.name.split('.')[0];
                    username = "";
                    category = "subdivision";
                } else {
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

                    username = "";
                    roomName = "";
                    if (jsonDataGetPTByEN[0].hasOwnProperty('Fname')) {
                        roomName += jsonDataGetPTByEN[0].Fname[0] + " ";
                    }
                    if (jsonDataGetPTByEN[0].hasOwnProperty('Lname')) {
                        roomName += jsonDataGetPTByEN[0].Lname[0];
                    }
                    roomName += ";" + jsonDataLocationList.filter(
                        function (jsonDataLocationList) {
                            return jsonDataLocationList.CTLOC_Code[0] === group.name.split('.')[1]
                        }
                    )[0].CTLOC_Desc[0];

                    if (jsonDataGetPTByEN[0].hasOwnProperty('ward') && jsonDataGetPTByEN[0].hasOwnProperty('Room')) {
                        roomName += "\n" + jsonDataGetPTByEN[0].ward[0] + " - " + jsonDataGetPTByEN[0].Room[0];
                    }
                    category = "patient";
                }
                result.rooms.push({
                    roomId: group._id,
                    roomName: roomName,
                    username: username,
                    member: members,
                    dateTime: dateTimeTemp,
                    chats: chatJson,
                    category: category
                });
            });

            // //get list history channel
            // const optionMyUserInfo = {
            //     headers: {
            //         'X-Auth-Token': token,
            //         'X-User-Id': userId
            //     },
            //     params: {
            //         userId: userId
            //     }
            // };
            // let jsonMyUserInfo = Meteor.http.call("GET", rocketChatUrl + "users.info", optionMyUserInfo);
            //
            // const optionsChannelList = {
            //     headers: {
            //         'X-Auth-Token': token,
            //         'X-User-Id': userId
            //     }
            // };
            // let jsonChannelList = Meteor.http.call("GET", rocketChatUrl + "channels.list", optionsChannelList);
            //
            // let optionChannelListHistory;
            // let jsonChannelListHistory;
            //
            // let optionUserInfo;
            // let jsonUserInfo;
            // let usernameTemp;
            //
            // jsonChannelList.data.channels.forEach(function (group) {
            //     if(group._id === 'GENERAL'){
            //         return;
            //     }
            //     if (jsonMyUserInfo.data.user.username === group.usernames[0]) {
            //         usernameTemp = group.usernames[1];
            //     } else {
            //         usernameTemp = group.usernames[0];
            //     }
            //     optionUserInfo = {
            //         headers: {
            //             'X-Auth-Token': token,
            //             'X-User-Id': userId
            //         },
            //         params: {
            //             username: usernameTemp
            //         }
            //     };
            //     jsonUserInfo = Meteor.http.call("GET", rocketChatUrl + "users.info", optionUserInfo);
            //
            //     if (startDateTime === null) {
            //         params = {
            //             roomId: group._id,
            //             count: 100
            //         }
            //     }
            //     else {
            //         params = {
            //             roomId: group._id,
            //             oldest: startDateTime,
            //             count: 100
            //         }
            //     }
            //     optionChannelListHistory = {
            //         headers: {
            //             'X-Auth-Token': token,
            //             'X-User-Id': userId
            //         },
            //         params: params
            //     };
            //     jsonChannelListHistory = Meteor.http.call("GET", rocketChatUrl + "channels.history", optionChannelListHistory);
            //     chatJson = [];
            //
            //     jsonChannelListHistory.data.messages.sort(function (a, b) {
            //         return a.ts.localeCompare(b.ts);
            //     });
            //
            //     jsonChannelListHistory.data.messages.forEach(function (chat) {
            //         chatTime = new Date(chat.ts);
            //         chatTime = chatTime.getFullYear()
            //             + ";" + ("0" + (chatTime.getMonth() + 1)).slice(-2)
            //             + ";" + ("0" + chatTime.getDate()).slice(-2)
            //             + "|" + ("0" + chatTime.getHours()).slice(-2)
            //             + ";" + ("0" + chatTime.getMinutes()).slice(-2)
            //             + ";" + ("0" + chatTime.getSeconds()).slice(-2)
            //             + ";" + ("0" + chatTime.getMilliseconds()).slice(-3);
            //         // console.log(chat);
            //         if (chat.u.hasOwnProperty('name')) {
            //             chatTemp = {
            //                 id: chat._id,
            //                 msg: chat.msg,
            //                 dateTime: chatTime,
            //                 ownerUsername: chat.u.username,
            //                 ownerRealname: chat.u.name.split(';')[0],
            //                 type: (!chat.hasOwnProperty('alias') || chat.alias === "" || chat.alias === null) ? "0" : chat.alias
            //             };
            //             chatJson.push(chatTemp);
            //         }
            //     });
            //
            //     dateTimeTemp = "";
            //     if (jsonChannelListHistory.data.messages.hasOwnProperty('0')) {
            //         dateTimeTemp = jsonChannelListHistory.data.messages[0].ts;
            //     } else {
            //         return;
            //     }
            //
            //     result.rooms.push({
            //         roomId: group._id,
            //         roomName: jsonUserInfo.data.user.name.split(';')[0],
            //         username: jsonUserInfo.data.user.username,
            //         dateTime: dateTimeTemp,
            //         chats: chatJson,
            //         category: "channel"
            //     });
            // });

            // //get list history im
            // const optionMyUserInfo = {
            //     headers: {
            //         'X-Auth-Token': token,
            //         'X-User-Id': userId
            //     },
            //     params: {
            //         userId: userId
            //     }
            // };
            // let jsonMyUserInfo = Meteor.http.call("GET", rocketChatUrl + "users.info", optionMyUserInfo);
            //
            // const optionsImList = {
            //     headers: {
            //         'X-Auth-Token': token,
            //         'X-User-Id': userId
            //     }
            // };
            // let jsonImList = Meteor.http.call("GET", rocketChatUrl + "im.list", optionsImList);
            //
            // let optionImListHistory;
            // let jsonImListHistory;
            //
            // let optionUserInfo;
            // let jsonUserInfo;
            // let usernameTemp;
            //
            // jsonImList.data.ims.forEach(function (group) {
            //     if (jsonMyUserInfo.data.user.username === group.usernames[0]) {
            //         usernameTemp = group.usernames[1];
            //     } else {
            //         usernameTemp = group.usernames[0];
            //     }
            //     optionUserInfo = {
            //         headers: {
            //             'X-Auth-Token': token,
            //             'X-User-Id': userId
            //         },
            //         params: {
            //             username: usernameTemp
            //         }
            //     };
            //     jsonUserInfo = Meteor.http.call("GET", rocketChatUrl + "users.info", optionUserInfo);
            //
            //     if (startDateTime === null) {
            //         params = {
            //             roomId: group._id,
            //             count: 100
            //         }
            //     }
            //     else {
            //         params = {
            //             roomId: group._id,
            //             oldest: startDateTime,
            //             count: 100
            //         }
            //     }
            //     optionImListHistory = {
            //         headers: {
            //             'X-Auth-Token': token,
            //             'X-User-Id': userId
            //         },
            //         params: params
            //     };
            //     jsonImListHistory = Meteor.http.call("GET", rocketChatUrl + "im.history", optionImListHistory);
            //     chatJson = [];
            //
            //     jsonImListHistory.data.messages.sort(function (a, b) {
            //         return a.ts.localeCompare(b.ts);
            //     });
            //
            //     jsonImListHistory.data.messages.forEach(function (chat) {
            //         chatTime = new Date(chat.ts);
            //         chatTime = chatTime.getFullYear()
            //             + ";" + ("0" + (chatTime.getMonth() + 1)).slice(-2)
            //             + ";" + ("0" + chatTime.getDate()).slice(-2)
            //             + "|" + ("0" + chatTime.getHours()).slice(-2)
            //             + ";" + ("0" + chatTime.getMinutes()).slice(-2)
            //             + ";" + ("0" + chatTime.getSeconds()).slice(-2)
            //             + ";" + ("0" + chatTime.getMilliseconds()).slice(-3);
            //         chatTemp = {
            //             id: chat._id,
            //             msg: chat.msg,
            //             dateTime: chatTime,
            //             ownerUsername: chat.u.username,
            //             ownerRealname: chat.u.name.split(';')[0],
            //             type: (!chat.hasOwnProperty('alias') || chat.alias === "" || chat.alias === null) ? "0" : chat.alias
            //         };
            //         chatJson.push(chatTemp);
            //     });
            //
            //     dateTimeTemp = "";
            //     if (jsonImListHistory.data.messages.hasOwnProperty('0')) {
            //         dateTimeTemp = jsonImListHistory.data.messages[0].ts;
            //     } else {
            //         return;
            //     }
            //
            //     result.rooms.push({
            //         roomId: group._id,
            //         roomName: jsonUserInfo.data.user.name.split(';')[0],
            //         username: jsonUserInfo.data.user.username,
            //         dateTime: dateTimeTemp,
            //         chats: chatJson,
            //         category: "im"
            //     });
            // });

            result.rooms.sort(function (a, b) {
                return a.dateTime.localeCompare(b.dateTime);
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