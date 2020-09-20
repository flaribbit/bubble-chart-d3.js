var bubbles = [];
var scale = 1;

//打开文件 读取数据
inputFile.onchange = function () {
    var reader = new FileReader();
    reader.readAsText(this.files[0], config.encoding);
    reader.onload = function () {
        var data = d3.csvParse(this.result);
        visual(groupData(data));
        // try {
        //     visual(groupData(data, "time"));
        // } catch (error) {
        //     alert(error);
        // }
    }
    this.hidden = true;
}

//数据预处理 按时间分组并计算颜色
function groupData(list) {
    var grouped = { time: [], color: {} };
    var i = 0;
    list.forEach(e => {
        e.value = Number(e.value);
        if (!grouped[e.time]) {
            grouped[e.time] = [];
            grouped.time.push(e.time);
        }
        grouped[e.time].push(e);
        if (!grouped.color[e.name]) {
            grouped.color[e.name] = colors[i % colors.length];
            i++;
        }
    });
    return grouped;
}

function random(a, b) {
    return a + (b - a) * Math.random();
}

function visual(data) {
    var i = 0;
    //更新气泡位置
    var updateTimer = setInterval(update, config.updateInterval);
    //更新气泡数据
    var timer = setInterval(() => {
        //取出当前时间的数据 并计算面积
        var area = 0;
        var currentTime = data.time[i];
        var bubbles = data[currentTime].map(e => {
            area += e.value;
            return {
                time: currentTime,
                name: e.name,
                value: e.value,
                color: data.color[e.name],
            }
        });
        //根据面积对气泡缩放
        if (area > 0) {
            scale = 1280 * 720 * 25 / area;
        }
        //绘制气泡
        draw(bubbles);
        //动画完成后停止
        if (++i >= data.time.length) {
            clearInterval(timer);
            clearInterval(updateTimer);
        }
    }, config.timeInterval);
}

//用于调整气泡大小
function rescale(x) {
    return Math.sqrt(x * scale) / 10;
}

//用于控制数据显示的格式
function format(x) {
    return Math.round(x);
}

function draw(bubbles) {
    var svg = d3.select("svg");
    var update = svg.selectAll("g.bubble").data(bubbles, d => d.name);
    var exit = update.exit();
    var enter = update.enter()
        .append("g")
        .attr("class", "bubble")
        .append("g")
        .attr("class", "move")
        .attr("transform", () => randomTranslate());
    //气泡开始
    enter.append("circle")
        .attr("fill", d => d.color)
        .transition()
        .duration(config.timeInterval)
        .attr("r", d => rescale(d.value));
    //文字标题
    enter.append("text")
        .attr("class", "name")
        .text(d => d.name);
    //值
    enter.append("text")
        .attr("class", "value")
        .attr("y", 14)
        .transition()
        .duration(config.timeInterval)
        .tween("text", function (d) {
            var i = d3.interpolate(0, d.value);
            return t => this.textContent = format(i(t));
        });

    //更新气泡
    update.select("circle")
        .transition()
        .duration(config.timeInterval)
        .attr("r", d => rescale(d.value));
    update.select(".value")
        .transition()
        .duration(config.timeInterval)
        .tween("text", function (d) {
            var i = d3.interpolate(this.textContent, d.value);
            return t => this.textContent = format(i(t));
        });

    //删除气泡
    //注意如果remove晚于数据更新会失效
    //所以才会出现数据跑完才删除的情况
    exit.select("circle")
        .transition()
        .duration(0.96 * config.timeInterval)
        .attr("r", 0);
    exit.select(".value")
        .transition()
        .duration(0.96 * config.timeInterval)
        .tween("text", function () {
            var i = d3.interpolate(this.textContent, 0);
            return t => this.textContent = format(i(t));
        });
    exit
        .transition()
        .duration(0.96 * config.timeInterval)
        .remove();
}

//更新气泡位置
function update() {
    //获取所有气泡的坐标和半径
    bubbles = [];
    d3.select("svg").selectAll("circle").each(function (d) {
        var ctm = this.getCTM();
        bubbles.push({
            name: d.name,
            x: ctm.e,
            y: ctm.f,
            r: d3.select(this).attr("r")
        });
    });
    //相互排斥
    for (var i = 0; i < config.iteration; i++) {
        updatePhysics(bubbles);
    }
    //更新位置
    d3.select("svg").selectAll("g.move").data(bubbles, d => d.name)
        .transition()
        .ease(d3.easeLinear)
        .duration(config.updateInterval)
        .attr("transform", d => `translate(${d.x}, ${d.y})`);
}

//随机一个不重叠的位置
function randomTranslate() {
    var x = random(0, 1280);
    var y = random(0, 720);
    for (var i = 0; i < bubbles.length; i++) {
        var dx = x - bubbles[i].x;
        var dy = y - bubbles[i].y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < bubbles[i].r) {
            x += dx / distance * bubbles[i].r;
            y += dy / distance * bubbles[i].r;
            break;
        }
    }
    return `translate(${random(0, 1280)}, ${random(0, 720)})`;
}

//相互排斥
function updatePhysics(bubbles) {
    const elasticity = 0.2;
    for (var i = 0; i < bubbles.length; i++) {
        if (bubbles[i].x + bubbles[i].r > 1280) {
            bubbles[i].x -= elasticity * (bubbles[i].x + bubbles[i].r - 1280);
        } else if (bubbles[i].x - bubbles[i].r < 0) {
            bubbles[i].x -= elasticity * (bubbles[i].x - bubbles[i].r);
        }
        if (bubbles[i].y + bubbles[i].r > 720) {
            bubbles[i].y -= elasticity * (bubbles[i].y + bubbles[i].r - 720);
        } else if (bubbles[i].y - bubbles[i].r < 0) {
            bubbles[i].y -= elasticity * (bubbles[i].y - bubbles[i].r);
        }
        for (var j = i + 1; j < bubbles.length; j++) {
            var dx = bubbles[j].x - bubbles[i].x;
            var dy = bubbles[j].y - bubbles[i].y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            var t = distance - bubbles[i].r - bubbles[j].r;
            if (t < 0) {
                t = t * elasticity / distance;
                bubbles[i].x += dx * t;
                bubbles[i].y += dy * t;
                bubbles[j].x -= dx * t;
                bubbles[j].y -= dy * t;
            }
        }
    }
}
