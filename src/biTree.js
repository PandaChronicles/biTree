var biTree = function(canvasId,dataarr) {
    /************************常量***************************/
    var apartwidth  = 120;    //相距宽度
    var apartheight = 100;    //相距高度
    var iconwidth   = 80;     //图标宽度
    var iconheight  = 60;     //图标高度
    var canvas_f    = 1.5;    //放大缩小倍数
    var offsetCanvasHeight = 20;
    var offsetAlphaHeight  = 5;     // 发出点纵坐标向上偏移量
    var offsetDeltaHeight  = 2;     // 终止点纵坐标(不计入箭头长度(10))向上偏移量
    var offsetCCHeight     = 7;     // 出厂终止点纵坐标(不计入箭头长度(10))向上偏移量

    var nd_lv     = {};             // 各节点层级
    var nd_lt     = {};             // 各节点层级 - 记录发出点终止点位数
    var ln_list   = new Array();    // 合同树链表
    var matrix    = new Array();    // 节点矩阵
    var nodes     = new Array();    // 节点集合
    var linestyle = new Array();

    var arrwidth  = 0; //横向数量
    var arrheight;     //纵向数量

    var canvas  = document.getElementById(canvasId)  //画布ID
    var context = canvas.getContext("2d");           //创建画布

    if (canvas == null)
    {
        return false;
    }
    /******************************************************/
    /************************直线样式************************/
    function translinestyle(style){
        var stylearr = new Array();
        switch (style)
        {
            case "0"://黑
                stylearr[0] = "#000000";
                stylearr[1] = "1";
                stylearr[2] = "";
                break;
            case "1"://蓝
                stylearr[0] = "#00A0E9";//颜色
                stylearr[1] = "2";//粗细
                stylearr[2] = "";//实虚
                break;
            case "2"://绿
                stylearr[0] = "#1A8C3B";
                stylearr[1] = "2";
                stylearr[2] = "";
                break;
            case "3"://虚线蓝
                stylearr[0] = "#171C61";
                stylearr[1] = "2";
                stylearr[2] = "dashed";
                break;
            case "4"://红
                stylearr[0] = "#E83828";
                stylearr[1] = "2";
                stylearr[2] = "";
                break;             
        }
        return stylearr;
    }
    function transccpng(style){
        var stylearr;
        switch (style)
        {
            case "":
                stylearr = "CC1";//CC1
                break;
            case "1":
                stylearr = "CC1";//CC1
                break;
            case "2":
                stylearr = "CC2";//CC2
                break;
            case "3":
                stylearr = "CC3";//CC3
                break;          
        }
        return stylearr;
    }
    /******************************************************/
    /************************虚线函数************************/
    CanvasRenderingContext2D.prototype.dashedLineTo = function (fromX, fromY, toX, toY, pattern) {
        // default interval distance -> 5px
        if (typeof pattern === "undefined") {
            pattern = 5;
        }
        // calculate the delta x and delta y
        var dx = (toX - fromX);
        var dy = (toY - fromY);
        var distance = Math.floor(Math.sqrt(dx*dx + dy*dy));
        var dashlineInteveral = (pattern <= 0) ? distance : (distance/pattern);
        var deltay = (dy/distance) * pattern;
        var deltax = (dx/distance) * pattern;
        // draw dash line
        this.beginPath();
        for(var dl=0; dl<dashlineInteveral; dl++) {
            if(dl%2) {
                this.lineTo(fromX + dl*deltax, fromY + dl*deltay);
            } else {
                this.moveTo(fromX + dl*deltax, fromY + dl*deltay);
            }
        }
        // console.log('dashedLineTo--lineTo:('+fromX+','+fromY+')');
        this.stroke();
    };
    /******************************************************/
    /************************三角形函数**********************/
    function drawtriangle(coo1X, coo1Y, coo2X, coo2Y, coo3X, coo3Y, color) {
        if (typeof color === "undefined") {
            color = "#000";
        }
        var dx = (coo1X + coo2X) / 2;
        var dy = (coo1Y + coo2Y) / 2;
        context.beginPath();
        context.moveTo(coo1X,coo1Y);
        context.lineTo(coo2X,coo2Y);
        context.lineTo(coo3X,coo3Y);
        context.closePath();
        context.fillStyle = color;
        context.fill();
    }
    /******************************************************/
    /*******************根据方向画三角************************/
    function drawtriangle_toward(x, y, direction, color) {
        if (typeof color === "undefined") {
            color = "#000";
        }
        var arc;
        switch(direction) {
            case "up" :
                arc = Math.PI / 2;
                break;
            case "down" :
                arc = - Math.PI / 2;
                break;
            case "left" :
                arc = Math.PI;
                break;
            case "right" :
                arc = 0;
                break;
        }
        drawtriangle_by_arc(x,y,arc,10,color);
    }

    function drawtriangle_by_arc(x,y,arc,side_len,color) {
        var ax = x + side_len * Math.cos(arc);
        var ay = y - side_len * Math.sin(arc);
        var bx = x + side_len * Math.cos(arc + Math.PI / 2) / 2;
        var by = y - side_len * Math.sin(arc + Math.PI / 2) / 2;
        var cx = x + side_len * Math.cos(arc - Math.PI / 2) / 2;
        var cy = y - side_len * Math.sin(arc - Math.PI / 2) / 2;
        drawtriangle(ax, ay, bx, by, cx, cy, color);
    }


    // 根据各线的开始结束点，建立链表
    for (var i = 0; i < dataarr.length; i++) {
        var p_fm = dataarr[i][8];
        var p_to = dataarr[i][9];
        if (p_to == '报废') {
            dataarr[i][12] = 2;
            dataarr[i][9] = '转出';
            p_to = '转出';
        }
        if (p_to == '无委托') {
            dataarr[i][12] = 1;
            dataarr[i][9] = '转出';
            p_to = '转出';
        }
        // 线的开始和结束点是空的、转入、转出，跳过
        if (isNull(p_fm) || isNull(p_to) || p_fm == '转入' || p_to == '转出' || p_fm == p_to) {
            if ((!isNull(p_fm) && p_fm != '转入')||(p_fm == p_to)) {
                for (var j = 0; j < ln_list.length; j++) {
                    var l_hd = ln_list[j][0];
                    var l_ed = ln_list[j][ln_list[j].length - 1];
                    if (l_ed === p_fm) {
                        is_exist = true;
                        break;
                    }
                    if (l_hd === p_fm) {
                        is_exist = true;
                        break;
                    }
                }
                // add new line
                if (!is_exist) {
                    ln_list[ln_list.length] = new Array();
                    ln_list[ln_list.length-1].push(p_fm);
                }
            }
            if (!isNull(p_to) && p_to != '转出') {
                for (var j = 0; j < ln_list.length; j++) {
                    var l_hd = ln_list[j][0];
                    var l_ed = ln_list[j][ln_list[j].length - 1];
                    if (l_ed === p_to) {
                        is_exist = true;
                        break;
                    }
                    if (l_hd === p_to) {
                        is_exist = true;
                        break;
                    }
                }
                // add new line
                if (!is_exist) {
                    ln_list[ln_list.length] = new Array();
                    ln_list[ln_list.length-1].push(p_to);
                }
            }
            continue;
        }
        var is_exist = false;
        // 循环已建链表，链表头是结束点or链表尾是开始点时
        for (var j = 0; j < ln_list.length; j++) {
            var l_hd = ln_list[j][0];
            var l_ed = ln_list[j][ln_list[j].length - 1];
            if (l_ed === p_fm) {
                // 尾部追加结点
                ln_list[j].push(p_to);
                // 新链表尾 == 某链表头，新链表接此链表，删除此链表
                for (var k = 0; k < ln_list.length; k++) {
                    if (j === k) {
                        continue;
                    }
                    if (ln_list[j][ln_list[j].length - 1] === ln_list[k][0]) {
                        ln_list[j] = ln_list[j].concat(ln_list[k].slice(1));
                        ln_list.splice(k,1);
                        break;
                    }
                }
                is_exist = true;
                break;
            }
            if (l_hd === p_to) {
                // 头部插入结点
                ln_list[j].unshift(p_fm);
                // 链表集中头尾相同结点的链表连接成新链表
                for (var k = 0; k < ln_list.length; k++) {
                    if (j === k) {
                        continue;
                    }
                    if (ln_list[k][ln_list[k].length - 1] === ln_list[j][0]) {
                        ln_list[k] = ln_list[k].concat(ln_list[j].slice(1));
                        ln_list.splice(j,1);
                        break;
                    }
                }
                is_exist = true;
                break;
            }
        }
        // add new line
        if (!is_exist) {
            ln_list[ln_list.length] = new Array();
            ln_list[ln_list.length-1].push(p_fm, p_to);
        }
    }
    console.log(ln_list);
    // 0: Array[4] 0: "H032_04" 1: "C302_08"   2: "Q116_08" 3: "Q118_1501"
    // 1: Array[4] 0: "C302_08" 1: "Q118_15"   2: "Q161_15" 3: "期货出厂"
    // 2: Array[4] 0: "C302_08" 1: "Q118_1501" 2: "Q161_15" 3: "统货出厂"
    // 3: Array[4] 0: "C302_08" 1: "Q518_15"   2: "Q161_16" 3: "期货出厂"
    // 4: Array[2] 0: "Q118_15" 1: "期货出厂"
    // 5: Array[2] 0: "Q161_15" 1: "现货出厂"
    // 6: Array[2] 0: "Q162_15" 1: "期货出厂"
    // 7: Array[2] 0: "Q162_15" 1: "统货出厂"
    // 8: Array[2] 0: "Q161_16" 1: "统货出厂"

    // 记算层级
    var lv_0_num = 0;
    var lv_0_set = 0;
    for (var i = 0; i < ln_list.length; i++) {
        var ll = ln_list[i].length;
        if (ll == 1) {
            lv_0_num++;
        }
    }
    lv_0_set = lv_0_num;
    for (var i = 0; i < ln_list.length; i++) {
        // 线开始点，如果没有设置层级，那么设为0
        var node0 = ln_list[i][0];
        var ll = ln_list[i].length;
        if (isNull(nd_lv[node0])) {
            if (ll > 1) {
                nd_lv[node0] = 0+lv_0_num;
            } else {
                nd_lv[node0] = 0+(lv_0_num - lv_0_set);
                lv_0_set--;
            }
        }
        // 
        for (var k = 1; k < ln_list[i].length; k++) {
            var nd_k = ln_list[i][k];
            var nd_p = ln_list[i][k-1];
            if (isNull(nd_lv[nd_k])) {
                nd_lv[nd_k] = nd_lv[nd_p] + 1;
            } else {
                nd_lv[nd_k] = nd_lv[nd_k] > (nd_lv[nd_p] + 1) 
                            ? nd_lv[nd_k] : (nd_lv[nd_p] + 1);
            }
        }
    }
    for (var i = 0; i < ln_list.length; i++) {
        // 线开始点，如果没有设置层级，那么设为0
        var node0 = ln_list[i][0];
        if (isNull(nd_lv[node0])) {
            nd_lv[node0] = 0;
        }
        // 
        for (var k = 1; k < ln_list[i].length; k++) {
            var nd_k = ln_list[i][k];
            var nd_p = ln_list[i][k-1];
            if (isNull(nd_lv[nd_k])) {
                nd_lv[nd_k] = nd_lv[nd_p] + 1;
            } else {
                nd_lv[nd_k] = nd_lv[nd_k] > (nd_lv[nd_p] + 1) 
                            ? nd_lv[nd_k] : (nd_lv[nd_p] + 1);
            }
        }
    }

    // 
    var a_val = isNull(nd_lv['现货出厂']) ? 0 : nd_lv['现货出厂'];
    var b_val = isNull(nd_lv['期货出厂']) ? 0 : nd_lv['期货出厂'];
    var c_val = isNull(nd_lv['统货出厂']) ? 0 : nd_lv['统货出厂'];
    var max = a_val;
    if (b_val > max) max = b_val;
    if (c_val > max) max = c_val;
    if (!isNull(nd_lv['现货出厂'])) nd_lv['现货出厂'] = max;
    if (!isNull(nd_lv['期货出厂'])) nd_lv['期货出厂'] = max;
    if (!isNull(nd_lv['统货出厂'])) nd_lv['统货出厂'] = max;
    console.log(nd_lv);

    /*******************************************************/
    /************************建立矩阵************************/
    var matrix_new = new Array();
    var width_max  = 0;
    var height_max = 0;
    for (var key in nd_lv) {
        var x = nd_lv[key];
        if (isNull(nodes[x])) {
            nodes[x] = new Array();
        }
        nodes[x].push(key);
    }

    for (var i = 0; i < nodes.length; i++ ) {
        if (isNull(nodes[i]) || nodes[i].length == 0) {
            nodes[i] = new Array();
            nodes.splice(i,1);
            i=i-1;
            continue;
        }

        for (var j = 0; j < nodes[i].length; j++) {
            nd_lv[nodes[i][j]]=i;
        }
    }

    for (var n in nodes) {
        matrix_new[n] = new Array();
        if (nodes[n].length > 2) {
            matrix_new[n] = [""].concat(nodes[n]);
        // } else if (nodes[n].length == 2) {
        //     matrix_new[n] = [""].concat(nodes[0]).concat([""]).concat(nodes[n][1]);
        } else {
            matrix_new[n] = ["",""].concat(nodes[n]);
        }
        width_max = width_max > (nodes[n].length + 2) 
                    ? width_max : (nodes[n].length + 2);
    }
    var new_cc = matrix_new.pop();
    matrix_new[matrix_new.length] = new Array();
    for (var m in new_cc) {
        var cc = new_cc[m];
        if (cc == "期货出厂") {
            // new_cc[m] = "CC1";
            matrix_new[matrix_new.length - 1][2] = "CC1";
        } else if (cc == "现货出厂") {
            // new_cc[m] = "CC3";
            matrix_new[matrix_new.length - 1][1] = "CC3";
        } else if (cc == "统货出厂") {
            // new_cc[m] = "CC2";
            matrix_new[matrix_new.length - 1][3] = "CC2";
        }
    }

    // matrix_new.pop();
    height_max = matrix_new.length;
    matrix     = matrix_new;
    arrwidth   = width_max > 5 ? width_max : 5;
    arrheight  = height_max;
    console.log('---------------');
    console.log(nodes);
    console.log(matrix_new);
    console.log(matrix);
    console.log('---------------');
    var cPx = 2;
    if (arrwidth%2==0) {
        cPx = (arrwidth-2)/2+1;     //cPx = (arrwidth+1)/2  //1,2=1;3,4=2;5,6=3;7,8=4;取中心列
    } else {
        cPx = (arrwidth-1)/2+1;
    }

    $("#"+canvasId).attr("width",arrwidth*(iconwidth+apartwidth)-apartwidth);
    $("#"+canvasId).css("width",arrwidth*(iconwidth+apartwidth)-apartwidth);
    $("#canvas").css("width",arrwidth*(iconwidth+apartwidth)-apartwidth);
    $("#"+canvasId).attr("height",arrheight*(iconheight+apartheight));
    $("#"+canvasId).css("height",arrheight*(iconheight+apartheight));


    for (var nd_lv_str in nd_lv) {
        var key = nd_lv_str;
        if (key == '期货出厂') {
            key = 'CC1';
        } else if (key == '统货出厂') {
            key = 'CC2';
        } else if (key == '现货出厂') {
            key = 'CC3';
        }
        nd_lt[key] = {};
        nd_lt[key].pos = findnode(key);
        nd_lt[key].begin = new Array();
        nd_lt[key].end = new Array();
        var beg_no = 0;
        var end_no = 0;
        for (var i = 0; i < dataarr.length; i++) {
            var linestyle=translinestyle(dataarr[i][11]);
            var p_fm = dataarr[i][8];
            var p_to = dataarr[i][9];
            if (p_to == '期货出厂') {
                p_to = 'CC1';
            } else if (p_to == '统货出厂') {
                p_to = 'CC2';
            } else if (p_to == '现货出厂') {
                p_to = 'CC3';
            }
            if (p_fm == '转入' || p_to == '转出' || isNull(p_fm) || isNull(p_to)) {
                continue;
            }
            var coo_fm = findnode(p_fm);
            var coo_to = findnode(p_to);
            if (key === p_fm) {
                var point = {};
                point.line_no = i;
                point.str = p_to;
                point.coo = coo_to;
                point.linestyle = linestyle[0];
                nd_lt[key].begin.push(point);
            }
            if (key === p_to) {
                var point = {};
                point.line_no = i;
                point.str = p_fm;
                point.coo = coo_fm;
                point.linestyle = linestyle[0];
                nd_lt[key].end.push(point);
            }
        }
        var beg_sites = new Array(nd_lt[key].begin.length);
        for (var i = 0; i < nd_lt[key].begin.length; i++) {
            var nd_i = nd_lt[key].begin[i].str;
            beg_sites[i] = nd_i;
        }
        var end_sites = new Array(nd_lt[key].end.length);
        for (var i = 0; i < nd_lt[key].end.length; i++) {
            var nd_i = nd_lt[key].end[i].str;
            end_sites[i] = nd_i;
        }

        var i = 0;
        var j,d;
        for (; i < nd_lt[key].begin.length; i++) {
            for (j = 0; j < nd_lt[key].begin.length; j++) {
                var nd_i = beg_sites[i];
                var nd_i_coo = findnode(nd_i);
                var nd_j = beg_sites[j];
                var nd_j_coo = findnode(nd_j);
                if (nd_i_coo[0] < nd_j_coo[0] 
                    || (nd_i_coo[0] == nd_j_coo[0] && nd_i_coo[1] < nd_j_coo[1])) {
                    d = beg_sites[j];
                    beg_sites[j] = beg_sites[i];
                    beg_sites[i] = d;
                }
            }
        }
        var s_val = 0;
        // 相同颜色的线出发点应相同
        // 循环 begin 取 linestyle 
        for (var i = 0; i < beg_sites.length; i++) {
            for (var j = 0; j < nd_lt[key].begin.length; j++) {
                if (beg_sites[i] == nd_lt[key].begin[j].str) {
                    nd_lt[key].begin[j].site = i;
                }
            }
        }

        var ss_val = new Array();
        for (var i = 0; i < nd_lt[key].begin.length; i++) {
            for (var j = i; j < nd_lt[key].begin.length; j++) {
                if (nd_lt[key].begin[i].linestyle == nd_lt[key].begin[j].linestyle) {
                    if (nd_lt[key].begin[i].site > nd_lt[key].begin[j].site) {
                        nd_lt[key].begin[i].site = nd_lt[key].begin[j].site;
                    } else {
                        nd_lt[key].begin[j].site = nd_lt[key].begin[i].site;
                    }
                }
            }
            if (!contains(ss_val,nd_lt[key].begin[i].site)) {
                ss_val.push(nd_lt[key].begin[i].site);
            }
        }

        i = 0;
        for (; i < ss_val.length; i++) {
            for (j = 0; j < ss_val.length; j++) {
                if (ss_val[i] < ss_val[j]) {
                    d = ss_val[j];
                    ss_val[j] = ss_val[i];
                    ss_val[i] = d;
                }
            }
        }

        for (var i = 0; i < nd_lt[key].begin.length; i++) {
            for (var j = 0; j < ss_val.length; j++) {
                if (nd_lt[key].begin[i].site == ss_val[j]) {
                    nd_lt[key].begin[i].site = j;
                    break;
                }
            }
        }

        // end point sorting
        // 列号相同的，行号大的排前面
        // 列号小的排前面
        var k = 0;
        var m;
        for (; k < nd_lt[key].end.length; k++) {
            for (m = 0; m < nd_lt[key].end.length; m++) {
                var nd_i     = end_sites[k];
                var nd_i_coo = findnode(nd_i);
                var nd_j     = end_sites[m];
                var nd_j_coo = findnode(nd_j);
                if ((nd_i_coo[0] > nd_j_coo[0] && nd_i_coo[1] == nd_j_coo[1])
                    || (nd_i_coo[1] < nd_j_coo[1])) {
                    d = end_sites[k];
                    end_sites[k] = end_sites[m];
                    end_sites[m] = d;
                }
            }
        }
        for (var i = 0; i < end_sites.length; i++) {
            for (var j = 0; j < nd_lt[key].end.length; j++) {
                if (end_sites[i] == nd_lt[key].end[j].str) {
                    nd_lt[key].end[j].site = i;
                }
            }
        }
    }

    function contains(arr, obj) {  
        var i = arr.length;
        while (i--) {  
            if (arr[i] === obj) {
                return true;
            }
        }
        return false;
    }

    function find_line_site(nodeA,nodeB) {
        var site = [0,0];
        for (var i = 0; i < nd_lt[nodeA].begin.length; i++) {
            if (nd_lt[nodeA].begin[i].str == nodeB) {
                site[0] = nd_lt[nodeA].begin[i].site;
                break;
            }
        }
        for (var i = 0; i < nd_lt[nodeB].end.length; i++) {
            if (nd_lt[nodeB].end[i].str == nodeA) {
                site[1] = nd_lt[nodeB].end[i].site;
                break;
            }
        }
        return site;
    }

    /*******************************************************/
    /************************查找节点************************/
    function findnode(node){
        var coordinate = new Array();
        for (var i = 0 ; i < arrheight ; i++) {
            for (var j = 0 ; j < arrwidth ; j++) {
                if (matrix[i][j] == node) {
                    coordinate[0] = i;
                    coordinate[1] = j;
                    return coordinate;
                }
            }
        }
        return 0;
    }

    /*******************************************************/
    /************************直线函数************************/
    var row_line_num = new Array();
    function drawline(nodeA,nodeB,color,lineWidth,dashed)
    {
        var site = find_line_site(nodeA,nodeB);
        var pxA = 5*(site[0]-1);
        var pxB = 5*(site[1]-1);
        context.beginPath();
        var coordinateA = findnode(nodeA);
        var coordinateB = findnode(nodeB);
        var bX,bY,eX,eY;
        var nodeAHCenter = coordinateA[1] * apartwidth + coordinateA[1] * iconwidth + iconwidth / 2;
        var nodeAVBottom = offsetCanvasHeight + coordinateA[0] * apartheight + (coordinateA[0] + 1) * iconheight;
        var nodeBHCenter = coordinateB[1] * apartwidth + coordinateB[1] * iconwidth + iconwidth / 2;
        var nodeBVTop    = offsetCanvasHeight + coordinateB[0] * apartheight + coordinateB[0] * iconheight;
        context.strokeStyle=color;
        context.lineWidth=lineWidth;
        // 根据 上-->下、同层-->同层、下层-->上层
        if (coordinateB[0]>coordinateA[0]) {
            // 从上层指向下层

            bX = nodeAHCenter + pxA;
            bY = nodeAVBottom - offsetAlphaHeight;
            eX = nodeBHCenter + pxB;
            eY = nodeBVTop - offsetDeltaHeight;

            if (coordinateB[0]-coordinateA[0]==1) {
                // 上下相临层
                if(coordinateA[1]==coordinateB[1]) {
                    // 上下同列
                    pxB = pxA;
                    eX = nodeBHCenter + pxB;

                    if (dashed=="dashed")
                    {
                        context.dashedLineTo(bX,bY,eX,eY);
                    } else {
                        context.moveTo(bX,bY);
                        context.lineTo(eX,eY);
                        context.stroke();
                    }
                    drawtriangle_toward(eX,eY,'down',color);
                } else {
                    // 上下不同列
                    // 起点向下1/2的apart高度，再横向到终点列，再向下到终点。

                    var y_p_pos = 3*apartheight/4;
                    // 起点的列大于终点，折线走上层
                    if (coordinateA[1] > coordinateB[1]) {
                        y_p_pos = apartheight/4;
                        if (matrix[coordinateA[0]][coordinateA[1]-1] != "") {
                            y_p_pos = 3*apartheight/4;
                        }
                    }

                    if (coordinateA[1] < coordinateB[1]) {
                        eX = eX - 5*(site[1]+coordinateB[1]-coordinateA[1]+1);
                    }
                    if (dashed=="dashed") {
                        context.dashedLineTo(bX,bY,bX,bY+apartheight/2);
                        context.dashedLineTo(bX,bY+apartheight/2,eX,bY+apartheight/2);
                        context.dashedLineTo(eX,bY+apartheight/2,eX,eY);
                    } else {
                        context.moveTo(bX,bY);
                        context.lineTo(bX,bY+y_p_pos);
                        context.lineTo(eX,bY+y_p_pos);
                        context.lineTo(eX,eY);
                        context.stroke();
                    }
                    drawtriangle_toward(eX,eY,'down',color);
                }
            }
            else
            {
                // 隔层
                // 起点：图片下方中心点。终点：图片上方中心点。
                // 起点向下1/2apart高度，水平向左1/2 (icon+apart)，然后向下至 终点纵坐标上方（1/2apart高度-10）处。
                // 然后水平到终点上方，(1/2apartheight-10)，再向下到终点

                if (dashed=="dashed") {
                    context.dashedLineTo(bX,bY,bX,bY+apartheight/2);
                    context.dashedLineTo(bX,bY+apartheight/2,bX-iconwidth/2-apartheight/2,bY+apartheight/3);
                    context.dashedLineTo(bX-iconwidth/2-apartheight/2,bY+apartheight/3,bX-iconwidth/2-apartheight/2,eY+10-apartheight/2);
                    context.dashedLineTo(bX-iconwidth/2-apartheight/2,eY+10-apartheight/3,eX,eY+10-apartheight/2);
                    context.dashedLineTo(eX,eY+10-apartheight/3,eX,eY);
                } else {
                    context.moveTo(bX,bY);
                    var x_p_pos = apartwidth/2;
                    var x_p_pos2 = apartwidth/3;
                    var y_p_pos = apartheight/3+5;
                    context.lineTo(bX,bY+y_p_pos);
                    if (coordinateA[1] < coordinateB[1]) {
                        context.lineTo(bX+iconwidth/2+x_p_pos2,bY+y_p_pos);
                        context.lineTo(bX+iconwidth/2+x_p_pos2,eY+10-y_p_pos);
                        context.lineTo(eX,eY+10-y_p_pos);
                        context.lineTo(eX,eY);
                    } else {
                        eX = eX - 5*(site[1]+coordinateB[1]-coordinateA[1]+1);
                        context.lineTo(bX-iconwidth/2-x_p_pos,bY+y_p_pos);
                        context.lineTo(bX-iconwidth/2-x_p_pos,eY+10-y_p_pos);
                        context.lineTo(eX,eY+10-y_p_pos);
                        context.lineTo(eX,eY);
                    }
                    context.stroke();
                }
                drawtriangle_toward(eX,eY,'down',color);
            }
        } else if(coordinateB[0]==coordinateA[0]&&coordinateB[1]==coordinateA[1]) {
            // 同层、同列
            // 起点：图标右侧，1/3图片高度处，
            // 1/3apartwidth
            bX = coordinateA[1]*apartwidth+coordinateA[1]*iconwidth+iconwidth+pxA;
            bY = offsetCanvasHeight + coordinateA[0]*apartheight+coordinateA[0]*iconheight+iconheight/3;
            eX = coordinateA[1]*apartwidth+coordinateA[1]*iconwidth+iconwidth+pxB; //10;
            eY = offsetCanvasHeight + coordinateA[0]*apartheight+coordinateA[0]*iconheight+iconheight*2/3;
            if (dashed=="dashed") {
                context.dashedLineTo(bX,bY,bX+apartwidth/3,bY);
                context.dashedLineTo(bX+apartwidth/3,bY,bX+apartwidth/3,eY);
                context.dashedLineTo(bX+apartwidth/3,eY,eX,eY);
            } else {
                context.moveTo(bX,bY);
                context.lineTo(bX+apartwidth/3,bY);
                context.lineTo(bX+apartwidth/3,eY);
                context.lineTo(eX,eY);
                context.stroke();
            }
            drawtriangle_toward(eX,eY,'left',color);
        }
        else
        {
            // 上层、同层不同列
            bX = coordinateA[1]*apartwidth+coordinateA[1]*iconwidth+iconwidth+pxA;
            bY = offsetCanvasHeight + coordinateA[0]*apartheight+coordinateA[0]*iconheight+iconheight/3;
            eX = coordinateB[1]*apartwidth+coordinateB[1]*iconwidth+iconwidth+pxB;//10;
            eY = offsetCanvasHeight + coordinateB[0]*apartheight+coordinateB[0]*iconheight+iconheight*2/3;
            if (dashed=="dashed") {
                context.dashedLineTo(bX,bY,bX+apartwidth/3,bY);
                context.dashedLineTo(bX+apartwidth/3,bY,bX+apartwidth/3,bY-iconheight/2-apartheight/2);
                context.dashedLineTo(bX+apartwidth/3,bY-iconheight/2-apartheight/2,eX-10+apartwidth/3,bY-iconheight/2-apartheight/2);
                context.dashedLineTo(eX-10+apartwidth/3,bY-iconheight/2-apartheight/2,eX-10+apartwidth/3,eY);
                context.dashedLineTo(eX-10+apartwidth/3,eY,eX,eY);
            } else {
                context.moveTo(bX,bY);
                context.lineTo(bX+apartwidth/3,bY);
                context.lineTo(bX+apartwidth/3,bY-iconheight/2-apartheight/2);
                context.lineTo(eX-10+apartwidth/3,bY-iconheight/2-apartheight/2);
                context.lineTo(eX-10+apartwidth/3,eY);
                context.lineTo(eX,eY);
                context.stroke();
            }
            drawtriangle_toward(eX,eY,'left',color);
        }
    }
    var cc_node = {};
    var cc_line_near_y_pos = 0;
    var cc_line_far_y_pos  = 0;
    var cc_line_style_node = new Array();
    var cc_line_style_node_near = new Array();
    function drawccline(nodeA,nodeB,color,lineWidth,dashed)
    {
        var site = find_line_site(nodeA,nodeB);
        if (isNull(cc_node[nodeB])) {
            cc_node[nodeB] = 0;
        }
        // console.log('-----drawccline-----');
        context.beginPath();
        var coordinateA = findnode(nodeA);
        var coordinateB = findnode(nodeB);
        if (coordinateB[0]-coordinateA[0] == 1 && coordinateA[1] < coordinateB[1]) {
            site[1] = (site[1]+1)*(-1);
        }
        if (coordinateB[0]-coordinateA[0] == 1 && coordinateA[1] == coordinateB[1]) {
            site[1] = site[0];
        }
        var pxA = 5*(site[0]-1);
        var pxB = 5*(site[1]-1);
        var bX,bY,eX,eY;
        var straight_flag = 0;
        context.strokeStyle=color;
        context.lineWidth=lineWidth;
        if (Math.abs(coordinateB[0]-coordinateA[0])==2)
        {
            if (matrix[coordinateB[0]-1][cPx-1]==undefined)
            {
                straight_flag=1;
            }
        }
        if (Math.abs(coordinateB[0]-coordinateA[0])==1||straight_flag==1)
        {
            // if (color == '#1A8C3B') {
            //     bX = coordinateA[1]*apartwidth+coordinateA[1]*iconwidth+iconwidth/2 - 5;
            //     bY = coordinateA[0]*apartheight+coordinateA[0]*iconheight+iconheight;
            //     eX = coordinateB[1]*apartwidth+coordinateB[1]*iconwidth+iconwidth/2 - 10-(-1)*cc_node[nodeB]*10;
            //     eY = coordinateB[0]*apartheight+coordinateB[0]*iconheight - offsetCCHeight;
            // } else {
                bX = coordinateA[1]*apartwidth+coordinateA[1]*iconwidth+iconwidth/2 + pxA;
                bY = offsetCanvasHeight + coordinateA[0]*apartheight+coordinateA[0]*iconheight+iconheight - offsetAlphaHeight;
                eX = coordinateB[1]*apartwidth+coordinateB[1]*iconwidth+iconwidth/2 + pxB;//-(-1)*cc_node[nodeB]*10;
                eY = offsetCanvasHeight + coordinateB[0]*apartheight+coordinateB[0]*iconheight - offsetCCHeight;
            // }
            if (dashed=="dashed")
            {
                context.dashedLineTo(bX,bY,bX,eY+10-apartheight/2);
                context.dashedLineTo(bX,eY+10-apartheight/2,eX,eY+10-apartheight/2);
                context.dashedLineTo(eX,bY+apartheight/2,eX,eY);
            }
            else
            {
                context.moveTo(bX,bY);
                // if (color == '#1A8C3B') {
                //     context.lineTo(bX,eY+10-2*apartheight/3+5);
                //     context.lineTo(eX,eY+10-2*apartheight/3+5);
                // } else {
                    if ($.inArray(nodeA+":"+color,cc_line_style_node_near) == -1) {
                        cc_line_style_node_near.push(nodeA+":"+color);
                    }
                    cc_line_near_y_pos = $.inArray(nodeA+":"+color,cc_line_style_node_near);
                    context.lineTo(bX,eY+5*cc_line_near_y_pos-2*apartheight/3);
                    context.lineTo(eX,eY+5*cc_line_near_y_pos-2*apartheight/3);
                    cc_line_near_y_pos++;
                // }
                context.lineTo(eX,eY);
                context.stroke();
            }
            //drawtriangle(eX,eY+10,eX-5,eY,eX+5,eY,color);
            drawtriangle_toward(eX,eY,'down',color);
        }
        else
        {
            bX = coordinateA[1]*apartwidth+coordinateA[1]*iconwidth+iconwidth/2+pxA;//10;
            bY = offsetCanvasHeight + coordinateA[0]*apartheight+coordinateA[0]*iconheight+iconheight - offsetAlphaHeight;
            eX = coordinateB[1]*apartwidth+coordinateB[1]*iconwidth+iconwidth/2+pxB;//-(-1)*cc_node[nodeB]*10;
            eY = offsetCanvasHeight + coordinateB[0]*apartheight+coordinateB[0]*iconheight - offsetCCHeight;
            if (dashed=="dashed")
            {
                context.dashedLineTo(bX,bY,bX,bY+apartheight/2+15);
                context.dashedLineTo(bX,bY+apartheight/2+15,(arrwidth-1)*(iconwidth+apartwidth)-apartwidth*2/3,bY+apartheight/2+15);
                context.dashedLineTo((arrwidth-1)*(iconwidth+apartwidth)-apartwidth*2/3,bY+apartheight/2+15,(arrwidth-1)*(iconwidth+apartwidth)-apartwidth*2/3,eY+10-apartheight/2);
                context.dashedLineTo((arrwidth-1)*(iconwidth+apartwidth)-apartwidth*2/3,eY+10-apartheight/2,eX,eY+10-apartheight/2);
                context.dashedLineTo(eX,eY+10-apartheight/2,eX,eY);
            }
            else
            {
                var is_not_empty = true;
                if (coordinateA[1] == coordinateB[1]) {
                    is_not_empty = false;
                    var l_a2b = coordinateB[0]-coordinateA[0];
                    for (var i = 1; i < l_a2b; i++) {
                        if (!isNull(matrix[coordinateA[0]+i][coordinateA[1]])) {
                            is_not_empty = true;
                            break;
                        }
                    }
                }
                context.moveTo(bX,bY);
                if (is_not_empty) {

                    if ($.inArray(nodeA+":"+color,cc_line_style_node) == -1) {
                        cc_line_style_node.push(nodeA+":"+color);
                    }
                    cc_line_far_y_pos = $.inArray(nodeA+":"+color,cc_line_style_node);
                    var x_p_pos = 0-5*cc_line_far_y_pos;
                    var y_p_pos = apartheight/3-5*cc_line_far_y_pos;
                    var ey_p_pos = apartheight/3+5*cc_line_far_y_pos;
                    context.lineTo(bX,bY+y_p_pos);//apartheight/4+15);
                    context.lineTo((arrwidth-1)*(iconwidth+apartwidth)-apartwidth*2/3+x_p_pos,bY+y_p_pos);//apartheight/4+15);
                    context.lineTo((arrwidth-1)*(iconwidth+apartwidth)-apartwidth*2/3+x_p_pos,eY-ey_p_pos);//+10-apartheight/2);
                    context.lineTo(eX,eY-ey_p_pos);//+10-apartheight/2);
                } else {
                    eX = bX;
                }
                context.lineTo(eX,eY);
                context.stroke();
            }
            //drawtriangle(eX,eY+10,eX-5,eY,eX+5,eY,color);
            drawtriangle_toward(eX,eY,'down',color);
        }
        cc_node[nodeB] = cc_node[nodeB] + 1;
    }
    /*******************************************************/
    /************************图标初始化***********************/
    var image = new Array();
    var iconcoo;
    var iconname;
    var k   = 0;
    var cc1 = 0;
    var cc2 = 0;
    var cc3 = 0;
    var cc  = 0;
    var ccimage1,ccimage2,ccimage3;
    var trsl,trjs,zcsl,zcjs;
    // 显示网格
    var is_show_grid = false;
    if (is_show_grid) {
        for (var i = 0 ; i < arrwidth ; i++)
        {
            context.beginPath();
            context.strokeStyle="#1A8C3B";
            context.lineWidth="1";
            var bX = i*(apartwidth+iconwidth);
            var bY = offsetCanvasHeight + 0;
            var eX = i*(apartwidth+iconwidth);
            var eY = offsetCanvasHeight + arrheight*(apartheight+iconheight);
            //context.dashedLineTo(bX,bY,eX,eY);
            context.moveTo(bX,bY);
            context.lineTo(eX,eY);
            context.stroke();
            context.beginPath();
            context.strokeStyle="#1A8C3B";
            context.lineWidth="1";
            context.strokeStyle="#FF5700";
            // if (i < arrwidth)
            // {
            var bX1 = i*(apartwidth+iconwidth)+iconwidth;
            var bY1 = offsetCanvasHeight + 0;
            var eX1 = i*(apartwidth+iconwidth)+iconwidth;
            var eY1 = offsetCanvasHeight + arrheight*(apartheight+iconheight);
            // context.dashedLineTo(bX1,bY1,eX1,eY1);
            context.moveTo(bX1,bY1);
            context.lineTo(eX1,eY1);
            context.stroke();
            // }
        }
        for (var i = 0 ; i < arrheight ; i++)
        {
            context.beginPath();
            context.strokeStyle="#1A8C3B";
            context.lineWidth="1";
            var bX = 0;
            var bY = offsetCanvasHeight + i*(apartheight+iconheight);
            var eX = arrwidth*(apartwidth+iconwidth);
            var eY = offsetCanvasHeight + i*(apartheight+iconheight);
            // context.dashedLineTo(bX,bY,eX,eY);
            context.moveTo(bX,bY);
            context.lineTo(eX,eY);
            context.stroke();
            context.beginPath();
            context.strokeStyle="#1A8C3B";
            context.lineWidth="1";
            context.strokeStyle="#FF5700";
            // if (i < arrheight)
            // {
            var bX1 = 0;
            var bY1 = offsetCanvasHeight + i*(apartheight+iconheight)+iconheight;
            var eX1 = arrwidth*(apartwidth+iconwidth);
            var eY1 = offsetCanvasHeight + i*(apartheight+iconheight)+iconheight;
            // context.dashedLineTo(bX1,bY1,eX1,eY1);
            context.moveTo(bX1,bY1);
            context.lineTo(eX1,eY1);
            context.stroke();
            // }
        }
    }
    for (var i = 0 ; i < arrheight ; i++)
    {
        for (var j = 0 ; j < arrwidth ; j++)
        {
            if (matrix[i][j])
            {
                image[k] = new Image();

                //image[k].src = "../images/biTree/"+matrix[i][j]+".png";
                //by hwzhu 2014-08-12
                var unit = matrix[i][j].split('_')[0];
                image[k].src = "./WE/images/biTree/"+unit+".png";

                //by hwzhu 2014-08-19
                image[k].title = matrix[i][j];

                iconname = matrix[i][j];
                image[k].onload = function(){
                    var imagedraw = new Image();
                    imagedraw.src = this.src;
                    //by hwzhu 2014-08-12
                    //var    iconcoo = findnode(imagedraw.src.split("biTree/")[1].split(".png")[0]);
                    var    iconcoo = findnode(this.title);

                    context.drawImage(imagedraw,iconcoo[1]*(iconwidth+apartwidth), offsetCanvasHeight +iconcoo[0]*(iconheight+apartheight),iconwidth,iconheight);
                }
                k++;
            }
        }
    }

    for (var i = 0 ; i < dataarr.length ; i++)
    {
        if (dataarr[i][9]=="期货出厂"
            ||dataarr[i][9]=="统货出厂"
            ||dataarr[i][9]=="现货出厂")
        {
            matrix[arrheight-1] = new Array();
        }
        if (dataarr[i][9]=="期货出厂")
        {
            cc1=1;
            cc1png=transccpng(dataarr[i][13]);
        }
        if (dataarr[i][9]=="统货出厂")
        {
            cc2=1;
            cc2png=transccpng(dataarr[i][13]);
        }
        if (dataarr[i][9]=="现货出厂")
        {
            cc3=1;
            cc3png=transccpng(dataarr[i][13]);
        }
    }

    if (cc1==1)
    {
        ccimage1 = new Image();
        ccimage1.src = "./WE/images/biTree/"+cc1png+".png";
        matrix[arrheight-1][cPx-1]="CC1";
        ccimage1.onload = function(){
            context.drawImage(ccimage1,findnode("CC1")[1]*(iconwidth+apartwidth), offsetCanvasHeight +(arrheight-1)*(iconheight+apartheight),iconwidth,iconheight);
        }
        cc++;
    }
    if (cc2==1)
    {
        ccimage2 = new Image();
        ccimage2.src = "./WE/images/biTree/"+cc2png+".png";
        if (cc==0)
        {
            matrix[arrheight-1][cPx-1]="CC2";
        }
        else
        {
            matrix[arrheight-1][cPx]="CC2";
        }
        ccimage2.onload = function(){
            context.drawImage(ccimage2,findnode("CC2")[1]*(iconwidth+apartwidth), offsetCanvasHeight +(arrheight-1)*(iconheight+apartheight),iconwidth,iconheight);
        }
        cc++;
    }
    if (cc3==1)
    {
        ccimage3 = new Image();
        ccimage3.src = "./WE/images/biTree/"+cc3png+".png";
        if (cc==0)
        {
            matrix[arrheight-1][cPx-1]="CC3";
        }
        else if(cc==1)
        {
            matrix[arrheight-1][cPx]="CC3";
        }
        else
        {
            matrix[arrheight-1][cPx-2]="CC3";
        }
        ccimage3.onload = function(){
            context.drawImage(ccimage3,findnode("CC3")[1]*(iconwidth+apartwidth), offsetCanvasHeight +(arrheight-1)*(iconheight+apartheight),iconwidth,iconheight);
        }
    }

    // 改进方向：画转出虚线的时候，同层右侧无结点，出发点可定为右侧中点。
    //         ：连结跨行结点的灰色实线，两结点在同一纵向，中间无结点，则直线连接。
    //         ：连结跨行结点的灰色实线，目标结点在出发点右侧时，实线从下方结点的右侧跨越
    //         ：连结跨行结点的灰色实线，出发点下方需转向时，转向点向上移动至原来的一半，
    //           到达目标点的上方需转向的下移至原来的一半
    //         ：跨越下方结点的线，纵向划线位置向左平移，以避开结的文字说明
    /*******************************************************/
    /************************直线初始化***********************/
    var leavecoo,count;
    var thsl = 0;
    var thjs = 0;
    var xhsl = 0;
    var xhjs = 0;
    var qhsl = 0;
    var qhjs = 0;
    var linearr = new Array();

    for (var i = 0 ; i < dataarr.length ; i++)
    {
        if (dataarr[i][8]&&dataarr[i][9]
            &&dataarr[i][8]!="转入"
            &&dataarr[i][9]!="转出"
            &&dataarr[i][9]!="统货出厂"
            &&dataarr[i][9]!="现货出厂"
            &&dataarr[i][9]!="期货出厂")
        {
            linestyle=translinestyle(dataarr[i][11]);
            drawline(dataarr[i][8],dataarr[i][9],linestyle[0],linestyle[1],linestyle[2]);
            leavecoo=findnode(dataarr[i][8]);
            count=0
            for (var j = 0 ; j < linearr.length ; j++)
            {
                if (linearr[j]==dataarr[i][8])
                {
                    count++;
                }
            }

            //edit 0821
            tempdiv = document.createElement("div");
            tempdiv.id = "icon_"+dataarr[i][8]+"line"+count;
            document.getElementById("canvas").appendChild(tempdiv);
            $("#"+tempdiv.id).addClass("canvas_icon_line");
            $("#"+tempdiv.id).css({"position":"absolute","left":(leavecoo[1]*(iconwidth+apartwidth)-apartwidth)+"px","top":( offsetCanvasHeight +leavecoo[0]*(apartheight+iconheight)+iconheight+apartheight*(4+count)/6-12)+"px","font-size":"12px"});

            $("#"+tempdiv.id).html(dataarr[i][8].split('_')[0]+"-"+dataarr[i][9].split('_')[0]+":"+parseFloat(dataarr[i][6]).toFixed(2)+"/"+parseInt(dataarr[i][7]).toFixed(0));
            //context.fillText(dataarr[i][8]+"-"+dataarr[i][9]+":"+dataarr[i][6]+"/"+dataarr[i][7],leavecoo[1]*(iconwidth+apartwidth)-apartwidth,leavecoo[0]*(apartheight+iconheight)+iconheight+apartheight*(4+count)/6);
            //edit
            linearr.push(dataarr[i][8]);
        }
        //edit 0821
        if (dataarr[i][9]=="期货出厂"&&dataarr[i][8]!="转入")
        {
            linestyle=translinestyle(dataarr[i][11]);
            drawccline(dataarr[i][8],"CC1",linestyle[0],linestyle[1],linestyle[2]);
        }
        if (dataarr[i][9]=="统货出厂"&&dataarr[i][8]!="转入")
        {
            linestyle=translinestyle(dataarr[i][11]);
            drawccline(dataarr[i][8],"CC2",linestyle[0],linestyle[1],linestyle[2]);
        }
        if (dataarr[i][9]=="现货出厂"&&dataarr[i][8]!="转入")
        {
            linestyle=translinestyle(dataarr[i][11]);
            drawccline(dataarr[i][8],"CC3",linestyle[0],linestyle[1],linestyle[2]);
        }
        //edit
    }
    /*******************************************************/
    /************************图标数据初始化********************/
    var trsl,trjs,zcsl,zcjs;
    var canvas_data = {};
    for (var i = 0 ; i < dataarr.length ; i++) {
        if (dataarr[i][8]&&dataarr[i][9]
            &&(dataarr[i][8]=='转入' || dataarr[i][9]=='转出')) {
            if (dataarr[i][8]=='转入') {
                var node = dataarr[i][9];
                if (node=="期货出厂")
                {
                    node="CC1";
                }
                if (node=="统货出厂")
                {
                    node="CC2";
                }
                if (node=="现货出厂")
                {
                    node="CC3";
                }
                if (isNull(canvas_data[node])) {
                    canvas_data[node] = new Array();
                }
                canvas_data[node].push(['转入:'+parseFloat(dataarr[i][4]).toFixed(2)+"/"+parseInt(dataarr[i][5]).toFixed(0),1,'rgb(26, 175, 93)','zr']);
            }
            if (dataarr[i][9]=='转出') {
                var node = dataarr[i][8];
                if (isNull(canvas_data[node])) {
                    canvas_data[node] = new Array();
                }
                if (dataarr[i][12]==1) {
                    canvas_data[node].unshift(['无委托:'+parseFloat(dataarr[i][4]).toFixed(2)+"/"+parseInt(dataarr[i][5]).toFixed(0),1,'rgb(0, 117, 194)','zc']);
                } else if (dataarr[i][12]==2) {
                    canvas_data[node].unshift(['报废:'+parseFloat(dataarr[i][4]).toFixed(2)+"/"+parseInt(dataarr[i][5]).toFixed(0),1,'rgb(242, 197, 0)','zc']);
                } else {
                    canvas_data[node].unshift(['转出:'+parseFloat(dataarr[i][4]).toFixed(2)+"/"+parseInt(dataarr[i][5]).toFixed(0),1,'rgb(244, 91, 0)','zc']);
                }
            }
        }
    }
    for (var i = 0 ; i < arrheight ; i++)
    {
        for (var j = 0 ; j < arrwidth ; j++)
        {
            if (matrix[i][j])
            {

                // tempdiv = document.createElement("div");
                // tempdiv.id = "icon_"+matrix[i][j];
                // document.getElementById("canvas").appendChild(tempdiv);
                // $("#"+tempdiv.id).addClass("canvas_div");
                // $("#"+tempdiv.id).css({"position":"absolute","left":j*(iconwidth+apartwidth)+"px","top":i*(iconheight+apartheight)+"px","width":iconwidth+"px","height":iconheight+"px","background":"rgba(0,0,255,.0)"});
                // $("#"+tempdiv.id).click(function(){alert("点击"+$(this).attr("id"))});

                // draw icon
                tempdiv = document.createElement("div");
                tempdiv.id = "icon_"+matrix[i][j];
                document.getElementById("canvas").appendChild(tempdiv);
                $("#"+tempdiv.id).css({"position":"absolute","left":j*(iconwidth+apartwidth)+"px","top": (offsetCanvasHeight +i*(iconheight+apartheight))+"px","width":iconwidth+"px","height":iconheight+"px","background":"rgba(0,0,255,.0)"});
                var btn ='<p id='+matrix[i][j]+' data-content="" style="width:80px;height:60px;" rel="popover" class="iBtn" ></p>';
                $("#"+tempdiv.id).append(btn);

                // set pie chart data and div
                tempdiv = document.createElement("div");
                tempdiv.id = "canvas_"+matrix[i][j];
                document.getElementById("canvas").appendChild(tempdiv);
                $("#"+tempdiv.id).addClass('icon_canvas');
                xleft = j*(iconwidth+apartwidth)+iconwidth/2 - 120;
                xtop = offsetCanvasHeight + i*(iconheight+apartheight)+iconheight/2 - 120;
                $("#"+tempdiv.id).css({"position":"absolute","left":xleft+"px","top":xtop+"px","width":"240px","height":"240px","display":"none","background":"rgba(0,255,0,.0)"});
                var icon_canvas = '<canvas class="iChartCanvas" id="chart_'+matrix[i][j]+'" width="240" height="240"></canvas>';
                $("#"+tempdiv.id).append(icon_canvas);
                var canvas_data_div = '<div id="data_'+tempdiv.id+'" style="display:none">'+JSON.stringify(canvas_data[matrix[i][j]])+'</div>';
                $("#"+tempdiv.id).append(canvas_data_div);

                // draw arrow
                // draw circle cancel
                if (!isNull(canvas_data[matrix[i][j]]) && canvas_data[matrix[i][j]].length > 0) {
                    var bX,bY,eX,eY;
                    var baseX = j*(iconwidth+apartwidth);
                    var baseY = offsetCanvasHeight + i*(iconheight+apartheight);

                    // var centreX = j*(iconwidth+apartwidth)+iconwidth - 5;
                    // var centreY = offsetCanvasHeight + i*(iconheight+apartheight);
                    // var chartRadius = 4;

                    var offsetArrowHeight = 5;
                    var zc_num = 0;
                    var arc = 11 * Math.PI / 6;
                    var arrow_len = 5;
                    for (var k = 0; k < canvas_data[matrix[i][j]].length; k++) {
                        if (canvas_data[matrix[i][j]][k][3] == 'zr') {
                            bX = baseX;
                            bY = baseY;
                            eX = baseX + 10;
                            eY = baseY + 10 * Math.tan(Math.PI / 6);
                        } else {
                            bX = baseX + iconwidth;
                            bY = baseY + iconheight * 0.4 + zc_num * offsetArrowHeight;
                            eX = baseX + iconwidth + 10;
                            eY = baseY + iconheight * 0.4 + zc_num * offsetArrowHeight + 5;
                            zc_num++;
                        }
                        context.beginPath();
                        context.strokeStyle = canvas_data[matrix[i][j]][k][2];
                        context.moveTo(bX,bY);
                        context.lineTo(eX,eY);
                        context.stroke();
                        drawtriangle_by_arc(eX,eY,arc,arrow_len,canvas_data[matrix[i][j]][k][2]);
                        context.closePath();

                        // context.beginPath();
                        // var num = canvas_data[matrix[i][j]].length;
                        // var arc = 1 / num;
                        // var color = new Array();
                        // context.strokeStyle = canvas_data[matrix[i][j]][k][2];
                        // context.arc(centreX, centreY, chartRadius, Math.PI * 2 * arc * (k + 1), Math.PI * 2 * arc * ( k + 2 ), true);
                        
                        // context.stroke();
                        // context.closePath();
                    }
                }

                // $("#"+tempdiv.id).hover(function(){alert("点击"+$(this).attr("id"))});
                // edit 0821 别处删除
                // 投入初始化
                trsl = 0;
                trjs = 0;
                if (i!=0&&i!=arrheight-1)
                {
                    for (var m = 0 ; m < dataarr.length ; m++)
                    {
                        if (dataarr[m][9]==matrix[i][j])
                        {
                            trsl += parseFloat(dataarr[m][4]);
                            trjs += parseFloat(dataarr[m][5]);
                        }
                    }
                    tempdiv = document.createElement("div");
                    tempdiv.id = "icon_"+matrix[i][j]+"_in";
                    document.getElementById("canvas").appendChild(tempdiv);
                    $("#"+tempdiv.id).addClass("canvas_icon_in");
                    $("#"+tempdiv.id).css({"position":"absolute","left":(j*(iconwidth+apartwidth)-80)+"px","top": (offsetCanvasHeight +(i*(apartheight+iconheight)+iconheight/4-12))+"px"});
                    $("#"+tempdiv.id).html("投入:"+trsl.toFixed(2)+"/"+trjs.toFixed(0));
                }
                // 产出初始化
                zcsl = 0;
                zcjs = 0;
                
                if (i!=arrheight-1)
                {
                    for (var m = 0 ; m < dataarr.length ; m++)
                    {
                        if (dataarr[m][9]==matrix[i][j])
                        {
                            zcsl += parseFloat(dataarr[m][6]);
                            zcjs += parseFloat(dataarr[m][7]);
                        }
                    }
                    tempdiv = document.createElement("div");
                    tempdiv.id = "icon_"+matrix[i][j]+"_out";
                    document.getElementById("canvas").appendChild(tempdiv);
                    $("#"+tempdiv.id).addClass("canvas_icon_out");
                    $("#"+tempdiv.id).css({"position":"absolute","left":(j*(iconwidth+apartwidth)-80)+"px","top":( offsetCanvasHeight +i*(apartheight+iconheight)+iconheight-40)+"px"});
                    $("#"+tempdiv.id).html("产出:"+zcsl.toFixed(2)+"/"+zcjs.toFixed(0));
                }
            }
        }
    }

    //edit 0821
    for (var i = 0 ; i < dataarr.length ; i++)
    {
        if (dataarr[i][9]=="期货出厂"&&dataarr[i][8]!="转入")
        {
            leavecoo=findnode(dataarr[i][8]);
            tempdiv = document.createElement("div");
            tempdiv.id = "icon_"+dataarr[i][8]+"_qh";
            document.getElementById("canvas").appendChild(tempdiv);
            $("#"+tempdiv.id).addClass("canvas_icon_cc");
            $("#"+tempdiv.id).css({"position":"absolute","left":(leavecoo[1]*(iconwidth+apartwidth)+iconwidth*2/3)+"px","top":( offsetCanvasHeight +leavecoo[0]*(apartheight+iconheight)+iconheight+apartheight/6-12)+"px","font-size":"12px"});
            $("#"+tempdiv.id).html("期货出厂:"+parseFloat(dataarr[i][6]).toFixed(2)+"/"+parseInt(dataarr[i][7]).toFixed(0));
            //context.fillText('期货出厂:'+dataarr[i][6]+"/"+dataarr[i][7],leavecoo[1]*(iconwidth+apartwidth)+iconwidth*2/3,leavecoo[0]*(apartheight+iconheight)+iconheight+apartheight/6);
            qhsl+=parseFloat(dataarr[i][6]);
            qhjs+=parseFloat(dataarr[i][7]);
        }
        if (dataarr[i][9]=="统货出厂")
        {
            leavecoo=findnode(dataarr[i][8]);
            tempdiv = document.createElement("div");
            tempdiv.id = "icon_"+dataarr[i][8]+"_th";
            document.getElementById("canvas").appendChild(tempdiv);
            $("#"+tempdiv.id).addClass("canvas_icon_cc");
            $("#"+tempdiv.id).css({"position":"absolute","left":(leavecoo[1]*(iconwidth+apartwidth)+iconwidth*2/3)+"px","top":( offsetCanvasHeight +leavecoo[0]*(apartheight+iconheight)+iconheight+apartheight*2/6-12)+"px","font-size":"12px"});
            $("#"+tempdiv.id).html("统货出厂:"+parseFloat(dataarr[i][6]).toFixed(2)+"/"+parseInt(dataarr[i][7]).toFixed(0));
            //context.fillText('统货出厂:'+dataarr[i][6]+"/"+dataarr[i][7],leavecoo[1]*(iconwidth+apartwidth)+iconwidth*2/3,leavecoo[0]*(apartheight+iconheight)+iconheight+apartheight*2/6);
            thsl+=parseFloat(dataarr[i][6]);
            thjs+=parseFloat(dataarr[i][7]);
        }
        if (dataarr[i][9]=="现货出厂")
        {
            leavecoo=findnode(dataarr[i][8]);
            tempdiv = document.createElement("div");
            tempdiv.id = "icon_"+dataarr[i][8]+"_xh";
            document.getElementById("canvas").appendChild(tempdiv);
            $("#"+tempdiv.id).addClass("canvas_icon_cc");
            $("#"+tempdiv.id).css({"position":"absolute","left":(leavecoo[1]*(iconwidth+apartwidth)+iconwidth*2/3)+"px","top":( offsetCanvasHeight +leavecoo[0]*(apartheight+iconheight)+iconheight+apartheight*3/6-12)+"px","font-size":"12px"});
            $("#"+tempdiv.id).html("现货出厂:"+parseFloat(dataarr[i][6]).toFixed(2)+"/"+parseInt(dataarr[i][7]).toFixed(0));
            //context.fillText('现货出厂:'+dataarr[i][6]+"/"+dataarr[i][7],leavecoo[1]*(iconwidth+apartwidth)+iconwidth*2/3,leavecoo[0]*(apartheight+iconheight)+iconheight+apartheight*3/6);
            xhsl+=parseFloat(dataarr[i][6]);
            xhjs+=parseFloat(dataarr[i][7]);
        }
    }
    if (qhsl!=0)
    {
        tempdiv = document.createElement("div");
        tempdiv.id = "icon_qh";
        document.getElementById("canvas").appendChild(tempdiv);
        $("#"+tempdiv.id).addClass("canvas_icon_cc");
        $("#"+tempdiv.id).css({"position":"absolute","left":(findnode("CC1")[1]*(iconwidth+apartwidth)+iconwidth/2+15)+"px","top":( offsetCanvasHeight +findnode("CC1")[0]*(apartheight+iconheight)-apartheight/5)+"px","font-size":"12px"});
        $("#"+tempdiv.id).html("期货出厂:"+qhsl.toFixed(2)+"/"+qhjs.toFixed(0));
    }
    if (thsl!=0)
    {
        tempdiv = document.createElement("div");
        tempdiv.id = "icon_th";
        document.getElementById("canvas").appendChild(tempdiv);
        $("#"+tempdiv.id).addClass("canvas_icon_cc");
        $("#"+tempdiv.id).css({"position":"absolute","left":(findnode("CC2")[1]*(iconwidth+apartwidth)+iconwidth/2+15)+"px","top":( offsetCanvasHeight +findnode("CC2")[0]*(apartheight+iconheight)-apartheight/5)+"px","font-size":"12px"});
        $("#"+tempdiv.id).html("统货出厂:"+thsl.toFixed(2)+"/"+thjs.toFixed(0));
    }
    if (xhsl!=0)
    {
        tempdiv = document.createElement("div");
        tempdiv.id = "icon_xh";
        document.getElementById("canvas").appendChild(tempdiv);
        $("#"+tempdiv.id).addClass("canvas_icon_cc");
        $("#"+tempdiv.id).css({"position":"absolute","left":(findnode("CC3")[1]*(iconwidth+apartwidth)+iconwidth/2+15)+"px","top":( offsetCanvasHeight +findnode("CC3")[0]*(apartheight+iconheight)-apartheight/5)+"px","font-size":"12px"});
        $("#"+tempdiv.id).html("现货出厂:"+xhsl.toFixed(2)+"/"+xhjs.toFixed(0));
    }
    //edit
          
    var node,nodecoo,nodeX,nodeY,textY;

    var image = new Image();
    image.src = "./WE/images/biTree/zr.png";
    image.onload = function(){
        context.drawImage(this,10, offsetCanvasHeight +textY-iconheight/2,iconwidth,iconheight);
    }

    image = new Image();
    image.src = "./WE/images/biTree/zc.png";
    image.onload = function(){
        context.drawImage(this,(arrwidth-1)*(iconwidth+apartwidth)-apartwidth/2+75, offsetCanvasHeight +textY-iconheight/2,iconwidth,iconheight);
    }

};


