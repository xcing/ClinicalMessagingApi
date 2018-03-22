import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
    Meteor.methods({
        callRest: function () {
            this.unblock();
            var options = {
                headers: {'Content-Type': 'application/json'}
            };
            return Meteor.http.call("GET", "https://jsonplaceholder.typicode.com/posts", options);
        },
        callXml: function () {
            this.unblock();
            const options = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                params: {
                    username: "pawanwit.su",
                    password: '2943731',
                }
            };
            let xml = Meteor.http.call("POST", "http://10.88.10.77/wsbhq2016/WS_GetDataBytrak.asmx/GetLogonAD", options);

            // xml2js.parseString(xml.content, function (jsError, jsResult) {
            //     console.error('errors',jsError);
            //     console.log('xml to js',jsResult);
            //     return 'aaa';
            // });

            var result = xml2js.parseStringSync(xml.content);

            console.log(result);

            return result;
        }
    });
});


