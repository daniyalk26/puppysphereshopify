// src/app/dashboard-charts.js

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { COLORS, formatCurrency } from './dashboard-utils';

// D3 Waterfall Chart Component
export const WaterfallChart = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const margin = { top: 40, right: 30, bottom: 80, left: 100 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Process data for waterfall
    const waterfallData = [];
    let cumulative = 0;
    
    data.forEach((d, i) => {
      if (i === 0) {
        // First bar (Gross Sales)
        waterfallData.push({
          name: d.name,
          start: 0,
          end: d.value,
          value: d.value,
          class: 'positive',
          displayValue: d.value
        });
        cumulative = d.value;
      } else if (d.name === 'Net Sales') {
        // Last bar (Net Sales) - show the final value
        waterfallData.push({
          name: d.name,
          start: 0,
          end: d.value,
          value: d.value,
          class: 'total',
          displayValue: d.value
        });
      } else {
        // Middle bars (deductions/additions)
        const newCumulative = cumulative + d.value;
        waterfallData.push({
          name: d.name,
          start: d.value >= 0 ? cumulative : newCumulative,
          end: d.value >= 0 ? newCumulative : cumulative,
          value: Math.abs(d.value),
          class: d.value >= 0 ? 'positive' : 'negative',
          displayValue: d.value
        });
        cumulative = newCumulative;
      }
    });

    // Scales
    const x = d3.scaleBand()
      .domain(waterfallData.map(d => d.name))
      .range([0, width])
      .padding(0.3);

    const maxValue = d3.max(waterfallData, d => Math.max(d.start, d.end));
    const y = d3.scaleLinear()
      .domain([0, maxValue * 1.1])
      .nice()
      .range([height, 0]);

    // Draw bars
    const bars = g.selectAll(".bar")
      .data(waterfallData)
      .enter().append("g")
      .attr("class", "bar-group");

    bars.append("rect")
      .attr("class", d => `bar ${d.class}`)
      .attr("x", d => x(d.name))
      .attr("y", height)
      .attr("height", 0)
      .attr("width", x.bandwidth())
      .attr("fill", d => {
        if (d.class === 'positive') return COLORS.success;
        if (d.class === 'negative') return COLORS.danger;
        return COLORS.primary; // total
      })
      .attr("opacity", 0.8)
      .transition()
      .duration(800)
      .attr("y", d => y(d.end))
      .attr("height", d => height - y(d.value));

    // Draw connectors
    let runningTotal = waterfallData[0].value;
    const connectorData = [];
    
    for (let i = 0; i < waterfallData.length - 2; i++) {
      if (i > 0) {
        runningTotal += waterfallData[i].displayValue;
      }
      connectorData.push({
        x1: x(waterfallData[i].name) + x.bandwidth(),
        y1: y(runningTotal),
        x2: x(waterfallData[i + 1].name),
        y2: y(runningTotal)
      });
    }

    setTimeout(() => {
      g.selectAll(".connector")
        .data(connectorData)
        .enter().append("line")
        .attr("class", "connector")
        .attr("x1", d => d.x1)
        .attr("y1", d => d.y1)
        .attr("x2", d => d.x2)
        .attr("y2", d => d.y2)
        .attr("stroke", "#666")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3")
        .style("opacity", 0)
        .transition()
        .duration(400)
        .style("opacity", 1);
    }, 800);

    // Add value labels
    bars.append("text")
      .attr("class", "label")
      .attr("x", d => x(d.name) + x.bandwidth() / 2)
      .attr("y", d => y(Math.max(d.start, d.end)) - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "13px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .style("opacity", 0)
      .text(d => {
        if (d.class === 'negative') return `-${formatCurrency(Math.abs(d.displayValue))}`;
        return formatCurrency(d.displayValue);
      })
      .transition()
      .delay(800)
      .duration(400)
      .style("opacity", 1);

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "12px")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Y axis
    g.append("g")
      .call(d3.axisLeft(y).tickFormat(d => `${d / 1000}k`))
      .style("font-size", "12px");

    // Add title
    svg.append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Revenue Waterfall: From Gross to Net");

  }, [data]);

  return <svg ref={svgRef}></svg>;
};

