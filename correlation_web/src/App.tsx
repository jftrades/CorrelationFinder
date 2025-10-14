
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
import { useState } from 'react';
import { Field, FieldLabel } from './components/ui/field';
import { TimeSeriesChart, CorrelationChart, RegressionChart } from './diagrams/d3_charts';


const methods = {
  "pearson": "Pearson",
  "spearman": "Spearman",
  "kendalltau": "Kendalltau",
  "linregress": "Lin Regression",
}

async function getAvailableInstruments() {
  const response = await fetch("http://localhost:8000/available-instruments");
  if (!response.ok) {
    throw new Error("Failed to fetch available instruments");
  }
  const data = await response.json();
  return data.instruments as string[];
}

async function getAvailableDatatypes(instrument: string) {
  const response = await fetch("http://localhost:8000/available-datatypes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ instrument }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch available datatypes");
  }
  const data = await response.json();
  return data.datatypes as string[];
}

async function getTimestampRange(instrument: string, datatype: string) {
  const response = await fetch("http://localhost:8000/timestamp-range", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ instrument, datatype }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch timestamp range");
  }
  const data = await response.json();
  return data as { min_timestamp: number; max_timestamp: number; min_datetime: string; max_datetime: string };
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
  methods: string[],
  start_month: string,
  start_year: string,
  end_month: string,
  end_year: string
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
      methods,
      start_month,
      start_year,
      end_month,
      end_year
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

  // Date range state - using month/year instead of full dates
  const [startMonth, setStartMonth] = useState<string>("");
  const [startYear, setStartYear] = useState<string>("");
  const [endMonth, setEndMonth] = useState<string>("");
  const [endYear, setEndYear] = useState<string>("");
  
  // State to control when to actually run the analysis
  const [shouldRunAnalysis, setShouldRunAnalysis] = useState(false);

  const { data: availableInstruments, isLoading: instrumentsLoading } = useQuery({
    queryKey: ["availableInstruments"],
    queryFn: getAvailableInstruments,
    retry: false,
  });

  const { data: targetDatatypes, isLoading: targetDatatypesLoading } = useQuery({
    queryKey: ["targetDatatypes", targetInstrument],
    queryFn: () => getAvailableDatatypes(targetInstrument),
    enabled: !!targetInstrument,
    retry: false,
  });

  const { data: comparisonDatatypes, isLoading: comparisonDatatypesLoading } = useQuery({
    queryKey: ["comparisonDatatypes", comparisonInstrument],
    queryFn: () => getAvailableDatatypes(comparisonInstrument),
    enabled: !!comparisonInstrument,
    retry: false,
  });

  // Fetch timestamp ranges for target
  const { data: targetTimestampRange } = useQuery({
    queryKey: ["targetTimestampRange", targetInstrument, targetDatatype],
    queryFn: () => getTimestampRange(targetInstrument, targetDatatype),
    enabled: !!targetInstrument && !!targetDatatype,
    retry: false,
  });

  // Fetch timestamp ranges for comparison
  const { data: comparisonTimestampRange } = useQuery({
    queryKey: ["comparisonTimestampRange", comparisonInstrument, comparisonDatatype],
    queryFn: () => getTimestampRange(comparisonInstrument, comparisonDatatype),
    enabled: !!comparisonInstrument && !!comparisonDatatype,
    retry: false,
  });

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

  const { data: analysedData } = useQuery({
    queryKey: ["analysedData", targetDataColumn, comparisonDataColumn, selectedMethods, shouldRunAnalysis, startMonth, startYear, endMonth, endYear],
    queryFn: () => getAnalysedData(
      targetInstrument,
      targetDatatype,
      targetDataColumn,
      [comparisonInstrument],
      [comparisonDatatype],
      [comparisonDataColumn],
      selectedMethods,
      startMonth,
      startYear,
      endMonth,
      endYear
    ),
    enabled: shouldRunAnalysis && !!targetDataColumn && !!comparisonDataColumn && !!startMonth && !!startYear && !!endMonth && !!endYear,
    retry: false,
  });

  console.log("analysedData", analysedData);


  let comparisonDataColumns = comparisonData ?? [];
  let availableDataColumns = targetData ?? [];
  let instruments = availableInstruments ?? [];
  let targetDatatypesList = targetDatatypes ?? [];
  let comparisonDatatypesList = comparisonDatatypes ?? [];

  return (
    <div className="flex justify-center p-8 min-h-screen w-full">
      <main className="flex flex-col gap-8 max-w-5xl w-full items-start">
        <h1 className="text-4xl font-bold">Correlation Analysis</h1>

        <div className="grid grid-cols-3 gap-6 w-full">
          <Field>
            <FieldLabel>Target Instrument</FieldLabel>
            <Select value={targetInstrument} onValueChange={(value) => {
              setTargetInstrument(value);
              setTargetDatatype("");
              setTargetDataColumn("");
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={instrumentsLoading ? "Loading..." : "Select a target instrument"} />
              </SelectTrigger>
              <SelectContent>
                {instruments.map((instrument) => (
                  <SelectItem key={instrument} value={instrument}>{instrument}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Target Datatype</FieldLabel>
            <Select value={targetDatatype} onValueChange={(value) => {
              setTargetDatatype(value);
              setTargetDataColumn("");
            }} disabled={!targetInstrument || targetDatatypesLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={!targetInstrument ? "Select instrument first" : targetDatatypesLoading ? "Loading..." : "Select a target datatype"} />
              </SelectTrigger>
              <SelectContent>
                {targetDatatypesList.map((datatype) => (
                  <SelectItem key={datatype} value={datatype}>{datatype}</SelectItem>
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
            <Select value={comparisonInstrument} onValueChange={(value) => {
              setComparisonInstrument(value);
              setComparisonDatatype("");
              setComparisonDataColumn("");
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={instrumentsLoading ? "Loading..." : "Select a comparison instrument"} />
              </SelectTrigger>
              <SelectContent>
                {instruments.map((instrument) => (
                  <SelectItem key={instrument} value={instrument}>{instrument}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Comparison Datatype</FieldLabel>
            <Select value={comparisonDatatype} onValueChange={(value) => {
              setComparisonDatatype(value);
              setComparisonDataColumn("");
            }} disabled={!comparisonInstrument || comparisonDatatypesLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={!comparisonInstrument ? "Select instrument first" : comparisonDatatypesLoading ? "Loading..." : "Select a comparison datatype"} />
              </SelectTrigger>
              <SelectContent>
                {comparisonDatatypesList.map((datatype) => (
                  <SelectItem key={datatype} value={datatype}>{datatype}</SelectItem>
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
              <Button variant="outline" className="col-span-3">
                Choose Analysis Method: {selectedMethods.length === 0 ? " None" : selectedMethods.map((method) => methods[method as keyof typeof methods]).join(", ")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(methods).map(([key, value]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={selectedMethods.includes(key)}
                  onCheckedChange={(checked) => {
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
        
        {/* Display available date range info */}
        {(targetTimestampRange || comparisonTimestampRange) && (
          <div className="text-sm text-muted-foreground space-y-1">
            {targetTimestampRange && (
              <div>
                Target: {new Date(targetTimestampRange.min_timestamp / 1_000_000).toLocaleDateString()} - {new Date(targetTimestampRange.max_timestamp / 1_000_000).toLocaleDateString()}
              </div>
            )}
            {comparisonTimestampRange && (
              <div>
                Comparison: {new Date(comparisonTimestampRange.min_timestamp / 1_000_000).toLocaleDateString()} - {new Date(comparisonTimestampRange.max_timestamp / 1_000_000).toLocaleDateString()}
              </div>
            )}
          </div>
        )}
        
        {/* Start Date Selection */}
        <div className="grid grid-cols-2 gap-6 w-full">
          <Field>
            <FieldLabel>Start Month</FieldLabel>
            <Select 
              value={startMonth} 
              onValueChange={setStartMonth}
              disabled={!targetTimestampRange && !comparisonTimestampRange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="01">January</SelectItem>
                <SelectItem value="02">February</SelectItem>
                <SelectItem value="03">March</SelectItem>
                <SelectItem value="04">April</SelectItem>
                <SelectItem value="05">May</SelectItem>
                <SelectItem value="06">June</SelectItem>
                <SelectItem value="07">July</SelectItem>
                <SelectItem value="08">August</SelectItem>
                <SelectItem value="09">September</SelectItem>
                <SelectItem value="10">October</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">December</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Start Year</FieldLabel>
            <Select 
              value={startYear} 
              onValueChange={setStartYear}
              disabled={!targetTimestampRange && !comparisonTimestampRange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const year = 2015 + i; // 2015 to 2026
                  return <SelectItem key={year} value={year.toString()}>{year}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </Field>
        </div>
        
        {/* End Date Selection */}
        <div className="grid grid-cols-2 gap-6 w-full">
          <Field>
            <FieldLabel>End Month</FieldLabel>
            <Select 
              value={endMonth} 
              onValueChange={setEndMonth}
              disabled={!targetTimestampRange && !comparisonTimestampRange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="01">January</SelectItem>
                <SelectItem value="02">February</SelectItem>
                <SelectItem value="03">March</SelectItem>
                <SelectItem value="04">April</SelectItem>
                <SelectItem value="05">May</SelectItem>
                <SelectItem value="06">June</SelectItem>
                <SelectItem value="07">July</SelectItem>
                <SelectItem value="08">August</SelectItem>
                <SelectItem value="09">September</SelectItem>
                <SelectItem value="10">October</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">December</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>End Year</FieldLabel>
            <Select 
              value={endYear} 
              onValueChange={setEndYear}
              disabled={!targetTimestampRange && !comparisonTimestampRange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const year = 2015 + i; // 2015 to 2026
                  return <SelectItem key={year} value={year.toString()}>{year}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </Field>
        </div>
        
        {/* Start CorrelationFinder Button */}
        <div className="w-full">
          <Button 
            variant="default" 
            size="lg"
            className="w-full"
            onClick={() => setShouldRunAnalysis(true)}
            disabled={!targetDataColumn || !comparisonDataColumn || !startMonth || !startYear || !endMonth || !endYear}
          >
            Start CorrelationFinder
          </Button>
        </div>
        
        {/* Results Section - Only show when analysis is complete */}
        {shouldRunAnalysis && analysedData && (
          <>
            <h2 className="text-2xl font-bold">Correlation Results</h2>
            <TimeSeriesChart analysedData={analysedData} width={1000} height={200} />
            <div className="flex gap-4">
              <CorrelationChart analysedData={analysedData} selectedMethods={selectedMethods} width={500} height={300} />
              <RegressionChart analysedData={analysedData} selectedMethods={selectedMethods} width={500} height={300} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

