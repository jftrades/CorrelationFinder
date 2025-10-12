import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const methods = {
  "pearson": "Pearson",
  "spearman": "Spearman",
  "kendalltau": "Kendalltau",
  "linregress": "Lin Regression",
};

interface DataPoint {
  x: number;
  y: number;
}

interface RegressionResult {
  method: string;
  slope: number;
  intercept: number;
  rvalue: number;
  pvalue: number;
  stderr: number;
}

interface TimeSeriesChartProps {
  analysedData: any;
  width?: number;
  height?: number;
}

interface CorrelationChartProps {
  analysedData: any;
  selectedMethods: string[];
  width?: number;
  height?: number;
}

interface RegressionChartProps {
  analysedData: any;
  selectedMethods: string[];
  width?: number;
  height?: number;
}

export function TimeSeriesChart({ analysedData, width = 1000, height = 200 }: TimeSeriesChartProps) {
  const renderRegion = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!analysedData || !renderRegion.current) {
      return;
    }

    const targetDataset = Object.entries(analysedData.target_column_content).map(([x, y]) => ({ x: +x, y: +(y as number) }));
    const comparisonDataset = Object.entries(analysedData.comparison_column_contents[0]).map(([x, y]) => ({ x: +x, y: +(y as number) }));

    // Min-max normalization
    const normalize = (data: DataPoint[]) => {
      const yValues = data.map(d => d.y);
      const min = Math.min(...yValues);
      const max = Math.max(...yValues);
      return data.map(d => ({ x: d.x, y: (d.y - min) / (max - min) }));
    };

    const normalizedTarget = normalize(targetDataset);
    const normalizedComparison = normalize(comparisonDataset);

    const svg = d3.select(renderRegion.current);
    svg.selectAll("*").remove();
    
    const svgWidth = width;
    const svgHeight = height;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    const allData = [...targetDataset, ...comparisonDataset];
    const x = d3.scaleLinear()
      .domain(d3.extent(allData, d => d.x) as [number, number])
      .range([margin.left, svgWidth - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, 1])
      .nice()
      .range([svgHeight - margin.bottom, margin.top]);

    const line = d3.line<DataPoint>()
      .x(d => x(d.x))
      .y(d => y(d.y));

    // Plot target data
    svg.append("path")
      .datum(normalizedTarget)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", line);

    // Plot comparison data
    svg.append("path")
      .datum(normalizedComparison)
      .attr("fill", "none")
      .attr("stroke", "purple")
      .attr("stroke-width", 1.5)
      .attr("d", line);

    // Only x-axis
    svg.append("g")
      .attr("transform", `translate(0,${svgHeight - margin.bottom})`)
      .call(d3.axisBottom(x));

  }, [analysedData, width, height]);

  return <svg ref={renderRegion} height={height} width={width} />;
}

export function CorrelationChart({ analysedData, selectedMethods, width = 500, height = 300 }: CorrelationChartProps) {
  const barChartRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!analysedData || !barChartRef.current) return;

    const correlationData = selectedMethods
      .filter(method => method !== 'linregress') // Exclude linregress from correlation chart
      .map(method => {
        let value;
        switch(method) {
          case 'pearson':
            value = analysedData?.pearson_results?.[0]?.[0]; // First element of tuple is correlation
            break;
          case 'spearman':
            value = analysedData?.spearman_results?.[0]?.[0]; // First element of tuple is correlation
            break;
          case 'kendalltau':
            value = analysedData?.kendalltau_results?.[0]?.[0]; // First element of tuple is correlation
            break;
          default:
            value = undefined;
        }
        return { method: methods[method as keyof typeof methods], value };
      })
      .filter(d => d.value !== undefined && d.value !== null);

    const data = correlationData;
    if (data.length === 0) return; // Don't render if no data

    const svg = d3.select(barChartRef.current);
    svg.selectAll("*").remove();

    const svgWidth = width;
    const svgHeight = height;
    const margin = { top: 20, right: 40, bottom: 40, left: 80 };

    const x = d3.scaleLinear()
      .domain([-1, 1])
      .range([margin.left, svgWidth - margin.right]);

    const y = d3.scaleBand()
      .domain(data.map(d => d.method))
      .range([margin.top, svgHeight - margin.bottom])
      .padding(0.1);

    // Center line at 0
    svg.append("line")
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", margin.top)
      .attr("y2", svgHeight - margin.bottom)
      .attr("stroke", "#000")
      .attr("stroke-width", 1);

    // Bars
    svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => d.value >= 0 ? x(0) : x(d.value))
      .attr("y", d => y(d.method)!)
      .attr("width", d => Math.abs(x(d.value) - x(0)))
      .attr("height", y.bandwidth())
      .attr("fill", d => d.value >= 0 ? "steelblue" : "crimson");

    // Value labels
    svg.selectAll("text.value")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "value")
      .attr("x", d => d.value >= 0 ? x(d.value) + 5 : x(d.value) - 5)
      .attr("y", d => y(d.method)! + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.value >= 0 ? "start" : "end")
      .attr("font-size", "12px")
      .attr("fill", "#333")
      .text(d => d.value.toFixed(3));

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${svgHeight - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

  }, [analysedData, selectedMethods, width, height]);

  return <svg ref={barChartRef} height={height} width={width} />;
}

