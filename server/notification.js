Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    extended: false
}));

// var admin = require("firebase-admin");
//
// var serviceAccount = require("../clinicalmessaging-12d88-firebase-adminsdk-l9ii9-932a2a3674.json");
//
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://clinicalmessaging-12d88.firebaseio.com"
// });

Router.route('/api/notification/send', {name: 'notification_send', where: 'server'})
    .get(function () {
        try {
            let apn = require("apn");
            let options = {
                token: {
                    key: "/Users/pawanwit/Clinical.Messaging.All/cnm-backend-meteor/cer.p8",
                    keyId: "P2VKC65JH4",
                    teamId: "28YQ7CPK6R"
                },
                production: false
            };
            let apnProvider = new apn.Provider(options);
            // Replace deviceToken with your particular token:
            let deviceToken = "1252a7fb2651d1c133db58e992127f04be0a7da82b03dc1f50b2f472c7d7e83f";

            // Prepare the notifications
            let notification = new apn.Notification();
            notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600; // will expire in 24 hours from now
            notification.badge = 2;
            notification.sound = "mega.aiff";
            notification.alert = "Hello from solarianprogrammer.com";
            notification.payload = {'messageFrom': 'Solarian Programmer'};
            // Replace this with your app bundle ID:
            notification.topic = "com.BangkokHospital.ChatBH";
            // Send the actual notification
            apnProvider.send(notification, deviceToken).then(result => {
                // Show the result of the send operation:
                console.log(result);
            });

            // Close the server
            apnProvider.shutdown();


            // var registrationToken = "cGIYiyAJG-k:APA91bGj--557GWB5T6hPnVzP3kyW5vXvD-47KEZ2UAmPEKemP_ydrMthrt8XYHFYnTcCeX4HKV5zGRPij9Zz3L9r5NXNy3fle73b-E2FrHgTaJRBrYKTZK4lcOZGVhvqPM90Eb4ITJW";

            // var registrationToken = [
            //     "cGIYiyAJG-k:APA91bGj--557GWB5T6hPnVzP3kyW5vXvD-47KEZ2UAmPEKemP_ydrMthrt8XYHFYnTcCeX4HKV5zGRPij9Zz3L9r5NXNy3fle73b-E2FrHgTaJRBrYKTZK4lcOZGVhvqPM90Eb4ITJW",
            //     "cL0akk6at4U:APA91bEc4GurUDAsWpZriNmeTatXlaEwYW76HN3GoP0-gfrspPSKeY0LNGwvxwaYgKzziXOXFA8Jf0QA42FT7wfD5mpghPW_IHVr3utfp1fJbPBchHEHSkjHGsmpGKzwvEgpzUHf9053",
            //     "dAhkj4XvTnQ:APA91bHu526C5VNLiXKREaeNzy_rMCvHLXq9xY_c-wX95YnTieqktQ7DHcROhhhQSGJMpKppClCs7-tiLHKliMiJyJ05VcksRxcDZLV4m54K8egkF1dIJ4_OwJpHYKqFRR9UYrMb3A0g",
            //     "dUDTm8MF0DA:APA91bH0jTNbTPZQflq4vm0aRqvXE4cVj_nJzYquU4Y--DtuyHR3kb1F7vbHqAbElInOfMMjo2rprpzOiuWsX5zh8LI5nMHRhml5e_7vM-j7UKud1O1TALJw4rGn4GDxmwfk-1YSKl5I"
            // ];

            // var payload = {
            //     notification: {
            //         title: "Title",
            //         body: "BODY",
            //         sound : "default"
            //     },
            //     data: {
            //         stock: "GOOG",
            //         open: "829.62",
            //         close: "635.67"
            //     }
            // };

            // admin.messaging().sendToDevice(registrationToken, payload)
            //     .then(function(response) {
            //         // See the MessagingDevicesResponse reference documentation for
            //         // the contents of response.
            //         console.log("Successfully sent message:", response);
            //     })
            //     .catch(function(error) {
            //         console.log("Error sending message:", error);
            //     });
        }
        catch(e){
            console.log(e);
        }
    });

