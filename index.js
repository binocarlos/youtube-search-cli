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
	var looplimit = 500;

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

	function getSearchUrl(pagetoken, count, publishedBefore){
		count = count || 50;

		var query = Object.keys(params || {}).map(function(p){
			return p + '=' + params[p];
		}).concat(['maxResults=' + count])

		if(pagetoken){
			query.push('pageToken=' + pagetoken);
		}

		if(publishedBefore){
			query.push('publishedBefore=' + publishedBefore);
		}

		var url = 'https://www.googleapis.com/youtube/v3/search?' + query.join('&')

		return url;
	}

	function run_search(pagetoken, count, publishedBefore){
		var url = getSearchUrl(pagetoken, count, publishedBefore);

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

		var videocount = 0;
		var pagecount = 0;

		function next_page(pagetoken, publishedBefore){
			var next_token = null;
			var next_published = null;

			

			var useperpage = perpage;

			if(videocount+perpage>max){
				useperpage = max - videocount;
			}

			var pagevideos = run_search(pagetoken, useperpage, publishedBefore);

			var lastpublished = null;

			var logger = eventStream.mapSync(function (data) {
				api.emit('video', data);
				next_published = data.snippet.publishedAt;
		    return data;
		  })

			pagevideos.on('pagetoken', function(token){
				next_token = token;
			})

			pagevideos.on('end', function(){
				var runnext = true;

				videocount += useperpage;
				
				api.emit('page', pagecount, videocount, pagetoken);

				if(max && videocount>=max){
					runnext = false;
				}
				
				if(!next_token){
					runnext = false;
				}

				if(runnext){
					pagecount++;
					next_page(next_token, next_published);
				}
				else{
					if(!next_token){
						if(videocount<max){
							next_page(null, next_published);
						}
						else{
							done();
						}
					}
					else{
						done();	
					}
				}
				
			})

			pagevideos.pipe(logger);
		}

		next_page();
	}

	function run_query(done){
		run_total(function(error, total){
			run_pages(done);
		})
	}

	api.query = run_query;
	api.total = run_total;

	return api;
}