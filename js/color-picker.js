var colorPicker;

(function () {

    colorPicker = function (cfg) {
        this.colorPool = ["#000000", "#993300", "#333300", "#003300", "#003366", "#000080", "#333399", "#333333", "#800000", "#FF6600", "#808000", "#008000", "#008080", "#0000FF", "#666699", "#808080", "#FF0000", "#FF9900", "#99CC00", "#339966", "#33CCCC", "#3366FF", "#800080", "#999999", "#FF00FF", "#FFCC00", "#FFFF00", "#00FF00", "#00FFFF", "#00CCFF", "#993366", "#CCCCCC", "#FF99CC", "#FFCC99", "#FFFF99", "#CCFFCC", "#CCFFFF", "#99CCFF", "#CC99FF", "#FFFFFF"];
        this.cfg = cfg;
        if (typeof cfg.el === 'string') {
            this.el = document.querySelector(cfg.el);
            if (!(this.el instanceof HTMLElement)) {
                console.error('请传入正确的查询选择字符!');
                return;
            }
        }
        if (cfg.el instanceof HTMLElement) {
            this.el = cfg.el;
        }

        this.isShow = false;

        this.initialize();
    }
    colorPicker.prototype = {
        initialize: function () {
            var count = 0;
            var html = '';
            var self = this;
            html += '<table cellspacing="5" cellpadding="0" border="1" bordercolor="#000000" style="cursor:pointer;background:#fff;">';
            for (i = 0; i < 5; i++) {
                html += "<tr>";
                for (j = 0; j < 8; j++) {
                    html += '<td align="center" width="20" height="20" style="background:' + this.colorPool[count] + '" unselectable="on"></td>';
                    count++;
                }
                html += "</tr>";
            }
            html += '</table>';
            this.div = document.createElement('div');
            this.div.innerHTML = html;
            var tds = this.div.getElementsByTagName('td');
            for (var i = 0, l = tds.length; i < l; i++) {
                tds[i].onclick = function (ev) {
                    self.setColor(this.style.backgroundColor);
                    ev.stopPropagation();
                }
            }
            this.div.id = 'color-picker-' + randomNumberString();
            this.el.parentNode.appendChild(this.div);
            this.div.style.position = 'absolute';
            this.div.style.zIndex = 9999;
            this.div.style.left = this.el.offsetLeft + 'px'
            this.div.style.top = (this.el.clientHeight + this.el.offsetTop) + 'px';
        },
        setColor: function (c) {
            if (typeof this.cfg.setColor === 'function') {
                this.cfg.setColor.call(this, c);
            }
            this.hide();
        },
        hide: function () {
            this.isShow = false;
            this.div.style.display = 'none'
        },
        show: function () {
            this.isShow = true;
            this.div.style.display = 'block'
        },
        toggle: function () {
            this.isShow ? this.hide() : this.show();
        }
    }
})();