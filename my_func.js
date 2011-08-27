exports.re = function( tpl, params, res )
{
	params = MergeRecursive( template, params );
	jade.renderFile( __dirname + '/template/'+ tpl +'.jade', params , function( err, html )
	{
		if( !err )
		{
			res.send( html );

		}
		else
		{
			console.log( err );
		}
	});
};

function MergeRecursive(obj1, obj2) {

  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if ( obj2[p].constructor==Object ) {
        obj1[p] = MergeRecursive(obj1[p], obj2[p]);

      } else {
        obj1[p] = obj2[p];

      }

    } catch(e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];

    }
  }

  return obj1;
}

exports.normalize = function( object )
{
	//console.log( content );

	object.content = object.content.replace('<head>', '<head><base href="'+ object.url +'" />');


	return object;
}
