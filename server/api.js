Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    extended: false
}));

//for test call rest api json
Router.route('/api/channel', {name: 'test', where: 'server'})
    .get(function () {
        const options = {
            headers: {'Content-Type': 'application/json'}
        };
        let json = Meteor.http.call("GET", "https://jsonplaceholder.typicode.com/posts", options);

        json = json.content;
        this.response.writeHead(200, {
            'Content-Length': json.length,
            'Content-Type': 'application/json'
        });
        this.response.end(json);
    });

