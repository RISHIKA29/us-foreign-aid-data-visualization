import define1 from "./a33468b95d0b15b0@817.js";
import define2 from "./a2e58f97fd5e8d7c@756.js";

function _1(md){return(
md`# Final Project - US Foreign Aid Visualization`
)}

function _2(md){return(
md`## Participants: 
1. Rishika Reddy Karra – Z2031118 

2. Sufiyan Abdullah Ghori Mohammed – Z2037215 `
)}

function _3(md){return(
md`**CSV Data Source:** https://s3.amazonaws.com/files.explorer.devtechlab.com/us_foreign_budget_complete.csv`
)}

function _4(md){return(
md`**GitHub Repo:** https://github.com/MSufiyanAG/U.S.-Global-Funding-Dashboard`
)}

function _5(md){return(
md`## 📄 Dataset Description

* This dataset provides a structured overview of U.S. foreign aid allocations across countries, regions, sectors, and funding agencies over multiple fiscal years.
* It combines both categorical and quantitative information to support informed analysis of foreign assistance trends and priorities.
* To support clearer analysis and visualization, the original detailed data — which included a wide range of funding agencies and allocation categories — was logically grouped. This helped make the patterns in the data easier to interpret while preserving important details across sectors and regions.`
)}

function _6(md){return(
md`## Tasks

1. Which countries receive U.S. foreign aid?
2. How much foreign aid does each region/country receive relative to others?
3. How is U.S. foreign aid divided among different funding groups?
4. How is U.S. foreign aid distributed across major allocation categories?
5. How do funding groups contribute to different allocation categories, and how can categories be traced back to their funding sources?
6. How are funding groups and allocation categories further broken down into sub-groups and sub-categories to provide a deeper understanding of aid distribution?`
)}

function _7(md){return(
md`# Funding Agency -> Regions -> Categories`
)}

function _8(md){return(
md`**How do all these dimensions—regions, countries, funding groups, and allocation categories—interact to shape the overall pattern of U.S. foreign aid distribution?**`
)}

function _9(md){return(
md`## Imports`
)}

function _d3sankey(require){return(
require("d3-sankey@0.12")
)}

function _sankey(d3sankey){return(
d3sankey.sankey
)}

function _sankeyLinkHorizontal(d3sankey){return(
d3sankey.sankeyLinkHorizontal
)}

function _15(md){return(
md`## Reading & processing Data`
)}

async function _data(d3){return(
await d3.csv("https://raw.githubusercontent.com/MSufiyanAG/U.S.-Global-Funding-Dashboard/refs/heads/main/us_foreign_budget_modified.csv", d => ({
  ...d,
  current_amount: +d.current_amount
}))
)}

async function _world(d3){return(
await d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
)}

function _dataByCountry(d3,data){return(
d3.rollup(
  data,
  v => ({
    totalAmount: d3.sum(v, d => d.current_amount),
    countryName: v[0]["Country Name"],
    regionName: v[0]["Region Name"],
    incomeGroupName: v[0]["Income Group Name"],
    transactionTypeName: v[0]["Transaction Type Name"],
    agencyGroup: v[0]["Agency Group"],
    fundingSubGroup: v[0]["Funding Sub Group"],
    mainCategory: v[0]["Main Category"],
    subCategory: v[0]["Sub-Category"]
  }),
  d => [
    d["Country Name"],
    d["Region Name"],
    d["Income Group Name"],
    d["Transaction Type Name"],
    d["Agency Group"],
    d["Funding Sub Group"],
    d["Main Category"],
    d["Sub-Category"]
  ].join("|")
)
)}

function _regionToCountries(data)
{
  return new Map(data.map(d => [d["Country Name"], d["Region Name"]]));
}


function _uniqueRegions(data)
{ 
  return [...new Set(data.map(d => d["Region Name"]))];
}


function _21(md){return(
md`## Visual Components`
)}

function _selectedRegion(Inputs,uniqueRegions){return(
Inputs.select(["All",...uniqueRegions], {label: "Select a Region"})
)}

function _23(md){return(
md`### Geo Map`
)}

