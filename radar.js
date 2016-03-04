function init(h,w) {
  $('#title').text(document.title);  
	   
 var radar = new pv.Panel()
      .width(w)
      .height(h)
      .canvas('radar');

 var labels = new pv.Panel()
      .width(w)
      .height(h)
      .canvas('radar-labels');

// arcs
radar.add(pv.Dot)
       .data(radar_arcs)
       .left(w/2)
       .bottom(h/2)
       .radius(function(d){return d.r;})
       .strokeStyle("#ccc")
       .anchor("top")       
       .add(pv.Label).text(function(d) { return d.name;});

var numberOfQuadrants = radar_data.length;
var step = 360/radar_data.length;
var outerWidth = radar_arcs[radar_arcs.length-1].r;

for (var i=0;i<=numberOfQuadrants;++i) {
   radar.add(pv.Line)
     .data([0,step*i])
     .lineWidth(1)
     .top(function(d) { return d===0 ? h/2 : h/2 + Math.cos(pv.radians(d)) * outerWidth; })
     .left(function(d) { return d===0 ? w/2 : w/2 + Math.sin(pv.radians(d)) * outerWidth; })
     .strokeStyle("#bbb");
}

// blips
// var total_index=1;
// for (var i = 0; i < radar_data.length; i++) {
//     radar.add(pv.Dot)       
//     .def("active", false)
//     .data(radar_data[i].items)
//     .size( function(d) { return ( d.blipSize !== undefined ? d.blipSize : 70 ); })
//     .left(function(d) { var x = polar_to_raster(d.pc.r, d.pc.t)[0];
//                         //console.log("name:" + d.name + ", x:" + x); 
//                         return x;})
//     .bottom(function(d) { var y = polar_to_raster(d.pc.r, d.pc.t)[1];                                 
//                           //console.log("name:" + d.name + ", y:" + y); 
//                           return y;})
//     .title(function(d) { return d.name;})		 
//     .cursor( function(d) { return ( d.url !== undefined ? "pointer" : "auto" ); })                                                            
//     .event("click", function(d) { if ( d.url !== undefined ){self.location =  d.url}}) 
//     .angle(Math.PI)  // 180 degrees in radians !
//     .strokeStyle(radar_data[i].color)
//     .fillStyle(radar_data[i].color)
//     .shape(function(d) {return (d.movement === 't' ? "triangle" : "circle");})         
//     .anchor("center")
//         .add(pv.Label)
//         .text(function(d) {return total_index++;}) 
//         .textBaseline("middle")
//         .textStyle("white");            
// }


//Quadrant Ledgends
var radar_quadrant_ctr=1;
var quadrantFontSize = 18;
var headingFontSize = 14;
var stageHeadingCount = 0;
var lastRadius = 0;
var lastQuadrant='';
var spacer = 6;
var fontSize = 10;
var total_index = 1;

//TODO: Super fragile: re-order the items, by radius, in order to logically group by the rings.
for (var i = 0; i < radar_data.length; i++) {
    //adjust top by the number of headings.
    var label_col = w / radar_data.length * i + fontSize;

    if (lastQuadrant != radar_data[i].quadrant) {
        labels.add(pv.Label)         
            .left(label_col)         
            .top( quadrantFontSize )  
            .text(  radar_data[i].quadrant )		 
            .strokeStyle( radar_data[i].color )
            .fillStyle( radar_data[i].color )                    
            .font(quadrantFontSize + "px sans-serif");
         
        lastQuadrant = radar_data[i].quadrant;

    }

    var itemsByStage = _.groupBy(radar_data[i].items, function(item) {return Math.floor(item.pc.r / 100)});
    var offsetIndex = 0;
    var keys = _(itemsByStage).keys();
    for (key in keys) {
    var stageIdx = keys[key];

        if (stageIdx > 0) {
            var length = 0;
            for(var prev = 1; prev <= stageIdx; prev++){
                if (itemsByStage[stageIdx-prev] !== undefined){
                   length = itemsByStage[stageIdx-prev].length;
                   break;
                }
            }
            offsetIndex = offsetIndex + length + 1; 
            console.log("offsetIndex = " + length, offsetIndex );
        }

        labels.add(pv.Label)         
            .left( label_col )
            .top( (2 * quadrantFontSize) + spacer + (stageIdx * headingFontSize) + (offsetIndex * fontSize) )
            .text( radar_arcs[stageIdx].name)
            .strokeStyle( '#cccccc' )
            .fillStyle( '#cccccc')                    
            .font(headingFontSize + "px Courier New");

    labels.add(pv.Label)             
        .left( label_col )         
        .top( (2 * quadrantFontSize) + spacer + (stageIdx * headingFontSize) + (offsetIndex * fontSize) )
        .strokeStyle( radar_data[i].color )
        .fillStyle( radar_data[i].color )                    
        .add( pv.Dot )            
            .def("i", (2 * quadrantFontSize) + spacer + (stageIdx * headingFontSize) + spacer  + (offsetIndex * fontSize) )
            .data(itemsByStage[stageIdx])            
            .top( function() { return ( this.i() + (this.index * fontSize) );} )   
            .shape( function(d) {return (d.movement === 't' ? "triangle" : "circle");})                 
            .cursor( function(d) { return ( d.url !== undefined ? "pointer" : "auto" ); })                                                            
            .event("click", function(d) { if ( d.url !== undefined ){self.location =  d.url}}) 
            .size(fontSize) 
            .angle(45)            
            .anchor("right")                
                .add(pv.Label)                
                .text(function(d) {return radar_quadrant_ctr++ + ". " + d.name;} );

    radar.add(pv.Dot)       
      .def("active", false)
      .data(itemsByStage[stageIdx])
      .size( function(d) { return ( d.blipSize !== undefined ? d.blipSize : 70 ); })
      .left(function(d) { var x = polar_to_raster(d.pc.r, d.pc.t)[0];
                          //console.log("name:" + d.name + ", x:" + x); 
                          return x;})
      .bottom(function(d) { var y = polar_to_raster(d.pc.r, d.pc.t)[1];                                 
                            //console.log("name:" + d.name + ", y:" + y); 
                            return y;})
      .title(function(d) { return d.name;})		 
      .cursor( function(d) { return ( d.url !== undefined ? "pointer" : "auto" ); })                                                            
      .event("click", function(d) { if ( d.url !== undefined ){self.location =  d.url}}) 
      .angle(Math.PI)  // 180 degrees in radians !
      .strokeStyle(radar_data[i].color)
      .fillStyle(radar_data[i].color)
      .shape(function(d) {return (d.movement === 't' ? "triangle" : "circle");})         
      .anchor("center")
          .add(pv.Label)
          .text(function(d) {return total_index++;}) 
          .textBaseline("middle")
          .textStyle("white");            


    }
}      
       
 radar.anchor('radar');
 radar.render();

 labels.anchor('radar-labels');
 labels.render();
     
  };
