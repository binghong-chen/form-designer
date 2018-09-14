(function ($, window, undefined) {
    var E;
    var P;
    var V;

    var Sort = function (cfg) {
        var self = this;
        V = cfg.viewPort;

        function checkSort(evt, E) {
            var sortType;

            var offset = E.offset();

            var E_H = E.outerHeight(true);

            var index = self.siblings.indexOf(E[0]);
            var prev = self.siblings[index - 1];
            var next = self.siblings[index + 1];

            if (prev) {
                prev = $(prev);
                var prevOffset = prev.offset();
                if (offset.top < prevOffset.top + self.movingRange.margin.top + 5) {
                    if (self.isScroll) return;

                    prev.offset({
                        top: prevOffset.top += E_H
                    });

                    arraySwap(self.siblings, index, index - 1);
                    self.swapConfig = {
                        node: prev,
                        type: 'before'
                    };

                    sortType = 'up';
                }
            }

            if (next) {
                next = $(next);
                var nextOffset = next.offset();
                if (offset.top + E_H > nextOffset.top + next.outerHeight(true) - self.movingRange.margin.bottom - 5) {
                    if (self.isScroll) return;

                    next.offset({
                        top: nextOffset.top -= E_H
                    });

                    arraySwap(self.siblings, index, index + 1);
                    self.swapConfig = {
                        node: next,
                        type: 'after'
                    };

                    sortType = 'down';
                }
            }


            if (sortType && typeof cfg.onSort === 'function') {
                cfg.onSort.call(self, evt, E, sortType);
            }
        }

        if (typeof cfg.checkEnter == 'function') {
            self.checkEnter = cfg.checkEnter;
        } else {
            self.checkEnter = function (el) {
                var offset = el.offset();
                var $parent = el.parent();
                var parentOffset = $parent.offset();
                var parentLeftBorderWidth = parseFloat($parent.css('border-left-width') || 0);
                if (offset.left + el.width() >= parentOffset.left + parentLeftBorderWidth &&
                    offset.left <= parentOffset.left + $parent.outerWidth(true)
                ) {
                    return true;
                } else {
                    return false;
                }
            }
        }


        $.extend(self, {
            cfg: cfg,
            dragCfg: {
                el: cfg.el,
                verticalCenter: true,
                dragMode: 3, // 0-不拖动 1-仅水平拖动 2-仅垂直拖动 3-任意拖动
                initMovingRange: cfg.initMovingRange,
                onStartDrag: function (evt, el, mousePosition) {
                    // 判断是否可以排序
                    var canSort = true;
                    if (typeof cfg.onCheckStartSort === 'function') {
                        canSort = cfg.onCheckStartSort.call(self, evt, el);
                    }
                    if (!canSort) {
                        return;
                    }

                    E = el;

                    // 是否在容器内
                    self.isEnter = self.checkEnter(el);

                    // 获取同一排序序列中的所有元素
                    self.siblings = [];
                    P = E.parent();
                    P.children('.sorttable').each(function () {
                        self.siblings.push(this);
                    });

                    self.isScroll = false;
                    self.swapConfig = undefined;
                    self.mousePosition = mousePosition;
                    self.movingRange = E.initMovingRange(this.cfg.movingLimit, V, E.data('movingRange').margin);

                    // 启动定时器 判断是否需要滚动
                    // 上滚定时器
                    if (self.upInterval) {
                        clearInterval(self.upInterval);
                    }
                    self.upInterval = setInterval(function () {
                        var offset = E.offset();
                        var vs = V.scrollTop();
                        if (offset.top - 10 < self.movingRange.top.min // 靠近上边界
                            &&
                            self.mousePosition.top < mousePosition.top - 5) { // 向上滑
                            if (vs <= 0) {
                                V.scrollTop(0);
                            } else {
                                self.isScroll = true;
                                V.scrollTop(vs - 1);
                                E.offset(offset);
                                E.draggable('resetOffset');
                                if (typeof cfg.onScroll === 'function') {
                                    cfg.onScroll.call(self, E, -1);
                                }
                            }
                        } else {
                            self.isScroll = false;
                        }
                    }, 3);

                    // 计算滚动高度
                    var scrollMax = -V.height();
                    V.children().each(function () {
                        scrollMax += $(this).outerHeight(true);
                    });
                    scrollMax = Math.max(0, scrollMax);

                    // 下滚定时器
                    if (self.downInterval) {
                        clearInterval(self.downInterval);
                    }
                    self.downInterval = setInterval(function () {
                        var offset = E.offset();
                        var vs = V.scrollTop();
                        if (offset.top + 10 > self.movingRange.top.max // 靠近下边界
                            &&
                            self.mousePosition.top > mousePosition.top + 5) { // 向下滑
                            if (vs >= scrollMax) {
                                V.scrollTop(scrollMax);
                            } else {
                                self.isScroll = true;
                                V.scrollTop(vs + 1);
                                E.offset(offset);
                                E.draggable('resetOffset');
                                if (typeof cfg.onScroll === 'function') {
                                    cfg.onScroll.call(self, E, 1);
                                }
                            }
                        } else {
                            self.isScroll = false;
                        }
                    }, 3);

                    if (typeof cfg.onAfterStartSort === 'function') {
                        cfg.onAfterStartSort.call(self, evt, E);
                    }
                },
                onDrag: function (evt, el, mousePosition) {
                    self.mousePosition = mousePosition;
                    var isEnter = self.checkEnter(E);
                    isEnter && checkSort(evt, E);
                    if (isEnter !== self.isEnter) {
                        isEnter ? cfg.onEnter.call(self, E) : cfg.onLeave.call(self, E);
                        self.isEnter = isEnter;
                    }
                    if (typeof cfg.onMove === 'function') {
                        cfg.onMove.call(self, evt, E);
                    }
                },
                onEndDrag: function (evt, el) {
                    var canSort = true;
                    if (typeof cfg.onCheckSort === 'function') {
                        canSort = cfg.onCheckSort.call(self, evt, E);
                    }

                    if (canSort) {
                        if (self.swapConfig) {
                            switch (self.swapConfig.type) {
                                case 'before':
                                    E.insertBefore(self.swapConfig.node);
                                    break;
                                case 'after':
                                    E.insertAfter(self.swapConfig.node);
                                    break;
                                default:
                                    break;
                            }
                        }
                    }

                    P.children('.sorttable').css('top', '0px');
                    P.children('.sorttable').css('left', '0px');

                    if (self.upInterval) {
                        clearInterval(self.upInterval);
                        self.upInterval = 0;
                    }
                    if (self.downInterval) {
                        clearInterval(self.downInterval);
                        self.downInterval = 0;
                    }

                    if (typeof cfg.onAfterEndSort === 'function') {
                        cfg.onAfterEndSort.call(self, evt, E);
                    }
                }
            }
        });
        self.init();
    };

    $.extend(Sort.prototype, {
        init: function () {
            var self = this;
            var dom = self.cfg.el;
            if (!(dom instanceof $)) {
                if (typeof dom === 'string' || isDOM(dom)) {
                    dom = $(dom);
                } else {
                    return;
                }
            }
            dom.draggable(self.dragCfg);
        }
    });

    $.fn.sortable = function (cfg) {
        var cfg = arguments[0] || {};
        if (typeof cfg === 'string') {
            var sort = $(this).data('Sort');
            if (sort && typeof sort[cfg] === 'function') {
                sort[cfg].apply(sort, Array.prototype.slice.call(arguments, 1));
            }
        } else {
            cfg.el = this;
            $(this).data('Sort', new Sort(cfg));
        }
    }
})(jQuery, window);