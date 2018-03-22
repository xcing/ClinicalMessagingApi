var trakCareUrl = 'http://10.88.10.77/wsbhq2016/WS_GetDataBytrak.asmx/';

Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    extended: false
}));

Router.route('/api/operation', {name: 'operation', where: 'server'})
    .post(function () {
        try {
            const options = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                params: {
                    input: this.request.body.HN,
                }
            };
            let xml = Meteor.http.call("POST", trakCareUrl + "GetOperationByHN", options);

            var jsonData = xml2js.parseStringSync(xml.content);

            jsonData = jsonData.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

            var result = [];
            jsonData.forEach(function (data) {
                result.push({
                    HN: data.hasOwnProperty('PAPMI_No') ? data.PAPMI_No[0] : "",
                    EN: data.hasOwnProperty('PAADM_ADMNo') ? data.PAADM_ADMNo[0] : "",
                    startDate: data.hasOwnProperty('ANAOP_OpStartDate') ? data.ANAOP_OpStartDate[0] : "",
                    description: data.hasOwnProperty('OPER_Desc') ? data.OPER_Desc[0] : "",
                    CTLOC_Desc: data.hasOwnProperty('CTLOC_Desc') ? data.CTLOC_Desc[0] : "",
                    ANAOP_Status: data.hasOwnProperty('ANAOP_Status') ? data.ANAOP_Status[0] : ""
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
            this.response.writeHead(500);

            this.response.end('Get Operation Fail');
        }
    });