function _chart(d3,mixcolor,dataByCountry,world,regionToCountries,selectedRegion,selectedFundingGroup,selectedMainCategoryFilter,invalidation)
{
  const width = 500, height = 500;
  const centerX = width / 2;
  const centerY = height / 2;
  const innerRadius = 200; 

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("defs")
  .append("mask")
    .attr("id", "circle-hole-mask")
  .call(mask => {
    mask.append("rect") 
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "white");

    mask.append("circle") 
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", innerRadius)
      .attr("fill", "black");
  });

  
   svg.append("rect")
    .attr("x", 50)
    .attr("y", 62)
    .attr("width", 400)
    .attr("height", 350)
    .attr("fill", mixcolor)
     .attr("mask", "url(#circle-hole-mask)");

  svg.append("defs")
    .append("clipPath")
      .attr("id", "circle-clip")
    .append("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", innerRadius);

  const mapGroup = svg.append("g")
    .attr("clip-path", "url(#circle-clip)");

  svg.append("circle")
    .attr("cx", centerX)
    .attr("cy", centerY)
    .attr("r", innerRadius)
     .style("fill", "none")
    .style("stroke", mixcolor)            
    .style("stroke-width", "10Apx")      
    .style("stroke-dasharray", ""); 

  const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("background", "rgba(255,255,255,0.95)")
    .style("padding", "6px 10px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font", "12px sans-serif")
    .style("display", "none");

  const projection = d3.geoNaturalEarth1();
  let path = d3.geoPath(projection);

  const normalizeName = name => name.trim().toLowerCase();

  const amounts = Array.from(dataByCountry.values(), d => d.totalAmount).filter(d => d > 0);

  const colorScale = d3.scaleSequential()
    .domain([d3.min(amounts), d3.quantile(amounts, 0.99)])
    .interpolator(d3.interpolateBlues)
    .clamp(true);

  function updateMap(selectedRegion, selectedFundingGroup, selectedMainCategoryFilter) {
    const activeDataByCountry = new Map();

    for (const [key, info] of dataByCountry.entries()) {
      const [countryName] = key.split("|");

      const fundingMatch = !selectedFundingGroup || info.agencyGroup === selectedFundingGroup;
      const categoryMatch = !selectedMainCategoryFilter || info.mainCategory === selectedMainCategoryFilter;

      if (fundingMatch && categoryMatch) {
        if (!activeDataByCountry.has(countryName)) {
          activeDataByCountry.set(countryName, { totalAmount: 0 });
        }
        activeDataByCountry.get(countryName).totalAmount += info.totalAmount;
      }
    }

    const features = world.features.filter(d => {
      if (selectedRegion === "All") return true;
      const region = regionToCountries.get(d.properties.name);
      return region === selectedRegion;
    });

    const fittingFeatures = features.length > 0 ? features : world.features;

    projection.fitExtent(
      [
        [centerX - innerRadius, centerY - innerRadius],
        [centerX + innerRadius, centerY + innerRadius]
      ],
      { type: "FeatureCollection", features: fittingFeatures }
    );

    path = d3.geoPath(projection);

    mapGroup.selectAll("path")
      .data(world.features, d => d.properties.name)
      .join("path")
      .attr("d", path)
      .attr("fill", d => {
        const info = activeDataByCountry.get(d.properties.name);
        const region = regionToCountries.get(d.properties.name);
        if (selectedRegion !== "All" && region !== selectedRegion) return "#eee";
        return info ? colorScale(info.totalAmount) : "#ccc";
      })
      .attr("stroke", "#999")
      .attr("stroke-width", 0.4)
      .on("mouseover", (event, d) => {
        const info = activeDataByCountry.get(d.properties.name);
        const region = regionToCountries.get(d.properties.name);

        if (selectedRegion !== "All" && region !== selectedRegion) return;
        if (!info) return;

        tooltip.style("display", "block").html(`
          <b>${d.properties.name}</b><br/>
          Amount: ${info ? `$${info.totalAmount.toLocaleString()}` : "N/A"}
        `);
      })
      .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", () => tooltip.style("display", "none"));
  }

  updateMap(selectedRegion, selectedFundingGroup, selectedMainCategoryFilter);

  invalidation.then(() => tooltip.remove());

  return svg.node();
}


