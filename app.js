// https://observablehq.com/@mayagans/cascading-zoomable-treemap@2099
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Grup 4 ` //Bu kısımda en üstte gözükecek başlığımızı yazdık. '#' işaretini kullanma sebebimiz bunu başlık olarak algılamasıydı. 
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Bu Veri Görselleştirmesi BTE307 - Eğitimde Modelleme ve Tasarım dersi için yapıldı. Bu görselleştirmede Cascading Zoomable Treemap Kullanıldı. Görselleştirmede kullanılan veriler
1-Siber Zorbalığa Uğrayanlar
2-Siber Zorbalık Yapanlar
3-Özel Okul
4-Devlet Okulu
5-Chat Odalarında atılma, hakarete uğrama ve tehdit edilme. 
Bu görselleştirme "Examination of Cyberbullying Experiences among Turkish Students from Different School Types" Adlı çalışmadan faydalanılarak yapıldı.`
)});
  main.variable(observer("chart")).define("chart", ["d3","width","height","DOM","treemapDims","offset","treemap","result","getNestedCloseRelatives","rectifyDimensions","format"], function(d3,width,height,DOM,treemapDims,offset,treemap,result,getNestedCloseRelatives,rectifyDimensions,format)
{
  const svg = d3.create("svg")                          //Create metodu ile bir svg oluşturduk. .attr ve .style metodları ile oluşturduğumuz svg'ye özellikler atadık.
      .attr("viewBox", [0, 0, width, height])           
      .style("overflow", "visible")           
      .style("font", "30px Helvetica");                 //Örneğin .style metodu ile fontu ve puntosunu değiştirdik.
      
 

  const margin = {                                      //Burada margin(Dış boşluk) ayarlamalarını yaptık.4 Değerimiz bulunmakta.
    top: 40,
    bottom: 20,
    left: 15,
    right: 25
  }
  
  const strokeWidth = 1 ;                               //Bu kısım veri görselleştirmenin üzerinde bulunmadığımız zaman kenar kalınlığını ifade ediyor.
  const strokeColor = "White";
  const activeParentStrokeWidth = 3;                    //Bu kısım ise veri görselleştirme ile etkileşime girerken kenar kalınlığımızı 3px yapmamızı sağlıyor.
  const activeParentStrokeColor = "White";              //Burada ise kenar çizgimizin rengini ayarladık.
  
  
  const shadow = DOM.uid("shadow");

  svg.append("filter")
      .attr("id", shadow.id)
    .append("feDropShadow")
      .attr("flood-opacity", 0.3)
      .attr("dx", 0)
      .attr("stdDeviation", 3);
  
  //Indicator value for whether ancestor as clicked
  var ancestorClicked = false;
  
  //Scale projecting onto svg domain
  var xScale = d3.scaleLinear()
                 .domain([5, treemapDims.width])
                 .range([margin.left, width - margin.right])
                 .clamp(false);
  var yScale = d3.scaleLinear()
                 .domain([5,treemapDims.height])
                 .range([margin.top, height - margin.bottom])
                 .clamp(false);
  
  
  //Yakınlaştırma işlevini etkinleştiren dinamik ölçek
  var parentXScale = d3.scaleLinear().domain([0, treemapDims.width])
                                      .range([margin.left,treemapDims.width - margin.right])
                                      .clamp(false);
  
  var parentYScale = d3.scaleLinear().domain([0, treemapDims.height])
                                     .range([margin.top,treemapDims.height - margin.bottom])
                                     .clamp(false);
  
  // Üçlü operatörlerde kullanım için kimlik ölçekleri

  var identityXScale = d3.scaleLinear()
                         .domain(xScale.range())
                         .range(xScale.range())
                         .clamp(false);
  
  var identityYScale = d3.scaleLinear()
                         .domain(yScale.range())
                         .range(yScale.range())
                         .clamp(false);
   
  //Özel ağaç haritası basamaklandırması için Ofsetler alın 
  const yOffset = yScale.invert(yScale.range()[0]+ yScale.range()[1] - yScale(yScale.domain()[1] - offset));
  const xOffset = xScale.invert(xScale.range()[0]+ xScale.range()[1] - xScale(xScale.domain()[1] - offset));

  //Ağaç haritası verileri oluşturun
  const root = treemap(result);
  
  //Min, medyan, maks ile renk ölçeğini belirledik.
  const ext = d3.extent(root.descendants(), d => d.value)
  const med = d3.mean(root.descendants(), d => d.value) 
  const last = d3.extent(root.descendants(), d=>d.value)
  const last2 = d3.extent(root.descendants(), d=>d.value)
  const last3 = d3.extent(root.descendants(), d=>d.value)

  const colorScale = d3.scaleLinear([last[1], last2[1], ext[0], med, ext[0], last3[1]], ["#E05698","#FF8829","#36c772","#f06bff","#FFCA29","#385FFA"]);

  //Buradaki fonksiyon veri modelimizde bir alt değişkene geçerken oluşan animasyonun süresini ayarlamamızı sağlıyor. Buradaki 600 değeri 1 saniyeye tekabül ediyor. 
  const tTime = 600;
    
  function update(current_node){
    // Geçerli düğüme göre üst ölçeği değiştir
    parentXScale
      .domain([d3.min(current_node.children, d => d.x0),d3.max(current_node.children, d => d.x1)])
      .range([(current_node.ancestorX0 + xOffset), current_node.ancestorX0 + treemapDims.width + xOffset]);
    
    parentYScale
      .domain([d3.min(current_node.children, d => d.y0),d3.max(current_node.children, d => d.y1)])
      .range([current_node.ancestorY0 + yOffset,  current_node.ancestorY0 + treemapDims.height + yOffset]);
    
     
    xScale.domain([0, parentXScale.range()[1]])
    yScale.domain([0, parentYScale.range()[1]])
    //Add Layers
    let layers = svg
      .selectAll(".layer")
      .data(getNestedCloseRelatives(current_node)).join("g").classed("layer",true)

    
    //Remove layers
    layers.exit().remove();
    layers.enter().attr("filter", shadow);
        layers.attr("filter", shadow);
    
    //Create nodes based on data names
    let children = layers.selectAll(".child").data(d => d.values, d => d.ancestors().reverse()
                                                                    .map(x => x.data.name).join("/"));

    //Remove children
    children.exit().transition().duration(tTime)
      .remove();
      
    children.exit()
      .selectAll("*")
      .remove();
    
    // Transition updated node groups
    children.transition()
      .duration(tTime).attr("transform", d => {
          let coords = rectifyDimensions(d);    
          if(d.isAncestor){
            return `translate(${xScale(coords.x0)},${yScale(coords.y0)})`
          }else{   
            return `translate(${xScale(parentXScale(coords.x0))},${yScale(parentYScale(coords.y0))})`
          }
    });
    
    //Add functionality on updated nodes in case of grandchildren
    children.on("click", function(event, d, i){
            let newParent = d3.select(this);
            if (d.children){
              handleNewParentClick(newParent);
              update(d);
            }})
        .on("mouseover", function(event, d) {
          let tempParent = d3.select(this)
          if(!d.children) return;
          handleNewParentMouseOver(tempParent);          
        })
    .on("mouseout",  function(event, d) {
          let notNewParent = d3.select(this);
          handleNewParentMouseOut(notNewParent)});
    
    //Transition Rectangles
    children.selectAll("rect").transition().delay(function(d){
     if(ancestorClicked) return 0;
     
     return d === current_node || d.depth < current_node.depth ? 0 : tTime;
    
    })      
        .on("end", () => svg.selectAll(".layer").selectAll("*").attr("pointer-events","auto"))
        .attr("width", d => {
                let coords = rectifyDimensions(d);    
                if(d.isAncestor){
                   return (xScale(coords.x1) - xScale(coords.x0));
                }else{   
                  return (xScale(parentXScale(coords.x1)) - xScale(parentXScale(coords.x0)));
                }
            })
        .attr("height", d => {
                let coords = rectifyDimensions(d);    
                if(d.isAncestor){
                   return (yScale(coords.y1) - yScale(coords.y0));
                }else{   
                  return (yScale(parentYScale(coords.y1)) - yScale(parentYScale(coords.y0)));
                }})
        .attr("fill", d => colorScale(d.value));
    
    
    var childrenToAddText = children.filter(function(d){
                                return d3.select(this).select("text").empty();
                            })
    
    childrenToAddText.append("text")
                              .attr("clip-path", d => d.clipUid)
                            .selectAll("tspan")
                            .data(d => d.data.name.split(/(?=[A-Z][^A-Z])/g).concat(format(d.value)))
                            .join("tspan")
                              .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)                                      
                               .attr("opacity", 0).transition().delay(tTime).attr("opacity", 1)
                            .text(d => d);

      
      
      childrenToAddText.filter(d => d.children).selectAll("tspan")
        .attr("y", 30)
        .attr("dx",3)
        
     childrenToAddText.filter(d => !d.children).selectAll("tspan")
       .attr("y", function(d, i, node){
            return  `${(i === node.length - 1) * 0.3 + 1.1 + i * 0.9}em`;
       }).attr("x", 3)
        
     
          
    
    
    let childrenEnter = children.enter().append("g").classed("child", true)
        .on("click", function(event, d){
            let newParent = d3.select(this);
            if (d.children){
              handleNewParentClick(newParent);
              update(d);
            }})
        .on("mouseover", function(event, d) {
          let tempParent = d3.select(this)
          
          if(!d.children){
            return; 
          }
          handleNewParentMouseOver(tempParent);          
        })
    .on("mouseout",  function(event, d) {
          var notNewParent = d3.select(this);
          notNewParent.transition()
          handleNewParentMouseOut(notNewParent)});
    

    
    childrenEnter.attr("transform", d => {
          let coords = rectifyDimensions(d);    
          if(d.isAncestor){
            return `translate(${xScale(coords.x0)},${yScale(coords.y0)})`
          }else{   
            return `translate(${xScale(parentXScale(coords.x0))},${yScale(parentYScale(coords.y0))})`
          }
    });
    
    
    childrenEnter.call(Child);
    
    let tempLayer = svg.append("g").attr("id","tempLayer");
    tempLayer = svg.append("g").attr("pointer-events","none");
    
   
  }
  
  function Child(selection){
    selection.append("title")
        .text(d => `${d.ancestors().reverse().map(d => d.data.name).join("/")}\n${format(d.value)}`);

    
     selection.append("rect")
        .attr("id", d => (d.nodeUid = DOM.uid("node")).id)
        .attr("stroke-width", 1)
        .attr("stroke", "white")
        .attr("opacity", 0)
        .attr("fill", d => colorScale(d.value))
       .attr("width", d => {
                let coords = rectifyDimensions(d);    
                if(d.isAncestor){
                   return (xScale(coords.x1) - xScale(coords.x0));
                }else{   
                  return (xScale(parentXScale(coords.x1)) - xScale(parentXScale(coords.x0)));
                }
            })
        .attr("height", d => {
                let coords = rectifyDimensions(d);    
                if(d.isAncestor){
                   return (yScale(coords.y1) - xScale(coords.y0));
                }else{   
                  return (yScale(parentYScale(coords.y1)) - yScale(parentYScale(coords.y0)));
                }
            })
            .transition().duration(tTime).on("interrupt", function(d){
          var selection = d3.select(this);
            selection.attr("fill", d => colorScale(d.value));
                                    
     }).attr("opacity", 1);
    
    selection.append("clipPath")
      .attr("id", d => (d.clipUid = DOM.uid("clip")).id)
    .append("use")
      .attr("xlink:href", d => d.nodeUid.href);
    


    selection.append("text")        //Bu kısımda değişkenlerin texti ile ilgili ayarlamaları yapabiliyoruz.
        .attr("clip-path", d => d.clipUid)
      .selectAll("tspan")
        .data(d => d.data.name.split(/(?=[A-Z][^A-Z])/g).concat(format(d.value)))
        .join("tspan")
        .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
        .attr("y",30)       // Bu kısımda her değişkenin oturduğu kısmın y' koordinatındaki değerini verdik. Bunu değiştirme sebebimiz değişken adını büyütünce dışarıya taşmaların olmasıydı. Bu değeri punto ile aynı değere getirdik.
        .attr("dx",3)
        .text(d => d)
        .attr("opacity", 0)
        .transition().duration(tTime).attr("opacity", 1)
    
            

  }
       
  
  function grandChild(selection){
       let datum = selection.datum()
     
     let tempLayer =  svg.select("#tempLayer").attr("width", datum.x1 - datum.x0)
                        .attr("height", datum.y1 - datum.y0)
     
     
     let innerNodes =  tempLayer.selectAll('.child')
                              .data(datum.children, function(d){
                                return d.ancestors().reverse().map(x => x.data.name).join("/");

                              
                              
                             }).join("g")
                              .classed("child", true)
                              .attr("transform", d => {
                                return `translate(${xScale(parentXScale(d.x0))},${yScale(parentYScale(d.y0))})`})
                              .attr("pointer-events","none");
   
    
     innerNodes.append("title")
        .text(d => `${d.ancestors().reverse().map(d => d.data.name).join("/")}\n${format(d.value)}`);
    
    innerNodes.append("rect")
        .attr("id", d => (d.nodeUid = DOM.uid("node")).id)
        .attr("fill", d => colorScale(d.value))
        .attr("width", d => xScale(parentXScale(d.x1)) - xScale(parentXScale(d.x0)))
        .attr("height", d => yScale(parentYScale(d.y1)) - yScale(parentYScale(d.y0)))
        .transition().duration(tTime).on("interrupt", function(d){
            var selection = d3.select(this);
            selection.attr("fill-opacity",1)                                    
        })
        .attr("fill-opacity",1).attr("stroke-width", 1)
        .attr("stroke", "white");
    
    innerNodes.append("clipPath")
      .attr("id", d => (d.clipUid = DOM.uid("clip")).id)
    .append("use")
      .attr("xlink:href", d => d.nodeUid.href);
  }
  
  
  function handleNewParentClick(selection){
    ancestorClicked = selection.datum().isAncestor;
    selection.selectAll("rect")
      .attr("stroke",strokeColor)
      .attr("stroke-width", strokeWidth)
    
    let tempLayer = svg.select("#tempLayer");
    tempLayer.attr("id", null)
    tempLayer.classed("layer", true);
  }
  
  function handleNewParentMouseOver(selection){
      selection.select("rect")
      .attr("stroke",activeParentStrokeColor)
      .attr("stroke-width", activeParentStrokeWidth)
    if(selection.datum().isAncestor) return;
    
    selection.call(grandChild);  
 
  }

    function handleNewParentMouseOut(selection){
      selection.select("rect")
        .attr("stroke",strokeColor)
        .attr("stroke-width", strokeWidth)
      
      if(!selection.datum().isAncestor) {
        let tempChildren = svg.select('#tempLayer').selectAll('*');
        tempChildren.interrupt();
        tempChildren.remove();
    };
  }

 
  update(root);

  return svg.node();
}
);
  main.variable(("getNestedCloseRelatives")).define("getNestedCloseRelatives", ["d3"], function(d3){return(
function getNestedCloseRelatives(node){

    node.ancestors().forEach(d => d.isAncestor = true);
    let relativesSet = new Set(node.ancestors().reverse());
  
    if(node.children){
      node.children.forEach(d => {
        d.isAncestor = false;
        relativesSet.add(d)
      })};
  
  ///let depthNest = d3.nest().key(d => d.depth).entries([...relativesSet]);
  //console.log(depthNest)
  let depthNest = d3.group([...relativesSet], d => d.depth)
  let arr = Array.from(depthNest).map(([name, values]) => ({name, values}))
  return arr
  //console.log(arr)
  //return depthNest
}
)});
  main.variable(("rectifyDimensions")).define("rectifyDimensions", function(){return(
(d) => {
  let x0Temp = d.isAncestor ? d.ancestorX0 : d.x0;
  let y0Temp = d.isAncestor ? d.ancestorY0 : d.y0;
  let x1Temp = d.isAncestor ? d.ancestorX1 : d.x1;
  let y1Temp = d.isAncestor ? d.ancestorY1 : d.y1;

      return {
        x0: x0Temp,
        y0: y0Temp,
        x1: x1Temp,
        y1: y1Temp}
}
)});
  main.variable(("data")).define("data", ["d3"], function(d3){return(
d3.json("/package.json") //Buradan json dosyasını import edebiliyoruz. Fakat biz bunu kullanmak yerine 504-526. satırlar arasında veri girmeyi tercih ettik.
)});
  main.variable(("data2")).define("data2", function(){return(
    {name: "Chat odalarında Siber Zorba & Siber Kurban Olma Durumları",
    children: 
     [
       {name: "Siber Zorbalığa Uğrayanlar",
        children: [ 
         {name: "Özel Okul", 
          children: [
            {name: "Chat Odasında Tehdit Edilme", value: 5},
            {name: "Chat Odasından Atılma", value: 4},
            {name: "Chat Odasında Hakarete Uğrama", value: 15}
            ]},
          {name: "Devlet Okulu", 
          children: [
            {name: "Chat Odasında Tehdit Edilme", value: 9},
            {name: "Chat Odasından Atılma", value: 22},
            {name: "Chat Odasında Hakarete Uğrama", value: 21}
            ]},
         
        ],
        value: null,
       },
       {name: "Siber Zorbalık Yapanlar",
        children: [
          {name: "Özel Okul", 
          children: [
            {name: "Chat Odasında Tehdit Etme", value: 65},
            {name: "Chat Odasından Atma", value: 9},
            {name: "Chat Odasında Hakaret Etme", value: 20}
            ]},
          {name: "Devlet Okulu", 
          children: [
            {name: "Chat Odasında Tehdit Etme", value: 19},
            {name: "Chat Odasından Atma", value: 37},
            {name: "Chat Odasında Hakaret Etme", value: 23}
            ]},
        ],
        value: null
       }
     ]
    }
  )});
  main.variable(("makeTree")).define("makeTree", function(){return(
arr =>
    arr.reduce((r,{name,parent,value,...others},i) =>
    {
    let refParent = r.pKeys.find(x=>x.name===parent)

    if (!refParent) // --> parent==='All'
      {
      r.res.name     = parent
      r.res.children = [] 
      refParent      = { name: parent, children: r.res.children }
      r.pKeys.push( refParent )
      }
    let newRow = {  name, value, ...others }
    if (value===null) 
      {
      newRow.children = []
      r.pKeys.push( { name, children: newRow.children } )
      }
    refParent.children.push( newRow )

    if (i===r.end) return r.res
    return r
    }
    ,{ end:arr.length -1, res:{}, pKeys:[] })
)});
  main.variable(("rawdata")).define("rawdata", function(){return(
[ 
    {name: 'Siber Zorbalığa Uğrayanlar',  parent: 'Chat odalarında Siber Zorba & Siber Kurban Olma Durumları', value: null} 
  , {name: 'Özel Okul-U',  parent: 'Siber Zorbalığa Uğrayanlar',   value: null}
  , {name: 'Devlet Okulu-U',  parent: 'Siber Zorbalığa Uğrayanlar',   value: null}
  , {name:'Chat Odasında Tehdit Edilme', parent :'Özel Okul-U', value:5}
  , {name:'Chat Odasından Atılma', parent :'Özel Okul-U', value:4}
  , {name:'Chat Odasında Hakarete Uğrama', parent :'Özel Okul-U', value:15}

  , {name:'Chat Odasında Tehdit Edilme', parent :'Devlet Okulu-U', value:9}
  , {name:'Chat Odasından Atılma', parent :'Devlet Okulu-U', value:22}
  , {name:'Chat Odasında Hakarete Uğrama', parent :'Devlet Okulu-U', value:21}


  , {name: 'Siber Zorbalık Yapanlar',  parent: 'Chat odalarında Siber Zorba & Siber Kurban Olma Durumları', value: null} 
  , {name: 'Özel Okulu-Y',  parent: 'Siber Zorbalık Yapanlar',   value: null} 
  , {name: 'Devlet Okulu-Y',  parent: 'Siber Zorbalık Yapanlar',   value: null} 
  
  , {name:'Chat Odasında Tehdit Etme', parent :'Özel Okulu-Y', value:5}
  , {name:'Chat Odasından Atma', parent :'Özel Okulu-Y', value:9}
  , {name:'Chat Odasında Hakaret Etme', parent :'Özel Okulu-Y', value:20}
  
  , {name:'Chat Odasında Tehdit Etme', parent :'Devlet Okulu-Y', value:19}
  , {name:'Chat Odasından Atma', parent :'Devlet Okulu-Y', value:37}
  , {name:'Chat Odasında Hakaret Etme', parent :'Devlet Okulu-Y', value:23}
  ]
)});    //Normalde alttaki veriler kullanıcı tarafından arayüzde görüntüleniyordu. Bu veri görselleştirmemizin anlaşılabilirliğini azalttığı için observer fonksiyonlarını silerek bu verilerin görünürlüğünü kaldırdık.
  main.variable(("result")).define("result", ["makeTree","rawdata"], function(makeTree,rawdata){return(
makeTree( rawdata )
)});
  main.variable(("treemap")).define("treemap", ["cascade","d3","treemapDims","offset"], function(cascade,d3,treemapDims,offset){return(
data => cascade(
  d3.treemap()
    .size([treemapDims.width, treemapDims.height])
    .paddingTop(treemapDims.paddingTop)
    .paddingInner(0)
    .round(true)
    .tile(d3.treemapResquarify)
  (d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.height - a.height)),
  offset // treemap.paddingOuter
)
)});
  main.variable(("cascade")).define("cascade", ["treemapDims"], function(treemapDims){return(
function cascade(root, offset) {
  
  return root.eachAfter(d => {
    let ancWidth = treemapDims.width;
    let ancHeight = treemapDims.height;
    
    d.ancestorX0 = d.depth * offset;
    d.ancestorY0 = d.depth * offset;
    d.ancestorX1 = d.ancestorX0 + ancWidth;
    d.ancestorY1 = d.ancestorY0 + ancHeight;
    
    d.childMinX = d.ancestorX0 + offset;
    d.childMinY = d.ancestorY0 + offset;
  });
}
)});
  main.variable(("offset")).define("offset", function(){return(
15        //Burada offset yöntemi ile ilgili koordinat değişikliği yapıldı.
)});
  main.variable(("width")).define("width", function(){return(
2440  //Burada genişliği değiştirdik.
)});
  main.variable(("height")).define("height", function(){return(
1080  //Burada yükseklik değerini değiştirdik.
)});
  main.variable(("treemapDims")).define("treemapDims", ["width","height"], function(width,height){return(
{
    width: width/3,       //Bu kısımda ise katmanlar arasındaki hiyerarşiyi ayarlamak için değişiklikler yaptık. Genişlik ve uzunluğu ayarladık. 
    height: height/3,
    paddingTop: 25        //İki dal arasındaki boşluğun ayarlamasını da buradan gerçekleştirdik.
  }
)});
  main.variable(("format")).define("format", ["d3"], function(d3){return(
d3.format(",d")
)});
  main.variable(("d3")).define("d3", ["require"], function(require){return(
require("d3@6")
)});
  return main;
}
