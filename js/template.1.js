var _tmp;
var Tmp;
(function (window, undefined) {

    var templateRealNodesMap = new Map();
    var templateForNodesMap = new Map();
    var nodeEventsMap = new Map();

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
        if (typeof obj !== 'object') return [];
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
        if (typeof obj !== 'object') return [];
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
                array[0] = array[0] || {};
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

    function copy(data) {
        var res = {};
        for (var k in data) {
            if (isPlainObject(data[k])) {
                res[k] = copy(data[k]);
            }
            res[k] = data[k];
        }
        return res;
    }

    function insertAfter(insert_element, target_element) {
        var parent = target_element.parentNode;
        //最后一个子节点 lastElementChild兼容其他浏览器 lastChild  兼容ie678;
        var last_element = parent.lastElementChild || parent.lastChild;
        //兄弟节点同样也是有兼容性
        var target_sibling = target_element.nextElementSibling || target_element.nextSibling;
        if (last_element == target_element) { //先判断目标节点是不是父级的最后一个节点，如果是的话，直接给父级加子节点就好
            parent.appendChild(insert_element);
        } else { //不是最好后一个节点  那么插入到目标元素的下一个兄弟节点之前（就相当于目标元素的insertafter）
            parent.insertBefore(insert_element, target_sibling);
        }
    }

    Tmp = function (cfg) {
        new _tmp(cfg, this);
    }


    _tmp = function (cfg, tmp) {
        var self = this;

        self.tmp = tmp;

        self.cfg = extend({
            watchMethod: function () {}
        }, cfg);
        self.init();
    }

    extend(_tmp.prototype, {
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

            extend(self.tmp, self.cfg.data);
            for (var k in self.cfg.methods) {
                if (typeof self.cfg.methods[k] !== 'function') continue;
                (function (method) {
                    self.tmp[k] = function () {
                        return method.apply(self.tmp, arguments);
                    };
                })(self.cfg.methods[k]);
            }


            if (typeof self.cfg.watchMethod === 'function') {
                bindModelChangeEvent(self.tmp, function () {
                    self.cfg.watchMethod.apply(self.tmp);

                    if (self.watching) {
                        self.render();
                    }
                });
            }

            self.setElements();

            self.render();
        },
        setElements: function () {
            var self = this;
            var parent = document.createElement('div');
            parent.innerHTML = self.template;
            self.templateElement = parent.firstElementChild;
            self.parentNode = self.$el.parentNode;
            self.parentNode.removeChild(self.$el);
        },
        otherAttrDeal: function (realNode, templateNode, tempVars, allVars) {
            var self = this;

            for (var i = 0; i < templateNode.attributes.length; i++) {
                var attr = templateNode.attributes[i];
                var attrName = attr.name
                    .replace(/r\-bind\s*(:.*)/g, function (a, b, c, d) {
                        return b;
                    })
                    .replace(/r\-on\s*:(.*)/g, function (a, b, c, d) {
                        return '@' + b;
                    });

                var attrValue = attr.value;
                if (attrName[0] === '@') {
                    var eventName = attrName.substring(1);

                    var lIndex = attrValue.indexOf('(');
                    lIndex = lIndex != -1 ? lIndex : attrValue.length;
                    var rIndex = attrValue.indexOf(')');
                    rIndex = rIndex != -1 ? rIndex : attrValue.length;

                    var events;
                    if (!nodeEventsMap.has(realNode)) {
                        events = {};
                        nodeEventsMap.set(realNode, events);
                    }
                    events = nodeEventsMap.get(realNode);
                    if (events[eventName]) {
                        realNode.removeEventListener(eventName, events[eventName])
                    }
                    (function (code) {
                        events[eventName] = function (ev) {
                            extend(allVars, {
                                $event: ev
                            });
                            self.compile(code, allVars);
                        };
                    })(attrValue);

                    realNode.addEventListener(eventName, events[eventName]);

                    realNode.removeAttribute(attr.name);
                }
                if (attrName[0] === ':') {
                    attrName = attrName.substring(1);
                    if (attrName === 'style') {
                        extend(realNode.style, _tmp.styleValue(self.compile(attrValue, allVars)));
                    } else if (attrName === 'class') {
                        var newClasses = _tmp.classValue(self.compile(attrValue, allVars)).split(' ');
                        for (var j = 0; j < newClasses.length; j++) {
                            var existClass = false;
                            for (var k = 0; k < realNode.classList.length; k++) {
                                if (realNode.classList[k] === newClasses[j]) {
                                    existClass = true;
                                    break;
                                }
                            }
                            if (!existClass) {
                                realNode.classList.add(newClasses[j]);
                            }
                        }
                    } else if (attrName === 'disabled' || attrName === 'readonly') {
                        self.compile(attrValue, allVars) ? realNode.setAttribute(attrName, attrName) : realNode.removeAttribute(attrName);
                    } else {
                        realNode.setAttribute(attrName, self.compile(attrValue, allVars));
                    }
                    realNode.removeAttribute(attr.name);
                }
            }
        },
        appendElement: function (parent, realNode, prevElement, templateNode, notExist, allVars, tempVars) {
            var self = this;

            notExist && (!isDOM(prevElement) ? parent.appendChild(realNode) : insertAfter(realNode, prevElement));

            if (templateNode.nodeType !== 1) return;

            var rModel = templateNode.getAttribute("r-model");
            if (rModel) self.rModelAttrDeal(realNode, rModel, tempVars);

            self.otherAttrDeal(realNode, templateNode, tempVars, allVars);

            for (var i = 0; i < templateNode.childNodes.length; i++) {
                self.parse(templateNode.childNodes[i], realNode, null, tempVars);
            }
        },
        rModelAttrDeal: function (realNode, rModel, tempVars) {
            var self = this;
            var nodeName = realNode.nodeName.toLowerCase();
            var isInput = (nodeName === 'input' && realNode.getAttribute('type') === 'text') || nodeName === 'textarea';
            var isSelect = nodeName === 'select';
            var isCheckbox = nodeName === 'input' && realNode.getAttribute('type') === 'checkbox';
            var isRadio = nodeName === 'input' && realNode.getAttribute('type') === 'radio';

            var eventName = isInput ? 'input' : 'change';

            var res = parseFieldExpress(rModel, self.tmp, tempVars);
            if (!res) return;
            var lastModel = res.lastModel;
            var lastProperty = res.lastProperty;

            var events;
            if (!nodeEventsMap.has(realNode)) {
                events = {};
                nodeEventsMap.set(realNode, events);
            }
            events = nodeEventsMap.get(realNode);

            if (events[eventName]) {
                realNode.removeEventListener(eventName, events[eventName])
            }

            if (isInput || isSelect) {
                events[eventName] = function () {
                    lastModel[lastProperty] = this.value;
                };
                realNode.addEventListener(eventName, events[eventName]);

                realNode.value = lastModel[lastProperty];
            } else if (isCheckbox) {
                events[eventName] = function () {
                    if (lastModel[lastProperty] instanceof Array) {
                        if (this.checked) {
                            var exist = false;
                            for (var i = 0; i < lastModel[lastProperty].length; i++) {
                                if (lastModel[lastProperty][i] === this.value) {
                                    exist = true;
                                    break;
                                }
                            }
                            if (!exist) {
                                lastModel[lastProperty].push(this.value);
                            }
                        } else {
                            for (var i = 0; i < lastModel[lastProperty].length; i++) {
                                if (lastModel[lastProperty][i] === this.value) {
                                    lastModel[lastProperty].splice(i, 1);
                                }
                            }
                        }
                    } else {
                        lastModel[lastProperty] = this.checked;
                    }
                };
                realNode.addEventListener(eventName, events[eventName]);

                realNode.checked = (function () {
                    if (lastModel[lastProperty] instanceof Array) {
                        for (var i = 0; i < lastModel[lastProperty].length; i++) {
                            if (lastModel[lastProperty][i] === this.value) {
                                return true;
                            }
                        }
                        return false;
                    } else {
                        return lastModel[lastProperty] === true;
                    }
                })();
            } else if (isRadio) {
                events[eventName] = function () {
                    lastModel[lastProperty] = this.checked ? this.value : '';
                };
                realNode.addEventListener(eventName, events[eventName]);

                realNode.checked = lastModel[lastProperty] === this.value;
            }
        },
        rElseAttrDeal: function (rElseIf, templateNode, notExist, parent, realNode, prevElement, allVars, tempVars) {
            var self = this;
            var prevNode = templateNode;
            var conditions = [rElseIf || '1 == 1'];
            do {
                prevNode = prevNode.previousSibling
                if (prevNode == null) break;
                if (prevNode.nodeType !== 1) continue;
                var rIf = prevNode.getAttribute("r-if");
                var rElseIf = prevNode.getAttribute("r-else-if");
                if (rIf) {
                    conditions.push('!(' + rIf + ')');
                    break;
                } else if (rElseIf) {
                    conditions.push('!(' + rElseIf + ')');
                } else {
                    break;
                }
            } while (prevNode);

            if (self.compile(conditions.reverse().join(' && '), allVars)) {
                self.appendElement(parent, realNode, prevElement, templateNode, notExist, allVars, tempVars);
            } else {
                !notExist && parent.removeChild(realNode);
            }
        },
        rForAttrDeal: function (rFor, templateNode, parent, tempVars, allVars) {
            var self = this;
            rFor = rFor.trim(' ');
            var splits = rFor.split(' in ');
            var itemName = splits[0].trim();
            var dataName = splits[1].trim();
            var array = _tmp.values(self.compile(dataName, allVars));


            if (!templateForNodesMap.has(templateNode)) {
                templateForNodesMap.set(templateNode, []);
            }
            var _templateNodes = templateForNodesMap.get(templateNode);

            // 去除多余
            for (var i = array.length; i < _templateNodes.length; i++) {
                parent.removeChild(templateRealNodesMap.get(_templateNodes[i]));
            }
            if (array.length < _templateNodes.length) _templateNodes.length = array.length;


            function findLastChildInFor() {
                var minStep = 9999;
                var _prevElement;
                for (var j = 0; j < _templateNodes.length; j++) {
                    var lastChild = parent.lastChild;
                    var _realNode = templateRealNodesMap.get(_templateNodes[j]);
                    var count = 0;
                    while (lastChild && lastChild !== _realNode) {
                        lastChild = lastChild.previousSibling;
                        count++;
                    }
                    if (count < minStep) {
                        minStep = count;
                        _prevElement = _realNode;
                    }
                }
                return _prevElement;
            }

            for (var i = 0; i < array.length; i++) {
                var _prevElement = findLastChildInFor();

                if (_templateNodes[i] === undefined) {
                    // 弥补不足
                    _templateNodes[i] = templateNode.cloneNode(true);
                    _templateNodes[i].removeAttribute("r-for");
                }

                var _newTempVar = {};
                _newTempVar[itemName] = array[i];
                var _tempVars = extend(tempVars, _newTempVar);
                self.parse(_templateNodes[i], parent, _prevElement, _tempVars);
            }
        },
        render: function () {
            var self = this;
            var templateNode = self.templateElement;
            self.parse(templateNode, self.parentNode);

            if (typeof self.cfg.mounted === "function") {
                self.cfg.mounted.apply(self.tmp);
            }
        },
        parse: function (templateNode, parent, prevElement, tempVars) {
            var self = this;

            if (!templateRealNodesMap.has(templateNode)) {
                var cloneNode = templateNode.cloneNode();
                if (cloneNode.nodeType === 1) {
                    cloneNode.removeAttribute('r-for');
                    cloneNode.removeAttribute('r-if');
                    cloneNode.removeAttribute('r-else-if');
                    cloneNode.removeAttribute('r-else');
                    cloneNode.removeAttribute('r-show');
                    cloneNode.removeAttribute('r-hide');
                    cloneNode.removeAttribute('r-model');
                }
                templateRealNodesMap.set(templateNode, cloneNode);
            }
            var realNode = templateRealNodesMap.get(templateNode);

            var notExist = true;
            for (var i = 0; i < parent.childNodes.length; i++) {
                if (realNode === parent.childNodes[i]) {
                    notExist = false;
                    break;
                }
            }

            var allVars = extend(copy(self.tmp), tempVars);

            // 文本
            if (templateNode.nodeType === 3) {
                realNode.nodeValue = self.parseExpress(templateNode.nodeValue, allVars);
                self.appendElement(parent, realNode, prevElement, templateNode, notExist, allVars, tempVars);
                return;
            }
            if (templateNode.nodeType !== 1) return;

            var rFor = templateNode.getAttribute('r-for');
            var rShow = templateNode.getAttribute("r-show");
            var rHide = templateNode.getAttribute("r-hide");
            var rIf = templateNode.getAttribute("r-if");
            var rElseIf = templateNode.getAttribute("r-else-if");
            var rElse = templateNode.hasAttribute("r-else");

            if (rFor) return self.rForAttrDeal(rFor, templateNode, parent, tempVars, allVars);
            if (rIf) self.compile(rIf, allVars) ? self.appendElement(parent, realNode, prevElement, templateNode, notExist, allVars, tempVars) : !notExist && parent.removeChild(realNode);
            else if (rElseIf || rElse) self.rElseAttrDeal(rElseIf, templateNode, notExist, parent, realNode, prevElement, allVars, tempVars);
            else self.appendElement(parent, realNode, prevElement, templateNode, notExist, allVars, tempVars);
            if (rShow) realNode.style.display = self.compile(rShow, allVars) ? '' : 'none';
            if (rHide) realNode.style.display = !self.compile(rHide, allVars) ? '' : 'none';
        },
        parseExpress: function (s, vars) {
            var self = this;
            var expressReg = /\{\s*\{\s*(.*?)\s*\}\s*\}/g;
            s = s.replace(expressReg, function (a, b, c, d) {
                return self.compile('_tmp.toString(' + b + ')', vars);
            });

            return s;
        },
        compile: function (code, vars) {
            var self = this;
            var argNames = _tmp.keys(vars);
            var argValues = _tmp.values(vars);
            var func = new Function(argNames, "return " + code);
            return func.apply(self.tmp, argValues);
        }
    });

    function parseFieldExpress(express, _tmpModel, tempVars) {
        var model;
        var properties = express
            .split(/[.|\s*\[\s*"|\s*\[\s*'|"\s*\]\s*|'\s*\]\s*]/g)
            .filter(function (s) {
                return s.length;
            });

        if (_tmpModel && _tmpModel.hasOwnProperty(properties[0])) {
            model = _tmpModel;
        } else if (tempVars && tempVars.hasOwnProperty(properties[0])) {
            model = tempVars;
        }

        if (!isPlainObject(model)) return false;
        var lastModel = model;
        for (var i = 0; i < properties.length - 1; i++) {
            lastModel = lastModel[properties[i]];
        }
        var lastProperty = properties[properties.length - 1];

        return {
            lastModel: lastModel,
            lastProperty: lastProperty,
            value: lastModel[lastProperty]
        };
    }

    extend(_tmp, {
        keys: keys,
        values: values,
        toString: toString,
        classValue: function (value) {
            if (value === null || value === undefined) return '';
            var array = [];
            if (value instanceof Array) {
                for (var i = 0; i < value.length; i++) {
                    array.push(_tmp.classValue(value[i]));
                }
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
        return Object.prototype.toString.apply(obj) === '[object Object]';
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
                        newModel[k] = newValue;

                        if (typeof setter === 'function') {
                            setter.apply(this, arguments);
                        }

                        method('object', {
                            model: model,
                            key: k,
                            oldValue: newModel[k],
                            newValue: newValue
                        });

                    },
                    get: getter || function () {
                        return newModel[k];
                    }
                });
            })(k);
        }
    }
})(window);