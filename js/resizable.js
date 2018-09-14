(function ($, window, undefined) {
    $.fn.resizable = function (cfg) {
        var $self = this;
        cfg = cfg || {};
        var selector = $self.selector || $self[0];
        
        if (typeof cfg === 'object') {
            $self.each(function () {
                var $dom = $(this);
                $dom.append('<div class="resize-bar resize-right draggable"></div>');
                $dom.append('<div class="resize-bar resize-bottom draggable"></div>');
                $dom.append('<div class="resize-bar resize-corner draggable"></div>');

                var zIndex = parseInt($dom.css('zIndex'));
                if (!isNaN(zIndex)) zIndex = 0;
                $dom.children('.resize-bar').css('zIndex', zIndex + 1);

                console.log($dom.children('.resize-right'));

                $dom.children('.resize-bar').draggable();
            });
        }
        if (typeof cfg === 'string' && methods[cfg] instanceof Function) {
            var $self = $(selector);
            $self.each(function () {
                var $dom = $(this);
                methods[cfg]($dom);
            });
        }
    };

    var methods = {};

    $(function () {
        $('.resizable').resizable();
    });

})(jQuery, window);