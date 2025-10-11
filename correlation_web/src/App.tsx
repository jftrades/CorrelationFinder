
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { use, useEffect, useRef, useState } from 'react';
import { Field, FieldLabel } from './components/ui/field';
import * as d3 from 'd3';


const instruments = {
  "btc": "Bitcoin",
  "eth": "Ethereum",
  "sol": "Solana",
  "fng": "Fear and Greed Index",
};

const datatypes = {
  "lunar": "Lunar Crush",
  "metrics": "Binance Venue Metrics",
  "last-external": "Bar Data",
}

const methods = {
  "pearson": "Pearson",
  "spearman": "Spearman",
  "kendalltau": "Kendalltau",
  "linregress": "Lin Regression",
}


async function getAvailableDataColumns(instrument: string[], datatype: string[]) {
  const response = await fetch("http://localhost:8000/available-data-columns", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ instrument, datatype }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch available data columns");
  }
  const data = await response.json();
  return data.available_data_columns as string[];
}

async function getAnalysedData(
  target_instrument: string,
  target_datatype: string,
  target_data_column: string,
  comparison_instruments: string[],
  comparison_datatypes: string[],
  comparison_data_columns: string[],
  methods: string[]
) {
  const response = await fetch("http://localhost:8000/analysedData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target_instrument,
      target_datatype,
      target_data_column,
      comparison_instruments,
      comparison_datatypes,
      comparison_data_columns,
      methods
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch analysed data");
  }
  const data = await response.json();
  return data as any;
}

export default function App() {
  const [targetInstrument, setTargetInstrument] = useState<string>("");
  const [targetDatatype, setTargetDatatype] = useState<string>("");
  const [targetDataColumn, setTargetDataColumn] = useState<string>("");

  const [comparisonInstrument, setComparisonInstrument] = useState<string>("");
  const [comparisonDatatype, setComparisonDatatype] = useState<string>("");
  const [comparisonDataColumn, setComparisonDataColumn] = useState<string>("")

  const [selectedMethods, setSelectedMethods] = useState<string[]>(Object.keys(methods));

  const { data: targetData, isLoading: targetIsLoading, error: targetError } = useQuery({
    queryKey: ["availableDataColumns", targetInstrument, targetDatatype],
    queryFn: () => getAvailableDataColumns([targetInstrument], [targetDatatype]),
    enabled: !!targetInstrument && !!targetDatatype,
    retry: false,
  })
  const { data: comparisonData, isLoading: comparisonIsLoading, error: comparisonError } = useQuery({
    queryKey: ["comparisonDataColumns", comparisonInstrument, comparisonDatatype],
    queryFn: () => getAvailableDataColumns([comparisonInstrument], [comparisonDatatype]),
    enabled: !!comparisonInstrument && !!comparisonDatatype,
    retry: false,
  });

  const { data: analysedData, isLoading: analysedIsLoading, error: analysedError } = useQuery({
    queryKey: ["analysedData", targetDataColumn, comparisonDataColumn, selectedMethods],
    queryFn: () => getAnalysedData(
      targetInstrument,
      targetDatatype,
      targetDataColumn,
      [comparisonInstrument],
      [comparisonDatatype],
      [comparisonDataColumn],
      selectedMethods
    ),
    enabled: !!targetDataColumn && !!comparisonDataColumn,
    retry: false,
  });

  console.log("analysedData", analysedData);


  let comparisonDataColumns = comparisonData ?? [];
  let availableDataColumns = targetData ?? [];

// -------------------------------------------------------------------------------
// -------------------------------------------------------------------------------
// data series visualization from here on

  const renderRegion = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!analysedData || !renderRegion) {
      return;
    }

    const targetDataset = Object.entries(analysedData.target_column_content).map(([x, y]) => ({ x: +x, y: +(y as number) }))
    const comparisonDataset = Object.entries(analysedData.comparison_column_contents[0]).map(([x, y]) => ({ x: +x, y: +(y as number) }))

    // Min-max normalization
    const normalize = (data: {x: number, y: number}[]) => {
      const yValues = data.map(d => d.y);
      const min = Math.min(...yValues);
      const max = Math.max(...yValues);
      return data.map(d => ({ x: d.x, y: (d.y - min) / (max - min) }));
    };

    const normalizedTarget = normalize(targetDataset);
    const normalizedComparison = normalize(comparisonDataset);

    const svg = d3.select(renderRegion.current);
    svg.selectAll("*").remove();
    
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    const allData = [...targetDataset, ...comparisonDataset];
    const x = d3.scaleLinear()
      .domain(d3.extent(allData, d => d.x) as [number, number])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, 1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3.line<{x: number, y: number}>()
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
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

  }, [analysedData, renderRegion])

// -------------------------------------------------------------------------------
// -------------------------------------------------------------------------------
// pearson, spearman, kendalltau chart from here on

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

const barChartRef = useRef<SVGSVGElement | null>(null);