function _choroplethLegend(dataByCountry,d3,html)
{
  const fullWidth = 500;
  const height = 60;
  const marginX = 20;
  const gradientHeight = 10;

  const amounts = Array.from(dataByCountry.values(), d => d.totalAmount).filter(d => d > 0);

  const colorScale = d3.scaleSequential()
    .domain([d3.min(amounts), d3.quantile(amounts, 0.99)])
    .interpolator(d3.interpolateBlues)
    .clamp(true);

  const container = html`<div style="width:${fullWidth}px; padding: 8px; font: 12px sans-serif; display: flex; flex-direction: column; align-items: center; background: #fff; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);"></div>`;

  const svg = d3.select(container)
    .append("svg")
    .attr("width", fullWidth)
    .attr("height", 50);

  const gradientWidth = fullWidth - marginX * 2;

  const defs = svg.append("defs");

  const linearGradient = defs.append("linearGradient")
    .attr("id", "choropleth-gradient")
    .attr("x1", "0%")
    .attr("x2", "100%");

  linearGradient.selectAll("stop")
    .data(d3.range(0, 1.01, 0.01))
    .join("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => colorScale(d3.interpolateNumber(colorScale.domain()[0], colorScale.domain()[1])(d)));

  svg.append("rect")
    .attr("x", marginX)
    .attr("y", 10)
    .attr("width", gradientWidth)
    .attr("height", gradientHeight)
    .style("fill", "url(#choropleth-gradient)");

  const scale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([marginX, marginX + gradientWidth]);

  const formatTick = d => d3.format("$.2s")(d).replace("G", "B");


  const axis = d3.axisBottom(scale)
    .ticks(8) 
    .tickSize(8)
    // .tickFormat(d3.format("$.2s"))
    .tickFormat(formatTick) ;

  svg.append("g")
    .attr("transform", `translate(0, ${10 + gradientHeight})`)
    .call(axis)
    .select(".domain").remove();

  const label = document.createElement("div");
  label.textContent = "Current Amount ($)";
  label.style.marginTop = "6px";
  label.style.fontSize = "12px";
  label.style.color = "#333";

  container.appendChild(label);

  return container;
}


function _26(md){return(
md`### Left Sankey Chart`
)}

function _selectedFundingGroup(){return(
null
)}

function _whiskerSankeyData(data,selectedRegion,regionToCountries,selectedMainCategoryFilter,d3)
{
  let baseData = data;
  
  if (selectedRegion !== "All") {
    baseData = data.filter(d => regionToCountries.get(d["Country Name"]) === selectedRegion);
  }
  if (selectedMainCategoryFilter !== null) {
    baseData = baseData.filter(d => d["Main Category"] === selectedMainCategoryFilter);
  }

  const grouped = d3.rollup(
    baseData,
    v => d3.sum(v, d => +d.current_amount),
    d => d["Funding Sub Group"],
    d => d["Agency Group"]
  );

  const nodesSet = new Set();
  const linksRaw = [];

  for (const [source, targets] of grouped) {
    nodesSet.add(source);
    for (const [target, value] of targets) {
      nodesSet.add(target);
      linksRaw.push({ source, target, value });
    }
  }

  const nodes = Array.from(nodesSet).map(name => ({ name }));
  const nodeIndex = new Map(nodes.map((d, i) => [d.name, i]));

  const links = linksRaw
    .filter(d => nodeIndex.has(d.source) && nodeIndex.has(d.target)) 
    .map(d => ({
      source: nodeIndex.get(d.source),
      target: nodeIndex.get(d.target),
      value: d.value
    }));

  const subGroupToAgencies = d3.rollup(
    baseData,
    v => new Set(v.map(d => d["Funding Agency Name"])),
    d => d["Funding Sub Group"]
  );

  for (const node of nodes) {
    if (subGroupToAgencies.has(node.name)) {
      node.agencyList = Array.from(subGroupToAgencies.get(node.name));
    }
  }

  return { nodes, links };
}


function _whiskerSankeyChart(html,d3,sankey,whiskerSankeyData,sankeyLinkHorizontal,groupColors,selectedFundingGroup,$0,invalidation)
{
  const width = 400;
  const height = 350;
  const rightNodeWidth = 140;
  const startRectWidth = 30;

  const container = html`<div style="position: relative;"></div>`;

  const svg = d3.select(container).append("svg")
    .attr("width", width)
    .attr("height", height);

  const sankeyGen = sankey()
    .nodeWidth(10)
    .nodePadding(4)
    .extent([[0, 0], [width, height]]);

  const graph = sankeyGen({
    nodes: whiskerSankeyData.nodes.map(d => ({ ...d })),
    links: whiskerSankeyData.links.map(d => ({ ...d }))
  });

svg.append("defs").append("pattern")
  .attr("id", "crosshatch")
  .attr("width", 8)
  .attr("height", 8)
  .attr("patternUnits", "userSpaceOnUse")
  .call(pattern => {
    pattern.append("path")
      .attr("d", "M0,0 L8,8 M8,0 L0,8")
      .attr("stroke", "#001f3f")  
      .attr("stroke-width", 1);
  });
svg.append("path")
  .attr("d", `
    M ${width} 0
    L ${width - startRectWidth + 6} 0
    Q ${width - startRectWidth} 0 ${width - startRectWidth} 6
    L ${width - startRectWidth} ${height - 6}
    Q ${width - startRectWidth} ${height} ${width - startRectWidth + 6} ${height}
    L ${width} ${height}
    Z
  `)
  .attr("fill", "url(#crosshatch)")
  .attr("fill-opacity", 1);


  const tooltip = d3.select(container).append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background", "rgba(0,0,0,0.75)")
    .style("color", "#fff")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font", "12px sans-serif")
    .style("display", "none");

  const link = svg.append("g")
    .selectAll("path")
    .data(graph.links)
    .join("path")
    .attr("d", sankeyLinkHorizontal())
    .attr("stroke", d => groupColors(d.target.name))
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("fill", "none")
    .attr("stroke-opacity",1)

    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke-opacity", 0.8);
      tooltip
        .style("display", "block")
        .html(`<strong>${d.source.name} → ${d.target.name}</strong><br/>$${d.value.toLocaleString()}`);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", (event.offsetX + 15) + "px")
        .style("top", (event.offsetY - 20) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke-opacity", 0.4);
      tooltip.style("display", "none");
    });

 const node = svg.append("g")
  .selectAll("path")
  .data(graph.nodes.filter(d => d.x0 > width / 2))
  .join("path")
  .attr("d", d => {
    const curveSize = 6;
    const xStart = d.x1 - rightNodeWidth - startRectWidth;
    const xEnd = d.x1 - startRectWidth;
    return `
      M ${xStart} ${d.y0}
      Q ${xStart - curveSize} ${d.y0} ${xStart - curveSize} ${d.y0 + curveSize}
      L ${xStart - curveSize} ${d.y1 - curveSize}
      Q ${xStart - curveSize} ${d.y1} ${xStart} ${d.y1}
      L ${xEnd - curveSize} ${d.y1}
      Q ${xEnd} ${d.y1} ${xEnd} ${d.y1 - curveSize}
      L ${xEnd} ${d.y0 + curveSize}
      Q ${xEnd} ${d.y0} ${xEnd - curveSize} ${d.y0}
      Z
    `;
  })
  .attr("fill", d => groupColors(d.name))
  .attr("stroke", "#222")
  .style("cursor", "pointer")

    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
      tooltip
        .style("display", "block")
        .html(`<strong>${d.name}</strong><br/>Total: $${d.value.toLocaleString()}`);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", (event.offsetX + 15) + "px")
        .style("top", (event.offsetY - 20) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", "#222").attr("stroke-width", 1);
      tooltip.style("display", "none");
    })
    .on("click", (event, d) => {
      if (selectedFundingGroup === d.name) {
        $0.value = null; 
      } else {
        $0.value = d.name;
      }
      updateHighlight(); 
    });


