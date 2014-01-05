/**
 * Bus是管理api和logic的桥梁
 * Bus读取apiconf配置，将logic注册到api对应的配置
 * 根据conf执行对应的初始化操作，并返回供logic调用的接口
 *
 *
 */
(function(){
    var mix = qboot.mix, jsonp = qboot.jsonp;
    
    var default_conf = {
        jsonp: '_callback',
        cluster: false, //是否聚合请求返回
        //host: ...,
        //api: ...,
        //v: ...
        //r: ...
        //filter: function...,
        //setup: function...,       //request 请求结束
        //teardown: function...,    //request 请求发起
        cache: false,  //false 默认不使用cache， true: 使用 cache
        storeObj:null, //null 默认不存在内存缓存中
        appData: 'all'  //公用
    };

    /**
     * 用来合并请求的管理工具
     */
    var ServiceCluster = {
        _requests: {},
        _task: null,
        prepare : function(evt){
            var _requests = this._requests;
            _requests[evt.host] = _requests[evt.host] || [];
            _requests[evt.host].push(evt);

            if(!this._task){
                var self = this;
                this._task = setTimeout(function(){
                    self.send();    //合并发送请求
                });
            }
        },
        send : function(){
            var _requests = this._requests;
            var _toPrepareNext = []; //如果有重复的api请求，不能合并请求，留待下一次再发，否则服务器只会返回一份

            for(var host in _requests){
                var reqlist = _requests[host] || []; //取指定host的一系列request
                var combo_api = [], combo_params = {}, combo_callbacks = {};
                for(var i = 0; i < reqlist.length; i++){

                    var req = reqlist[i];
                    combo_api.push(req.api);        //合并api路径
                    //combo_params['m'].push([req.api, req.v, req.r]); //v-小版本，r-大版本

                    //判断api是否有重复，如果有重复的api的话，重复的留待下一次发送
                    if(!(req.api in combo_callbacks)){
                        mix(combo_params, req.params, function(d,s){
                            if(d == null) d = [];
                            if(!(d instanceof Array)){
                                d = [d];
                            }
                            return d.concat([s]);
                        }); //合并参数  

                        combo_callbacks[req.api] = req.callback; //合并callback
                    }else{
                        //留待下一次
                        _toPrepareNext.push(req);
                    }
                }
                if(combo_api.length){                   
                    (function(host, params, callbacks){
                        jsonp(host, params, function(data){                         
                            for(var i in callbacks){
                                var callback = callbacks[i];                                
                                if(callback && data){                                   
                                    callback(data[i]);  //分发callback
                                }
                            }
                        }, {jsonp: default_conf.jsonp});    //这里不清楚用哪个配置，因此全部忽略，统一用 _callback
                    })(host, combo_params, combo_callbacks);                    
                }
            }
            //删除引用
            delete this._requests;
            this._requests = {};

            clearTimeout(this._task);
            delete this._task;

            while(_toPrepareNext.length){
                this.prepare(_toPrepareNext.shift());
            }
        }
    }  

    var Bus = {
        /**
         * Bus.register将logic注册到apiconf，由apiconf来提供api调用的接口规范
         * setup和teardown可以用来做初始构造或者析构操作
         *
         * @param logic 要注册的logic对象
         * @param apiconf logic对象对应的apiconf配置
         * @param setup 可选的，覆盖掉conf默认的setup
         * @param teardown 可选的，覆盖掉conf默认的teardown
         */
        register : function(logic, conf /*host, api*/){         

            if(conf == null){
                //配置不存在的话，告诉logic出现异常
                throw new Error("call unknown api:" + apiconf);
            }
            if(typeof conf == "string"){
                conf = {
                    host: conf,
                    api: arguments[2]
                }
            }else{
                conf = mix({}, conf); //copy conf
            }

            //合并默认配置
            mix(conf, default_conf);            
            var provider = new JsonpProvider(conf);
            provider.on('request', function(evt){
                var params = evt.params;

                if(evt.api && evt.cluster){
                    mix(evt.params, {m:[evt.api, evt.v, evt.r]});
                }
                if(evt.cluster){
                    ServiceCluster.prepare(evt);
                    evt.preventDefault();
                }
            });
            var cache;
            if(conf.cache){
                cache = new DataCache(conf.api, 'api.hao.360.cn', conf.r,conf.storeObj);
            }
            var adapter = new DataAdapter(provider, cache); 

            logic.request = function(params, callback, cache_opt, expires){
                adapter.update(params, callback, cache_opt, expires);
            }

            logic.getApi = function(){
                return adapter;
            }

            logic.getCache = function(){
                return cache;
            }

            logic.getDataProvider = function(){
                return provider;
            }

            return logic;
        }
    };

    mix(Bus, {CACHE_QUIET: DataCache.QUIET, CACHE_FLUSH: DataCache.FLUSH, CACHE_NORMAL: DataCache.NORMAL});
    window.Bus = Bus;
})();