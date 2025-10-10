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
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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

export default function App() {
  const [targetInstrument, setTargetInstrument] = useState<string>("");
  const [targetDatatype, setTargetDatatype] = useState<string>("");
  const [targetDataColumn, setTargetDataColumn] = useState<string>("");

  const [comparisonInstruments, setComparisonInstruments] = useState<string[]>([]);
  const [comparisonDatatypes, setComparisonDatatypes] = useState<string[]>([]);
  const [comparisonDataColumns, setComparisonDataColumns] = useState<string[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["availableDataColumns", targetInstrument, targetDatatype],
    queryFn: () => getAvailableDataColumns(targetInstrument, targetDatatype),
    enabled: !!targetInstrument && !!targetDatatype,
    retry: false,
  })

  let availableDataColumns = data ?? [];

  function handleComparisonInstrumentClick(instrument: string) {
    if (comparisonInstruments.includes(instrument)) {
      setComparisonInstruments(comparisonInstruments.filter((i) => i !== instrument));
    } else {
      setComparisonInstruments([...comparisonInstruments, instrument]);
    }
  }

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
            <Select value={targetDataColumn} onValueChange={setTargetDataColumn} disabled={isLoading || !!error || availableDataColumns.length === 0}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoading ? "Loading..." : !!error ? "Error loading data columns" : availableDataColumns.length === 0 ? "No data columns available" : "Select a target data column"} />
              </SelectTrigger>
              <SelectContent>
                {availableDataColumns.map((column) => (
                  <SelectItem key={column} value={column}>{column}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Comparison Instruments</FieldLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="font-normal">{comparisonInstruments.length > 0 ? comparisonInstruments.join(", ") : "Select comparison instruments"}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {Object.entries(instruments).map(([key, value]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={comparisonInstruments.includes(key)}
                    onClick={() => handleComparisonInstrumentClick(key)}>
                    {value}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>
        </div>
      </main>
    </div>
  );
}