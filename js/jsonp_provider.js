/**
 * Jsonp数据提供类，封装了基本的数据服务
 */
(function(){

    var mix = qboot.mix, 
        createEvents = qboot.createEvents,
        jsonp = qboot.jsonp;

    var default_conf = {
        //host: ...,

        //filter:...,
        //setup:...,
        //request:..., 
        //teardown...,
        
        jsonp: '_callback',
        threshold: 600000,
        timeout:30000
    };  

    function JsonpProvider(conf){
        this.conf = mix(conf, default_conf);        
        createEvents(this);
    }

    JsonpProvider.prototype = {

        addFilter: function(filter){
            this.conf.filter = filter;
        },

        get: function(params, callback){
            if(typeof params == 'function'){
                callback = params;
                params = {};
            }           
            
            var evt = mix({params: params || {}}, this.conf),
                cb = callback, 
                filter = this.conf.filter,
                setup = this.conf.setup,
                teardown = this.conf.teardown,
                self = this;            
            
            if(filter && cb){               
                cb = function(data){
                    data = filter.call(self, data);
                    callback(data);
                }
            }

            mix(evt, {callback:cb})

            //如果有setup，先执行setup，可以在setup中修改evt的各个属性，这样会影响jsonp提交的参数
            if(this.fire('setup', evt)){
                setup && setup(evt);                
            }

            if(this.fire('request', evt)){              
                jsonp(evt.host, evt.params, function(data){                 
                    evt.callback && evt.callback(data);
                }, {
                    jsonp: evt.jsonp,
                    timeout:evt.timeout,
                    threshold:evt.threshold,
                    cb:evt.cb
                });
            }

            //如果有teardown，执行teardown
            if(this.fire('teardown', evt)){
                teardown && teardown(evt);
            }
        }
    }

    window.JsonpProvider = JsonpProvider;

})();