const labels = svg.append("g")
  .selectAll("text")
  .data(graph.nodes.filter(d => d.x0 > width / 2))
  .join("text")
  .attr("x", d => d.x1 - rightNodeWidth - startRectWidth - 20)  
  .attr("y", d => (d.y0 + d.y1) / 2 - 8)  
  .attr("text-anchor", "start")
  .attr("alignment-baseline", "middle")
  .style("font", "bold 12px sans-serif") 
  .style("fill", "black")
  .call(text => {
    text.each(function(d) {
      const words = d.name.split(" ");  
      const tspan1 = d3.select(this)
        .append("tspan")
        .attr("x", d.x1 - rightNodeWidth - startRectWidth)
        .attr("dy", "0em")
        .text(words.slice(0, Math.ceil(words.length/2)).join(" ")); 

      const tspan2 = d3.select(this)
        .append("tspan")
        .attr("x", d.x1 - rightNodeWidth - startRectWidth)
        .attr("dy", "1.2em")
        .text(words.slice(Math.ceil(words.length/2)).join(" "));  
    });
  });





  function updateHighlight() {
    const selected = selectedFundingGroup;

    node.style("opacity", d => {
      if (!selected) return 1;
      return d.name === selected ? 1 : 0.2;
    });

    link.style("opacity", d => {
      if (!selected) return 0.4;
      return (d.target.name === selected || d.source.name === selected) ? 0.8 : 0.1;
    });

    labels.style("opacity", d => {
      if (!selected) return 1;
      return d.name === selected ? 1 : 0.2;
    });
  }

  updateHighlight();

  invalidation.then(() => tooltip.remove());

  return container;
}


