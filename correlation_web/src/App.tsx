
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
        <TimeSeriesChart analysedData={analysedData} width={1000} height={200} />
        <div className="flex gap-4">
          <CorrelationChart analysedData={analysedData} selectedMethods={selectedMethods} width={500} height={300} />
          <RegressionChart analysedData={analysedData} selectedMethods={selectedMethods} width={500} height={300} />
        </div>
      </main>
    </div>
  );
}

