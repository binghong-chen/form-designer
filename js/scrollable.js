(function ($, window, undefined) {
    $.fn.scrollable = function (cfg) {
        var $self = this;
        cfg = cfg || {};
        var selector = $self.selector || $self[0];
        if (typeof cfg === 'object') {
            $self.each(function () {
                var $dom = $(this);
                $dom.addClass("scroll-outer").html('<div class="scroll-inner">' +
                    $dom.html() +
                    '</div><div class="scroll-bar"><div class="scroll-bar-btn"></div></div>');
                var $scrollInner = $dom.children('.scroll-inner');
                var $scrollBar = $dom.children('.scroll-bar');
                var $scrollBarBtn = $dom.children('.scroll-bar').children('.scroll-bar-btn');

                var scrollStyle = cfg.scrollStyle || new Function('return {' + ($dom.attr('scroll-style') || '') + '};')();
                $dom.removeAttr('scroll-style');

                var innerStyle = $.extend({}, scrollStyle.inner);
                $scrollInner.css(innerStyle);

                var barStyle = $.extend({}, scrollStyle.bar);
                barStyle.top = 0;
                barStyle.height = $dom.height();
                $scrollBar.offset({
                    left: $dom.width() - $scrollBar.width()
                }).css(barStyle);


                var btnStyle = $.extend({}, scrollStyle.btn);
                $scrollBarBtn.css(btnStyle);

                methods.checkScroll($dom);
            });
        }
        if (typeof cfg === 'string' && methods[cfg] instanceof Function) {
            var $self = $(selector);
            $self.each(function () {
                var $dom = $(this);
                methods[cfg]($dom);
            });
        }
    }

    var colorRgb = function (sColor) {
        var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
        if (sColor && reg.test(sColor)) {
            if (sColor.length === 4) {
                var sColorNew = "#";
                for (var i = 1; i < 4; i += 1) {
                    sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
                }
                sColor = sColorNew;
            }
            //处理六位的颜色值
            var sColorChange = [];
            for (var i = 1; i < 7; i += 2) {
                sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
            }
            return "rgb(" + sColorChange.join(",") + ")";
        } else {
            return sColor;
        }
    };

    var methods = {
        checkScroll: function ($dom) {
            var V = $scrollInner = $dom.children('.scroll-inner');
            var $scrollBar = $dom.children('.scroll-bar');
            var $scrollBarBtn = $scrollBar.children('.scroll-bar-btn');
            var V_H = V.height();
            var V_S_MAX = V[0].scrollHeight;
            if (V_S_MAX > V_H) {
                $scrollBarBtn.css({
                    height: (V_H * V_H / V_S_MAX) + 'px'
                }).addClass('draggable');


                var isScroll = false;

                $scrollBar.show();
                var offset = $scrollBar.offset();
                $scrollInner.off('scroll').on('scroll', function () {
                    if(isScroll) return;
                    var scrollTop = $scrollInner.scrollTop();
                    $scrollBarBtn.offset({
                        top: offset.top + (V_H * scrollTop / V_S_MAX)
                    });
                });

                var bgColor;
                $scrollBarBtn.draggable({
                    onStartDrag: function (ev, el) {
                        V_H = V.height();
                        V_S_MAX = V[0].scrollHeight;
                        // 滚动时 加深 滚动条颜色
                        var draggedBackgroundColor = bgColor = el.css('backgroundColor');
                        if (draggedBackgroundColor) {
                            draggedBackgroundColor = colorRgb(draggedBackgroundColor).toLowerCase();
                            var splits = draggedBackgroundColor.split(/[(|,|)]/g);
                            var rgb = splits[0];
                            splits.shift();
                            splits.pop();
                            if (rgb === 'rgb') {
                                for (var i = 0; i < 3; i++) {
                                    splits[i] = ((+splits[i]) * 0.7).toString();
                                }
                            }
                            if (rgb === 'rgba') {
                                splits[3] = (Math.min(1, (+splits[3]) * 1.5)).toString();
                            }
                            var _bgColor = rgb + '(' + splits.join(',') + ')';
                            el.css('backgroundColor', _bgColor);
                        }
                        isScroll = true;
                    },
                    onDrag: function (ev, el, position) {
                        V.scrollTop(V_S_MAX * (el.offset().top - offset.top) / V_H);
                    },
                    onEndDrag: function (ev, el) {
                        isScroll = false;
                        el.css('backgroundColor', bgColor);
                    }
                });
            } else {
                $scrollBar.hide();
            }
        }
    };

    $(function () {
        $('.scroll').scrollable();
    });

})(jQuery, window);