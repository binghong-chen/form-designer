var Tmp;

(function (window, undefined) {

    var changeEvent = 'change';

    //首先要对HTMLElement进行类型检查，因为即使在支持HT MLElement
    //的浏览器中，类型却是有差别的，在Chrome,Opera中HTMLElement的
    //类型为function，此时就不能用它来判断了
    var isDOM = (typeof HTMLElement === 'object') ?
        function (obj) {
            return obj instanceof HTMLElement;
        } :
        function (obj) {
            return obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
        };


    function keys(obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var res = [];
        for (var key in obj) {
            res.push(key.toString());
        }
        return res;
    }

    function values(obj) {
        if (Object.values) {
            return Object.values(obj);
        }
        var res = [];
        for (var key in obj) {
            res.push(obj[key]);
        }
        return res;
    }

    function extend() {
        var array = [];
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof Object)
                array.push(arguments[i]);
        }

        function realExtend(array) {
            if (array.length <= 1) return array[0];
            if (array.length == 2) {
                for (var k in array[1]) {
                    if (array[1].hasOwnProperty(k)) {
                        array[0][k] = array[1][k];
                    }
                }
                return array[0];
            }
            array[array.length - 2] = realExtend([array[array.length - 2], array[array.length - 1]]);
            array.length--;
            return realExtend(array);
        }
        return realExtend(array);
    }

    Tmp = function (cfg) {
        var self = this;

        self.cfg = extend({
            watchMethod: function () {
            }
        }, cfg);
        self.init();
    }

    extend(Tmp.prototype, {
        initEl: function () {
            var self = this;
            self.$el = self.cfg.el;
            if (typeof self.$el === 'string') {
                self.$el = document.querySelector(self.$el);
            }
        },
        init: function () {
            var self = this;

            self.initEl();
            if (!isDOM(self.$el)) return;

            self.template = self.$el.outerHTML;
            self.watching = true;

            self.model = self.cfg.data;
            for (var k in self.cfg.methods) {
                if (typeof self.cfg.methods[k] !== 'function') continue;
                self.model[k] = self.cfg.methods[k];
            }

            if (typeof self.cfg.watchMethod === 'function') {
                bindModelChangeEvent(self.model, function () {
                    self.cfg.watchMethod.call(self);
                    if (self.watching) {
                        self.render();
                    }
                });
            }

            self.render();
        },
        render: function () {
            var self = this;

            var argNames = keys(self.model);
            var argValues = values(self.model);

            // console.log(self.model)

            // var fakeElement = self.fakeElement.cloneNode();
            var parent = document.createElement('div');
            parent.innerHTML = self.template;
            var fakeElement = parent.firstElementChild;


            var code = [];
            code.push("var html = [];\r\n");
            code.push('var self = this;\r\n');
            // code.push('console.log(self.model);\r\n');
            code.push('var argNames = ' + JSON.stringify(argNames) + ';\r\n');
            code.push('var needBindArgNames = {};\r\n')
            code.push('for(var i=0;i<arguments.length;i++){\r\n');
            code.push('if(typeof arguments[i] !== "object"){\r\n');
            code.push('needBindArgNames[argNames[i]] = true;\r\n');
            code.push('}\r\n');
            code.push('}\r\n');

            code.push('var eventMap = {};\r\n');
            code.push('var domEventMap = new Map();\r\n');
            getCode(fakeElement, code);

            code.push('self.initEl();\r\n');
            code.push('self.$el.outerHTML = html.join("");\r\n');

            // code.push('console.log(html.join(""));\r\n');
            code.push('var elements = document.querySelectorAll("*[fakeClass=needBindEvent]");\r\n');
            code.push('for(var i=0; i<elements.length; i++) {\r\n');

            code.push('var dom = elements[i];\r\n');

            code.push('var tempId = dom.getAttribute("tempId");\r\n');
            code.push('var events = eventMap[tempId];\r\n');

            code.push('if(events) {\r\n');

            code.push('for(var eventName in events){\r\n');
            code.push('eventName === "setval" || eventName === "setstyle" || eventName === "setclass" ? events[eventName].apply(dom) : dom.addEventListener(eventName, events[eventName]);\r\n');

            code.push('}//for\r\n');

            code.push('}//if\r\n');

            code.push('dom.removeAttribute("tempId");\r\n');
            code.push('dom.removeAttribute("fakeClass");\r\n');

            code.push('}//for\r\n');


            // code.push('if (typeof self.cfg.mounted === "function") {\r\n');
            // code.push('self.cfg.mounted.call(self);\r\n');
            // code.push('}\r\n');


            var func = new Function(argNames, code.join(''));

            // console.log('function', func);

            func.apply(self, argValues);

            if (typeof self.cfg.mounted === "function") {
                self.cfg.mounted.call(self);
            }
        }
    });

    extend(Tmp, {
        keys: keys,
        values: values,
        toString: toString,
        classValue: function (value) {
            if (value === null || value === undefined) return '';
            var array = [];
            if (value instanceof Array) {
                //return value.join(' '); 
                for (var i = 0; i < value.length; i++) {
                    array.push(Tmp.classValue(value[i]));
                }
                // console.log(array.join(' '))
                return array.join(' ');
            }
            if (value instanceof Object) {
                for (var key in value) {
                    if (value.hasOwnProperty(key)) {
                        if (value[key]) {
                            array.push(key);
                        }
                    }
                }
                return array.join(' ');
            }
            return value.toString();
        },
        styleValue: function (value) {
            if (isPlainObject(value)) return value;
            var res = {};
            if (value instanceof Array) {
                for (var i = 0; i < value.length; i++) {
                    if (isPlainObject(value[i])) {
                        extend(res, value[i]);
                    }
                }
            }
            return res;
        }
    });


    function isPlainObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    }

    function toString(v) {
        return isPlainObject(v) || v instanceof Array ? JSON.stringify(v) : String(v);
    }

    var arrayMethodsMap = new Map();
    var modelSet = new Set();

    function bindModelChangeEvent(model, method) {
        if (modelSet.has(model)) return;
        modelSet.add(model);

        // 不是好方法
        if (model instanceof Array) {
            var last = JSON.stringify(model);
            setInterval(function () {
                var current = JSON.stringify(model);
                if (current != last) {

                    var methods = arrayMethodsMap.get(model) || [];
                    methods.push(method);
                    for (var i = 0; i < methods.length; i++) {
                        if (typeof methods[i] === 'function') {
                            methods[i]('array', {
                                model: model,
                                oldValue: JSON.parse(last),
                                newValue: JSON.parse(current)
                            });
                        }
                    }

                    last = current;
                }
            }, 1);
            return;
        }

        var newModel = {};
        for (var k in model) {
            if (!model.hasOwnProperty(k)) continue;
            var type = typeof model[k];
            if (type === 'function') continue;
            if (type === 'object') {
                bindModelChangeEvent(model[k], method)
            }

            newModel[k] = model[k];
            (function (k) {
                var setter = model.__lookupSetter__(k);
                var getter = model.__lookupGetter__(k);

                Object.defineProperty(model, k, {
                    set: function (newValue) {
                        if (typeof setter === 'function') {
                            setter.apply(this, arguments);
                        }

                        method('object', {
                            model: model,
                            key: k,
                            oldValue: newModel[k],
                            newValue: newValue
                        });

                        newModel[k] = newValue;
                    },
                    get: getter || function () {
                        return newModel[k];
                    }
                });
            })(k);
        }
    }

    function replaceSpecialChar(s) {
        s = s.replace(/\n/g, '\\n');
        s = s.replace(/"/g, '\\"');

        var attributePlaceholderReg = /:attribute\-placeholder(\w+.*?\\".*?\\")/g;
        s = s.replace(attributePlaceholderReg, function (a, b, c, d) {
            return b.replace(/\s/g, '').replace(/\\"(.*)\\"/g, function (a, b, c, d) {
                return '\\"\" + Tmp.toString(' + b + ') + \"\\"';
            });
        });

        var expressReg = /\{\s*\{\s*(.*?)\s*\}\s*\}/g;
        s = s.replace(expressReg, function (a, b, c, d) {
            return '" + Tmp.toString(' + b + ') + "';
        });

        return '"' + s + '"';
    }

    function getCurrentElementCode(self, code) {

        var hasEvent = false;
        var eventHash = {};

        var cloneNode = self.cloneNode();

        var nodeName = self.nodeName.toLowerCase();
        var isInput = (nodeName === 'input' && self.getAttribute('type') === 'text') || nodeName === 'textarea' || nodeName === 'select';
        var isCheckbox = nodeName === 'input' && self.getAttribute('type') === 'checkbox';
        var isRadio = nodeName === 'input' && self.getAttribute('type') === 'radio';

        for (var i = 0; i < cloneNode.attributes.length; i++) {

            var attr = cloneNode.attributes[i];

            var attrName = attr.name
                .replace(/r\-bind\s*(:.*)/g, function (a, b, c, d) {
                    return b;
                })
                .replace(/r\-on\s*:(.*)/g, function (a, b, c, d) {
                    return '@' + b;
                });


            if (attrName[0] === '@') {
                hasEvent = true;
                var eventName = attrName.substring(1);

                var lIndex = attr.value.indexOf('(');
                lIndex = lIndex != -1 ? lIndex : attr.value.length;
                var rIndex = attr.value.indexOf(')');
                rIndex = rIndex != -1 ? rIndex : attr.value.length;

                var method = attr.value.substring(0, lIndex).trim();
                var argList = attr.value.substring(lIndex + 1, rIndex).trim();
                argList == '' ? argList = 'self' : argList = 'self,' + argList;

                eventHash[eventName] = eventHash[eventName] || '';
                eventHash[eventName] += method + '.call(' + argList + ')';
                self.removeAttribute(attr.name);
            }
            if (attrName[0] === ':') {
                attrName = attrName.substring(1);
                if (attrName == 'style') {
                    hasEvent = true;
                    eventHash['setstyle'] = eventHash['setstyle'] || '';
                    eventHash['setstyle'] += '(' + (function () {
                        extend(this.style, Tmp.styleValue(modelData));
                    }).toString().replace(/modelData/g, attr.value) + ').apply(this);\r\n';
                } else if (attrName == 'class') {
                    hasEvent = true;
                    eventHash['setclass'] = eventHash['setclass'] || '';
                    eventHash['setclass'] += '(' + (function () {
                        this.className = this.className || '';
                        this.className += ' ' + Tmp.classValue(modelData)
                    }).toString().replace(/modelData/g, attr.value) + ').apply(this);\r\n';
                } else {
                    self.setAttribute(':attribute-placeholder' + attrName, attr.value)
                }
                self.removeAttribute(attr.name);
            }
            if (attrName === 'r-model') {
                hasEvent = true;
                eventHash[changeEvent] = eventHash[changeEvent] || '';
                eventHash['setval'] = eventHash['setval'] || '';
                if (isInput) {
                    eventHash[changeEvent] += '(' + (function () {
                        modelData = this.value;
                        if (needBindArgNames['modelData']) {
                            self.modelData = modelData;
                        }
                    }).toString().replace(/modelData/g, attr.value) + ').apply(this);\r\n';

                    eventHash['setval'] += '(' + (function () {
                        this.value = modelData;
                    }).toString().replace(/modelData/g, attr.value) + ').apply(this);\r\n';
                } else if (isCheckbox) {
                    eventHash[changeEvent] += '(' + (function () {
                        if (modelData instanceof Array) {
                            if (this.checked) {
                                var exist = false;
                                for (var i = 0; i < modelData.length; i++) {
                                    if (modelData[i] === this.value) {
                                        exist = true;
                                        break;
                                    }
                                }
                                if (!exist) {
                                    modelData.push(this.value);
                                }
                            } else {
                                for (var i = 0; i < modelData.length; i++) {
                                    if (modelData[i] === this.value) {
                                        modelData.splice(i, 1);
                                    }
                                }
                            }
                        } else {
                            modelData = this.checked;
                        }

                        if (needBindArgNames['modelData']) {
                            self.modelData = modelData;
                        }
                    }).toString().replace(/modelData/g, attr.value) + ').apply(this);\r\n';

                    eventHash['setval'] += '(' + (function () {
                        this.checked = false;
                        if (modelData instanceof Array) {
                            for (var i = 0; i < modelData.length; i++) {
                                if (modelData[i] === this.value) {
                                    this.checked = true;
                                }
                            }
                        } else {
                            this.checked = modelData === true;
                        }
                    }).toString().replace(/modelData/g, attr.value) + ').apply(this);\r\n';
                } else if (isRadio) {
                    eventHash[changeEvent] += '(' + (function () {
                        modelData = this.checked ? this.value : '';
                        if (needBindArgNames['modelData']) {
                            self.modelData = modelData;
                        }
                    }).toString().replace(/modelData/g, attr.value) + ').apply(this);\r\n';

                    eventHash['setval'] += '(' + (function () {
                        this.checked = modelData === this.value;
                    }).toString().replace(/modelData/g, attr.value) + ').apply(this);\r\n';
                }

                self.removeAttribute(attr.name);
            }
            if (attrName === 'r-show') {
                hasEvent = true;
                eventHash['setstyle'] = eventHash['setstyle'] || '';
                eventHash['setstyle'] += '(' + (function () {
                    if (!(modelData)) this.style.display = 'none';
                }).toString().replace(/modelData/g, attr.value) + ').apply(this);\r\n';
            }
            if (attrName === 'r-hide') {
                hasEvent = true;
                eventHash['setstyle'] = eventHash['setstyle'] || '';
                eventHash['setstyle'] += '(' + (function () {
                    if (modelData) this.style.display = 'none';
                }).toString().replace(/modelData/g, attr.value) + ').apply(this);\r\n';
            }
        }

        if (hasEvent) {
            self.setAttribute('tempId', 'temp-id-placeholder');
            self.setAttribute('fakeClass', 'needBindEvent');
        }

        var outerHTML = self.cloneNode().outerHTML;
        var index;
        for (index = 0; index < outerHTML.length; index++) {
            if (outerHTML[index] === '>') {
                break;
            }
        }

        var splits = [];
        if (index >= 0 && index < outerHTML.length) {
            splits[0] = outerHTML.substring(0, index + 1);
            splits[1] = outerHTML.substring(index + 1);

            if (hasEvent) {
                var tempIdVarName = 'tempId' + randomNumberString();
                code.push('var ' + tempIdVarName + ' = "el-" + randomNumberString();\r\n');
                code.push('eventMap[' + tempIdVarName + '] = {};\r\n');
                for (var eventName in eventHash) {
                    if (!eventHash.hasOwnProperty(eventName)) continue;
                    code.push('eventMap[' + tempIdVarName + '].' + eventName +
                        ' = (function(){ return function(evt){\r\n var $event = evt;\r\n ' +
                        eventHash[eventName] + '\r\n};}).apply(self, arguments);\r\n');
                }

                code.push('html.push((' + replaceSpecialChar(splits[0]) + ').replace("temp-id-placeholder", ' + tempIdVarName + ' ));\r\n');
            } else {
                code.push('html.push(' + replaceSpecialChar(splits[0]) + ');\r\n');
            }

            var childNodes = self.childNodes;
            for (var i = 0; i < childNodes.length; i++) {
                var child = childNodes[i];
                getCode(child, code);
            }

            code.push('html.push(' + replaceSpecialChar(splits[1]) + ');\r\n');
        }
    }

    function getCode(self, code) {

        // 文本
        if (self.nodeType === 3) {
            if (self.nodeValue.trim().length === 0) return;
            code.push('html.push(' + replaceSpecialChar(self.nodeValue) + ');\r\n');
            return;
        }

        // 注释
        if (self.nodeType === 8) {
            return;
        }

        var rFor = self.getAttribute('r-for');
        var rIf = self.getAttribute("r-if");
        var rElseIf = self.getAttribute("r-else-if");
        var rElse = self.hasAttribute("r-else");

        if (rIf) {
            self.removeAttribute("r-if");
            code.push('if(' + rIf + ') {\r\n');
            getCurrentElementCode(self, code);
            code.push('}\r\n');
        } else if (rElseIf) {
            self.removeAttribute("r-else-if");
            code.push('else if(' + rElseIf + ') {\r\n');
            getCurrentElementCode(self, code);
            code.push('}\r\n');
        } else if (rElse) {
            self.removeAttribute("r-else");
            code.push('else {\r\n');
            getCurrentElementCode(self, code);
            code.push('}\r\n');
        } else if (rFor) {
            rFor = rFor.trim(' ');
            self.removeAttribute("r-for");
            var dataName = rFor.substring(rFor.lastIndexOf(' ') + 1);
            var itemName = rFor.substring(0, rFor.indexOf(' '));
            code.push('for(var ' + rFor + ') {\r\n');
            code.push('if(!' + dataName + '.hasOwnProperty(' + itemName + ')) continue;\r\n');
            code.push('(function(' + itemName + '){\r\n');
            getCurrentElementCode(self, code);
            code.push('})(' + dataName + '[' + itemName + ']);\r\n')
            code.push('}\r\n');

        } else {
            getCurrentElementCode(self, code);
        }
    }
})(window);