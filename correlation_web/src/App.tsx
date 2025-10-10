
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from './components/ui/field';
import { useState } from 'react';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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

async function getAvailableDataColumns(instrument: string, datatype: string) {
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

// async function getAnalysedData(
//   target_instrument: string,
//   target_datatype: string,
//   target_data_column: string,
//   comparison_instruments: string[],
//   comparison_datatypes: string[],
//   comparison_data_columns: string[],
//   methods: string[]
// ) {
//   const response = await fetch("http://localhost:8000/analysedData", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       target_instrument,
//       target_datatype,
//       target_data_column,
//       comparison_instruments,
//       comparison_datatypes,
//       comparison_data_columns,
//       methods
//     }),
//   });
//   if (!response.ok) {
//     throw new Error("Failed to fetch analysed data");
//   }
//   const data = await response.json();
//   return data.analysed_data as any;
// }

export default function App() {
  const [targetInstrument, setTargetInstrument] = useState<string>("");
  const [targetDatatype, setTargetDatatype] = useState<string>("");
  const [targetDataColumn, setTargetDataColumn] = useState<string>("");

  const [comparisonInstrument, setComparisonInstrument] = useState<string>("");
  const [comparisonDatatype, setComparisonDatatype] = useState<string>("");
  const [comparisonDataColumn, setComparisonDataColumn] = useState<string>("");

  const [selectedMethods, setSelectedMethods] = useState<string[]>(Object.keys(methods));

  const { data: targetData, isLoading: targetIsLoading, error: targetError } = useQuery({
    queryKey: ["availableDataColumns", targetInstrument, targetDatatype],
    queryFn: () => getAvailableDataColumns(targetInstrument, targetDatatype),
    enabled: !!targetInstrument && !!targetDatatype,
    retry: false,
  })
  const { data: comparisonData, isLoading: comparisonIsLoading, error: comparisonError } = useQuery({
    queryKey: ["comparisonDataColumns", comparisonInstrument, comparisonDatatype],
    queryFn: () => getAvailableDataColumns(comparisonInstrument, comparisonDatatype),
    enabled: !!comparisonInstrument && !!comparisonDatatype,
    retry: false,
  });

  // const { data: analysedData, isLoading: analysedIsLoading, error: analysedError } = useQuery({
  //   queryKey: ["analysedData", targetDataColumn, comparisonDataColumn],
  //   queryFn: () => getAnalysedData(
  //     targetInstrument,
  //     targetDatatype,
  //     targetDataColumn,
  //     comparisonInstrument,
  //     comparisonDatatype,
  //     comparisonDataColumn
  //   )
  //   enabled: !!targetDataColumn && !!comparisonDataColumn,
  //   retry: false,
  // });


  let comparisonDataColumns = comparisonData ?? [];
  let availableDataColumns = targetData ?? [];


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
                Choose Analysis Method: {selectedMethods.length === 0 ? " None" : selectedMethods.map((method) => methods[method]).join(", ")} {/* anonyme methode */}
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
        {/* <div>
          <h2 className="text-2xl font-bold mb-4">Analysis Result</h2>
            {JSON.stringify(analysedData)}
        </div> */}
      </main>
    </div>
  );
}

