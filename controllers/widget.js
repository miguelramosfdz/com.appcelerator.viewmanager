var history = [];
var current = -1;
var available = [];
var lastOpen = [];

var isAndroid = (Ti.Platform.osname == "android");

var options = {
    handleBackWin: null
}

/**
 * @method open
 * Hides the current page, opens the new one inside the ViewManager and adds it
 * to the history. If the view doesn't exist already, it is created by calling
 * the load method of the controller.
 * 
 * @param {String} _page The name of the page to open
 */
exports.open = function (_page) {
    var view = null;
    
    var page = Alloy.createController(_page, {
        ViewManager: this
    });
    
    var cacheTime = page.cache || 0;
    
    var forceReload = false;
    if (cacheTime >= 0) {
        var last = lastOpen[_page] || null;
        if (last) {
            if ((_curTime() - last) > (cacheTime * 1000)) {
                Ti.API.info('Page opened ' + (_curTime() - last)/1000 + ' seconds ago: force reload');
                forceReload = true;
            } else {
                Ti.API.info('Caching for other ' + (cacheTime - (_curTime() - last)/1000) + ' seconds...');
            }
        }
    }
    
    if (forceReload || !available[_page]) {
        page.load();
        view = page.getView();
        available[_page] = view;
        $.ViewManagerContainer.add(view);
        
        lastOpen[_page] = _curTime();
    } else {
        view = available[_page];
        Ti.App.fireEvent('ViewManager::ViewLoaded', {
            view: _page
        });
    }
    
    _hide();
    history.push(view);
    _show();
}

/**
 * @method back
 * Closes the current page and opens the previous one.
 * 
 */
exports.back = function () {
    if (history.length > 1) {
        _hide();
        history.pop();
        _show();
    } else if (isAndroid && options.handleBackWin) {
        handleBackWin.hide();
    }
};

/**
 * @method handleBack
 * Handles the Android back button (Android only)
 * 
 * @param {Ti.UI.Window} _window The window that will listen to the back event
 * @param {Boolean} _handle If true, handles the back button
 * 
 */
exports.handleBack = function (_window, _handle) {
    if (isAndroid && _handle != (options.handleBackWin != null)) {
        if (!_window)
            return;
            
        options.handleBackWin = _handle ? _window : null;
            
        if (_handle) {
            _window.addEventListener('android:back', this.back);
        } else {
            _window.removeEventListener('android:back', this.back);
        }
    }
};

function _hide () {
    if (history.length > 0)
        history[history.length-1].hide();
}

function _show () {
    if (history.length > 0)
        history[history.length-1].show();
}

function _curTime () {
    return (new Date()).getTime();
}
