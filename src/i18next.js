// i18next, v1.8.1
// Copyright (c)2015 Jan Mühlemann (jamuhl).
// Distributed under MIT license
// http://i18next.com
(function(root) {

    var defaults = {
        keyseparator: '.',
        lng: 'en-US',
        fallbackLng: 'dev',
        namespace: 'translation'
    };

    function Translator(options) {
        options = options || {};

        this.options = {};
        i18n.functions.extend(options, defaults);
        i18n.functions.extend(this.options, options);

        if (options.resStore) {
            this.resStore = options.resStore;
        }
        this.lng(this.options.lng);
    }

    Translator.prototype.translate = function (key, options) {
        options = options || {};
        options.lng = options.lng || this.lng();

        var parts = key.split(this.options.keyseparator),
            lng = this.resStore[options.lng][this.options.namespace] || {},
            slug;

        while (slug = parts.shift()) {
            lng = lng ? lng[slug] : null;
        }

        if (!lng || lng === {}) {
            if (options.lng === this.options.fallbackLng) {
                return key;
            } else if (options.lng.indexOf('-') > -1) {
                return this.translate(key, { lng: options.lng.split('-')[0] });
            } else {
                return this.translate(key, { lng: this.options.fallbackLng });
            }
        }

        return lng;
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
            callback(i18n.t);
            return translator;
        },
        functions: {
            extend: $.extend
        }
    };


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