export function RegressionChart({ analysedData, selectedMethods, width = 500, height = 300 }: RegressionChartProps) {
  const regressionChartRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!analysedData || !regressionChartRef.current) return;

    const RegressCorrData = selectedMethods
      .filter(method => method === 'linregress') // Only linregress for regression chart
      .map(method => {
        const result = analysedData?.linregress_results?.[0]; // Assuming single comparison
        if (result) {
          return {
            method: methods[method as keyof typeof methods],
            slope: result[0],
            intercept: result[1], 
            rvalue: result[2],
            pvalue: result[3],
            stderr: result[4]
          };
        }
        return null;
      })
      .filter(d => d !== null) as RegressionResult[];

    if (RegressCorrData.length === 0) return;

    const regressionData = RegressCorrData[0]; // Single regression result
    const svg = d3.select(regressionChartRef.current);
    svg.selectAll("*").remove();

    const svgWidth = width;
    const svgHeight = height;
    const margin = { top: 30, right: 20, bottom: 120, left: 40 };
    const scatterHeight = svgHeight - margin.bottom - margin.top; // More bottom margin for stats

    // Prepare data for scatter plot
    const scatterData = Object.entries(analysedData.target_column_content).map(([x, y]) => ({
      x: +(y as number),
      y: +(analysedData.comparison_column_contents[0][x] as number)
    }));

    // Create scales
    const xExtent = d3.extent(scatterData, d => d.x) as [number, number];
    const yExtent = d3.extent(scatterData, d => d.y) as [number, number];

    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([margin.left, svgWidth - margin.right]);

    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([margin.top + scatterHeight, margin.top]);

    // Draw scatter points
    svg.selectAll("circle")
      .data(scatterData)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 3)
      .attr("fill", "#333")
      .attr("opacity", 0.7);

    // Draw regression line
    const slope = regressionData.slope;
    const intercept = regressionData.intercept;
    
    const lineData = [
      { x: xExtent[0], y: slope * xExtent[0] + intercept },
      { x: xExtent[1], y: slope * xExtent[1] + intercept }
    ];

    const line = d3.line<DataPoint>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y));

    svg.append("path")
      .datum(lineData)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${margin.top + scatterHeight})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    // Add statistics below the chart
    const statsY = margin.top + scatterHeight + 50;
    const stats = [
      { label: "Slope:", value: regressionData.slope.toFixed(4) },
      { label: "Intercept:", value: regressionData.intercept.toFixed(4) },
      { label: "R-value:", value: regressionData.rvalue.toFixed(4) },
      { label: "R²:", value: (regressionData.rvalue * regressionData.rvalue).toFixed(4) },
      { label: "P-value:", value: regressionData.pvalue.toFixed(6) },
      { label: "Std Error:", value: regressionData.stderr.toFixed(6) }
    ];

    // Display stats in two columns
    stats.forEach((stat, i) => {
      const col = Math.floor(i / 3);
      const row = i % 3;
      const x = 20 + col * 200;
      const y = statsY + row * 20;
      
      // Label
      svg.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(stat.label);
      
      // Value
      svg.append("text")
        .attr("x", x + 70)
        .attr("y", y)
        .attr("font-size", "12px")
        .text(stat.value);
    });

    // Add equation
    const equation = `y = ${regressionData.slope.toFixed(4)}x + ${regressionData.intercept.toFixed(4)}`;
    svg.append("text")
      .attr("x", svgWidth / 2)
      .attr("y", svgHeight - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-style", "italic")
      .text(equation);

  }, [analysedData, selectedMethods, width, height]);

  return <svg ref={regressionChartRef} height={height} width={width} />;
}
