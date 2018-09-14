var saveData;

function showUsedFieldsTitle() {
    dfs(saveData.usedFields, 'fields', function (fields, currentField, index) {
        console.log(currentField.title);
    });
}

function getPhoneCloneNode() {
    return document.querySelector('#phone>.scroll-inner').cloneNode(true);
}

(function ($, window, undefined) {
    var controlsVm;
    var settingsVm;
    var corPropertyVm;
    var corFieldVm;
    var dateFormulaVm;
    var numberFormulaVm;
    var fontColorPickerInstance;
    var bgColorPickerInstance;

    // 创建字段控件到手机面板
    function createFieldControl(field, callback) {
        var parentEl = field.tableId !== undefined ? '#control-table-' + field.tableId : '#phone>.scroll-inner';
        var elId = 'control-container-' + field.id;
        var $parent = $(parentEl);
        var html = [];

        html.push('<div id="' + elId + '" class="control-container sorttable">');
        html.push('<control-element :object="this" :field="field"></control-element>');
        html.push('</div>');

        $parent.append(html.join(''));
        var $panelControl = $('#panel-controls');
        var panelControlZIndex = parseInt($panelControl.css('zIndex'));

        new Vue({
            el: '#' + elId,
            data: {
                field: field
            },
            mounted: function () {
                var self = this;
                self.$nextTick(function () {
                    var $controlContainer = $('#' + elId);
                    // 判断是否滚动
                    $('#phone').scrollable('checkScroll');
                    var $vDom;

                    // 拖动的是子表 默认附加所有子表字段
                    if (field.type == 'table') {
                        for (var i = 0; i < field.fields.length; i++) {
                            createFieldControl(field.fields[i]);
                        }
                    }

                    $controlContainer.find('.control').resizable({
                    });

                    $controlContainer.sortable({
                        viewPort: $('#phone>.scroll-inner'),
                        initMovingRange: function (cfg, parent) {
                            var margin = {
                                top: 0,
                                bottom: 0,
                                right: 0
                            };
                            var movingRange = $controlContainer.initMovingRange(cfg, $('#phone'), margin);
                            $controlContainer.data('movingRange', movingRange);
                            return movingRange;
                        },
                        checkEnter: function (el) {
                            var offset = $controlContainer.offset();
                            var $phoneBorder = $('#phone-border');
                            var phoneOffset = $phoneBorder.offset();
                            var phoneLeftBorderWidth = parseFloat($phoneBorder.css('border-left-width'));
                            if (offset.left + $controlContainer.width() >= phoneOffset.left + phoneLeftBorderWidth &&
                                offset.left <= phoneOffset.left + $phoneBorder.outerWidth(true)
                            ) {
                                return true;
                            } else {
                                return false;
                            }
                        },
                        onScroll: function (el, delta) {
                            $vDom.offset({
                                top: $vDom.offset().top - delta
                            });
                        },
                        onAfterStartSort: function (evt, el) {

                            // 将左侧控件面板的z-index设置为0 防止遮挡正在拖动的控件
                            $panelControl.css('zIndex', 0);

                            $vDom = $('<div class="virtual-dom control-container"><div class="control"></div></div>');
                            var p = el.parent();
                            // 子表处理
                            if (p.hasClass('control-table')) {
                                p = p.closest('.control-container');
                            }
                            // 显示插入位置的红色提示框
                            var top = el.offset().top - p.offset().top;
                            $vDom.height(el.height()).width(el.width()).css({
                                position: 'absolute'
                            }).offset({
                                top: top
                            }).insertAfter(el);
                            if (!$controlContainer.data('isAdd')) {
                                $vDom.show();
                            }
                            el.css({
                                transform: 'rotate(3deg)'
                            });
                        },
                        onEnter: function (el) {
                            if (!$controlContainer.data('isAdd')) return;

                            var p = el.parent();
                            if (p.hasClass('control-table')) {
                                // 子表处理
                                p = p.closest('.control-container');
                            }

                            var top = 8;
                            var index = this.siblings.indexOf(el[0]);
                            var prev = this.siblings[index - 1];
                            if (prev !== undefined) {
                                var prev = $(prev);
                                top = prev.offset().top - p.offset().top + prev.outerHeight(true)
                            }

                            $vDom.height(el.height()).width(el.width()).css({
                                position: 'absolute'
                            }).offset({
                                top: top
                            }).show();
                        },
                        onLeave: function (el) {
                            if (!$controlContainer.data('isAdd')) return;
                            $vDom.hide();
                        },
                        onSort: function (evt, el, sortType) {
                            console.log('onsort');
                            sort(field, sortType);
                            var top = $vDom.offset().top;
                            switch (sortType) {
                                case 'up':
                                    $vDom.offset({
                                        top: top - this.swapConfig.node.outerHeight(true)
                                    });
                                    break;
                                case 'down':
                                    $vDom.offset({
                                        top: top + this.swapConfig.node.outerHeight(true)
                                    });
                                    break;
                            }
                        },
                        onCheckSort: function (evt, el) {
                            $vDom.remove();
                            // 恢复左侧控件面板的z-index
                            $panelControl.css('zIndex', panelControlZIndex);

                            // 判断是否有效的添加 拖动到手机面板内部才算有效的拖动添加
                            if ($controlContainer.data('isAdd')) {
                                $controlContainer.data('isAdd', false);
                                if (!this.checkEnter(el)) {
                                    controlDelete(field);
                                    return false;
                                }
                            }
                            return true;
                        },
                        onAfterEndSort: function (evt, el) {
                            el.css({
                                transform: ''
                            });
                        }
                    });

                    if (typeof callback === 'function') {
                        callback.call(this, field);
                    }
                });
            }
        });
    }

    // 添加到已用字段
    function addUsedField(field, callback) {
        // 设置 全局字段saveData.allFields 为已使用
        field.isUsed = true;
        if (field.type === 'table') {
            for (var i = 0; i < field.fields.length; i++) {
                field.fields[i].isUsed = true;
            }
            controlsVm.tables.push(field);
        }

        // 复制到 已用字段 saveData.usedFields
        field = JSON.parse(JSON.stringify(field));
        // 拖动的是子表 默认折叠
        if (field.type == 'table') {
            field.isUnFold = true;
        }
        var fields = saveData.usedFields;
        if (field.tableId !== undefined) {
            for (var i = 0; i < fields.length; i++) {
                if (fields[i].id === field.tableId) {
                    fields[i].isUnFold = false;
                    fields[i].fields.push(field);
                    break;
                }
            }
        } else {
            fields.push(field);
        }

        // 创建控件到手机面板
        createFieldControl(field, callback);
    }

    // 显示所有可用字段
    function showFields() {

        var tables = [{
            id: 0,
            title: '主表控件',
            fields: saveData.allFields
        }];
        tables = tables.concat(saveData.allFields.filter(function (field) {
            return field.type === 'table' && field.isUsed;
        }));

        controlsVm = new Vue({
            el: '#panel-controls',
            data: {
                fixedFields: saveData.fixedFields,
                tables: tables
            },
            updated: function () {
                this.$nextTick(function () {
                    $(this.$el).find('.scroll').scrollable('checkScroll');
                });
            },
            mounted: function () {
                this.$nextTick(function () {
                    $('#panel-controls').css('visibility', 'visible');
                    $(this.$el).find('.scroll').scrollable('checkScroll');
                });
            },
            methods: {
                unUsedFields: function (table) {
                    return table.fields.filter(function (field) {
                        return !field.isUsed;
                    });
                },
                mousedown: function (ev, field) {
                    if (ev.which !== 1) return;
                    var $el = $(ev.target).closest('.control-item');
                    var offset = $el.offset();
                    if (field.isFixed) {
                        field.id = randomNumberString() + 99999;
                    }
                    addUsedField(field, function (field) {
                        var $controlContainer = $('#control-container-' + field.id);
                        $controlContainer.offset(offset).addClass('dragged');
                        $controlContainer.data('isAdd', true);
                        $controlContainer.draggable('startDrag', $controlContainer, getMousePosition(ev));
                        $('#panel-controls').css('zIndex', 0);
                    });
                }
            }
        });
    }

    // 显示关联字段面板
    function showCorField(corFields, type) {
        $('.model-panel-shade').show();
        $('#panel_corField').show();
        if (corFieldVm === undefined) {
            corFieldVm = new Vue({
                el: '#panel_corField',
                data: {
                    corFields: corFields,
                    type: type,
                    selectedField: undefined
                },
                methods: {
                    selectField: function (field) {
                        this.selectedField = field;
                    },
                    ok: function () {
                        if (this.selectedField === undefined) {
                            alert('请选择字段');
                            return;
                        }

                        settingsVm.field.corField = this.selectedField.fieldName;
                        $('.model-panel-shade').hide();
                        $('#panel_corField').hide();
                    },
                    cancel: function () {
                        $('.model-panel-shade').hide();
                        $('#panel_corField').hide();
                    }
                }
            });
        } else {
            corFieldVm.corFields = corFields;
            corFieldVm.selectedField = undefined;
        }
    }

    // 显示对应属性面板
    function showCorProperty(field) {
        var corFields = [];

        dfs(saveData.usedFields, 'fields', function (fields, currentField, index) {
            if (currentField.id === field.id) {
                for (var i = 0; i < fields.length; i++) {
                    if (fields[i].properties) {
                        corFields.push(fields[i]);
                    }
                }
                return true;
            }
        });

        $('.model-panel-shade').show();
        $('#panel_corProperty').show();
        if (corPropertyVm === undefined) {
            corPropertyVm = new Vue({
                el: '#panel_corProperty',
                data: {
                    corFields: corFields,
                    selectedField: undefined,
                    selectedProperty: undefined
                },
                methods: {
                    showProperties: function (field) {
                        this.selectedField = field;
                        this.selectedProperty = undefined;
                    },
                    selectProperty: function (property) {
                        this.selectedProperty = property;
                    },
                    ok: function () {
                        if (this.selectedField === undefined) {
                            alert('请选择关联字段');
                            return;
                        }
                        if (this.selectedProperty === undefined) {
                            alert('请选择属性');
                            return;
                        }
                        settingsVm.field.corProperty = {
                            text: this.selectedProperty.text,
                            field: this.selectedField.fieldName,
                            property: this.selectedProperty.value
                        };
                        $('.model-panel-shade').hide();
                        $('#panel_corProperty').hide();
                    },
                    cancel: function () {
                        $('.model-panel-shade').hide();
                        $('#panel_corProperty').hide();
                    }
                }
            });
        } else {
            corPropertyVm.corFields = corFields;
            corPropertyVm.selectedField = undefined;
        }
    }

    // 显示链接输入面板
    function showHref(field) {
        $('.model-panel-shade').show();
        $('#panel_href').show();
        if (corFieldVm === undefined) {
            corFieldVm = new Vue({
                el: '#panel_href',
                data: {
                    href: field.href,
                    description: field.description
                },
                methods: {
                    ok: function () {
                        if (this.href === '') {
                            alert('请输入链接地址');
                            return;
                        }

                        settingsVm.field.href = this.href;
                        $('.model-panel-shade').hide();
                        $('#panel_href').hide();
                    },
                    cancel: function () {
                        $('.model-panel-shade').hide();
                        $('#panel_href').hide();
                    }
                }
            });
        } else {
            corFieldVm.corFields = corFields;
            corFieldVm.selectedField = undefined;
        }
    }

    // 显示日期设置公式面板
    function showDateFormula(field) {
        var dateFields = [];

        dfs(saveData.usedFields, 'fields', function (fields, currentField, index) {
            if (currentField.id === field.id) {
                for (var i = 0; i < fields.length; i++) {
                    // 添加 日期字段
                    if (fields[i].id !== field.id && fields[i].controlType === 8) {
                        dateFields.push(fields[i]);
                    }
                }
                return true;
            }
        });

        dateFields.push({
            title: '当前日期',
            fieldName: '&Now'
        });

        $('.model-panel-shade').show();
        $('#panel_date_formula').show();
        if (dateFormulaVm === undefined) {
            dateFormulaVm = new Vue({
                el: '#panel_date_formula',
                data: {
                    fields: dateFields,
                    formula: JSON.parse(JSON.stringify(field.formula)),
                    selectedField: undefined
                },
                methods: {
                    selectField: function (field) {
                        var lastExpress = this.formula[this.formula.length - 1];
                        if (this.formula.length > 0 && ['+', '-'].indexOf(lastExpress) === -1) {
                            alert('请选择+/-');
                            return;
                        }
                        this.selectedField = field;
                        this.formula.push(field.fieldName);
                    },
                    addOperator: function (operator) {
                        this.formula.push(operator);
                    },
                    ok: function () {
                        settingsVm.field.formula = this.formula;
                        $('.model-panel-shade').hide();
                        $('#panel_date_formula').hide();
                    },
                    cancel: function () {
                        $('.model-panel-shade').hide();
                        $('#panel_date_formula').hide();
                    }
                }
            });
        } else {
            dateFormulaVm.fields = dateFields;
            dateFormulaVm.formula = field.formula;
            dateFormulaVm.selectedField = undefined;
        }
    }

    // 显示数字计算公式面板
    function showNumberFormula(field) {
        var numberFields = [];
        var count = 0;
        dfs(saveData.usedFields, 'fields', function (fields, currentField, index) {
            if (currentField.id === field.id) {
                for (var i = 0; i < fields.length; i++) {
                    // 添加 数字字段
                    if (fields[i].id !== field.id && fields[i].controlType === 7) {
                        numberFields.push(fields[i]);
                    }
                }
                count++;
                if (count === 2) return true;
            }

            if (field.isSubTableField) {
                if (currentField.id === field.tableId) {
                    for (var i = 0; i < fields.length; i++) {
                        // 添加 数字字段
                        if (fields[i].id !== field.id && fields[i].controlType === 7) {
                            numberFields.push(fields[i]);
                        }
                    }
                    count++;
                    if (count === 2) return true;
                }
            }
        });

        $('.model-panel-shade').show();
        $('#panel_number_formula').show();
        if (numberFormulaVm === undefined) {
            numberFormulaVm = new Vue({
                el: '#panel_number_formula',
                data: {
                    fields: numberFields,
                    formula: JSON.parse(JSON.stringify(field.formula)),
                    selectedField: undefined
                },
                methods: {
                    selectField: function (field) {
                        this.selectedField = field;
                        this.formula.push(field.fieldName);
                    },
                    addOperator: function (operator) {
                        this.formula.push(operator);
                    },
                    ok: function () {
                        settingsVm.field.formula = this.formula;
                        $('.model-panel-shade').hide();
                        $('#panel_number_formula').hide();
                    },
                    cancel: function () {
                        $('.model-panel-shade').hide();
                        $('#panel_number_formula').hide();
                    }
                }
            });
        } else {
            numberFormulaVm.fields = numberFields;
            numberFormulaVm.formula = field.formula;
            numberFormulaVm.selectedField = undefined;
        }
    }

    // 显示属性设置面板
    function initSettingsVm() {
        settingsVm = new Vue({
            el: '#settings',
            data: {
                field: undefined
            },
            methods: {
                showHref: function (field) {
                    showHref(field);
                },
                showCorField: function (field) {
                    var corFields = [];
                    // 大写
                    if (field.type === 'dx') {
                        for (var i = 0; i < saveData.usedFields.length; i++) {
                            if (saveData.usedFields[i].controlType === 7) {
                                corFields.push(saveData.usedFields[i]);
                            }
                        }
                    } else {
                        dfs(saveData.usedFields, 'fields', function (fields, currentField, index) {
                            if (currentField.id === field.id) {
                                for (var i = 0; i < fields.length; i++) {
                                    if (fields[i].isCorField) {
                                        corFields.push(fields[i]);
                                    }
                                }
                                return true;
                            }
                        });
                    }
                    showCorField(corFields, field.type);
                },
                showCorProperty: function (field) {
                    showCorProperty(field);
                },
                showFormula: function (field) {
                    if (field.controlType === 1 || field.controlType === 31) {
                        showDateFormula(field);
                    } else if (field.controlType === 7) {
                        showNumberFormula(field);
                    }
                },
                pickImage: function () {
                    $('#imagePicker').click();
                },
                setImageSrc: function (field, evt) {
                    var file = evt.target.files[0];
                    var reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = function (e) {
                        field.picUrl = this.result;
                    };
                }
            }
        });
    }

    // Vue字段控件注册
    function registerControlComponent() {
        Vue.component('control-element', {
            template: '#control-element-template',
            props: ['object', 'field'],
            updated: function () {
                this.$nextTick(function () {
                    $('#phone').scrollable('checkScroll');
                });
            },
            methods: {
                controlClass: function (field) {
                    return {
                        control: true,
                        selected: field === settingsVm.field
                    }
                },
                checkScroll: function () {
                    $('#phone').scrollable('checkScroll');
                },
                title: function (field) {
                    var arr = [];
                    field.type !== 'table' && arr.push('点击编辑');
                    arr.push('拖动排序');
                    return arr.join(',');
                },
                value: function (field) {
                    if (field.controlType !== 8) return field.defaultValue || '';
                    var formatter = field.containHour ? 'yyyy-MM-dd hh:mm' : 'yyyy-MM-dd';
                    if (field.currentTime) return format(new Date(), formatter);
                    if (field.defaultValue == '') return '';
                    return format(field.defaultValue, formatter);
                },
                hover: function (ev, field) {
                    // hover时, 如果父节点是控件, 取消父节点hover状态
                    $('#phone>.scroll-inner .hover').removeClass('hover');
                    var $control = $(ev.target);
                    $control.addClass('hover');
                },
                unHover: function (ev, field) {
                    var $control = $(ev.target);
                    // 取消hover时, 如果父节点是控件, 将父节点设置为hover状态
                    var $pControl = $control.parent().closest('.control');
                    if ($pControl.length) {
                        $pControl.addClass('hover');
                    }
                    $control.removeClass('hover');
                },
                controlToggle: function (field) {
                    field.isUnFold = !field.isUnFold;
                    var id = field.id;
                    field.id = 10002;
                    field.id = id;

                    this.$nextTick(function () {
                        this.checkScroll();
                    });
                },
                controlClick: function (ev, field) {
                    settingsVm.field = field;
                    // 重新渲染后原来的hover状态丢失了
                    this.$nextTick(function () {
                        $(ev.target).closest('.control').addClass('hover')
                    });
                },
                controlDelete: function (field) {
                    controlDelete(field);
                    this.$nextTick(function () {
                        this.checkScroll();
                    });
                }
            }
        });
    }

    // 删除控件
    function controlDelete(field) {
        $('#control-container-' + field.id).remove();
        if (field === settingsVm.field) {
            settingsVm.field = undefined;
        }
        if (field.type == 'table') {
            for (var i = 0; i < controlsVm.tables.length; i++) {
                if (controlsVm.tables[i].id === field.id) {
                    controlsVm.tables.splice(i, 1);
                }
            }
        }
        dfs(saveData.usedFields, 'fields', function (fields, currentField, index) {
            if (currentField === field) {
                fields.splice(index, 1);
                return true;
            }
        });
        dfs(saveData.allFields, 'fields', function (fields, currentField, index) {
            if (currentField.id === field.id) {
                currentField.isUsed = false;
                if (currentField.fields && currentField.fields.length) {
                    for (var j = 0; j < currentField.fields.length; j++) {
                        currentField.fields[j].isUsed = false;
                    }
                }
                return true;
            }
        });
    }

    // 显示已用的字段到手机面板
    function showUsedFields() {
        dfs(saveData.usedFields, 'fields', function (fields, currentField, index) {
            createFieldControl(currentField);
        });
    }

    // 对json数据中的字段排序
    function sort(field, type) {
        if (type !== 'up' && type !== 'down') return;
        dfs(saveData.usedFields, 'fields', function (fields, currentField, index) {
            if (currentField === field) {
                var anotherIndex = type === 'up' ? index - 1 : index + 1;
                arraySwap(fields, index, anotherIndex);
                return true;
            }
        });
    }

    // 获取保存数据
    function getSaveData() {
        //todo 编辑时从后台获取数据
        // $.ajax({
        //     url: '',
        //     method:'POST',
        //     success: function (data) {
        //         saveData = data;
        //     },
        //     dataType: 'json',
        //     async: false
        // });

        function getData() {
            var res = {};
            $.ajax({
                url: '../assets/json/fields.json',
                method: 'GET',
                success: function (data) {
                    res = data;
                },
                dataType: 'json',
                async: false
            });
            return res;
        }

        var data = getData();
        saveData = JSON.parse(localStorage.getItem('saveData')) || {};
        saveData.allFields = saveData.allFields || data.fields;
        saveData.fixedFields = saveData.fixedFields || data.fixedFields;
        saveData.usedFields = saveData.usedFields || [];
    }

    // 绑定事件
    function bindEvents() {
        $('#toolbar-fontColor').click(function (ev) {
            if (!fontColorPickerInstance) {
                fontColorPickerInstance = new colorPicker({
                    el: this,
                    setColor: function (c) {
                        if (!settingsVm || !settingsVm.field) return;
                        settingsVm.field.style = $.extend({}, settingsVm.field.style, {
                            color: c
                        });
                    }
                });
            }
            fontColorPickerInstance.toggle();
            bgColorPickerInstance && bgColorPickerInstance.hide();
        });
        $('#toolbar-bgColor').click(function (ev) {
            if (!bgColorPickerInstance) {
                bgColorPickerInstance = new colorPicker({
                    el: this,
                    setColor: function (c) {
                        if (!settingsVm || !settingsVm.field) return;
                        settingsVm.field.style = $.extend({}, settingsVm.field.style, {
                            backgroundColor: c
                        });
                    }
                });
            }
            bgColorPickerInstance.toggle();
            fontColorPickerInstance && fontColorPickerInstance.hide();
        });
        $('#toolbar-fontFamilyPicker').change(function (ev) {
            if (!settingsVm || !settingsVm.field) return;
            settingsVm.field.style = $.extend({}, settingsVm.field.style, {
                fontFamily: this.value
            });
        });
        $('#toolbar-fontSizePicker').change(function (ev) {
            if (!settingsVm || !settingsVm.field) return;
            settingsVm.field.style = $.extend({}, settingsVm.field.style, {
                fontSize: this.value + 'px'
            });
        });
        // 预览
        $('#btnPreview').click(function (ev) {
            window.open('preview.html');
        });
        // 保存
        $('#btnSave').click(function (ev) {
            localStorage.setItem("saveData", JSON.stringify(saveData));
            location.reload();
        });
        //工作面板
        $('#work').click(function (ev) {
            var $dom = $(ev.target);
            if (!$dom.is('.control,.control *, #settings, #settings *')) {
                settingsVm.field = undefined;
            }
        });
        // 全局事件
        $(document)
            .on('selectstart', function (ev) {
                // 禁止结点选中文字
                return false;
            })
            .on('contextmenu', function (ev) {
                // 阻止默认的右键菜单
                ev.preventDefault();
            })
            .on('click', function (ev) {
                var $dom = $(ev.target);
                if (!$dom.is('#toolbar-bgColor, #toolbar-bgColor *')) {
                    if (bgColorPickerInstance) {
                        bgColorPickerInstance.hide();
                    }
                }
                if (!$dom.is('#toolbar-fontColor, #toolbar-fontColor *')) {
                    if (fontColorPickerInstance) {
                        fontColorPickerInstance.hide();
                    }
                }
            });
    }

    function scrollPhone() {
        var $phoneBorder = $('#phone-border');
        var phoneBorderLeftWidth = parseFloat($phoneBorder.css('border-left-width'));
        $('#phone').scrollable({
            scrollStyle: {
                inner: {
                    paddingLeft: 'calc(40% + ' + phoneBorderLeftWidth + 'px)',
                    zIndex: 1
                },
                bar: {
                    backgroundColor: 'white',
                    left: $phoneBorder.offset().left + $phoneBorder.width() + phoneBorderLeftWidth
                },
                btn: {
                    backgroundColor: 'rgba(88,88,88,0.6)'
                }
            }
        });
    }

    $(function () {
        scrollPhone();
        registerControlComponent();
        initSettingsVm();
        getSaveData();
        showFields();
        showUsedFields();
        bindEvents();
    });
})(jQuery, window);