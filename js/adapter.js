
/**
 * DataAdapter 是一组数据集的抽象，封装了缓存策略和读写相关切面
 */
(function(){

    function DataAdapter(provider, cache){
        this.provider = provider;
        this.cache = cache;     
    }

    DataAdapter.prototype = {
        /**
         * 更新数据
         * @param params 控制参数
         * @param callback 完成后的回调
         * @param cache_opt 缓存选项 1: 立即刷新， 2: 静默刷新 
         */
        update: function(params, callback, cache_opt, expires){         
            if(typeof params == 'function'){
                expires = cache_opt;
                cache_opt = callback;
                callback = params;
                params = {};
            }

            var provider = this.provider,
                cache = this.cache,
                result;

            //如果缓存策略需要立即刷新，那么刷新缓存
            if(cache && DataCache.FLUSH == cache_opt){  
                cache.flush();
            }

            //先尝试从缓存获取数据
            result = cache && cache.get();

            //如果需要静默刷新
            if(cache && DataCache.QUITE == cache_opt){
                //cache.flush();    //先清空缓存，再将数据获取并存在缓存中
                provider.get(params, function(data){
                    cache.set(data, expires);
                });         
            }

            if(result == null){
                provider.get(params, function(data){                        
                    cache && cache.set(data, expires);              
                    callback(data);             
                });
            }else{              
                callback(result);
            }           
        }
    };

    window.DataAdapter = DataAdapter;
})();