function _groupColors(d3){return(
d3.scaleOrdinal()
  .domain(['Economic & Technical Assistance', 'Diplomatic & Direct Aid',
       'Defense & Strategic Development'])
  .range(["#ff7f0e",  
    "#d62728",  
    "#008080"
          ])
)}

function _whiskerSankeyLegend(html,groupColors)
{
  const container = html`<div style="font: 12px sans-serif; background: #fff; padding: 10px 15px; border: 1px solid #ccc; border-radius: 6px; display: flex; flex-direction: column; gap: 6px; width: fit-content;"></div>`;

  const seenColors = new Map();

  for (const name of groupColors.domain()) {
    const color = groupColors(name);
    if (!seenColors.has(color)) {
      seenColors.set(color, []);
    }
    seenColors.get(color).push(name);
  }

  seenColors.forEach((names, color) => {
    const row = html`<div style="display: flex; align-items: center; gap: 6px;"></div>`;

    const colorBox = html`<div style="width: 14px; height: 14px; background: ${color}; border: 1px solid #999;"></div>`;
    const label = html`<span>${names.join(", ")}</span>`;

    row.appendChild(colorBox);
    row.appendChild(label);
    container.appendChild(row);
  });

  return container;
}


function _32(md){return(
md`### Right Sankey Chart`
)}

function _selectedMainCategoryFilter(){return(
null
)}

function _twoLevelSankeyData(data,selectedRegion,regionToCountries,selectedFundingGroup,d3)
{
  let baseData = data;
  
  if (selectedRegion !== "All") {
    baseData = baseData.filter(d => regionToCountries.get(d["Country Name"]) === selectedRegion);
  }
  if (selectedFundingGroup !== null) {
    baseData = baseData.filter(d => d["Agency Group"] === selectedFundingGroup);
  }

  const grouped = d3.rollup(
    baseData,
    v => d3.sum(v, d => +d.current_amount),
    d => d["Main Category"],
    d => d["Sub-Category"]
  );

  const nodesSet = new Set();
  const linksRaw = [];

  for (const [source, targets] of grouped) {
    nodesSet.add("main:" + source);
    for (const [target, value] of targets) {
      nodesSet.add("sub:" + target);
      linksRaw.push({ source: "main:" + source, target: "sub:" + target, value });
    }
  }

  const nodes = Array.from(nodesSet).map(name => {
    if (name.startsWith("main:")) {
      return { name, displayName: name.slice(5) };
    } else {
      return { name, displayName: name.slice(4) };
    }
  });

  const nodeIndex = new Map(nodes.map((d, i) => [d.name, i]));

  const links = linksRaw
    .filter(d => nodeIndex.has(d.source) && nodeIndex.has(d.target))
    .map(d => ({
      source: nodeIndex.get(d.source),
      target: nodeIndex.get(d.target),
      value: d.value
    }));

  return { nodes, links };
}


function _twoLevelSankeyChart(html,d3,sankey,twoLevelSankeyData,sankeyLinkHorizontal,groupColors_r,selectedMainCategoryFilter,$0,invalidation)
{
  const width = 400;
  const height = 350;
  const rightNodeWidth = 140;

  const container = html`<div style="position: relative;"></div>`;

  const svg = d3.select(container).append("svg")
    .attr("width", width)
    .attr("height", height);

  const sankeyGen = sankey()
    .nodeWidth(10)
    .nodePadding(4)
    .extent([[0, 0], [width, height]]);

  const graph = sankeyGen({
    nodes: twoLevelSankeyData.nodes.map(d => ({ ...d })),
    links: twoLevelSankeyData.links.map(d => ({ ...d }))
  });

  svg.append("defs").append("pattern")
    .attr("id", "crosshatch")
    .attr("width", 8)    
    .attr("height", 8)
    .attr("patternUnits", "userSpaceOnUse")
  .call(pattern => {
    pattern.append("path")
      .attr("d", "M0,0 L8,8 M8,0 L0,8") 
      .attr("stroke", "#001f3f")          
      .attr("stroke-width", 1);
  });

svg.append("path")
  .attr("d", `
    M 0 0
    L ${30 - 6} 0
    Q ${30} 0 ${30} 6
    L ${30} ${height - 6}
    Q ${30} ${height} ${30 - 6} ${height}
    L 0 ${height}
    Z
  `)
  .attr("fill", "url(#crosshatch)")
  .attr("fill-opacity", 1);   

  const tooltip = d3.select(container).append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background", "rgba(0,0,0,0.75)")
    .style("color", "#fff")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font", "12px sans-serif")
    .style("display", "none");

  const link = svg.append("g")
    .selectAll("path")
    .data(graph.links)
    .join("path")
    .attr("d", sankeyLinkHorizontal())
    .attr("stroke", d => groupColors_r(d.source.name)) 
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("fill", "none")
    .attr("stroke-opacity", 1)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke-opacity", 0.8);
      tooltip
        .style("display", "block")
        .html(`<strong>${d.source.displayName} → ${d.target.displayName}</strong><br/>$${d.value.toLocaleString()}`);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", (event.offsetX + 15) + "px")
        .style("top", (event.offsetY - 20) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke-opacity", 0.4);
      tooltip.style("display", "none");
    });

