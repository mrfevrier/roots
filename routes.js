//routes.js

var as    = require('async'); // 'async' is a reserved word now
//var tools = require('./tools.js');

module.exports = function(app, db)
{
    app.get('/', function(req, res)
    {
        res.sendfile("index.html");
    });
};

function requireLogin(req, res, next)
{
    if(!req.user) res.redirect('/');
    else next();
}