// D3 Studio Revenue Donut Chart Component
export const StudioRevenueDonut = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = 800;
    const height = 500;
    const radius = Math.min(width, height) / 2 - 100;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2 - 100},${height / 2})`);

    // Create pie layout
    const pie = d3.pie()
      .value(d => d.value)
      .sort((a, b) => b.value - a.value);

    // Create arc generators
    const arc = d3.arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d.name))
      .range(COLORS.gradient);

    // Create arcs
    const arcs = g.selectAll(".arc")
      .data(pie(data))
      .enter().append("g")
      .attr("class", "arc");

    // Draw arcs with animation
    arcs.append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => colorScale(d.data.name))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("opacity", 0.9)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius * 1.05)
          )
          .style("opacity", 1);
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc)
          .style("opacity", 0.9);
      })
      .transition()
      .duration(1000)
      .attrTween("d", function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arc(interpolate(t));
        };
      });

    // Add percentage labels only for larger slices
    setTimeout(() => {
      arcs.filter(d => parseFloat(d.data.percentage) > 10)
        .append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "white")
        .text(d => `${d.data.percentage}%`);
    }, 1000);

    // Center text showing total
    const centerText = g.append("g");
    
    centerText.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.5em")
      .style("font-size", "36px")
      .style("font-weight", "bold")
      .text(formatCurrency(d3.sum(data, d => d.value)));

    centerText.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.5em")
      .style("font-size", "16px")
      .style("fill", "#666")
      .text("Total Net Revenue");

    // Add legend on the right side
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 280}, 50)`);

    legend.append("text")
      .attr("x", 0)
      .attr("y", -10)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Studios");

    const legendItems = legend.selectAll(".legend-item")
      .data(data)
      .enter().append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 25 + 10})`);

    legendItems.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", d => colorScale(d.name))
      .style("opacity", 0.9);

    legendItems.append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("font-size", "12px")
      .text(d => {
        const name = d.name.length > 25 ? d.name.substring(0, 25) + '...' : d.name;
        return `${name} (${d.percentage}%)`;
      });

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "d3-tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.9)")
      .style("color", "white")
      .style("padding", "12px")
      .style("border-radius", "6px")
      .style("font-size", "14px")
      .style("pointer-events", "none");

    arcs.on("mouseover.tooltip", function(event, d) {
      tooltip.transition().duration(200).style("opacity", .9);
      tooltip.html(`
        <strong>${d.data.name}</strong><br/>
        Revenue: ${formatCurrency(d.data.value)}<br/>
        Orders: ${d.data.orders}<br/>
        Share: ${d.data.percentage}%
      `)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout.tooltip", function(d) {
      tooltip.transition().duration(500).style("opacity", 0);
    });

    return () => {
      d3.select("body").selectAll(".d3-tooltip").remove();
    };

  }, [data]);

  return <svg ref={svgRef}></svg>;
};

// D3 Monthly Trend Chart Component
export const MonthlyTrendChart = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    const margin = { top: 20, right: 120, bottom: 60, left: 80 };
    const width = 900 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse dates
    const parseTime = d3.timeParse("%b %Y");
    const processedData = data.map(d => ({
      ...d,
      date: parseTime(d.month) || new Date()
    }));

    // Scales
    const x = d3.scaleTime()
      .domain(d3.extent(processedData, d => d.date))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => Math.max(d.gross, d.net))])
      .nice()
      .range([height, 0]);

    // Line generators
    const lineGross = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.gross))
      .curve(d3.curveMonotoneX);

    const lineNet = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.net))
      .curve(d3.curveMonotoneX);

    // Area generator for net sales
    const areaNet = d3.area()
      .x(d => x(d.date))
      .y0(height)
      .y1(d => y(d.net))
      .curve(d3.curveMonotoneX);

    // Add gradient
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", COLORS.success)
      .attr("stop-opacity", 0.3);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", COLORS.success)
      .attr("stop-opacity", 0);

    // Add area
    g.append("path")
      .datum(processedData)
      .attr("fill", "url(#gradient)")
      .attr("d", areaNet);

    // Add lines
    g.append("path")
      .datum(processedData)
      .attr("fill", "none")
      .attr("stroke", COLORS.primary)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("d", lineGross);

    g.append("path")
      .datum(processedData)
      .attr("fill", "none")
      .attr("stroke", COLORS.success)
      .attr("stroke-width", 3)
      .attr("d", lineNet);

    // Add dots for data points
    g.selectAll(".dot-gross")
      .data(processedData)
      .enter().append("circle")
      .attr("class", "dot-gross")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.gross))
      .attr("r", 4)
      .attr("fill", COLORS.primary);

    g.selectAll(".dot-net")
      .data(processedData)
      .enter().append("circle")
      .attr("class", "dot-net")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.net))
      .attr("r", 4)
      .attr("fill", COLORS.success);

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickFormat(d3.timeFormat("%b %Y")))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Y axis
    g.append("g")
      .call(d3.axisLeft(y)
        .tickFormat(d => `$${d / 1000}k`));

    // Add legend
    const legend = g.append("g")
      .attr("transform", `translate(${width - 150}, 0)`);

    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 20)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", COLORS.primary)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

    legend.append("text")
      .attr("x", 25)
      .attr("y", 0)
      .attr("dy", ".35em")
      .style("font-size", "12px")
      .text("Gross Sales");

    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 20)
      .attr("y1", 20)
      .attr("y2", 20)
      .attr("stroke", COLORS.success)
      .attr("stroke-width", 3);

    legend.append("text")
      .attr("x", 25)
      .attr("y", 20)
      .attr("dy", ".35em")
      .style("font-size", "12px")
      .text("Net Sales");

    // Add tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "d3-tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "10px")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none");

    // Add vertical line for hover
    const hoverLine = g.append("line")
      .attr("class", "hover-line")
      .attr("y1", 0)
      .attr("y2", height)
      .style("stroke", "#999")
      .style("stroke-width", 1)
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0);

    // Add overlay for mouse events
    g.append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", () => {
        tooltip.style("opacity", 1);
        hoverLine.style("opacity", 1);
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
        hoverLine.style("opacity", 0);
      })
      .on("mousemove", function(event) {
        const [mouseX] = d3.pointer(event);
        const bisect = d3.bisector(d => d.date).left;
        const x0 = x.invert(mouseX);
        const i = bisect(processedData, x0, 1);
        if (i >= processedData.length) return;
        const d0 = processedData[i - 1];
        const d1 = processedData[i];
        if (!d0 || !d1) return;
        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        hoverLine.attr("x1", x(d.date)).attr("x2", x(d.date));

        tooltip.html(`
          <strong>${d.month}</strong><br/>
          Gross: ${formatCurrency(d.gross)}<br/>
          Net: ${formatCurrency(d.net)}<br/>
          Orders: ${d.orders}<br/>
          Deductions: ${formatCurrency(d.discounts + d.refunds)}
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
      });

    return () => {
      d3.select("body").selectAll(".d3-tooltip").remove();
    };

  }, [data]);

  return <svg ref={svgRef}></svg>;
};