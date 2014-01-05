(function(){

    var mix = qboot.mix;
    
    //require appdata
    function DataCache(key, namespace, signature, storeObj){
        if(namespace instanceof AppData){
            this.appData = namespace;
        }else{
            this.appData = new AppData(namespace, signature, storeObj);
        }
        this.key = key;
    }

    DataCache.prototype = {
        set: function(data, expires){           
            this.appData.set(this.key, data, expires);
        },
        get: function(ignoreExpires){
            return this.appData.get(this.key, ignoreExpires);
        },
        flush: function(){
            this.appData.remove(this.key);
        }
    }

    mix(DataCache, {
        NORMAL: 0x0,
        FLUSH: 0x1,
        QUITE: 0x2
    }); 

    window.DataCache = DataCache;
})();