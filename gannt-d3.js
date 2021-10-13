function evalNewGanttInput(){
    var field = document.getElementById("customGanttInput");
    var bulk = JSON.parse(field.value);
    //console.log(bulk,core,meta);
    makeGantt("customGantt",bulk,true);
}
async function makeGantt(domId,allProj,full){
    $("#"+domId).html('');

    // console.log('bulk',bulk);
    // console.log('allProj',allProj);
    // console.log('meta',meta);
    // console.log('legend',legend);

    if(domId=="customGantt"){
        $("#customGanttInput").val(JSON.stringify(allProj, null, 2));
    }
    

    var bulk = allProj.filter(u => {
        if(u.hasOwnProperty('ignore')){
            if(Number(u.ignore)>0){
                return false;
            }else{
                return true;
            }
        }else{
            return true;
        }
    });
    allProj = bulk.filter(u => !u._type);
    var meta = bulk.filter(u => u._type=="keydate");
    var legend = bulk.filter(u => u._type=="legend");

    //console.log(domId,full, allProj);
    //var humanFormat = d3.timeFormat("%Y");
    var today = new Date();
    var humanFormat = d3.timeFormat("%d%b%Y");
    var dateFormat = d3.timeFormat("%a %m/%d/%y");
    
    //console.log(width);
    
    function stringToDate(_date,_format,_delimiter){
        var formatLowerCase=_format.toLowerCase();
        var formatItems=formatLowerCase.split(_delimiter);
        var dateItems=_date.split(_delimiter);
        var monthIndex=formatItems.indexOf("mm");
        var dayIndex=formatItems.indexOf("dd");
        var yearIndex=formatItems.indexOf("yyyy");
        var month=parseInt(dateItems[monthIndex]);
        month-=1;
        var formatedDate = new Date(dateItems[yearIndex],month,dateItems[dayIndex]);
        return formatedDate;
    }
    if(meta.length>0){
        meta = meta.map((e,i) => {
            var date = stringToDate(e.Date,"yyyy-mm-dd","-");
            return {
                ...e,
                date:date
            };
        });
    }

    allProj = allProj.map((e,i) => {
        //var e = allProj[h];
        //var [YYYY, MM, DD] = '2014-04-03'.split('-')
        var end = stringToDate(e.End_Date,"yyyy-mm-dd","-");
        var start = stringToDate(e.Start_Date,"yyyy-mm-dd","-");
        //console.log(e.Itx_Contract_Num,start,end);
        return {
            ...e,
            end:end,
            start:start,
            _type:e._type?e._type:"task"
        };
    });

    allProj.sort(function(a,b){
        return b.start - a.start;
    });

    // allProj = allProj.map((e,i) => {
    //     return {...e,index:i};
    // });

    var categories = {};
    
    for(var h=0;h<allProj.length;h++){
        if(!allProj[h].Category){
            allProj[h].Category="uc";
        }
        if(!categories[allProj[h].Category]){
            categories[allProj[h].Category]=[];
        }
        categories[allProj[h].Category].push(allProj[h]);
        
    }
    var timeBufferFraction = 0.10;
    var catKeys = Object.keys(categories);
    //var n_cats = catKeys.length;
    var lc=0;
    allProj=[];

    for(var h=0;h<catKeys.length;h++){
        // categories[catKeys[h]] = categories[catKeys[h]].map(e => {
        //     //var e = allProj[h];
        //     //var [YYYY, MM, DD] = '2014-04-03'.split('-')
        //     var end = stringToDate(e.End_Date,"yyyy-mm-dd","-");
        //     var start = stringToDate(e.Start_Date,"yyyy-mm-dd","-");
        //     //console.log(e.Itx_Contract_Num,start,end);
        //     return {...e,end:end,start,start};
        // });
        // categories[catKeys[h]].sort(function(a,b){
        //     return b.start - a.start;
        // });

        //var caty =  d3.max(categories[catKeys[h]].map(u => u.index))

        var timeExtent = d3.extent(categories[catKeys[h]].map(e => [e.end,e.start]).flat());
        // var bufferMillis = (timeExtent[1].getTime() - timeExtent[0].getTime() )  * timeBufferFraction; //10% buffer?
        // //var bufferMillis = 1000 * 60 * 60 * 24 * 7 * bufferWeeks;
        // timeExtent = [
        //     new Date(timeExtent[0].getTime()-bufferMillis),
        //     new Date(timeExtent[1].getTime()+bufferMillis)
        // ];
        categories[catKeys[h]].timeExtent=timeExtent;
        categories[catKeys[h]].sort(function(a,b){
            return b.start - a.start;
        });
        // allProj.push({
            
        //     "Start_Date": srcFormat(timeExtent[0]),
        //     "End_Date": srcFormat(timeExtent[1]),
        //     "Long": catKeys[h],
        //     "Name":catKeys[h],
        //     "_type":"category"
        // });

        for(var i=0;i<categories[catKeys[h]].length;i++){
            
            // categories[catKeys[h]][i]._x = xAxis(categories[catKeys[h]][i].start);
            // categories[catKeys[h]][i]._w = xAxis(categories[catKeys[h]][i].end)-xAxis(categories[catKeys[h]][i].start);
            // categories[catKeys[h]][i]._y = yAxis(lc)-gridSize+padding/2;
            allProj.push({...categories[catKeys[h]][i],index:lc});
            categories[catKeys[h]][i].index=lc;
            lc++;
        }

        var caty =  d3.max(categories[catKeys[h]].map(u => u.index));
        categories[catKeys[h]].index=caty;
    }

    //for(var h=0;h<allProj.length;h++){
    var defaultColor = "#68a16d";
    var strokeOpacity = 0.5;
    var maxStrLength = 28;
    var padding = 7;
    var width = $("#"+domId).parent().width();

    var margin = {top: 60, right: 30, bottom: 60};//left: 200,brush:20
    margin.cat = 70;
    margin.name = 145;
    margin.dates = 155;
    margin.left = margin.cat + margin.name + margin.dates + padding;

    width = width - margin.left - margin.right;
    var gridSize = 13;//full ? 20 : 13; 
    var n_proj = allProj.length;
    var height = n_proj*(gridSize+padding);//+n_cats*(gridSize/2+padding);//+margin.top + margin.bottom;// - margin.brush;
    
    var markerBoxWidth = 4, markerBoxHeight = 4, refX = markerBoxWidth / 2, refY = markerBoxHeight / 2;
    var arrowPoints = [[0, 0], [0, markerBoxHeight], [markerBoxWidth, refY]];

    //console.log('categories',categories);

    var timeExtent = d3.extent(allProj.map(e => [e.end,e.start]).flat());

    var bufferMillis = (timeExtent[1].getTime() - timeExtent[0].getTime() )  * timeBufferFraction; //10% buffer?
    //var bufferMillis = 1000 * 60 * 60 * 24 * 7 * bufferWeeks;

    timeExtent = [
        new Date(timeExtent[0].getTime()-bufferMillis),
        new Date(timeExtent[1].getTime()+bufferMillis)
    ];

    function catPoints(d,axis){

        let start = axis(d.timeExtent[0]);
        let end = axis(d.timeExtent[1]);
        let yp = y(d.index);

        return [ 
            [start-padding/2-1,yp-gridSize/2], 
            [start-padding/2-1,yp-gridSize-1], 
            [end+padding/2+1,yp-gridSize-1], 
            [end+padding/2+1,yp-gridSize/2] 
        ];
        //return [ [start,yp+gridSize/2], [start,yp], [end,yp], [end,yp+gridSize/2] ];
    }

    // function zoomed() {
    //     if(full){
    //         const currentTransform = d3.event.transform;

    //         // rescale the x linear scale so that we can draw the top axis
    //         const xNewScale = currentTransform.rescaleX(x);
    //         //x.scale(xNewScale);
    //         //gAxis.call(x);
    //         //console.log(xNewScale.domain(),xNewScale.range());
    //         //x.domain(xNewScale.domain());
    //         //x.scale(xNewScale);

    //         dependancies = setDepsAndPos(xNewScale,y);

    //         gAxis.call(d3.axisBottom(xNewScale)//.ticks(20)
    //             .tickFormat(humanFormat));
    //         gAxis.selectAll("text")	
    //             .style("text-anchor", "end")
    //             .attr("dx", "-.8em")
    //             .attr("dy", ".15em")
    //             .attr("transform", "rotate(-65)");
            
    //         progBars 
    //             .attr("width", function(d){
    //                 return d.prog?((xNewScale(d.end)-xNewScale(d.start))*d.prog/100):0; //+padding/2
    //             })
    //             .attr("x", function(d){
    //                 return xNewScale(d.start);//-padding/4;
    //             });
            
    //             //draw();
    //         bars.attr("width", function(d){return xNewScale(d.end)-xNewScale(d.start);})
    //             .attr("x",  function(d){return xNewScale(d.start);});
    //             //.attr("y",  function(d,i){return y(i)-gridSize ;});


    //         cats.attr("d",function(d){return d3.line()(catPoints(d,xNewScale));});

    //         //texts.attr("x",  function(d){return xNewScale(d.start)+2;});
    //         //todo if d.start < 0.. dont print?

    //         cattexts.attr("x", function(d){return xNewScale(d.start)-padding;});

    //         todayLine.attr("x1", xNewScale(today))
    //             .attr("x2", xNewScale(today));

    //         todayText.attr("transform", "translate("+xNewScale(today)+",0) rotate(-65)");
    //            //todo if d.start < 0.. dont print?
    //         //container.attr("transform", currentTransform);
    //         //slider.property("value", currentTransform.k);

    //         lines = ui.selectAll("path.dep").data(dependancies)
    //             .attr("d", function(d){return depLine(d.points);});
    //     }
    // }
    // function dragstarted(d) {
    //     d3.event.sourceEvent.stopPropagation();
    //     d3.select(this)
    //         //.classed("dragging", true);
    //         .attr("fill","red");
    // }
    // function dragged(d) {
    //     //transform translate? instead of x/y
    //     d3.select(this)
    //         .attr("x", d.x = d3.event.x)
    //         .attr("y", d.y = d3.event.y);
    // }
    // function dragended(d) {
    //     d3.select(this)
    //         //.classed("dragging", false);
    //         .attr("fill","#eee");
    // }
    /*
    function slided(d) {
        zoom.scaleTo(svg, d3.select(this).property("value"));
    }*/
    // if(full){
    //     //look for manufacturing events that follow into each project
    // }

    var x = d3.scaleTime().range([0,width]).domain(timeExtent).clamp(true);
    //var xAxis = d3.scaleTime().range([0,width]).domain(timeExtent).clamp(true);
    var y = d3.scaleLinear().range([height,0]).domain([0,n_proj]);

    // gridlines in x axis function
    function make_x_gridlines() {		
        return d3.axisBottom(x)
            //.ticks(5)
    }

    // var zoom = d3.zoom() //for zooming in
    //     .scaleExtent([1, 10])
    //     .on("zoom", zoomed);

    // var drag = d3.drag() //for dragging items within a container
    //     .subject(function (d) { return d; })
    //     .on("start", dragstarted)
    //     .on("drag", dragged)
    //     .on("end", dragended);

    /*var slider = d3.select("#"+domId).append("p").append("input")
        .datum({})
        .attr("type", "range")
        .attr("value", zoom.scaleExtent()[0])
        .attr("min", zoom.scaleExtent()[0])
        .attr("max", zoom.scaleExtent()[1])
        .attr("step", (zoom.scaleExtent()[1] - zoom.scaleExtent()[0]) / 100)
        .on("input", slided);*/

    var mainsvg = d3.select("#"+domId).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

    mainsvg
        .append('defs')
        .append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
        .attr('refX', refX)
        .attr('refY', refY)
        .attr('markerWidth', markerBoxWidth)
        .attr('markerHeight', markerBoxHeight)
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', d3.line()(arrowPoints))
        .attr('stroke', 'black');
   
    var svg = mainsvg.append("g")    
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        //.call(zoom);

    var rect = svg.append("rect") //background
        .attr("width", width+margin.left)
        .attr("height", height+padding)
        .attr("x", -margin.left)
        .style("fill", "#eee")
        .attr("fill-opacity",0.5)
        .style("pointer-events", "all");

    var container = svg.append("g")
        .attr("width", width )
        .attr("height", height );

    container.append("g")
        .attr("class", "fadexaxis")
        .selectAll("line")
        //.attr("transform","translate("+(-margin.left)+",0)")
        .data(d3.range(-margin.left, width, gridSize))
        .enter().append("line")
        .attr("stroke","#fff")
        .attr("stroke-opacity",0.5)
        .attr("x1", function (d) { return d; })
        .attr("y1", 0)
        .attr("x2", function (d) { return d; })
        .attr("y2", height+padding);

    container.append("g")
        .attr("class", "fadeyaxis")
        .selectAll("line")
        .data(d3.range(0, height+padding, gridSize))
        .enter().append("line")
        .attr("stroke","#fff")
        .attr("stroke-opacity",0.5)
        .attr("x1", -margin.left)
        .attr("y1", function (d) { return d; })
        .attr("x2", width)
        .attr("y2", function (d) { return d; });

    /*
    container.append("g")			
        //.attr("class", "grid")
        //.attr("stroke","green")
        //.attr("stroke-opacity",0.5)
        //.attr("shape-rendering",'crispEdges')
        .attr("transform", "translate(0," + height + ")")
        .call(make_x_gridlines()
            .tickSize(-height)
                .tickFormat("")
        );
    */
    
    var gAxis = svg.append("g")
        .attr("class", "mainxaxis")
        //.attr("transform", "translate(0," + (height+padding) + ")")
        .call(d3.axisTop(x) //axisBottom(x)//.ticks(20)
                .tickFormat(humanFormat));
            
    gAxis.selectAll("text")	
        .style("text-anchor", "start")
        .attr("dx", "0.5em")
        .attr("dy", "0.5em")
        .attr("transform", "rotate(-45)");

    var todayLine = container.append("line")
        .attr("stroke","red")
        .attr("stroke-opacity",0.5)
        .attr("x1", x(today))
        .attr("y1", 0)
        .attr("x2", x(today))
        .attr("y2", height+padding);
        //.attr("stroke-dasharray","3");

    if(meta){
        for(var i=0;i<meta.length;i++){
            container.append("line")
                .attr("stroke","#000")
                .attr("stroke-opacity",0.25)
                .attr("stroke-dasharray","3, 3")
                .attr("x1", x(meta[i].date))
                .attr("y1", 0)
                .attr("x2", x(meta[i].date))
                .attr("y2", height+padding);

            container.append("text")
                //.attr("x", x(today))
                //.attr("y", 0)
                .style("text-anchor", "end")
                .attr("font-size",10)
                .attr("font-family","sans-serif")
                .attr("fill","#000")
                //.attr("dx", ".8em")
                .attr("dy", "0.5em")
                .attr("transform", "translate("+x(meta[i].date)+","+(height+padding)+") rotate(-65)")
                .text(humanFormat(meta[i].date));
        }
    }

    if(legend.length>0){
        var labels = Object.entries(legend[0]);
        labels.shift(); //remove the _type key
        let cw = 90, ch = labels.length*(gridSize+padding);
        let cx = width - gridSize - cw;
        let cy = gridSize;

        container.append("rect")
        .attr("x",cx)
        .attr("y",cy)
        .attr("width",cw)
        .attr("height",ch)
        .attr("fill","#fff")
        .attr("stroke","#000");

        //console.log(labels);
        labels.forEach(([key,val],i) => {

            container.append("text")
            .attr("x",cx+3)
            .attr("y",cy+i*(gridSize+padding/2)+padding/2)
            .attr("alignment-baseline", "hanging")
            //.attr("width",cw)
            //.attr("height",ch)
            .attr("fill",key)
            .text(val);
        });
    }
    // var todayText = container.append("text")
    //     //.attr("x", x(today))
    //     //.attr("y", 0)
    //     .style("text-anchor", "start")
    //     .attr("font-size",10)
    //     .attr("font-family","sans-serif")
    //     .attr("fill","#000")
    //     //.attr("dx", "-.8em")
    //     //.attr("dy", ".15em")
    //     .attr("transform", "translate("+x(today)+",0) rotate(-65)")
    //     .text(humanFormat(today));

    var ui = container.append("g");
    var dependancies = [];
    var depLine = d3.line().curve(d3.curveStep);//.curve(d3.curveStepBefore);
    
    function setDepsAndPos(xAxis,yAxis){
        mydeps = [];
        //discover each dependancy
        allProj = [];
        var lc=0;
        for(var h=0;h<catKeys.length;h++){
            for(var i=0;i<categories[catKeys[h]].length;i++){
                categories[catKeys[h]][i]._x = xAxis(categories[catKeys[h]][i].start);
                categories[catKeys[h]][i]._w = xAxis(categories[catKeys[h]][i].end)-xAxis(categories[catKeys[h]][i].start);
                categories[catKeys[h]][i]._y = yAxis(lc)-gridSize+padding/2;
                allProj.push(categories[catKeys[h]][i]);
                lc++;
            }
        }
        for(var i=0;i<allProj.length;i++){
            let p = allProj[i];
            if(p.dep){ //may or may not have a dependency
                let deps = p.dep.split(",");
                for(var d=0;d<deps.length;d++){
                    
                    let tdi = parseInt(deps[d]); //convert text to int
                    let td = allProj.findIndex( x => x.id === tdi );//.filter(x => x.id==tdi)[0];
                    let src = allProj[td];
                    //console.log(tdi,td,i,p);
                    var sx = src._x+src._w; //gridSize/2;
                    //var sx = src._x; //gridSize/2;
                    var sy = src._y+gridSize/2;
                    var dx = p._x-padding/2;
                    var dy = p._y+gridSize/2;
                    var points = [ [sx,sy], [sx+padding/2,sy], [sx,dy] ,[dx, dy] ];
                    if(dx<(sx+padding/2)){
                        points = [ [sx,sy], [sx+padding/2,sy], [sx+padding/2,sy+gridSize/2+padding/2], [dx-padding/2,sy+gridSize/2+padding/2], [dx-padding/2,dy] ,[dx, dy] ];
                    }
                    mydeps.push({
                        src_x:sx,
                        src_y:sy,
                        dest_x:dx,
                        dest_y:dy,
                        points:points,
                        srcFill:src.fill
                    });
                }
            }
        }
        return mydeps;
    }
    
    dependancies = setDepsAndPos(x,y);
    
    if(dependancies.length>0){
        //console.log(dependancies,allProj);
        //draw dependencies
        // var lines = ui.selectAll("line").data(dependancies).enter()
        //     .append("line")
        //     //.attr("fill","#eee")
        //     .attr("stroke","#000")
        //     .attr("x1", function(d){return d.src_x;})
        //     .attr("x2", function(d){return d.dest_x;})
        //     .attr("y1", function(d){return d.src_y;})
        //     .attr("y2", function(d){return d.dest_y;});

        lines = ui.selectAll("path.dep").data(dependancies).enter()
            .append("path")
            .attr("class","dep")
            .attr("fill","none")
            .attr("stroke",function(d){return d.srcFill?d.srcFill:defaultColor;})
            .attr("stroke-opacity",strokeOpacity)
            .attr('marker-end', 'url(#arrow)')
            .attr("d", function(d){return depLine(d.points);});
    }

    for(var h=0;h<catKeys.length;h++){
        for(var i=0;i<categories[catKeys[h]].length;i++){
            if(catKeys[h]!="uc"){//uncategorized
                if(i==0){
                    ui//.selectAll("path.cat").data(allProj.filter(e => e._type=="category")).enter()
                    .append("path")
                    .attr("class","cat")
                    .attr("fill","none")
                    //.attr("fill-opacity",strokeOpacity)
                    .attr("d",d3.line()( catPoints(categories[catKeys[h]],x) ))
                    .attr("stroke","#000");
                    //.attr("stroke-width","2px");

                    // ui.append("rect")
                    // .attr("class","cat")
                    // //.attr("fill","green")
                    // .attr("fill","#eee")
                    // //.attr("fill-opacity",strokeOpacity+0.5)
                    // .attr("stroke","none")
                    // .attr("height", categories[catKeys[h]].length*(gridSize+padding))//+padding/2)
                    // .attr("width", margin.left) //+padding/2
                    // .attr("x",  -margin.left)//-padding/4;})
                    // .attr("y",  y(categories[catKeys[h]].index)-2*padding);

                    ui//.selectAll("text").data(allProj.filter(e => e._type=="category")).enter()
                    .append("text")
                    //.attr("fill","#000")
                    .attr("fill","#000")
                    //.attr("stroke","#000")
                    .attr("alignment-baseline", "middle")
                    .attr("text-anchor","end")
                    .attr("font-style","italic")
                    .attr("font-weight","bold")
                    //.attr("width", function(d){return x(d.end)-x(d.start);})
                    .attr("x", x(categories[catKeys[h]].timeExtent[0])-padding*1.5)
                    .attr("y", y(categories[catKeys[h]].index))
                    .attr("font-size","0.7em")
                    .text( catKeys[h]);

                    ui//.selectAll("text").data(allProj.filter(e => e._type=="category")).enter()
                    .append("text")
                    //.attr("fill","#000")
                    .attr("fill","#000")
                    //.attr("stroke","#000")
                    .attr("alignment-baseline", "middle")
                    .attr("text-anchor","start")
                    .attr("font-style","italic")
                    .attr("font-weight","bold")
                    //.attr("width", function(d){return x(d.end)-x(d.start);})
                    .attr("x", -margin.left+2)
                    .attr("y", y(categories[catKeys[h]].index))
                    .attr("font-size","0.7em")
                    .text( catKeys[h].substring(0, maxStrLength) );

                    if(h!=(catKeys.length-1)){
                        //neat category line
                        ui.append("path")
                        .attr("stroke","#000")
                        .attr("stroke-opacity",0.25)
                        .attr("fill","none")
                        .attr("d",d3.line()([ 
                            [-margin.left,y(categories[catKeys[h]].index)-padding*3/2], 
                            [0,y(categories[catKeys[h]].index)-padding*3/2]
                            //[-margin.left+margin.cat,y(categories[catKeys[h]].index)+gridSize+(categories[catKeys[h]].length-1)*(gridSize+padding)]
                        ]));
                    }
                }
            }
            
            pr = categories[catKeys[h]][i];
            //console.log(pr);
            ui//.selectAll("rect.bar").data(allProj.filter(e => e._type=="task")).enter()
            .append("rect")
            .attr("class","bar")
            .attr("fill",( pr.fill?pr.fill:defaultColor))
            .attr("fill-opacity",strokeOpacity)
            .attr("stroke","none")
            .attr("height", gridSize)
            .attr("width", pr._w)
            .attr("x",  pr._x)
            .attr("y",  pr._y);
            //.call(drag);

            ui.append("rect")
            .attr("class","prog")
            //.attr("fill","green")
            .attr("fill",( pr.fill?pr.fill:defaultColor))
            .attr("fill-opacity",strokeOpacity+0.5)
            .attr("stroke","none")
            .attr("height", gridSize/2)//+padding/2)
            .attr("width", (pr.prog?(pr._w*pr.prog/100):0)) //+padding/2
            .attr("x",  pr._x)//-padding/4;})
            .attr("y",  pr._y+gridSize/4);//-padding/4;});

            //texts
            // ui.append("rect")
            // .attr("class","nameBlank")
            // .attr("x", -margin.left + margin.cat)
            // .attr("y",  pr._y)
            // .attr("width", margin.name)
            // .attr("height", gridSize)
            // .attr("fill-opacity",strokeOpacity)
            // .attr("fill",( pr.fill?pr.fill:defaultColor));
            

            //var alltexts = 
            ui//.selectAll("text").data(allProj).enter()
            .append("text")
            //.attr("fill","#000")
            .attr("fill",pr.fill?pr.fill:"#000")
            //.attr("stroke","#000")
            .attr("alignment-baseline", "hanging")
            .attr("text-anchor","start")
            //.attr("width", function(d){return x(d.end)-x(d.start);})
            .attr("x", -margin.left + margin.cat +2)
            .attr("y",  pr._y+2)
            .attr("font-size","0.7em")
            .text( function(){
                var txt = '';
                if(pr.Name){
                   
                    txt = pr.Name;
                    if(pr.Itx_Contract_Num){
                        txt = txt + " ["+pr.Itx_Contract_Num+"]";
                    }
                }else{
                    txt = pr.Long;
               
                }

                return txt.substring(0, maxStrLength);
            });

            // ui.append("rect")
            // .attr("class","dateBlank")
            // .attr("x", -margin.dates-padding/2)
            // .attr("y",  pr._y-padding/2)
            // .attr("width", margin.dates+padding/2)
            // .attr("height", gridSize+padding)
            // .style("fill", "#fff");

            ui//.selectAll("text").data(allProj).enter()
            .append("text")
            //.attr("fill","#000")
            .attr("fill", pr.fill?pr.fill:"#000")
            //.attr("stroke","#000")
            .attr("alignment-baseline", "hanging")
            .attr("text-anchor","start")
            //.attr("width", function(d){return x(d.end)-x(d.start);})
            .attr("x", -margin.dates+padding/2)
            .attr("y",  pr._y+2)
            .attr("font-size","0.7em")
            .text( function(){
                var txt = dateFormat(pr.start)+ " - " + dateFormat(pr.end);
                return txt.substring(0, maxStrLength);
            });
    
        }
    }


    
        //.call(drag);


    /*for(var h=0;h<n_proj;h++){
        let d = allProj[h];

        ui.append("rect")
            .attr("fill","#eee")
            .attr("stroke","#000")
            .attr("height", gridSize)
            .attr("width", x(d.end)-x(d.start))
            .attr("x",  x(d.start) )
            .attr("y",  y(h)-gridSize );
            //.call(drag);

        ui.append("text")
            .attr("fill","#000")
            //.attr("stroke","#000")
            .attr("alignment-baseline", "hanging")
            //.attr("width", function(d){return x(d.end)-x(d.start);})
            .attr("x",  x(d.start)+2)
            .attr("y",  y(h)-gridSize+2)
            .attr("font-size","0.7em")
            .text( d.Name+" ["+d.Itx_Contract_Num+"]");

        /*ui.append("text")
            .attr("fill","#000")
            //.attr("stroke","#000")
            .attr("alignment-baseline", "middle")
            .attr("text-anchor", "end")
            //.attr("width", function(d){return x(d.end)-x(d.start);})
            .attr("x",  x(d.start) -3 )
            .attr("y",  y(h)-gridSize/2)
            .attr("font-size","0.7em")
            .text( d.Start_Date);

        ui.append("text")
            .attr("fill","#000")
            //.attr("stroke","#000")
            .attr("alignment-baseline", "middle")
            .attr("text-anchor", "start")
            //.attr("width", function(d){return x(d.end)-x(d.start);})
            .attr("x",  x(d.end)+3)
            .attr("y",  y(h)-gridSize/2)
            .attr("font-size","0.7em")
            .text( d.End_Date);
            //.call(drag);*/
    //}
    
    
    
}
