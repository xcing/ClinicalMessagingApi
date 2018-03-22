var trakCareUrl = 'http://10.88.10.77/wsbhq2016/WS_GetDataBytrak.asmx/';

Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    extended: false
}));

Router.route('/api/medicine', {name: 'medicine', where: 'server'})
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
            var optionsMedicine;
            let xmlMedicine;
            var jsonDataMedicine;
            var resultTemp = [];
            jsonDataEN.forEach(function (dataEN) {
                optionsMedicine = {
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    params: {
                        strHN: HN,
                        strEN: dataEN.PAADM_ADMNo[0],
                    }
                };
                xmlMedicine = Meteor.http.call("POST", trakCareUrl + "GetMedicineByEn", optionsMedicine);

                jsonDataMedicine = xml2js.parseStringSync(xmlMedicine.content);
                if(!jsonDataMedicine.DataTable['diffgr:diffgram'][0].hasOwnProperty('DocumentElement')){
                    return;
                }

                jsonDataMedicine = jsonDataMedicine.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

                resultTemp = [];
                jsonDataMedicine.forEach(function (dataMedicine) {
                    resultTemp.push({
                        date: dataMedicine.hasOwnProperty('OEORI_Date') ? dataMedicine.OEORI_Date[0] : "",
                        orderName: dataMedicine.hasOwnProperty('ARCIM_Desc') ? dataMedicine.ARCIM_Desc[0] : "",
                        // instruction: dataMedicine.hasOwnProperty('PHCIN_Desc1') ? dataMedicine.PHCIN_Desc1[0] : "",
                        dosage: dataMedicine.hasOwnProperty('OEORI_DoseQty') ? dataMedicine.OEORI_DoseQty[0] : "",
                        UOM: dataMedicine.hasOwnProperty('CTUOM_Desc') ? dataMedicine.CTUOM_Desc[0] : "",
                        // frequency: dataMedicine.hasOwnProperty('PHCFR_Desc1') ? dataMedicine.PHCFR_Desc1[0] : "",
                        // processing: dataMedicine.hasOwnProperty('OEORI_DepProcNotes') ? dataMedicine.OEORI_DepProcNotes[0] : "",
                        // status: dataMedicine.hasOwnProperty('OSTAT_Desc') ? dataMedicine.OSTAT_Desc[0] : "",
                        // priority: dataMedicine.hasOwnProperty('OECPR_Desc') ? dataMedicine.OECPR_Desc[0] : "",
                        // docterUser: dataMedicine.hasOwnProperty('CTPCP_Desc') ? dataMedicine.CTPCP_Desc[0] : ""
                    });
                });
                result.push({
                    EN: dataEN.PAADM_ADMNo[0],
                    admidDate: dataEN.PAADM_AdmDate[0],
                    medicine: resultTemp
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