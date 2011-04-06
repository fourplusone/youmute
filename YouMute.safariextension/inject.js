/*

The MIT License

Copyright (c) 2010 Matthias Bartelmeß

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

Parts from mootools. License see mootools-1.2.4-core-nc.js

*/

(function(){

function contains(a, obj) {
  var i = a.length;
  while (i--) {
    if (a[i] === obj) {
      return true;
    }
  }
  return false;
}

function delayed(fun, delay){
    var called = false;
    var that = this;
    var timer_started = false;
    
    function _run(){
        timer_started = false;
        return fun();
    }
    
    return (function(){ 
        if(!timer_started){
            window.setTimeout(_run, delay);
            timer_started = true;
        }
    });
}

var MediaObserverController = function(){
    
    this.media = new Array();
    this.observers = new Array();
    this.playing = false
    
    var that = this;
    function reloadCb(){
        that.reloadList();
    }
    function unload(){
        safari.self.tab.dispatchMessage("resume");        
    }
    
    document.addEventListener("DOMNodeInserted", delayed(reloadCb, 1000), false);
    window.addEventListener("beforeunload", unload, true);
    this.reloadList();
}

MediaObserverController.prototype.reloadList = function(){
    console.log("reloading list"); 
    var videos = document.getElementsByTagName('video');
    var audios = document.getElementsByTagName('audio');
    
    var medias = [].concat(videos,audios);
    
    for (var i = 0, l = videos.length; i < l; i++){ 
        var v = videos[i];
        if(!contains(this.media, v)){
            this.media.push(v);
            var observer = new HTMLMediaObserver(this, v);
            this.observers.push(observer);
            console.log('added ' + v);
        }
        
    }
};
    
MediaObserverController.prototype.unload = function(){
    if(this.hasActivePlayers()){
        safari.self.tab.dispatchMessage('resume');
        alert('Will now resume');
        
    }
}

MediaObserverController.prototype.hasActivePlayers = function(){
    var l = this.observers.length;
    var has_active_players = false;
    for (var i = 0; i < l; i++){
        if(this.observers[i].playing){
            has_active_players = true;
        }
    }
    return has_active_players;
}
    
MediaObserverController.prototype.mediaPlaystateChanged = function(observer){
        if(observer.playing){
            // Stop iTunes
             safari.self.tab.dispatchMessage("pause");
        }else{
            if (!this.hasActivePlayers()){
                safari.self.tab.dispatchMessage("resume");
            }
            
        }
}

var HTMLMediaObserver = function(controller, element){
    var that = this;
    this.playing = false;
    this.controller = controller;
    
    element.addEventListener('playing', function(){
        that.playing = true;
        that.controller.mediaPlaystateChanged(that);
    });
    element.addEventListener('pause', function(){
        that.playing = false;
        that.controller.mediaPlaystateChanged(that);
    });
    element.addEventListener('ended', function(){
        that.playing = false;
        that.controller.mediaPlaystateChanged(that);
    });
}



var PageScriptProxy = function(){
    var that = this;
    var msgContainer = document.createElement('div');
    this.proxyID = "__FOURPROXY" + PageScriptProxy.uid++;
    msgContainer.id =  this.proxyID;
    msgContainer.style.display = "none";
    msgContainer.addEventListener('DOMNodeInserted', function(n){
        if(n.relatedNode === msgContainer){
            that.cb(JSON.parse(n.target.textContent));
            msgContainer.removeChild(n.target);
        }
        
    });
    if(document.body){
        document.body.appendChild(msgContainer);
    }
    
}

PageScriptProxy.prototype.cb = function(){};

PageScriptProxy.prototype.getInjectionScript = function(){
    return 'var InjectedScriptProxy = function(){\
        this.element = document.getElementById("' + this.proxyID + '");\
    };\
    InjectedScriptProxy.prototype.sendMsg = function(m){\
        var msgEl = document.createElement("div");\
        msgEl.textContent = JSON.stringify(m);\
        this.element.appendChild(msgEl);\
    };';
}

PageScriptProxy.uid = 0;




var YTObserver = function(controller){
    var proxy = new PageScriptProxy();
    controller.observers.push(this);
    var that = this;
    
    proxy.cb = function(m){
        if(m === "started"){
            that.playing = true;
            controller.mediaPlaystateChanged(that)
        }else{
            that.playing = false;
            controller.mediaPlaystateChanged(that);
        }
    };
    
    var script = '\
    (function(){'+ proxy.getInjectionScript() +'\
        function decorate(name, fn){\
            var _fn = fn;\
            var f = fn;\
            if(window[name] !== undefined){\
                var _previous = window[name];\
                f = function(){\
                   var r = _previous.apply(this,arguments);\
                   var r_overwritten =  fn.apply(this, arguments);\
                   return (r_overwritten !== undefined) ? r_overwritten : r;\
                }\
            }\
            window[name] = f;\
        }\
        var proxy = new InjectedScriptProxy();\
        decorate(\'__FOURYTPLAYSTATECHANGED\', function(newState){\
            if(newState === 1){ proxy.sendMsg("started"); return;}; \
            if(newState !== 3){ proxy.sendMsg("stopped"); return; }; \
        });\
        decorate(\'onYouTubePlayerReady\', function(){var player=document.getElementById(\'movie_player\');if(player!==undefined)player.addEventListener(\'onStateChange\',\'__FOURYTPLAYSTATECHANGED\')});\
    })();\
    ';
    
    var injectedScript = document.createElement('script');
    injectedScript.textContent = script;
    if(document.body){
        document.body.appendChild(injectedScript);
    }
}

var controller = new MediaObserverController();
new YTObserver(controller);


})();