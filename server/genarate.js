let trakCareUrl = 'http://10.88.10.77/wsbhq2016/WS_GetDataBytrak.asmx/';
let trakCareTestUrl = 'http://10.88.10.77/wsemrpathway_test/WS_GetDataBytrak.asmx/';
let rocketChatUrl = 'http://10.88.10.209:3020/api/v1/';
// let rocketChatUrl = 'http://localhost:3000/api/v1/';

let securityGroupOfNurse = ["7","9","17","19","24","25","26","33","35","39","40","41","50","51","146","180","198","202","223","229","256","260","261","262","263","264","269"];

import {Mongo} from 'meteor/mongo'

export let userCollection = new Mongo.Collection('cnm_user');
export let patientCollection = new Mongo.Collection('cnm_patient');


Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    extended: false
}));


Router.route('/api/genarate/test', {name: 'generate_test', where: 'server'})
    .get(function () {
        try {
            const testcollection = new Mongo.Collection('testcollection');

            // testcollection.insert({title: 'Hello world', body: 'First post'});
            const queryResult = testcollection.find({title: 'Hello world'}).fetch();
            if (queryResult.length === 0) {
                console.log("is null");
            }
            else {
                console.log("have data");
            }
            console.log(queryResult);

            this.response.writeHead(200);
            this.response.end('Success');
        }
        catch (e) {
            console.log(e);
            this.response.writeHead(500);
            this.response.end('Error: Test Error');
        }
    });

Router.route('/api/genarate/user', {name: 'generate_user', where: 'server'})
    .get(function () {
        try {
            const optionsGetCareprovider = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                params: {
                    CareproviderName: ""
                }
            };
            let xml = Meteor.http.call("POST", trakCareTestUrl + "GetAllCareprovider", optionsGetCareprovider);

            let jsonDataGetCareprovider = xml2js.parseStringSync(xml.content);

            jsonDataGetCareprovider = jsonDataGetCareprovider.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

            // console.log(jsonDataGetCareprovider.filter(
            //     function(jsonDataGetCareprovider){ return jsonDataGetCareprovider.CTPCP_SMCNo === 45402 }
            // ));

            let optionsRegister;
            let jsonRegister;
            let careProviderCodeTrim;
            let queryResult;
            // let userCollection;
            // try{
            //     userCollection = new Mongo.Collection('cnm_user');
            // }
            // catch(exx){
            //     console.log(exx);
            //     // userCollection = Mongo.Collection('cnm_user');
            // }

            jsonDataGetCareprovider.forEach(function (user) {
                careProviderCodeTrim = user.CTPCP_Code[0].trim();

                queryResult = userCollection.find({careProviderCode: careProviderCodeTrim}).fetch();
                if (queryResult.length > 0) {
                    console.log("created: " + careProviderCodeTrim);
                    return;
                }

                optionsRegister = {
                    headers: {'Content-Type': 'application/json'},
                    data: {
                        email: careProviderCodeTrim + "@bdms.co.th",
                        username: careProviderCodeTrim,
                        pass: careProviderCodeTrim,
                        name: user.DoctorName[0]
                    }
                };

                try {
                    jsonRegister = Meteor.http.call("POST", rocketChatUrl + "users.register", optionsRegister);
                    console.log(careProviderCodeTrim);
                    userCollection.insert({careProviderCode: careProviderCodeTrim});
                }
                catch (ex) {
                    if (ex.response.data.error === 'Email already exists. [403]') {
                        userCollection.insert({careProviderCode: careProviderCodeTrim});
                        console.log(careProviderCodeTrim);
                    } else {
                        console.log(ex);
                    }
                }
            });

            this.response.writeHead(200);

            this.response.end("success");
        }
        catch (e) {
            console.log(e);
            this.response.writeHead(500);

            this.response.end('Error: Regsiter User Not Complete');
        }
    });