const node = svg.append("g")
  .selectAll("path")
  .data(graph.nodes.filter(d => d.name.startsWith("main:")))
  .join("path")
  .attr("d", d => {
    const curveSize = 6;  
    const xStart = d.x0 + 35;
    const xEnd = d.x1 + 30 + rightNodeWidth - 10; 
    return `
      M ${xStart} ${d.y0}
      Q ${xStart - curveSize} ${d.y0} ${xStart - curveSize} ${d.y0 + curveSize}
      L ${xStart - curveSize} ${d.y1 - curveSize}
      Q ${xStart - curveSize} ${d.y1} ${xStart} ${d.y1}
      L ${xEnd - curveSize} ${d.y1}
      Q ${xEnd} ${d.y1} ${xEnd} ${d.y1 - curveSize}
      L ${xEnd} ${d.y0 + curveSize}
      Q ${xEnd} ${d.y0} ${xEnd - curveSize} ${d.y0}
      Z
    `;
  })
  .attr("fill", d => groupColors_r(d.name))
  .attr("stroke", "#222")
  .style("cursor", "pointer")

    .on("click", (event, d) => {
      if (selectedMainCategoryFilter === d.displayName) {
        $0.value = null;
      } else {
        $0.value = d.displayName;
      }
      updateHighlight();
    })
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "#000").attr("stroke-width", 2);
      tooltip
        .style("display", "block")
        .html(`<strong>${d.displayName}</strong><br/>Total: $${d.value.toLocaleString()}`);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", (event.offsetX + 15) + "px")
        .style("top", (event.offsetY - 20) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", "#222").attr("stroke-width", 1);
      tooltip.style("display", "none");
    });

  const labels = svg.append("g")
  .selectAll("text")
  .data(graph.nodes.filter(d => d.name.startsWith("main:")))
  .join("text")
  .attr("x", d => d.x0 + 40)  
  .attr("y", d => (d.y0 + d.y1) / 2 - 8)  
  .attr("text-anchor", "start")
  .attr("alignment-baseline", "middle")
  .style("font", "bold 12px sans-serif")
  .style("fill", "black")
  .call(text => {
    text.each(function(d) {
      const words = d.displayName.split(" ");
      const tspan1 = d3.select(this)
        .append("tspan")
        .attr("x", d.x0 + 40)
        .attr("dy", "0em")
        .text(words.slice(0, Math.ceil(words.length / 2)).join(" "));  

      const tspan2 = d3.select(this)
        .append("tspan")
        .attr("x", d.x0 + 40)
        .attr("dy", "1.2em")
        .text(words.slice(Math.ceil(words.length / 2)).join(" "));  
    });
  });


  function updateHighlight() {
    const selected = selectedMainCategoryFilter;

    node.style("opacity", d => {
      if (!selected) return 1;
      return d.displayName === selected ? 1 : 0.2;
    });

    link.style("opacity", d => {
      if (!selected) return 0.4;
      return d.source.displayName === selected ? 0.8 : 0.1;
    });

    labels.style("opacity", d => {
      if (!selected) return 1;
      return d.displayName === selected ? 1 : 0.2;
    });
  }

  updateHighlight();

  invalidation.then(() => tooltip.remove());

  return container;
}


function _groupColors_r(d3){return(
d3.scaleOrdinal()
  .domain([
    "Other & Cross-Cutting",
    "Health & Humanitarian",
    "Productive Sectors",
    "Governance & Administration"
  ])
  .range([
    "#2ca02c",  
    "#ffbb78",  
    "#ff9896",  
    "#8c564b"  
  ])
)}

