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

  const { data, isLoading, error } = useQuery({
    queryKey: ["availableDataColumns", targetInstrument, targetDatatype],
    queryFn: () => getAvailableDataColumns(targetInstrument, targetDatatype),
    enabled: !!targetInstrument && !!targetDatatype,
    retry: false,
  })

  let availableDataColumns = data ?? [];

  return (
    <div className="flex justify-center p-8 min-h-screen w-full">
      <main className="flex flex-col gap-8 max-w-3xl w-full items-start">
        <h1 className="text-4xl font-bold">Correlation Analysis</h1>
        <div className="flex flex-col gap-6">
          <Field>
            <FieldLabel>Target Instrument</FieldLabel>
            <Select value={targetInstrument} onValueChange={setTargetInstrument}>
              <SelectTrigger>
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
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading..." : !!error ? "Error loading data columns" : availableDataColumns.length === 0 ? "No data columns available" : "Select a target data column"} />
              </SelectTrigger>
              <SelectContent>
                {availableDataColumns.map((column) => (
                  <SelectItem key={column} value={column}>{column}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </main>
    </div>
  );
}