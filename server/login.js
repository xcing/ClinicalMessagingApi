var trakCareUrl = 'http://10.88.10.77/wsbhq2016/WS_GetDataBytrak.asmx/';
var rocketChatUrl = 'http://10.88.10.209:3000/api/v1/';

Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    extended: false
}));

Router.route('/api/logon', {name: 'logon', where: 'server'})
    .post(function () {
        try {
            //api logon
            const optionsLogon = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                params: {
                    UserID: this.request.body.UserID,
                    Password: this.request.body.Password,
                }
            };
            let xml = Meteor.http.call("POST", trakCareUrl + "LogonTrakcare", optionsLogon);

            var jsonDataLogon = xml2js.parseStringSync(xml.content);

            jsonDataLogon = jsonDataLogon.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

            // jsonDataLogon = {
            //     'userId': jsonDataLogon[0].USERID[0],
            //     'securityGroup': jsonDataLogon[0].SecurityGroup[0],
            //     'realname': jsonDataLogon[0].SSUSR_Name[0]
            // };

            //api get care provider code
            const optionsGetCareProviderCode = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                params: {
                    strUsrCode: jsonDataLogon[0].USERID[0]
                }
            };

            xml = Meteor.http.call("POST", trakCareUrl + "GetCareproviderCode", optionsGetCareProviderCode);

            var jsonDataGetCareProviderCode = xml2js.parseStringSync(xml.content);

            jsonDataGetCareProviderCode = jsonDataGetCareProviderCode.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

            // jsonDataGetCareProviderCode = {
            //     'CTPCP_Code': jsonDataGetCareProviderCode[0].CTPCP_Code[0]
            // };

            // json = JSON.stringify(json);
        }
        catch (e) {
            console.log(e);
            this.response.writeHead(401);

            this.response.end('Trak Care: Logon Trak Care Fail');
        }

        try {
            //api login rocket chat
            const optionsLogin = {
                headers: {'Content-Type': 'application/json'},
                data: {
                    username: jsonDataGetCareProviderCode[0].CTPCP_Code[0],
                    password: jsonDataGetCareProviderCode[0].CTPCP_Code[0]
                }
            };
            let jsonLogin = Meteor.http.call("POST", rocketChatUrl + "login", optionsLogin);

            var result = {
                'TrakCare': {
                    'userId': jsonDataLogon[0].USERID[0],
                    'securityGroup': jsonDataLogon[0].SecurityGroup[0],
                    'realname': jsonDataLogon[0].SSUSR_Name[0].split(';')[0],
                    'careProviderCode': jsonDataGetCareProviderCode[0].CTPCP_Code[0]
                },
                'RocketChat': {
                    'userId': jsonLogin.data.data.userId,
                    'authToken': jsonLogin.data.data.authToken
                }
            };

            result = JSON.stringify(result);

            this.response.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });

            this.response.end(result);
        }
        catch (e) {
            try {
                //api register rocket chat
                const optionsRegister = {
                    headers: {'Content-Type': 'application/json'},
                    data: {
                        email: jsonDataGetCareProviderCode[0].CTPCP_Code[0] + "@bdms.co.th",
                        username: jsonDataGetCareProviderCode[0].CTPCP_Code[0],
                        pass: jsonDataGetCareProviderCode[0].CTPCP_Code[0],
                        name: jsonDataLogon[0].SSUSR_Name[0]
                    }
                };

                let jsonRegister = Meteor.http.call("POST", rocketChatUrl + "users.register", optionsRegister);
                const optionsLogin = {
                    headers: {'Content-Type': 'application/json'},
                    data: {
                        username: jsonDataGetCareProviderCode[0].CTPCP_Code[0],
                        password: jsonDataGetCareProviderCode[0].CTPCP_Code[0]
                    }
                };

                let jsonLogin = Meteor.http.call("POST", rocketChatUrl + "login", optionsLogin);
                // const optionsUpdateUserInfo = {
                //     headers: {
                //         'Content-Type': 'application/json',
                //         'X-Auth-Token': jsonLogin.data.data.authToken,
                //         'X-User-Id': jsonRegister.data.user._id
                //     },
                //     data: {
                //         userId: jsonRegister.data.user._id,
                //         data: {
                //             username: jsonRegister.data.user._id
                //         }
                //     }
                // };
                // let jsonUpdateUserInfo = Meteor.http.call("POST", rocketChatUrl + "users.update", optionsUpdateUserInfo);
                var result = {
                    'TrakCare': {
                        'userId': jsonDataLogon[0].USERID[0],
                        'securityGroup': jsonDataLogon[0].SecurityGroup[0],
                        'realname': jsonDataLogon[0].SSUSR_Name[0],
                        'careProviderCode': jsonDataGetCareProviderCode[0].CTPCP_Code[0]
                    },
                    'RocketChat': {
                        'userId': jsonRegister.data.user._id,
                        'authToken': jsonLogin.data.data.authToken
                    }
                };

                result = JSON.stringify(result);

                this.response.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8'
                });

                this.response.end(result);
            }
            catch (ee) {
                console.log(ee);
                this.response.writeHead(500);

                this.response.end('Rocket Chat: Login Rocket Chat Fail');
            }
        }
    });

Router.route('/api/user/update', {name: 'User Update', where: 'server'})
    .post(function () {
        try {
            const optionsUpdateUserInfo = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': this.request.headers.token,
                    'X-User-Id': this.request.headers.userid
                },
                data: {
                    userId: this.request.headers.userid,
                    data: {
                        name: this.request.body.notificationToken
                    }
                }
            };
            let jsonUpdateUserInfo = Meteor.http.call("POST", rocketChatUrl + "users.update", optionsUpdateUserInfo);
            if (jsonUpdateUserInfo.data.success === true) {
                this.response.writeHead(200);

                this.response.end("success");
            } else {
                this.response.writeHead(500);

                this.response.end("Rocket Chat: Update User Fail");
            }
        }
        catch (e) {
            console.log(e);
            this.response.writeHead(e.response.statusCode);

            this.response.end('Error: Cannot Update User');
        }
    });

Router.route('/api/user/set/avatar', {name: 'User Set Avatar', where: 'server'})
    .post(function () {
        try {
            // console.log(this.request.data);

            this.request.on('data', (data) => {
                console.log(data.toString());
            });

            this.response.writeHead(200);

            this.response.end("success");
            //
            // const optionsUpdateUserInfo = {
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'X-Auth-Token': this.request.headers.token,
            //         'X-User-Id': this.request.headers.userid
            //     },
            //     data: {
            //         userId: this.request.headers.userid,
            //         data: {
            //             name: this.request.body.notificationToken
            //         }
            //     }
            // };
            // let jsonUpdateUserInfo = Meteor.http.call("POST", rocketChatUrl + "users.setAvatar", optionsUpdateUserInfo);
            // if (jsonUpdateUserInfo.data.success === true) {
            //     this.response.writeHead(200);
            //
            //     this.response.end("success");
            // } else {
            //     this.response.writeHead(500);
            //
            //     this.response.end("Rocket Chat: Set Avatar Fail");
            // }
        }
        catch (e) {
            console.log(e);
            this.response.writeHead(e.response.statusCode);

            this.response.end('Error: Cannot Set Avatar');
        }
    });