Router.route('/api/genarate/group', {name: 'generate_group', where: 'server'})
    .get(function () {
        try {
            // let patientCollection;
            // try{
            //     patientCollection = new Mongo.Collection('cnm_patient');
            // }
            // catch(exx){
            //     console.log(exx);
            //     //patientCollection = Mongo.Collection('cnm_patient');
            // }

            const optionsGetCareprovider = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                params: {
                    CareproviderName: ""
                }
            };
            let xml = Meteor.http.call("POST", trakCareTestUrl + "GetAllCareprovider", optionsGetCareprovider);

            // let jsonDataGetCareprovider = xml2js.parseStringSync(xml.content);
            //
            // jsonDataGetCareprovider = jsonDataGetCareprovider.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

            let dateTime = new Date();
            let currentDate = dateTime.getUTCFullYear()
                + "-" + ("0" + (dateTime.getUTCMonth() + 1)).slice(-2)
                + "-" + ("0" + dateTime.getUTCDate()).slice(-2);
            console.log(currentDate);
            const optionsGetPTArrive = {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                params: {
                    ArriveDate_yyyy_mm_dd: currentDate
                }
            };
            xml = Meteor.http.call("POST", trakCareTestUrl + "GetPTArrivedBYArriveDate", optionsGetPTArrive);

            let jsonDataGetPTArrive = xml2js.parseStringSync(xml.content);
            jsonDataGetPTArrive = jsonDataGetPTArrive.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

            const optionsLogin = {
                headers: {'Content-Type': 'application/json'},
                data: {
                    username: "admin",
                    password: "cnmveera"
                }
            };
            let jsonLogin = Meteor.http.call("POST", rocketChatUrl + "login", optionsLogin);
            // let optionsGetPTByEN;
            // let jsonDataGetPTByEN;
            let optionsGroupCreate;
            let jsonGroupCreate;
            let optionsGetListCareProviderByLocationCode;
            let jsonDataGetListCareProviderByLocationCode;
            let dataLocationCode = [];
            let dataCareProviderByLocationCode = [];
            let alreadyIndex = -1;
            let i = 0;
            let dataGroupCreated = [];
            let isAlreadyCreate = false;
            let roomName;
            let queryResult;

            jsonDataGetPTArrive.forEach(function (patient) {
                // console.log(patient.EN[0]); //find name patient
                // console.log(patient.LocDesc[0]);
                // console.log(patient.LocCode[0]); //for find nurse
                // console.log(patient.CarProvCode[0]); //doctor
                // console.log(patient.CarProvCodeMain[0]); //doctor

                queryResult = patientCollection.find({
                    ENRowID: patient.ENRowID[0],
                    locationCode: patient.LocCode[0]
                }).fetch();
                if (queryResult.length > 0) {
                    console.log("created: " + patient.ENRowID[0] + "." + patient.LocCode[0]);
                    return;
                }

                isAlreadyCreate = false;
                dataGroupCreated.forEach(function (dataAlreadyCreate) {
                    if (dataAlreadyCreate.ENRowID === patient.ENRowID[0] && dataAlreadyCreate.locationCode === patient.LocCode[0]) {
                        isAlreadyCreate = true;
                        return false;
                    }
                });

                if (isAlreadyCreate) {
                    return;
                }
                let members = [];
                if (patient.hasOwnProperty('CarProvCodeMain')) {
                    members.push(patient.CarProvCodeMain[0]);
                }
                if (patient.hasOwnProperty('CarProvCode')) {
                    if (!patient.hasOwnProperty('CarProvCodeMain')) {
                        members.push(patient.CarProvCode[0]);
                    }
                    else if (patient.CarProvCode[0] !== patient.CarProvCodeMain[0]) {
                        members.push(patient.CarProvCode[0]);
                    }
                }
                alreadyIndex = -1;
                i = 0;
                dataLocationCode.forEach(function (locationCode) {
                    if (locationCode === patient.LocCode[0]) {
                        alreadyIndex = i;
                        return false;
                    }
                    i++;
                });
                if (alreadyIndex === -1) {
                    optionsGetListCareProviderByLocationCode = {
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        params: {
                            LocationCode: patient.LocCode[0]
                        }
                    };
                    xml = Meteor.http.call("POST", trakCareTestUrl + "GetListCareProviderByLocation", optionsGetListCareProviderByLocationCode);

                    jsonDataGetListCareProviderByLocationCode = xml2js.parseStringSync(xml.content);

                    jsonDataGetListCareProviderByLocationCode = jsonDataGetListCareProviderByLocationCode.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

                    dataCareProviderByLocationCode.push(jsonDataGetListCareProviderByLocationCode);
                    dataLocationCode.push(patient.LocCode[0]);
                }
                else {
                    jsonDataGetListCareProviderByLocationCode = dataCareProviderByLocationCode[alreadyIndex];
                }

                jsonDataGetListCareProviderByLocationCode.forEach(function (careProvider) {
                    if(securityGroupOfNurse.indexOf(careProvider.SecurityGroupID[0]) > -1){
                        if (careProvider.hasOwnProperty('CTPCP_Code')) {
                            members.push(careProvider.CTPCP_Code[0]);
                        }
                    }
                });

                // optionsGetPTByEN = {
                //     headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                //     params: {
                //         EN: patient.EN[0]
                //     }
                // };
                // xml = Meteor.http.call("POST", trakCareUrl + "GetPTInfoByEN", optionsGetPTByEN);
                //
                // jsonDataGetPTByEN = xml2js.parseStringSync(xml.content);
                //
                // jsonDataGetPTByEN = jsonDataGetPTByEN.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

                roomName = patient.ENRowID[0] + "." + patient.LocCode[0] + ".patient";
                optionsGroupCreate = {
                    headers: {
                        'X-Auth-Token': jsonLogin.data.data.authToken,
                        'X-User-Id': jsonLogin.data.data.userId
                    },
                    data: {
                        name: roomName,
                        members: members
                    }
                };
                try {
                    dataGroupCreated.push({
                        ENRowID: patient.ENRowID[0],
                        locationCode: patient.LocCode[0]
                    });
                    // console.log(optionsGroupCreate);
                    jsonGroupCreate = Meteor.http.call("POST", rocketChatUrl + "groups.create", optionsGroupCreate);
                    patientCollection.insert({ENRowID: patient.ENRowID[0], locationCode: patient.LocCode[0]});
                    console.log('insert: ' + roomName);
                }
                catch (ex) {
                    if (ex.response.data.errorType === 'error-duplicate-channel-name') {
                        patientCollection.insert({ENRowID: patient.ENRowID[0], locationCode: patient.LocCode[0]});
                        console.log('duplicate: ' + roomName);
                    } else if (ex.response.statusCode === 400) {
                        patientCollection.insert({ENRowID: patient.ENRowID[0], locationCode: patient.LocCode[0]});
                        console.log('dup key: ' + roomName);
                    }
                    else {
                        console.log(ex);
                    }
                }
            });

            this.response.writeHead(200);

            this.response.end("success");
        }
        catch (e) {
            console.log(e);
            this.response.writeHead(500);

            this.response.end('Error: Create Group Not Complete');
        }
    });

