(function(){
    //require CacheSVC
    /**
    * 封装appData对象，datacache也依赖用这个对象
    */
    function AppData(namespace, signature, storeObj){
        this.storage = CacheSVC.ins(namespace, storeObj);
        this.signature = signature; //签名，签名需要一致才判断为storage有效
        this.lastUpdate = null;
        this.dataFormatter = {getter:null, setter:null};
    }

    AppData.clear = function(namespace){
        CacheSVC.ins(namespace).clear();
    }

    AppData.prototype = {
        setFormatter: function(setter, getter){
            this.dataFormatter = {
                setter: setter,
                getter: getter
            }
        },
        set: function(key, data, expires){
            if(this.dataFormatter && this.dataFormatter.setter){
                data = this.dataFormatter.setter(data);
            }
            this.lastUpdate = (new Date()).getTime();
            var storage = {
                value: data,
                signature: this.signature,
                lastUpdate : this.lastUpdate
            }
            if(expires){
                storage.expires = expires;
            }
            this.storage.set(key, storage);         
        },
        get: function(key, ignoreExpires){
            var data = this.storage.get(key);
            if(data && data.signature === this.signature && (ignoreExpires || !data.expires || (new Date()).getTime() < data.expires)){ 
                data = data.value;

                if(this.dataFormatter && this.dataFormatter.getter){
                    data = this.dataFormatter.getter(data);
                }
                return data;
            }
        },
        remove: function(key){
            this.storage.remove(key);
        },
        clear: function(){
            this.storage.clear();
        },
        getUpdatedTime : function(key){
            var data = this.storage.get(key);
            return data && (data.lastUpdate - 0);
        },
        getExpires : function(key){
            var data = this.storage.get(key);
            return data && data.expires;
        }
    };

    window.AppData = AppData;
})();