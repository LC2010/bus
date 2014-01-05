var http = require('http');
var querystring = require('querystring');

http.createServer(function (req, res) {
    console.log(querystring.parse(req.url));
    var query = querystring.parse(req.url);
    var api = query['/?api'] || query['/?api[]'];
    var callback = query['_callback'];
    var data = {
        "joke": {
            "data" : {
                "key" : "joke"
            }
        },
        "broadcast" : {
            "data" : {
                "key" : ["one", "two", "three"]
            }
        }
    }
    res.writeHead(200, {'Content-Type': 'application/json'});
    // console.log(api);
    if (api === 'broadcast') {
        var params = query['m[]'] || query['m'];
        if (params) {
            data.broadcast.data.key = "broad";
        }
    }
    res.end(callback + "(" + JSON.stringify(data[api]) + ")");
}).listen(3000);