Router.route('/api/cronjob/discharge', {name: 'cronjob_discharge', where: 'server'})
    .get(function () {
        try {
            let dateTime = new Date();
            let yesterday = dateTime.getUTCFullYear()
                + "-" + ("0" + (dateTime.getUTCMonth() + 1)).slice(-2)
                + "-" + ("0" + (dateTime.getUTCDate() - 1)).slice(-2);
            console.log("yesterday: "+yesterday);
            discharge(yesterday);

            let today = dateTime.getUTCFullYear()
                + "-" + ("0" + (dateTime.getUTCMonth() + 1)).slice(-2)
                + "-" + ("0" + dateTime.getUTCDate()).slice(-2);
            console.log("today: "+today);
            discharge(today);

            this.response.writeHead(200);
            this.response.end('Success');
        }
        catch (e) {
            console.log(e);
            this.response.writeHead(e.response.statusCode);
            this.response.end('Error: Cronjob Discharge');
        }
    });

function discharge(date){
    const optionsGetDischarge = {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        params: {
            FinalDateyyy_mm_dd: date
        }
    };
    xml = Meteor.http.call("POST", trakCareUrl + "GetDischargeInfoByFinalDate", optionsGetDischarge);

    let jsonDataGetDischarge = xml2js.parseStringSync(xml.content);
    jsonDataGetDischarge = jsonDataGetDischarge.DataTable['diffgr:diffgram'][0].DocumentElement[0].tblResult;

    const optionsLogin = {
        headers: {'Content-Type': 'application/json'},
        data: {
            username: "admin",
            password: "cnmveera"
        }
    };
    let jsonLogin = Meteor.http.call("POST", rocketChatUrl + "login", optionsLogin);

    let patients;
    let roomName;
    let optionsGroupInactive;
    let jsonGroupInactive;

    jsonDataGetDischarge.forEach(function (discharge) {

        patients = patientCollection.find({ENRowID: discharge.PAADM_RowID[0]}).fetch();
        if (patients.length === 0) {
            console.log("patient not found: "+discharge.PAADM_RowID[0]);
            return;
        }

        patients.forEach(function (patient) {
            roomName = patient.ENRowID + "." + patient.locationCode + ".patient";

            console.log("inactive: "+roomName);
            try
            {
                optionsGroupInactive = {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Auth-Token': jsonLogin.data.data.authToken,
                        'X-User-Id': jsonLogin.data.data.userId
                    },
                    data: {
                        roomName: roomName
                    }
                };
                jsonGroupInactive = Meteor.http.call("POST", rocketChatUrl + "groups.inactive", optionsGroupInactive);

                console.log(jsonGroupInactive);
            }
            catch(ex){
                console.log(ex);
            }
        });

    });
}
