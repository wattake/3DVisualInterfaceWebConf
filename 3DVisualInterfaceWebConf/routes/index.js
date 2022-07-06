'use strict';
var express = require('express');
const { get } = require('./users');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: '3D Visual Interface'});
});

module.exports = router;

