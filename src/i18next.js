// i18next, v1.8.1
// Copyright (c)2015 Jan Mühlemann (jamuhl).
// Distributed under MIT license
// http://i18next.com
(function(root) {

    var defaults = {
        keyseparator: '.',
        lng: 'en-US',
        fallbackLng: ['dev'],
        ns: {
            namespaces: ['translation'],
            defaultNs: 'translation'
        },
        useLocalStorage: false
    };

    function Translator(options) {

        var self = this;

        options = options || {};

        this.options = {};
        this._onready = [];

        this.options = i18n.functions.extend(i18n.functions.extend({}, defaults), options);
        if (typeof this.options.fallbackLng === 'string') {
            this.options.fallbackLng = [this.options.fallbackLng];
        }
        if (typeof this.options.ns === 'string') {
            this.options.ns = {
                namespaces: [this.options.ns],
                defaultNs: this.options.ns
            };
        }
        this.lng(this.options.lng);

        if (this.options.resStore) {
            this.resStore = this.options.resStore;
            this._ready();
        } else {
            sync.load(i18n.functions.toLanguages(this.lng(), this.options), this.options, function (err, store) {
                self.resStore = store;
                self._ready();
            });
        }
    }

    Translator.prototype.ready = function (fn) {
        if (this._initialized) {
            fn();
        } else {
            this._onready.push(fn);
        }
    };

    Translator.prototype._ready = function () {
        this._initialized = true;
        var fn;
        while (fn = this._onready.shift()) {
            if (typeof fn === 'function') {
                fn();
            }
        }
    };

    Translator.prototype.translate = function (key, options) {
        options = options || {};
        options.lng = options.lng || i18n.functions.toLanguages(this.lng(), this.options);

        if (typeof options.lng === 'string') {
            options.lng = [options.lng];
        }

        var parts = key.split(this.options.keyseparator),
            lng = this.resStore[options.lng[0]][this.options.ns.defaultNs] || {},
            slug;

        while (slug = parts.shift()) {
            lng = lng ? lng[slug] : null;
        }

        if (lng) {
            return lng;
        } else if (options.lng.length > 1) {
            options.lng.shift();
            return this.translate(key, options);
        } else {
            return key;
        }
    };
    Translator.prototype.t = Translator.prototype.translate;

    Translator.prototype.lng = function (lng) {
        if (lng) {
            this._lng = lng;
        }
        return this._lng;
    };

    var i18n = {
        init: function (options, callback) {
            var translator = new Translator(options);
            i18n.t = function () {
                return translator.t.apply(translator, arguments);
            };
            translator.ready(callback);
            return translator;
        },
        functions: {
            extend: $.extend,
            each: $.each,
            ajax: $.ajax,
            regexEscape: function(str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            },
            regexReplacementEscape: function(strOrFn) {
                if (typeof strOrFn === 'string') {
                    return strOrFn.replace(/\$/g, "$$$$");
                } else {
                    return strOrFn;
                }
            },
            log: function () {},
            getCountyIndexOfLng: function(lng) {
                var lng_index = 0;
                if (lng === 'nb-NO' || lng === 'nn-NO' || lng === 'nb-no' || lng === 'nn-no') lng_index = 1;
                return lng_index;
            },
            toLanguages: function(lng, o) {
                function applyCase(l) {
                    var ret = l;

                    if (typeof l === 'string' && l.indexOf('-') > -1) {
                        var parts = l.split('-');

                        ret = o.lowerCaseLng ?
                            parts[0].toLowerCase() +  '-' + parts[1].toLowerCase() :
                            parts[0].toLowerCase() +  '-' + parts[1].toUpperCase();
                    } else {
                        ret = o.lowerCaseLng ? l.toLowerCase() : l;
                    }

                    return ret;
                }

                var languages = [];
                var whitelist = o.lngWhitelist || false;
                var addLanguage = function(language){
                  //reject langs not whitelisted
                  if(!whitelist || whitelist.indexOf(language) > -1){
                    languages.push(language);
                  }else{
                    log('rejecting non-whitelisted language: ' + language);
                  }
                };
                if (typeof lng === 'string' && lng.indexOf('-') > -1) {
                    var parts = lng.split('-');

                    if (o.load !== 'unspecific') addLanguage(applyCase(lng));
                    if (o.load !== 'current') addLanguage(applyCase(parts[this.getCountyIndexOfLng(lng)]));
                } else {
                    addLanguage(applyCase(lng));
                }

                for (var i = 0; i < o.fallbackLng.length; i++) {
                    if (languages.indexOf(o.fallbackLng[i]) === -1 && o.fallbackLng[i]) languages.push(applyCase(o.fallbackLng[i]));
                }
                return languages;
            }
        }
    };

    var sync = {

        load: function(lngs, options, cb) {
            if (options.useLocalStorage) {
                sync._loadLocal(lngs, options, function(err, store) {
                    var missingLngs = [];
                    for (var i = 0, len = lngs.length; i < len; i++) {
                        if (!store[lngs[i]]) missingLngs.push(lngs[i]);
                    }

                    if (missingLngs.length > 0) {
                        sync._fetch(missingLngs, options, function(err, fetched) {
                            i18n.functions.extend(store, fetched);
                            sync._storeLocal(fetched);

                            cb(null, store);
                        });
                    } else {
                        cb(null, store);
                    }
                });
            } else {
                sync._fetch(lngs, options, function(err, store){
                    cb(null, store);
                });
            }
        },

        _loadLocal: function(lngs, options, cb) {
            var store = {}
              , nowMS = new Date().getTime();

            if(window.localStorage) {

                var todo = lngs.length;

                i18n.functions.each(lngs, function(key, lng) {
                    var local = i18n.functions.localStorage.getItem('res_' + lng);

                    if (local) {
                        local = JSON.parse(local);

                        if (local.i18nStamp && local.i18nStamp + options.localStorageExpirationTime > nowMS) {
                            store[lng] = local;
                        }
                    }

                    todo--; // wait for all done befor callback
                    if (todo === 0) cb(null, store);
                });
            }
        },

        _storeLocal: function(store) {
            if(window.localStorage) {
                for (var m in store) {
                    store[m].i18nStamp = new Date().getTime();
                    i18n.functions.localStorage.setItem('res_' + m, JSON.stringify(store[m]));
                }
            }
            return;
        },

        _fetch: function(lngs, options, cb) {
            var ns = options.ns
              , store = {};

            if (!options.dynamicLoad) {
                var todo = ns.namespaces.length * lngs.length
                  , errors;

                // load each file individual
                i18n.functions.each(ns.namespaces, function(nsIndex, nsValue) {
                    i18n.functions.each(lngs, function(lngIndex, lngValue) {

                        // Call this once our translation has returned.
                        var loadComplete = function(err, data) {
                            if (err) {
                                errors = errors || [];
                                errors.push(err);
                            }
                            store[lngValue] = store[lngValue] || {};
                            store[lngValue][nsValue] = data;

                            todo--; // wait for all done befor callback
                            if (todo === 0) cb(errors, store);
                        };

                        if(typeof options.customLoad == 'function'){
                            // Use the specified custom callback.
                            options.customLoad(lngValue, nsValue, options, loadComplete);
                        } else {
                            //~ // Use our inbuilt sync.
                            sync._fetchOne(lngValue, nsValue, options, loadComplete);
                        }
                    });
                });
            } else {
                // Call this once our translation has returned.
                var loadComplete = function(err, data) {
                    cb(null, data);
                };

                if(typeof options.customLoad == 'function'){
                    // Use the specified custom callback.
                    options.customLoad(lngs, ns.namespaces, options, loadComplete);
                } else {
                    var url = applyReplacement(options.resGetPath, { lng: lngs.join('+'), ns: ns.namespaces.join('+') });
                    // load all needed stuff once
                    i18n.functions.ajax({
                        url: url,
                        success: function(data, status, xhr) {
                            i18n.functions.log('loaded: ' + url);
                            loadComplete(null, data);
                        },
                        error : function(xhr, status, error) {
                            i18n.functions.log('failed loading: ' + url);
                            loadComplete('failed loading resource.json error: ' + error);
                        },
                        dataType: "json",
                        async : options.getAsync
                    });
                }
            }
        },

        _fetchOne: function(lng, ns, options, done) {
            var url = applyReplacement(options.resGetPath, { lng: lng, ns: ns });
            i18n.functions.ajax({
                url: url,
                success: function(data, status, xhr) {
                    i18n.functions.log('loaded: ' + url);
                    done(null, data);
                },
                error : function(xhr, status, error) {
                    if ((status && status == 200) || (xhr && xhr.status && xhr.status == 200)) {
                        // file loaded but invalid json, stop waste time !
                        i18n.functions.error('There is a typo in: ' + url);
                    } else if ((status && status == 404) || (xhr && xhr.status && xhr.status == 404)) {
                        i18n.functions.log('Does not exist: ' + url);
                    } else {
                        var theStatus = status ? status : ((xhr && xhr.status) ? xhr.status : null);
                        i18n.functions.log(theStatus + ' when loading ' + url);
                    }

                    done(error, {});
                },
                dataType: "json",
                async : options.getAsync
            });
        }

    };

    function applyReplacement(str, replacementHash, nestedKey, options) {
        if (!str) return str;

        options = options || replacementHash; // first call uses replacement hash combined with options
        if (str.indexOf(options.interpolationPrefix || '__') < 0) return str;

        var prefix = options.interpolationPrefix ? i18n.functions.regexEscape(options.interpolationPrefix) : '__',
            suffix = options.interpolationSuffix ? i18n.functions.regexEscape(options.interpolationSuffix) : '__',
            unEscapingSuffix = 'HTML'+suffix;

        var hash = replacementHash.replace && typeof replacementHash.replace === 'object' ? replacementHash.replace : replacementHash;
        i18n.functions.each(hash, function(key, value) {
            var nextKey = nestedKey ? nestedKey + defaults.keyseparator + key : key;
            if (typeof value === 'object' && value !== null) {
                str = applyReplacement(str, value, nextKey, options);
            } else {
                if (options.escapeInterpolation || defaults.escapeInterpolation) {
                    str = str.replace(new RegExp([prefix, nextKey, unEscapingSuffix].join(''), 'g'), i18n.functions.regexReplacementEscape(value));
                    str = str.replace(new RegExp([prefix, nextKey, suffix].join(''), 'g'), i18n.functions.regexReplacementEscape(i18n.functions.escape(value)));
                } else {
                    str = str.replace(new RegExp([prefix, nextKey, suffix].join(''), 'g'), i18n.functions.regexReplacementEscape(value));
                }
                // str = options.escapeInterpolation;
            }
        });
        return str;
    }

    // Export the i18next object for **CommonJS**.
    // If we're not in CommonJS, add `i18n` to the
    // global object or to jquery.
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = i18n;
    } else {
        if ($) {
            $.i18n = $.i18n || i18n;
        }

        root.i18n = root.i18n || i18n;
    }


})(typeof exports === 'undefined' ? window : exports);