function _sankeyLegend_r(html,groupColors_r)
{
  const container = html`<div style="font: 12px sans-serif; background: #fff; padding: 10px 15px; border: 1px solid #ccc; border-radius: 6px; display: flex; flex-direction: column; gap: 6px; width: fit-content;"></div>`;

  const categories = Array.from(new Set(
    groupColors_r.domain().map(d => d.replace(/^main:/, ""))
  ));

  categories.forEach(name => {
    const row = html`<div style="display: flex; align-items: center; gap: 6px; align-items: center;"></div>`;

    const colorBox = html`<div style="width: 12px; height: 14px; background: ${groupColors_r(name)}; border: 1px solid #999;"></div>`;
    const label = html`<span>${name}</span>`;

    row.appendChild(colorBox);
    row.appendChild(label);
    container.appendChild(row);
  });

  return container;
}


function _38(md){return(
md`## Main Dashboard`
)}

function _mixcolor()
{ return "#00062b"}


function _dashboardLayout(html,$0,$1,$2,$3,$4,$5,$6,$7,$8)
{
  const div = html`
<div style="text-align: center; margin-bottom: 20px;">
  <div style="display: flex; justify-content: center;">
    <h1 style="margin-bottom: 10px;">U.S. Global Funding Dashboard</h1>
  </div>

  <div style="display: flex; justify-content: center; gap: 12px;">
    ${$0}
    <button>Reset</button>
  </div>
</div>

<div style="
  position: relative; 
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 10px;
  justify-content: center;
  align-items: start;
">

  <!-- Charts -->
  <div style="grid-column: 1; display: flex; justify-content: flex-end; margin-right: -70px; margin-top: 60px;">
    <div style="transform: translateY(2px);">${$1}</div>
  </div>

  <div style="grid-column: 2; display: flex; justify-content: center;">
    ${$2}
  </div>

  <div style="grid-column: 3; display: flex; justify-content: flex-start; margin-left: -70px; margin-top: 60px;">
    <div style="transform: translateY(2px);">${$3}</div>
  </div>

  <!-- Legends -->
  <div style="grid-column: 1; display: flex; justify-content: center;">
    <div style="font: 14px sans-serif;">
      <b>Funding Groups</b>
      <div style="margin-top: 2px;">${$4}</div>
    </div>
  </div>

  <div style="grid-column: 2; display: flex; justify-content: center;">
    <div style="font: 14px sans-serif;">
      <b>Choropleth Legend</b>
      <div style="margin-top: 2px;">${$5}</div>
    </div>
  </div>

  <div style="grid-column: 3; display: flex; justify-content: center;">
    <div style="font: 14px sans-serif;">
      <b>Allocation Categories</b>
      <div style="margin-top: 2px;">${$6}</div>
    </div>
  </div>

</div>
`
  const resetButton = div.querySelector("button");
  resetButton.onclick = () => {
    $7.value = null;
    $8.value = null;
  }
  return div;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer()).define(["md"], _3);
  main.variable(observer()).define(["md"], _4);
  main.variable(observer()).define(["md"], _5);
  main.variable(observer()).define(["md"], _6);
  main.variable(observer()).define(["md"], _7);
  main.variable(observer()).define(["md"], _8);
  main.variable(observer()).define(["md"], _9);
  const child1 = runtime.module(define1);
  main.import("legend", child1);
  main.variable(observer("d3sankey")).define("d3sankey", ["require"], _d3sankey);
  main.variable(observer("sankey")).define("sankey", ["d3sankey"], _sankey);
  main.variable(observer("sankeyLinkHorizontal")).define("sankeyLinkHorizontal", ["d3sankey"], _sankeyLinkHorizontal);
  const child2 = runtime.module(define2);
  main.import("Inputs", child2);
  main.variable(observer()).define(["md"], _15);
  main.variable(observer("data")).define("data", ["d3"], _data);
  main.variable(observer("world")).define("world", ["d3"], _world);
  main.variable(observer("dataByCountry")).define("dataByCountry", ["d3","data"], _dataByCountry);
  main.variable(observer("regionToCountries")).define("regionToCountries", ["data"], _regionToCountries);
  main.variable(observer("uniqueRegions")).define("uniqueRegions", ["data"], _uniqueRegions);
  main.variable(observer()).define(["md"], _21);
  main.variable(observer("viewof selectedRegion")).define("viewof selectedRegion", ["Inputs","uniqueRegions"], _selectedRegion);
  main.variable(observer("selectedRegion")).define("selectedRegion", ["Generators", "viewof selectedRegion"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _23);
  main.variable(observer("viewof chart")).define("viewof chart", ["d3","mixcolor","dataByCountry","world","regionToCountries","selectedRegion","selectedFundingGroup","selectedMainCategoryFilter","invalidation"], _chart);
  main.variable(observer("chart")).define("chart", ["Generators", "viewof chart"], (G, _) => G.input(_));
  main.variable(observer("viewof choroplethLegend")).define("viewof choroplethLegend", ["dataByCountry","d3","html"], _choroplethLegend);
  main.variable(observer("choroplethLegend")).define("choroplethLegend", ["Generators", "viewof choroplethLegend"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _26);
  main.define("initial selectedFundingGroup", _selectedFundingGroup);
  main.variable(observer("mutable selectedFundingGroup")).define("mutable selectedFundingGroup", ["Mutable", "initial selectedFundingGroup"], (M, _) => new M(_));
  main.variable(observer("selectedFundingGroup")).define("selectedFundingGroup", ["mutable selectedFundingGroup"], _ => _.generator);
  main.variable(observer("whiskerSankeyData")).define("whiskerSankeyData", ["data","selectedRegion","regionToCountries","selectedMainCategoryFilter","d3"], _whiskerSankeyData);
  main.variable(observer("viewof whiskerSankeyChart")).define("viewof whiskerSankeyChart", ["html","d3","sankey","whiskerSankeyData","sankeyLinkHorizontal","groupColors","selectedFundingGroup","mutable selectedFundingGroup","invalidation"], _whiskerSankeyChart);
  main.variable(observer("whiskerSankeyChart")).define("whiskerSankeyChart", ["Generators", "viewof whiskerSankeyChart"], (G, _) => G.input(_));
  main.variable(observer("groupColors")).define("groupColors", ["d3"], _groupColors);
  main.variable(observer("viewof whiskerSankeyLegend")).define("viewof whiskerSankeyLegend", ["html","groupColors"], _whiskerSankeyLegend);
  main.variable(observer("whiskerSankeyLegend")).define("whiskerSankeyLegend", ["Generators", "viewof whiskerSankeyLegend"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _32);
  main.define("initial selectedMainCategoryFilter", _selectedMainCategoryFilter);
  main.variable(observer("mutable selectedMainCategoryFilter")).define("mutable selectedMainCategoryFilter", ["Mutable", "initial selectedMainCategoryFilter"], (M, _) => new M(_));
  main.variable(observer("selectedMainCategoryFilter")).define("selectedMainCategoryFilter", ["mutable selectedMainCategoryFilter"], _ => _.generator);
  main.variable(observer("twoLevelSankeyData")).define("twoLevelSankeyData", ["data","selectedRegion","regionToCountries","selectedFundingGroup","d3"], _twoLevelSankeyData);
  main.variable(observer("viewof twoLevelSankeyChart")).define("viewof twoLevelSankeyChart", ["html","d3","sankey","twoLevelSankeyData","sankeyLinkHorizontal","groupColors_r","selectedMainCategoryFilter","mutable selectedMainCategoryFilter","invalidation"], _twoLevelSankeyChart);
  main.variable(observer("twoLevelSankeyChart")).define("twoLevelSankeyChart", ["Generators", "viewof twoLevelSankeyChart"], (G, _) => G.input(_));
  main.variable(observer("groupColors_r")).define("groupColors_r", ["d3"], _groupColors_r);
  main.variable(observer("viewof sankeyLegend_r")).define("viewof sankeyLegend_r", ["html","groupColors_r"], _sankeyLegend_r);
  main.variable(observer("sankeyLegend_r")).define("sankeyLegend_r", ["Generators", "viewof sankeyLegend_r"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _38);
  main.variable(observer("mixcolor")).define("mixcolor", _mixcolor);
  main.variable(observer("viewof dashboardLayout")).define("viewof dashboardLayout", ["html","viewof selectedRegion","viewof whiskerSankeyChart","viewof chart","viewof twoLevelSankeyChart","viewof whiskerSankeyLegend","viewof choroplethLegend","viewof sankeyLegend_r","mutable selectedFundingGroup","mutable selectedMainCategoryFilter"], _dashboardLayout);
  main.variable(observer("dashboardLayout")).define("dashboardLayout", ["Generators", "viewof dashboardLayout"], (G, _) => G.input(_));
  return main;
}
