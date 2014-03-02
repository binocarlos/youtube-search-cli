#!/usr/bin/env node
var argv = require('optimist').argv;
var Bot = require('./index');
var eventStream = require('event-stream');
var search = argv.search || argv.s;
var key = argv.key || argv.k || process.env.YOUTUBE_SEARCH_KEY;
var max = argv.max || argv.m || 10;
var total = argv.total || argv.t;
var api = 'https://www.googleapis.com/youtube/v3/search?part=snippet';
//https://www.googleapis.com/youtube/v3/search?part=snippet&q=castle&key=AIzaSyB1OOSpTREs85WUMvIgJvLTZKye4BVsoFU
function usage(){
	console.log([
		"",
		"Usage: youtube_search",
		"Options:",
	  "		-s, --search  Search String  [required]",
	  "		-k, --key     API Key        [required]",
	  "		-t, --total   Print Total",
	  "		-m, --max     Max results",
	  "",
  ].join("\n"))
}

if(!key){
	console.error('please provide a key string');
	usage();
	process.exit(1);
}

if(!search){
	console.error('please provide a search string');
	usage();
	process.exit(1);
}

var bot = Bot({
	search:search,
	key:key,
	max:max
});

if(total){
	bot.total(function(error, total){
		if(error){
			console.error(error);
			process.exit(1);
		}
		else{
			console.log(total);
		}
	})
}
else{

	bot.on('video', function(video){
		console.log(JSON.stringify(video));
	})

	bot.on('page', function(page, token){
		//console.log('page: ' + page + ' - ' + token);
	})
	bot.query(function(error){
		process.exit();
	})
}	