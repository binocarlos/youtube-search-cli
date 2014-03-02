var hyperquest = require('hyperquest');
var JSONStream = require('JSONStream');
var eventStream = require('event-stream');
var concat = require('concat-stream');
var through = require('through');
var EventEmitter = require('events').EventEmitter;

module.exports = function Bot(options){

	var key = options.key;
	var search = options.search;
	var max = parseInt(options.max || 10);
	var perpage = 50;

	if(isNaN(max)){
		max = 10;
	}

	var params = {
		type:'video',
		part:'snippet',
		order:'date',
		q:encodeURIComponent(search),
		key:key
	}

	var api = new EventEmitter();

	function getSearchUrl(pagetoken, count){
		count = count || 50;

		var query = Object.keys(params || {}).map(function(p){
			return p + '=' + params[p];
		}).concat(['maxResults=' + count])

		if(pagetoken){
			query.push('pageToken=' + pagetoken);
		}

		var url = 'https://www.googleapis.com/youtube/v3/search?' + query.join('&')

		return url;
	}

	function run_search(pagetoken, count){
		var url = getSearchUrl(pagetoken, count);

		var req = hyperquest(url);
		var json = JSONStream.parse('items.*');

		json.on('root', function(root, count) {
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

	function run_pages(done){

		var pagecount = 0;
		var totalpages = 0;

		function next_page(pagetoken){
			var next_token = null;

			var nextpage = pagecount + perpage;
			var nextperpage = perpage;
			
			if(nextpage>=max){
				nextperpage = max - pagecount;
				nextpage = max;
			}

			api.emit('page', totalpages, pagetoken);

			var pagevideos = run_search(pagetoken, nextperpage);

			var logger = eventStream.mapSync(function (data) {
				api.emit('video', data);
		    return data;
		  })

			pagevideos.on('pagetoken', function(token){
				next_token = token;
			})

			pagevideos.on('end', function(){
				var runnext = true;

				pagecount = nextpage;

				if(max && pagecount>=max){
					runnext = false;
				}
				
				if(!next_token){
					runnext = false;
				}

				if(runnext){
					totalpages++;
					next_page(next_token);
				}
				else{
					done();
				}
				
			})

			pagevideos.pipe(logger);
		}

		next_page();
	}

	function run_query(done){
		run_total(function(error, total){
			console.log('-------------------------------------------');
			console.dir(total);
			process.exit();
		})
	}

	api.query = run_query;
	api.total = run_total;

	return api;
}