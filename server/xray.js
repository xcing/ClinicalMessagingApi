var trakCareUrl = 'http://10.88.10.77/wsbhq2016/WS_GetDataBytrak.asmx/';

Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    extended: false
}));

Router.route('/api/xray', {name: 'x-ray', where: 'server'})
    .post(function () {
        try {
            var HN = this.request.body.HN;
            const optionsEN = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                params: {
                    strHN: HN
                }
            };
            let xmlEN = Meteor.http.call("POST", trakCareUrl + "ListEpisodeByHn", optionsEN);

            var jsonDataEN = xml2js.parseStringSync(xmlEN.content);

            jsonDataEN = jsonDataEN.DataSet['diffgr:diffgram'][0].NewDataSet[0].tblResult;

            var result = [];
            var optionsXRay;
            let xmlXRay;
            var jsonDataXRay;
            var resultTemp = [];
            jsonDataEN.forEach(function (dataEN) {
                optionsXRay = {
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    params: {
                        PMINo: HN,
                        ADMRowId: dataEN.PAADM_ADMNo[0],
                        OrdSttDateFrom: "2017-09-01",
                        OrdSttDateTo: "2017-11-30"
                    }
                };
                xmlXRay = Meteor.http.call("POST", trakCareUrl + "GetXrayResultList_XrayResult", optionsXRay);

                jsonDataXRay = xml2js.parseStringSync(xmlXRay.content);
                console.log("not done "+dataEN.PAADM_ADMNo[0]);
                if(!jsonDataXRay.DataTable['diffgr:diffgram'][0].hasOwnProperty('DocumentElement')){
                    return;
                }

                jsonDataXRay = jsonDataXRay.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

                resultTemp = [];
                jsonDataXRay.forEach(function (dataXRay) {
                    resultTemp.push({
                        startDate: dataXRay.hasOwnProperty('OEORISttDat') ? dataXRay.OEORISttDat[0] : "",
                        description: dataXRay.hasOwnProperty('ARCIMDesc') ? dataXRay.ARCIMDesc[0] : "",
                        note: dataXRay.hasOwnProperty('RESFileName') ? dataXRay.RESFileName[0] : "",
                        resultFile: dataXRay.hasOwnProperty('RESFileName') ? dataXRay.RESFileName[0] : ""
                    });
                });
                result.push({
                    EN: dataEN.PAADM_ADMNo[0],
                    admidDate: dataEN.PAADM_AdmDate[0],
                    xRay: resultTemp
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

            this.response.end('Get Medicine Fail');
        }
    });