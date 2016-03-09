var radar = {};

radar.draw = function(h,w) {
  $('#title').text(document.title);

 var radar_panel = new pv.Panel()
      .width(w)
      .height(h)
      .canvas('radar');

 var labels = new pv.Panel()
      .width(w)
      .height(h)
      .canvas('radar-labels');

// arcs
radar_panel.add(pv.Dot)
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
   radar_panel.add(pv.Line)
     .data([0,step*i])
     .lineWidth(1)
     .top(function(d) { return d===0 ? h/2 : h/2 + Math.cos(pv.radians(d)) * outerWidth; })
     .left(function(d) { return d===0 ? w/2 : w/2 + Math.sin(pv.radians(d)) * outerWidth; })
     .strokeStyle("#bbb");
}

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

    radar_panel.add(pv.Dot)
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

 radar_panel.anchor('radar');
 radar_panel.render();

 labels.anchor('radar-labels');
 labels.render();
};


radar.blip_positions = [];

radar.handleFile = function(e) {
  var files = e.target.files;
  var i,f;
  for (i = 0, f = files[i]; i != files.length; ++i) {
    var reader = new FileReader();
    var name = f.name;
    reader.onload = function(e) {
      var d = e.target.result;

      radar.workbook = XLSX.read(d, {type: 'binary'});

      console.log("Populating sheet names");
      for(sheet in radar.workbook.SheetNames) {
          $("#sheets").append($("<option/>", {html: radar.workbook.SheetNames[sheet]}));
      }
      $("#sheet-row").prop("hidden", false);
    };
    reader.readAsBinaryString(f);
  }
}

radar.handleSheetSelect = function(e) {
      console.log("Rendering radar");
      var worksheet = radar.workbook.Sheets[e.target.value];
      console.log(radar.rowsToArray(worksheet));
      var a = radar.rowsToArray(worksheet);
      for(quad in radar_data){
          radar_data[quad].items = radar.arrayToRadarItem(a, radar_data[quad].quadrant);
      }
      radar.draw(h,w); // Redraw
      radar.encode_as_img_and_link("#radar");
      radar.encode_as_img_and_link("#radar-labels");
}

radar.rowsToArray = function(ws) {
  var cur_row = 0;
  var rows = [];
  var temp_row = [];

  for(z in ws) {
      if( z[0] === '!' ) continue;
      if( XLSX.utils.decode_cell(z).r === 0 ) continue; // Consider the first row as headings
      // console.log(z + " is " + ws[z].v);
      if( cur_row === XLSX.utils.decode_cell(z).r) {
          temp_row.push(ws[z].v);

      } else {
          cur_row = XLSX.utils.decode_cell(z).r;
          if( temp_row.length > 0 ) {
              rows.push(temp_row);
          }
          temp_row = [ws[z].v];
      }

  };

  rows.push(temp_row);
  return rows;
}

radar.arrayToRadarItem = function(arr, cat) {
    var items = [];
    var pos_name = 1; // Name
    var pos_cat = 2; // Catagory
    var pos_rec = 3; // Recommendation

    for( i in arr ) {
        if( arr[i][pos_cat] != cat ) continue;
        var overlapping = true;
        var count = 0;
        while(overlapping == true && count < 100)
        {
            var radius = radar.arcNameToRadius(arr[i][pos_rec]); 
            var angle = radar.catNameToAngle(cat);
            overlapping = radar.checkOverlappingBlip(radius, angle);
            count = count + 1;
        }
        radar.blip_positions.push({"r":radius, "t":angle});

        var temp_item = {"name":arr[i][pos_name], "pc":{"r":radius,"t":angle},"movement":"c"};
        items.push(temp_item);
    }
    return items;
}

radar.arcNameToRadius = function(n) {

    for ( a in radar_arcs ) {
        if ( n === radar_arcs[a].name ){
            return radar_arcs[a].r - (Math.floor((Math.random() * 80) + 10)); // TODO hard coded
        }
    }
    return 0; // Did not match any of the names
}

radar.catNameToAngle = function(catagory){
    var step = 360 / radar_data.length;
    for (c in radar_data) {
        if (catagory === radar_data[c].quadrant ){
            return ((2 * step - 90) - Math.floor((Math.random() * (step - 10)) + 5 ) + (c *  step)); //TODO hard coded buffer value
        }
    }
    return 0; // Did not match any of the catagories
}

radar.checkOverlappingBlip = function(r, t){
    for (pos in radar.blip_positions){
        if(radar.polar_distance({"r":r,"t":t}, radar.blip_positions[pos]) < 20) return true; //TODO hard coded value
    }
    return false;
}

radar.polar_distance = function(a, b){
    var rad_a = a.t * (2 * Math.PI / 360); // Degrees to rad
    var rad_b = b.t * (2 * Math.PI / 360);
    return Math.sqrt(Math.pow(a.r, 2) + Math.pow(b.r, 2) - (2 * a.r * b.r * Math.cos(rad_b - rad_a)));
}

radar.encode_as_img_and_link = function(id){
 // Add some critical information
 $("svg").attr({ version: '1.1' , xmlns:"http://www.w3.org/2000/svg"});

 var svg = $(id).html();
 var b64 = btoa(svg); // or use btoa if supported


 // Works in Firefox 3.6 and Webit and possibly any browser which supports the data-uri
 $("body").append($("<a href-lang='image/svg+xml' href='data:image/svg+xml;base64,\n"+b64+"' title='file.svg'>Download  </a>"));
}

