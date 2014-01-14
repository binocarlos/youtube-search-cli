#!/usr/bin/env node
var argv = require('optimist').argv;
var youtube  = require('youtube-node');

var search = argv.search || argv.s;
var count = argv.n || argv.num || 10;

function usage(){
	console.log([
		"",
		"Usage: node ./youtube_search.js",
		"Options:",
	  "		-s, --search  Search String  [required]",
	  "		-n, --num     Num results",
	  "",
  ].join("\n"))
}

function getSearchUrl(){
    return api + 'videos?q=' + params['q'] + '&start-index=' + params['start-index'] + '&max-results=' + params['max-results'] + '&v=' + params['v'] + '&alt=' + params['alt'];
}


if(!search){
	console.error('please provide a search string');
	usage();
	process.exit(1);
}

youtube.search(search, count, function(results) {
	console.log(JSON.stringify(results));
});