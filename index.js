'use strict';

var winston = require('winston');
var fs = require('fs');
var nconf = require.main.require('nconf');
var db = module.parent.require('./database');
var qnLib = require('qn');

(function(qn) {

    var settings;
    var qnClient;

    function reconstructQN() {
        qnClient = qnLib.create({
            accessKey: settings.accessKey,
            secretKey: settings.secretKey,
            bucket: settings.bucket,
            origin: settings.origin,
            // timeout: 3600000, // default rpc timeout: one hour, optional 
            // if your app outside of China, please set `uploadURL` to `http://up.qiniug.com/` 
            // uploadURL: 'http://up.qiniu.com/', 
        });
    }

    db.getObject('nodebb-plugin-qn', function(err, _settings) {
        if (err) {
            return winston.error(err.message);
        }
        settings = _settings || {};
        if (settings.accessKey)
            reconstructQN();
    });

    qn.init = function(params, callback) {
        params.router.get('/admin/plugins/qn', params.middleware.applyCSRF, params.middleware.admin.buildHeader, renderAdmin);
        params.router.get('/api/admin/plugins/qn', params.middleware.applyCSRF, renderAdmin);

        params.router.post('/api/admin/plugins/qn/save', params.middleware.applyCSRF, save);
        winston.verbose("[plugins]nodebb-plugin-qn init done.")

        callback();
    };

    function renderAdmin(req, res, next) {
        var data = {
            accessKey: settings.accessKey,
            secretKey: settings.secretKey,
            bucket: settings.bucket,
            origin: settings.origin
        };
        res.render('admin/plugins/qn', { settings: data, csrf: req.csrfToken() });
    }

    function save(req, res, next) {
        var data = {
            accessKey: req.body.accessKey || '',
            secretKey: req.body.secretKey || '',
            bucket: req.body.bucket || '',
            origin: req.body.origin || ''
        };

        db.setObject('nodebb-plugin-qn', data, function(err) {
            if (err) {
                return next(err);
            }

            settings.accessKey = data.accessKey;
            settings.secretKey = data.secretKey;
            settings.bucket = data.bucket;
            settings.origin = data.origin;
            reconstructQN();
            res.status(200).json({ message: 'Settings saved!' });
        });
    }

    qn.upload = function(data, callback) {

        if (!settings.accessKey) {
            return callback(new Error('invalid qiniu accessKey'));
        }

        var image = data.image;
        if (!image) {
            return callback(new Error('invalid image'));
        }

        var type = image.url ? 'url' : 'file';
        if (type === 'file' && !image.path) {
            return callback(new Error('invalid image path'));
        }

        if (type === 'file') {
            qnClient.uploadFile(image.path, function(err, result) {
                if (err) {
                    winston.error(err);
                    callback(new Error('Qiniu Upload failure.'))
                } else {
                    return callback(null, {
                        name: image.name,
                        url: "http://" + result.url
                    });
                }
            });
        } else if (type === 'url') {
            qnClient.upload(image.url, function(err, result) {
                if (err) {
                    winston.error(err);
                    callback(new Error('Qiniu Upload failure.'))
                } else {
                    return callback(null, {
                        name: image.name,
                        url: result.url.replace('http:', 'https:')
                    });
                }
            });
        } else {
            return callback(new Error('unknown-type'));
        }
    }

    var admin = {};

    admin.menu = function(menu, callback) {
        menu.plugins.push({
            route: '/plugins/qn',
            icon: 'fa-cloud-upload',
            name: 'Qiniu'
        });

        callback(null, menu);
    };


    qn.admin = admin;

}(module.exports));
