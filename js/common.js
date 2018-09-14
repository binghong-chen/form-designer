var Map = Map || function () {
    this.elements = new Array();
    // 获取Map元素个数
    this.size = function () {
            return this.elements.length;
        },
        // 判断Map是否为空
        this.isEmpty = function () {
            return (this.elements.length < 1);
        },
        // 删除Map所有元素
        this.clear = function () {
            this.elements = new Array();
        },
        // 向Map中增加元素（key, value)
        this.put = function (_key, _value) {
            if (this.containsKey(_key) == true) {
                if (this.containsValue(_value)) {
                    if (this.remove(_key) == true) {
                        this.elements.push({
                            key: _key,
                            value: _value
                        });
                    }
                } else {
                    this.elements.push({
                        key: _key,
                        value: _value
                    });
                }
            } else {
                this.elements.push({
                    key: _key,
                    value: _value
                });
            }
        },
        // 向Map中增加元素（key, value)
        this.set = function (_key, _value) {
            if (this.containsKey(_key) == true) {
                if (this.containsValue(_value)) {
                    if (this.remove(_key) == true) {
                        this.elements.push({
                            key: _key,
                            value: _value
                        });
                    }
                } else {
                    this.elements.push({
                        key: _key,
                        value: _value
                    });
                }
            } else {
                this.elements.push({
                    key: _key,
                    value: _value
                });
            }
        },
        // 删除指定key的元素，成功返回true，失败返回false
        this.remove = function (_key) {
            var bln = false;
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].key == _key) {
                        this.elements.splice(i, 1);
                        return true;
                    }
                }
            } catch (e) {
                bln = false;
            }
            return bln;
        },

        // 删除指定key的元素，成功返回true，失败返回false
        this.delete = function (_key) {
            var bln = false;
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].key == _key) {
                        this.elements.splice(i, 1);
                        return true;
                    }
                }
            } catch (e) {
                bln = false;
            }
            return bln;
        },

        // 获取指定key的元素值value，失败返回null
        this.get = function (_key) {
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].key == _key) {
                        return this.elements[i].value;
                    }
                }
            } catch (e) {
                return null;
            }
        },

        // set指定key的元素值value
        this.setValue = function (_key, _value) {
            var bln = false;
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].key == _key) {
                        this.elements[i].value = _value;
                        return true;
                    }
                }
            } catch (e) {
                bln = false;
            }
            return bln;
        },

        // 获取指定索引的元素（使用element.key，element.value获取key和value），失败返回null
        this.element = function (_index) {
            if (_index < 0 || _index >= this.elements.length) {
                return null;
            }
            return this.elements[_index];
        },

        // 判断Map中是否含有指定key的元素
        this.containsKey = function (_key) {
            var bln = false;
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].key == _key) {
                        bln = true;
                    }
                }
            } catch (e) {
                bln = false;
            }
            return bln;
        },

        // 判断Map中是否含有指定key的元素
        this.has = function (_key) {
            var bln = false;
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].key == _key) {
                        bln = true;
                    }
                }
            } catch (e) {
                bln = false;
            }
            return bln;
        },

        // 判断Map中是否含有指定value的元素
        this.containsValue = function (_value) {
            var bln = false;
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].value == _value) {
                        bln = true;
                    }
                }
            } catch (e) {
                bln = false;
            }
            return bln;
        },

        // 获取Map中所有key的数组（array）
        this.keys = function () {
            var arr = new Array();
            for (i = 0; i < this.elements.length; i++) {
                arr.push(this.elements[i].key);
            }
            return arr;
        },

        // 获取Map中所有value的数组（array）
        this.values = function () {
            var arr = new Array();
            for (i = 0; i < this.elements.length; i++) {
                arr.push(this.elements[i].value);
            }
            return arr;
        };

    /**
     * map遍历数组
     * @param callback [function] 回调函数；
     * @param context [object] 上下文；
     */
    this.forEach = function forEach(callback, context) {
        context = context || window;

        //IE6-8下自己编写回调函数执行的逻辑
        var newAry = new Array();
        for (var i = 0; i < this.elements.length; i++) {
            if (typeof callback === 'function') {
                var val = callback.call(context, this.elements[i].value, this.elements[i].key, this.elements);
                newAry.push(this.elements[i].value);
            }
        }
        return newAry;
    }

}

RANDOM_HASH = {};

function randomNumberString() {
    var random;
    do {
        random = Math.floor(Math.random() * 10000000);
    } while (RANDOM_HASH[random]);
    RANDOM_HASH[random] = true;
    return random;
}

function format(date, fmt) {
    if (!(date instanceof Date)) date = new Date(date);
    var o = {
        "M+": date.getMonth() + 1, //月份 
        "d+": date.getDate(), //日 
        "h+": date.getHours(), //小时 
        "m+": date.getMinutes(), //分 
        "s+": date.getSeconds(), //秒 
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
        "S": date.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

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


// 获取鼠标位置
function getMousePosition(evt) {
    if (evt.touches) {
        evt = evt.touches[0];
    }
    return {
        left: evt.clientX,
        top: evt.clientY
    };
}

function getScrollTopMax(dom){
    return dom.scrollHeight - dom.offsetHeight;
}


$.fn.initMovingRange = function (cfg, parent, margin) {
    var dom = $(this);
    var parent = parent || dom.parent();
    var movingRange = {
        top: {
            min: 0,
            max: 9999
        },
        left: {
            min: -9999,
            max: 9999
        }
    };

    margin = margin || {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    };

    margin.left = margin.left || 0;
    margin.right = margin.right || 0;
    margin.top = margin.top || 0;
    margin.bottom = margin.bottom || 0;

    //绝对定位元素 插入到 父元素中 的默认位置（相对于屏幕）
    var offset = parent.offset();
    if (cfg && cfg.hor) {
        movingRange.left.min = offset.left + parseFloat(parent.css('border-left-width')) + margin.left;
        movingRange.left.max = parent.innerWidth() - dom.outerWidth() + movingRange.left.min - margin.left - margin.right;
    }

    if (cfg && cfg.ver) {
        movingRange.top.min = offset.top + parseFloat(parent.css('border-top-width')) + margin.top;
        movingRange.top.max = parent.innerHeight() - dom.outerHeight() + movingRange.top.min - margin.top - margin.bottom;
    }

    movingRange.margin = margin;
    return movingRange;
};

function arraySwap(array, index, anotherIndex) {
    if (
        index < 0 || index >= array.length ||
        anotherIndex < 0 || anotherIndex >= array.length
    )
        return;

    var temp = array[index];
    array[index] = array[anotherIndex];
    array[anotherIndex] = temp;
}

function dfs(array, childrenName, callback) {
    (function (arr) {
        if (arr && arr.length) {
            for (var i = 0; i < arr.length; i++) {
                var tmp = arr[i];
                if (typeof callback === 'function') {
                    var isBreak = callback(arr, tmp, i);
                    if (isBreak) {
                        break;
                    }
                }
                if (tmp[childrenName] && tmp[childrenName].length) {
                    arguments.callee.call(this, tmp[childrenName], childrenName, callback);
                }
            }
        }
    })(array);
}