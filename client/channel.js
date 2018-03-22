import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';

import './channel.html';

Router.route('/channel', function () {
    this.render('channel');
});

Template.channel.onCreated(function channelOnCreated() {
    this.channelJsonContent = new ReactiveVar("Waiting for response from server...");
});

Template.channel.onRendered(function () {
    var self = this;
    Meteor.call('callXml', function (err, asyncValue) {
        if (err)
            console.log(err);
        else
            self.channelJsonContent.set(asyncValue);
    });
});

Template.channel.helpers({
    channelJsonContent() {
        return Template.instance().channelJsonContent.get();
    },
});