useEffect(() => {
  if (!analysedData || !barChartRef.current) return;

  const data = correlationData;
  if (data.length === 0) return; // Don't render if no data

  const svg = d3.select(barChartRef.current);
  svg.selectAll("*").remove();

  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const margin = { top: 20, right: 40, bottom: 40, left: 80 };

  const x = d3.scaleLinear()
    .domain([-1, 1])
    .range([margin.left, width - margin.right]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.method))
    .range([margin.top, height - margin.bottom])
    .padding(0.1);

  // Center line at 0
  svg.append("line")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
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
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

}, [analysedData, selectedMethods, correlationData]);

// ===============================================================================
// ===============================================================================
// linregress chart from here on

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
  .filter(d => d !== null);

const regressionChartRef = useRef<SVGSVGElement | null>(null);

useEffect(() => {
  if (!analysedData || !regressionChartRef.current || RegressCorrData.length === 0) return;

  const regressionData = RegressCorrData[0]; // Single regression result
  const svg = d3.select(regressionChartRef.current);
  svg.selectAll("*").remove();

  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const margin = { top: 30, right: 20, bottom: 120, left: 40 };
  const scatterHeight = height - margin.bottom - margin.top; // More bottom margin for stats

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
    .range([margin.left, width - margin.right]);

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

  const line = d3.line<{x: number, y: number}>()
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
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-style", "italic")
    .text(equation);

}, [analysedData, RegressCorrData]);

// -------------------------------------------------------------------------------

  return (
    <div className="flex justify-center p-8 min-h-screen w-full">
      <main className="flex flex-col gap-8 max-w-5xl w-full items-start">
        <h1 className="text-4xl font-bold">Correlation Analysis</h1>

        <div className="grid grid-cols-3 gap-6 w-full">
          <Field>
            <FieldLabel>Target Instrument</FieldLabel>
            <Select value={targetInstrument} onValueChange={setTargetInstrument}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a target instrument" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(instruments).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Target Datatype</FieldLabel>
            <Select value={targetDatatype} onValueChange={setTargetDatatype}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a target datatype" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(datatypes).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Target Data Column</FieldLabel>
            <Select value={targetDataColumn} onValueChange={setTargetDataColumn} disabled={targetIsLoading || !!targetError || availableDataColumns.length === 0}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={targetIsLoading ? "Loading..." : !!targetError ? "Error loading data columns" : availableDataColumns.length === 0 ? "No data columns available" : "Select a target data column"} />
              </SelectTrigger>
              <SelectContent>
                {availableDataColumns.map((column) => (
                  <SelectItem key={column} value={column}>{column}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Comparison Instrument</FieldLabel>
            <Select value={comparisonInstrument} onValueChange={setComparisonInstrument}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a comparison instrument" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(instruments).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Comparison Datatype</FieldLabel>
            <Select value={comparisonDatatype} onValueChange={setComparisonDatatype}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a comparison datatype" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(datatypes).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Comparison Data Column</FieldLabel>
            <Select value={comparisonDataColumn} onValueChange={setComparisonDataColumn} disabled={comparisonIsLoading || !!comparisonError || comparisonDataColumns.length === 0}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={comparisonIsLoading ? "Loading..." : !!comparisonError ? "Error loading data columns" : comparisonDataColumns.length === 0 ? "No data columns available" : "Select a comparison data column"} />
              </SelectTrigger>
              <SelectContent>
                {comparisonDataColumns.map((column) => (
                  <SelectItem key={column} value={column}>{column}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <DropdownMenu>
            <DropdownMenuTrigger disabled={!targetDataColumn || !comparisonDataColumn} asChild>
              <Button variant="outline" className="col-span-3"> {/* button design */}
                Choose Analysis Method: {selectedMethods.length === 0 ? " None" : selectedMethods.map((method) => methods[method as keyof typeof methods]).join(", ")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(methods).map(([key, value]) => (   /* die Liste aller Einträge wird hier gemappt */
                <DropdownMenuCheckboxItem
                  key={key} /* key prop also Parameter der Komponenten (DropdownMenuCheckboxItem ist eine Komponente)*/
                  checked={selectedMethods.includes(key)}  /* props immer in geschweiften Klammern */
                  onCheckedChange={(checked) => { /* prop allgemein heisst: Daten die von übergeordneten Komponenten an untergeordnete Komponenten weitergegeben werden */
                    if (checked) {
                      setSelectedMethods([...selectedMethods, key]);
                    } else {
                      setSelectedMethods(selectedMethods.filter((method) => method !== key));
                    }
                  }}
                >
                  {value}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div>
          Analysis state: {analysedIsLoading ? "Loading..." : analysedError ? "Error loading analysed data" : analysedData ? "Data loaded" : "Idle"}
        </div>
        <h2 className="text-2xl font-bold">Correlation Results</h2>
        <svg ref={renderRegion} height="200" width="1000" />
        <div className="flex gap-4">
          <svg ref={barChartRef} height="300" width="500" />
          <svg ref={regressionChartRef} height="300" width="500" />
        </div>
      </main>
    </div>
  );
}

