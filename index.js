var     express	= require('express')
    ,   MultiParser = require('./multiparser')
    ,   sys		= require('sys')
    ,   crypto  = require('crypto')
	,   cluster = require('cluster')
	,   http    = require('http')
	;

var app = express.createServer();

app.configure(function()
{
    app.use(MultiParser());
    //app.use(express.logger('\x1b[33m:method\x1b[0m \x1b[32m:url\x1b[0m :response-time'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    //app.use(express.cookieParser());
    //app.use(express.session({ secret: 'keyboard cat' }));
    app.use(express.static(__dirname + '/public'));
    //app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

var nMemcached = require( 'nMemcached' ),
	memcached,
	localcache = {}
	;

global.jade = require('jade');

app.set('view engine', 'jade');
app.enable('view cache');

global.template = {
	locals: {
		title: 'Сохранялка от Rpsl',
		content: 'default content'
	},
	cache: true
}

// Выяснить как лучше, делать коннект тут или мб деражать его постоянно ?
memcached = new nMemcached('127.0.0.1:11211');

memcached.connect( '127.0.0.1:11212', function( err, conn ){
	if( err ) throw new Error( err );
});

var my = require( __dirname + '/my_func.js');

app.get('/', function( req, res ){
	p = { locals: { random: Math.random() } };
	my.re( 'index', p, res );
});

app.get('/public/*', function( req, res, next ){
	var file = req.params.file,
		path = __dirname + req.originalUrl
		;

	res.download( path, function( err ){
		if( err ) return next(err);

		console.log('transfered %s', path);
	});
});

app.post('/upload', function(req, res)
{
    var upload = {};
    var date = new Date;
    var unixtime_ms = date.getTime(); // Returns milliseconds since the epoch

    upload.content  = req.body.r_content;
    upload.url      = req.body.r_url;
    upload.type     = req.body.r_type;

    upload.time     = parseInt(unixtime_ms / 1000);
    upload.hash     = crypto.createHash('md5').update( upload.time + upload.url ).digest('hex');

	upload = my.normalize( upload );

    memcached.set( upload.hash, upload , 10000, function( err, result ){
        if( err ) console.error( err );

	    if( result )
        {
            res.redirect('/hash/' + upload.hash  );
        }
        else
        {
            // TODO ???? show error ?
            console.log( 123 );
        }
    });
});

app.get('/hash/:hash', function( req, res )
{
	if( localcache[ req.params['hash'] ] )
    {
        res.send( localcache[ req.params['hash'] ] );
    }
    else
    {
        memcached.get( req.params['hash'], function( err, result )
        {
            if( err ) console.error( err );
	        if( !result.content )
	        {
		        res.send('nope');
		        return;
	        }

            // localcache[ req.params['hash'] ] = result.content ;

	        res.send( result.content );

        });
    }
});

app.get('*', function( req, res )
{
    var fs = require('fs');
    var txt = 'ERROR - ' + new Date().toString() + ' - ' + req.url + "\n";

    fs.open( __dirname + '/logs/error_request.txt', 'a', 666, function( e, id ) {
        fs.write( id, txt.toString(), null, 'utf8', function(){
            fs.close(id, function(){} );
        });
    });

    res.send('404', 404);

});

app.listen(80);

/*
cluster(app)
  .set('workers', 4)
  .use(cluster.debug())
  .listen(80);
*/
