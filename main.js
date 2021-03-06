//main.js


/*
 * ================================================================================
 *                                                                                *
 * This is the file that Node reads first. It sets up Express, Handlebars, Mongo, *
 * session cookies, and some tools for asynchronous programming.                  *
 *                                                                                *
 * Express:                                                                       *
 *     HTTP server which allows us to set up some HTTP endpoints with some        *
 *     middleware                                                                 *
 *                                                                                *
 * Handlebars:                                                                    *
 *     Templating engine. .hbs files are html with logic contained in curly       *
 *     braces. We compile them to html on the server using the expres-handlebars  *
 *     npm package.                                                               *
 *                                                                                *
 * Mongo:                                                                         *
 *     No-SQL database, holds data in JSON-like format (we interact with it using *
 *     JSON                                                                       *
 *                                                                                *
 * Session cookies:                                                               *
 *     Sessions are taken care of by the client-sessions package; the session     *
 *     cookie is encrypted with SECRET_KEY , defined below.                       *
 *                                                                                *
 * Async package:                                                                 *
 *     Tools for asynchronous programming,                                        *
 *     see https://caolan.github.io/async/docs.                                   *
 * ================================================================================
 * */




// The port that the server runs on, stored in config.js
const PORT = require('./config.js').portnumber;

// ### SETUP

var express    = require('express');            // HTTP/ routing/ web server
var exphbs     = require('express-handlebars'); // lets us use res.render to render our hbs templates
var mongodb    = require('mongodb');            // NoSQL database (JSON-like)
var bodyParser = require('body-parser');        // for parsing data from client
var session    = require('client-sessions');    // cookies/ user accounts
var as         = require('async');              // makes asynchronous code less of a pain

// secret key for encrypting cookies
const SECRET_KEY = "CGgnvg2$zc#!Kz2EVh8GZTkNpaxj!5HE";

// Create Handlebars object
var hbs = exphbs.create
({
    // Some helpers we can use in our .hbs templates
    helpers:
    {
        sep: function()
        {
            return "&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;";
        },
        // Handlebars switch statement, see
        // http://chrismontrois.net/2016/01/30/handlebars-switch/
        switch : function(value, options)
        {
            this._switch_value_ = value;
            var html = options.fn(this); // Process the body of the switch block
            delete this._switch_value_;
            return html;
        },
        case : function(value, options)
        {
            if (value == this._switch_value_)
                return options.fn(this);
        },
        // Handlebars comparison helper, for equality, inequality, less than, gt, etc. see
        // http://doginthehat.com.au/2012/02/comparison-block-helper-for-handlebars-templates/#comment-44
        compare: function (lvalue, operator, rvalue, options)
        {
            var operators, result;

            if (arguments.length < 3)
            {
                throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
            }

            if (options === undefined)
            {
                options  = rvalue;
                rvalue   = operator;
                operator = "===";
            }

            operators =
            {
                '=='     : function (l, r) { return l == r; },
                '==='    : function (l, r) { return l === r; },
                '!='     : function (l, r) { return l != r; },
                '!=='    : function (l, r) { return l !== r; },
                '<'      : function (l, r) { return l < r; },
                '>'      : function (l, r) { return l > r; },
                '<='     : function (l, r) { return l <= r; },
                '>='     : function (l, r) { return l >= r; },
                'typeof' : function (l, r) { return typeof l == r; }
            };

            if (!operators[operator])
            {
                throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
            }

            result = operators[operator](lvalue, rvalue);

            if (result) {return options.fn(this);}
            else        {return options.inverse(this);}
        },
        // convert unix timestamp to datetime string
        time : function(value, options)
        {
            var a = (new Date(value) + "").split(" ");
            var t = a[4].split(":");
            return a[0] + ", " + a[1] + " " + a[2] + ", " +  a[3] + " at " + ((t[0]==0)?12:t[0]%12) + ":" + t[1] + " " + ((t[0]/12)?"pm":"am");
        }
    },
    defaultLayout: 'main', // sets which layout will be used by default, in our case it's main.hbs
    extname: '.hbs', // retain some sanity by keeping the file extensions short on our Handlebars templates
    partialsDir: ['views/partials/']
});

// main app object
var app = express();

// tell express that when we say something like 'res.render("page", data);' we mean
// compile 'page.hbs' with 'data' and send it back.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.use(express.static(__dirname + "/resources")); // all resources in resources folder
app.use(bodyParser()); // so we can parse data from client using req.body


// ### MONGO INIT

var db = {};

// Connect to the database and add the collections to our local object
mongodb.connect('mongodb://localhost:27017/roots', function(error, database)
{
    if(error)
    {
        console.log('Error connecting to MongoDB\n');
    }

    db.users = database.collection('users');
    db.posts = database.collection('posts');

    console.log("Connected to database");

    process.on('SIGTERM', function()
    {
        console.log("Shutting Roots server on port " + PORT + " down.");
        database.close();
        app.close();
    });
});

// ### COOKIES

app.use
(
    session
    ({
      cookieName: 'session',
      secret: SECRET_KEY,
      duration: 5 * 60 * 60 * 1000,      // 5 hours
      activeDuration: 1 * 60 * 60 * 1000 // 1 hour
    })
);

// ### MIDDLEWARE

app.use(function (req, res, next)
{
    // If there's a user logged in, find them in the database and set
    // req.user to them so we can access their info
    if (req.session && req.session.user)
    {
        db.users.findOne({username: req.session.user.username}, function(err, user)
        {
            if(user)
            {
                if(!user.cookie)
                {
                    // keep cookie small by only using username
                    user.cookie =
                    {
                        username : user.username
                    };
                }

                req.user = user;
                req.session.user = user.cookie; // refresh
            }
            next();
        });
    }
    else next();
});

// ### ROUTES (exported)

require('./routes.js')(app, db);

// ### API (exported)

require('./api.js')(app, db);

// ### 404 AND LISTEN

// this is what will happen if someone tries to access a resource that doesn't exist (send HTTP 404)
app.use(function(req, res)
{
    res.status(404);
    return res.send("<h1>404 - Page not found</h1> <br> Sorry, that address doesn't exist");
});

// Start it up, output confirmation that we are listening on the port specified in config.js
var server = app.listen(PORT, function()
{
    console.log('Listening on port %d', server.address().port);
});

