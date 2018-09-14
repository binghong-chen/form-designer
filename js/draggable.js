var DRAGED_ELEMENT = null;
var DRAG_START_TIME = null;

(function ($, window, undefined) {
    var START_EVENT = "touchstart mousedown", // 拖动开始事件名
        MOVE_EVENT = "touchmove mousemove", // 拖动事件名
        END_EVENT = "touchend mouseup";
    var methods = {
        onStartDrag: function (evt) {
            // 不是鼠标左键
            if (evt.which !== 1) return;
            // 可以拖动的上级元素
            var $dom = $(evt.target).closest('.draggable');
            if ($dom.length == 0) return;
            evt.preventDefault();
            evt.stopPropagation();
            // 拖动时移动的元素
            $dom = $(evt.target).closest('.draggable-body');
            methods.startDrag($dom, getMousePosition(evt))
        },
        startDrag: function ($dom, mousePosition) {
            if ($dom.length == 0) return;
            var self = $dom.data('Drag');
            if (!self) return;
            if (self.isDragging) return;
            self.isDragging = true;
            DRAGED_ELEMENT = $dom;
            self.dragStartTime = new Date();
            self.startDragPosition = {
                left: mousePosition.left,
                top: mousePosition.top
            };
            self.lastOffset = self.dom.offset();
            self.startDragPosition.left -= self.lastOffset.left;
            self.startDragPosition.top -= self.lastOffset.top;

            self.initMovingRange();
        },
        onDrag: function (evt) {
            if (DRAGED_ELEMENT === null) return;
            evt.preventDefault();
            var self = DRAGED_ELEMENT.data('Drag');
            if (!self.isDragging) return;
            if ((new Date() - self.dragStartTime) < 200) {
                // 点击事件
                return;
            }
            if(!self.isStartDrag){
                self.isStartDrag = true;
                 // 拖动开始接口
                 if (typeof self.cfg.onStartDrag === 'function') {
                    self.cfg.onStartDrag.call(self, evt, DRAGED_ELEMENT, mousePosition);
                }
            }
            var mousePosition = getMousePosition(evt);
            if (!DRAGED_ELEMENT.hasClass('dragged')) {
                DRAGED_ELEMENT.addClass('dragged');
            }

            var left = mousePosition.left - self.startDragPosition.left;
            var top = mousePosition.top - self.startDragPosition.top;
            self.setOffset({
                left: left,
                top: top
            });

            // 拖动接口
            if (typeof self.cfg.onDrag === 'function') {
                self.cfg.onDrag.call(self, evt, DRAGED_ELEMENT, mousePosition);
            }
        },
        onEndDrag: function (evt) {
            if (DRAGED_ELEMENT === null) return;
            evt.preventDefault();
            var self = DRAGED_ELEMENT.data('Drag');
            self.isDragging = false;
            self.isStartDrag = false;
            if (DRAGED_ELEMENT.hasClass('dragged')) {
                DRAGED_ELEMENT.removeClass('dragged');
                // 拖动结束接口
                if (typeof self.cfg.onEndDrag === 'function') {
                    self.cfg.onEndDrag.call(self, evt, DRAGED_ELEMENT);
                }
            }

            DRAGED_ELEMENT = null;
        }
    };
    $(document.body)
        .off(START_EVENT)
        .off(MOVE_EVENT)
        .off(END_EVENT)
        .on(START_EVENT, methods.onStartDrag)
        .on(MOVE_EVENT, methods.onDrag)
        .on(END_EVENT, methods.onEndDrag);



    var Drag = function (cfg) {
        var self = this;
        $.extend(self, {
            cfg: {
                dragMode: 3,
                movingLimit: {
                    hor: true,
                    ver: true
                },
                verticalCenter: false,
                horizontalCenter: false
            }
        });
        $.extend(self.cfg, cfg);
        self.init();
    };
    $.extend(self, {
        dom: null,
        movingRange: null,
        isDragging: false,
        lastOffset: null,
        startDragPosition: null
    });
    $.extend(Drag.prototype, {
        init: function () {
            var self = this;
            self.dom = self.cfg.el;

            if (!(self.dom instanceof $)) {
                if (typeof self.dom === 'string' || isDOM(self.dom)) {
                    self.dom = $(self.dom);
                } else {
                    return;
                }
            }

            self.initMovingRange();
        },
        setOffset: function (offset) {
            var self = this;
            offset = offset || self.dom.offset();
            var _offset = {};

            var movingRange = self.movingRange;

            if (self.cfg.dragMode & 1) _offset.left = offset.left;
            if (self.cfg.dragMode & 2) _offset.top = offset.top;

            if (_offset.left) {
                _offset.left = Math.max(_offset.left, movingRange.left.min);
                _offset.left = Math.min(_offset.left, movingRange.left.max);
            }
            if (_offset.top) {
                _offset.top = Math.max(_offset.top, movingRange.top.min);
                _offset.top = Math.min(_offset.top, movingRange.top.max);
            }

            // css 改成 offset 
            // offset是相对于页面的
            // css 是相对于父容器的
            self.dom.offset(_offset);
        },
        resetOffset: function () {
            var self = this;
            self.initMovingRange();
            self.setOffset();
        },
        initMovingRange: function () {
            var self = this;
            if (typeof self.cfg.initMovingRange === 'function') {
                self.movingRange = self.cfg.initMovingRange(self.cfg.movingLimit);
            } else {
                self.movingRange = self.dom.initMovingRange(self.cfg.movingLimit);
            }
        }
    });

    $.fn.draggable = function () {
        var cfg = arguments[0] || {};

        if (typeof cfg === 'string') {
            var method;
            if (typeof methods[cfg] === 'function') {
                method = methods[cfg];
            }

            this.each(function(){
                var $dom = $(this);
                var drag = $dom.data('Drag');
                if (method == undefined && drag && typeof drag[cfg] === 'function') {
                    method = drag[cfg];
                }
                method.apply(drag, Array.prototype.slice.call(arguments, 1));
            });
        } else {
            this.each(function(){
                var $dom = $(this);
                cfg.el = $dom;
                $dom.addClass('draggable-body');
                $dom.data('Drag', new Drag(cfg));
            });
        }
       
        return this;
    }
})(jQuery, window);