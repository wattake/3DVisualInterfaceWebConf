'use strict';
var express = require('express');
const { get } = require('./users');
var router = express.Router();


var getData = function () {
    var data = {
        'item1': 'https://images.unsplash.com/photo-1563422156298-c778a278f9a5',
        'item2': 'https://images.unsplash.com/photo-1620173834206-c029bf322dba',
        'item3': 'https://images.unsplash.com/photo-1602491673980-73aa38de027a'
    }
    return data;
}

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Express', "data": getData() });
});

module.exports = router;
