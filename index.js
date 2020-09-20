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

function groupData(list) {
    var grouped = { time: [], color: {} };
    var i = 0;
    list.forEach(e => {
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
    var updateTimer = setInterval(update, config.updateInterval);
    var timer = setInterval(() => {
        var currentTime = data.time[i];
        var bubbles = data[currentTime].map(e => {
            return {
                time: currentTime,
                name: e.name,
                value: Number(e.value),
                color: data.color[e.name],
            }
        });
        draw(bubbles);
        if (++i >= data.time.length) {
            clearInterval(timer);
            clearInterval(updateTimer);
        }
    }, config.timeInterval);
}

function rescale(x) {
    return Math.sqrt(x) / 10;
}

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
        .attr("transform", () => `translate(${random(0, 1280)}, ${random(0, 720)})`);
    //气泡开始
    enter.append("circle")
        .attr("fill", d => d.color)
        .transition()
        .duration(1000)
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
        .duration(1000)
        .tween("text", function (d) {
            var i = d3.interpolate(0, d.value);
            return t => this.textContent = format(i(t));
        });

    //更新气泡
    update.select("circle")
        .transition()
        .duration(1000)
        .attr("r", d => rescale(d.value));
    update.select(".value")
        .transition()
        .duration(1000)
        .tween("text", function (d) {
            var i = d3.interpolate(this.textContent, d.value);
            return t => this.textContent = format(i(t));
        });

    //删除气泡
    //注意如果remove晚于数据更新会失效
    //所以才会出现数据跑完才删除的情况
    exit.select("circle")
        .transition()
        .duration(960)
        .attr("r", 0);
    exit.select(".value")
        .transition()
        .duration(960)
        .tween("text", function () {
            var i = d3.interpolate(this.textContent, 0);
            return t => this.textContent = format(i(t));
        });
    exit
        .transition()
        .duration(960)
        .remove();
}

function update() {
    var bubbles = [];
    var circles = d3.select("svg").selectAll("circle");
    circles.each(function (d) {
        var self = d3.select(this);
        console.log(this);
        bubbles.push({
            name: d.name,
            x: self.attr("cx"),//错误
            y: self.attr("cy"),//错误
            r: self.attr("r")
        });
    });
    console.log(bubbles);
    updatePhysics(bubbles);
    d3.select("svg").selectAll("g.bubble").data(bubbles, d => d.name)
        .transition()
        .ease(d3.easeLinear)
        .duration(config.updateInterval)
        .attr("transform", d => `translate(${d.x}, ${d.y})`);
}

function updatePhysics(bubbles) {
    const elasticity = 0.6;
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
