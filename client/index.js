import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';

import './index.html';

Router.route('/index', function () {
    this.render('index');
});

Template.index.onCreated(function indexOnCreated() {
    this.indexJsonContent = new ReactiveVar("Waiting for response from server...");
});

Template.index.onRendered(function () {
    var self = this;
    Meteor.call('callRest', function (err, asyncValue) {
        if (err)
            console.log(err);
        else
            self.indexJsonContent.set(asyncValue.content);
    });
});

Template.index.helpers({
    indexJsonContent() {
        return Template.instance().indexJsonContent.get();
    },
});