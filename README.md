youtube-search-cli
==================

CLI script that searches the [youtube api v3](https://developers.google.com/youtube/v3/)

youtube limits a single page of results to 50 and a single search to 500 results.

this module will repeatedly query the api over different time periods to build up a full list of results for a given search topic.

## install

```
$ npm install youtube-search-cli -g
```

## usage

```
Usage: youtube-search-cli
Options:
    -s, --search  Search String  [required]
    -k, --key     API Key        [required]
    -t, --total   Print Total dont search
    -m, --max     Max results
```

## output

The results are streamed the stdout:

```json
{
	"count":5439,
	"results":[{
		
	},{
		
	}]
}
```

You can use [JSONStream](https://github.com/dominictarr/JSONStream) to process the results into your own fashion.

## API

You can use this module in your node app also.

```js
var youtube = require('youtube-search-cli');

var bot = Bot({
	search:'Castle Coombe',
	key:'...',
	max:5000
});

// get the full total for the search
bot.total(function(error, total){

})

// run the search
bot.query(function(video){
	// each video is streamed to here
})
```

## license

MIT