var hyperquest = require('hyperquest');
var JSONStream = require('JSONStream');
var eventStream = require('event-stream');
var concat = require('concat-stream');
var through = require('through');

module.exports = function Bot(options){

	var key = options.key;
	var search = options.search;
	var max = options.max;

	function getSearchUrl(pagetoken, count){
		count = count || 50;
		var url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=' + count + '&order=date&q=' + encodeURIComponent(search) + '&key=' + key;

		if(pagetoken){
			url += '&pageToken=' + pagetoken;
		}

		return url;
	}

	function run_search(pagetoken){
		var url = getSearchUrl(pagetoken);

		var req = hyperquest(url);
		var json = JSONStream.parse('items.*');

		json.on('root', function(root, count) {
			console.dir(root);
			console.dir(count);
		  if (count) {
	    	json.emit('pagetoken', root.nextPageToken);
		  }
		})

		return req.pipe(json);
	}

	function run_total(done){
		var url = getSearchUrl(null, 1);

		var req = hyperquest(url);

		var buffer = concat(function(data){
			data = JSON.parse(data.toString());
			done(null, data.pageInfo.totalResults);			
		})

		req.pipe(buffer);
	}

	function run_pages(videofn, done){

		var pagecount = 0;

		function next_page(pagetoken){
			var next_token = null;
			var pagevideos = run_search(pagetoken);

			var logger = eventStream.mapSync(function (data) {
				videofn(data);
		    return data;
		  })

			pagevideos.on('pagetoken', function(token){
				next_token = token;
			})

			pagevideos.on('end', function(){
				pagecount+=50;

				var runnext = true;

				if(max && pagecount>=max){
					runnext = false;
				}

				if(!next_token){
					runnext = false;
				}

				if(runnext){
					next_page(next_token);
				}
				else{
					console.log('-------------------------------------------');
					console.log(pagecount);
					done();
				}
				
			})

			pagevideos.pipe(logger);
		}

		next_page();
	}

	return {
		pages:run_pages,
		total:run_total
	}
}